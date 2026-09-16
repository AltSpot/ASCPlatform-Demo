#!/usr/bin/env node
/**
 * Screenshot a flow at the three recording sizes, against a running server.
 *
 *   node scripts/shoot.mjs <plan.json> [--out screenshots/<dir>]
 *
 * Drives a headless Chromium (Edge or Chrome) over the DevTools protocol
 * with Node's built-in WebSocket, so it adds no dependency. A plan is a
 * list of shots; each shot runs its steps in a fresh browser context (so
 * each /reshoot mints its own account) and captures the viewport at
 * 1600x1000, 1440x780 and 1280x720, the sizes the demo is recorded at.
 *
 * Step types:
 *   { "go": "/reshoot?as=new&to=/wizard" }          navigate and wait for load
 *   { "post": "/api/...", "body": { ... } }          same-origin fetch from the page
 *   { "eval": "document.querySelector(...).click()" } run script in the page
 *   { "wait": 400 }                                  milliseconds
 *   { "scroll": "#selector" }                        scroll an element into view
 *
 * A shot fails loudly if a navigation lands on an error page or a post is
 * not 2xx, so a broken flow cannot produce a folder of plausible images.
 *
 * Tooling, not product: nothing in the app imports this.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:4000';
const SIZES = [
  [1600, 1000],
  [1440, 780],
  [1280, 720],
];
const CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];

const [planPath, ...rest] = process.argv.slice(2);
if (!planPath) {
  console.error('usage: node scripts/shoot.mjs <plan.json> [--out dir]');
  process.exit(2);
}
const outIndex = rest.indexOf('--out');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const outDir = outIndex >= 0 ? rest[outIndex + 1] : plan.out;
if (!outDir) throw new Error('no output directory: pass --out or set "out" in the plan');
fs.mkdirSync(outDir, { recursive: true });

const browserPath = CANDIDATES.find((p) => fs.existsSync(p));
if (!browserPath) throw new Error('no Chromium browser found');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'asc-shoot-'));
const port = 9300 + Math.floor(Math.random() * 500);
const browser = spawn(
  browserPath,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  throw new Error('browser did not start');
}

function connect(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const l of listeners) l(msg);
    }
  });
  const ready = new Promise((resolve) => ws.addEventListener('open', resolve));
  return {
    ready,
    send(method, params = {}, sessionId) {
      const msgId = ++id;
      ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
      return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
    },
    on(fn) {
      listeners.push(fn);
    },
    close() {
      ws.close();
    },
  };
}

async function run() {
  const cdp = connect(await endpoint());
  await cdp.ready;

  for (const shot of plan.shots) {
    const { browserContextId } = await cdp.send('Target.createBrowserContext');
    const { targetId } = await cdp.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId,
    });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (m, p) => cdp.send(m, p, sessionId);
    await send('Page.enable');
    await send('Runtime.enable');

    let loaded = null;
    cdp.on((msg) => {
      if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired' && loaded) loaded();
    });

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (res.exceptionDetails) {
        throw new Error(`${shot.name}: script failed: ${res.exceptionDetails.exception?.description ?? res.exceptionDetails.text}`);
      }
      return res.result.value;
    };

    const [firstW, firstH] = SIZES[0];
    await send('Emulation.setDeviceMetricsOverride', {
      width: firstW,
      height: firstH,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (const step of shot.steps) {
      if (step.go) {
        const done = new Promise((resolve) => (loaded = resolve));
        await send('Page.navigate', { url: BASE + step.go });
        await done;
        await sleep(700);
        const status = await evaluate(
          `(() => { const t = document.body.innerText; return /Application error|Internal Server Error|This page could not be found/.test(t) ? t.slice(0, 200) : 'ok'; })()`,
        );
        if (status !== 'ok') throw new Error(`${shot.name}: ${step.go} rendered an error: ${status}`);
      } else if (step.post) {
        const result = await evaluate(
          `fetch(${JSON.stringify(step.post)}, { method: 'POST', headers: { 'content-type': 'application/json' }, body: ${JSON.stringify(JSON.stringify(step.body ?? {}))} }).then(async r => ({ status: r.status, text: await r.text() }))`,
        );
        const expect = step.expect ?? 200;
        if (result.status !== expect) {
          throw new Error(`${shot.name}: POST ${step.post} returned ${result.status}, expected ${expect}: ${result.text.slice(0, 200)}`);
        }
      } else if (step.get) {
        const result = await evaluate(
          `fetch(${JSON.stringify(step.get)}).then(async r => ({ status: r.status, text: await r.text() }))`,
        );
        if (step.expect && result.status !== step.expect) {
          throw new Error(`${shot.name}: GET ${step.get} returned ${result.status}, expected ${step.expect}`);
        }
        console.log(`  ${shot.name}: GET ${step.get} -> ${result.status} ${result.text.slice(0, 120)}`);
      } else if (step.eval) {
        await evaluate(step.eval);
      } else if (step.scroll) {
        await evaluate(`document.querySelector(${JSON.stringify(step.scroll)})?.scrollIntoView({ block: 'start' })`);
        await sleep(300);
      } else if (step.wait) {
        await sleep(step.wait);
      }
    }

    if (shot.capture !== false) {
      for (const [w, h] of SIZES) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: w,
          height: h,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await sleep(450);
        if (shot.scroll) {
          await evaluate(`document.querySelector(${JSON.stringify(shot.scroll)})?.scrollIntoView({ block: 'start' })`);
          await sleep(300);
        }
        const { data } = await send('Page.captureScreenshot', { format: 'png' });
        const file = path.join(outDir, `${shot.name}-${w}x${h}.png`);
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        console.log(`  wrote ${file}`);
      }
    }

    await cdp.send('Target.disposeBrowserContext', { browserContextId });
  }

  cdp.close();
}

run()
  .then(() => {
    browser.kill();
  })
  .catch((error) => {
    console.error(error.message);
    browser.kill();
    process.exit(1);
  })
  .finally(() => {
    setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 500);
  });
