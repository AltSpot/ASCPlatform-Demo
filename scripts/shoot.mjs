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
const DEFAULT_SIZES = [
  [1600, 1000],
  [1440, 780],
  [1280, 720],
];
/* A plan may name its own sizes ("sizes": [[1600, 1000]]), for a sweep of
   every page where three sizes of each would be hundreds of files. */
let SIZES = DEFAULT_SIZES;
/* The tallest page a full-length capture will take, in CSS pixels. */
const FULL_MAX = 14000;
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
/* --resume skips a shot whose files are already on disk, so a sweep that
   lost its browser picks up at the shot it lost it on. */
const RESUME = rest.includes('--resume');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
if (Array.isArray(plan.sizes) && plan.sizes.length > 0) SIZES = plan.sizes;
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
  /* If the browser dies (it runs out of memory on a very tall frosted page)
     every pending call would hang and Node would exit 0 with half a sweep.
     Say so, and exit 3 so a caller can run again with --resume. */
  let closing = false;
  ws.addEventListener('close', () => {
    if (closing) return;
    console.error('  the browser went away; run again with --resume to carry on');
    process.exit(3);
  });
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
      closing = true;
      ws.close();
    },
  };
}

async function run() {
  const cdp = connect(await endpoint());
  await cdp.ready;

  /* "keepGoing": true on a plan logs a failed shot and carries on, for a
     sweep of every page where one broken selector should not cost the
     other hundred. A plan that checks behaviour leaves it off and stops. */
  const failures = [];
  const wantsFull = (shot) => Boolean(shot.full ?? plan.full) && shot.capture !== false;
  const done = (shot) => {
    if (shot.capture === false) return false;
    const [w0, h0] = SIZES[0];
    if (!fs.existsSync(path.join(outDir, `${shot.name}-${w0}x${h0}.png`))) return false;
    if (!wantsFull(shot)) return true;
    return (
      fs.existsSync(path.join(outDir, `${shot.name}-full.png`)) ||
      fs.existsSync(path.join(outDir, `${shot.name}-full.skipped`))
    );
  };

  const shootOne = async (shot) => {
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
      } else if (step.hover) {
        /* Move the real pointer over an element, so :hover styles show. */
        const at = await evaluate(
          `(() => { const el = document.querySelector(${JSON.stringify(step.hover)}); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`,
        );
        if (!at) throw new Error(`${shot.name}: nothing to hover at ${step.hover}`);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
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

      /* "full": true on a shot (or on the plan) also takes the whole page,
         top to bottom, at the first size's width. The viewport is made as
         tall as the page rather than stitched, so the fixed ground and the
         rail run the full length and nothing repeats. */
      if ((shot.full ?? plan.full) && !fs.existsSync(path.join(outDir, `${shot.name}-full.png`))) {
        const [w, h] = SIZES[0];
        /* A marker first: if this capture takes the browser down, the next
           --resume run will not walk into the same wall. It is removed the
           moment the capture succeeds. */
        const marker = path.join(outDir, `${shot.name}-full.skipped`);
        fs.writeFileSync(marker, 'The full-length capture of this page took the browser down. The on-arrival shot stands.');
        await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
        const tall = await evaluate(
          `Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)`,
        );
        const height = Math.max(h, Math.min(FULL_MAX, Math.ceil(Number(tall) || h)));
        await send('Emulation.setDeviceMetricsOverride', {
          width: w,
          height,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await sleep(900);
        const { data } = await send('Page.captureScreenshot', { format: 'png' });
        const file = path.join(outDir, `${shot.name}-full.png`);
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        fs.rmSync(marker, { force: true });
        console.log(`  wrote ${file}`);
      }
    }

    await cdp.send('Target.disposeBrowserContext', { browserContextId });
  };

  for (const shot of plan.shots) {
    if (RESUME && done(shot)) continue;
    try {
      await shootOne(shot);
    } catch (error) {
      if (!plan.keepGoing) throw error;
      failures.push(shot.name);
      console.error(`  FAILED ${error.message}`);
    }
  }
  if (failures.length > 0) console.error(`${failures.length} shot(s) failed: ${failures.join(', ')}`);

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
    // The browser can still hold the profile for a moment after exit on
    // Windows. A leftover temp folder is harmless; a crash here is not.
    setTimeout(() => {
      try {
        fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      } catch {
        /* left for the OS temp sweep */
      }
    }, 800);
  });
