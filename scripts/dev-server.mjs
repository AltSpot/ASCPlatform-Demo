#!/usr/bin/env node
/**
 * Dev server supervisor.
 *
 *   npm run serve            start in dev (detached, survives this terminal)
 *   npm run serve:demo       build, then start in production mode
 *   npm run serve:restart    restart, in whichever mode is running
 *   npm run serve:stop       stop
 *   npm run serve:status     is it up, and in which mode?
 *   npm run serve:logs       tail the log
 *
 * Why this exists: Next's dev server already hot-reloads code, but it
 * does not come back on its own if it crashes, and it dies with the
 * terminal that launched it. This wrapper runs it detached and restarts
 * it automatically, so http://localhost:4000 simply stays up.
 *
 * Port conflicts are resolved rather than reported: whatever is holding
 * the port is terminated before the server starts, because a half-bound
 * port is the single most common reason "localhost is broken".
 *
 * DEMO MODE EXISTS BECAUSE `next dev` IS NOT WHAT THE PRODUCT FEELS
 * LIKE. In dev, a route compiles the first time it is visited and React
 * ships unminified with its development warnings, so the first visit to
 * each page stalls for seconds and a scroll that crosses newly loaded
 * code can drop a frame for well over a second. None of that is in the
 * built product. `serve:demo` builds first, in the foreground so the
 * build output is visible, then hands the finished build to the same
 * supervisor. Restarts stay instant because there is nothing left to
 * compile.
 *
 * The mode is recorded next to the pid so `restart` and `status` do not
 * have to be told again.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runDir = resolve(root, '.run');
const pidFile = resolve(runDir, 'dev-server.pid');
const modeFile = resolve(runDir, 'dev-server.mode');
const logFile = resolve(runDir, 'dev-server.log');

const PORT = Number(process.env.PORT ?? 4000);
const URL = `http://localhost:${PORT}`;

/* Next's own entry point, run on this Node rather than through npx, for
   the same reason supervisor.mjs does it: npx is a shell script on
   Windows and spawn() will not find it without a shell. */
const NEXT_BIN = resolve(root, 'node_modules/next/dist/bin/next');

// ---------------- helpers ----------------

function quiet(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

/**
 * PIDs currently listening on the port.
 *
 * `lsof` is not on Windows, and asking for it there returned an empty
 * string that read exactly like "nothing holds the port". So the one
 * job this function exists for, stopping a stale process from blocking
 * the next start, silently did nothing on the only platform this
 * project is developed on. The symptom was a supervisor that came up,
 * hit EADDRINUSE five times, gave up, and left `serve:status` claiming
 * the supervisor was alive while an older server answered the port.
 *
 * `netstat -ano` is present on every Windows install and needs no
 * elevation. Its LISTENING lines end in the owning PID.
 */
function portHolders() {
  const pids =
    process.platform === 'win32'
      ? quiet('netstat', ['-ano', '-p', 'TCP'])
          .split('\n')
          .filter((line) => /LISTENING/i.test(line))
          .filter((line) => new RegExp(`[:.]${PORT}\\s`).test(line))
          .map((line) => Number(line.trim().split(/\s+/).pop()))
      : quiet('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t'])
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map(Number);

  // Never report ourselves: killing this process would end the command
  // that is trying to start the server.
  return [...new Set(pids)].filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
}

/**
 * Windows has no signals. `process.kill(pid, 'SIGTERM')` there maps to a
 * hard TerminateProcess on that pid alone, which orphans the Next child
 * and leaves the port held. `taskkill /T` takes the tree.
 */
function killTree(pid, force) {
  if (process.platform === 'win32') {
    quiet('taskkill', force ? ['/PID', String(pid), '/T', '/F'] : ['/PID', String(pid), '/T']);
    return;
  }
  try {
    process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');
  } catch {
    /* already gone */
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid() {
  if (!existsSync(pidFile)) return null;
  const pid = Number(readFileSync(pidFile, 'utf8').trim());
  return Number.isInteger(pid) && alive(pid) ? pid : null;
}

async function waitForExit(pid, ms = 5000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (!alive(pid)) return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

/** Free the port, politely first and then not. */
async function freePort() {
  const holders = portHolders();
  if (holders.length === 0) return;

  console.log(`Port ${PORT} is in use by ${holders.join(', ')} — clearing it.`);
  for (const pid of holders) killTree(pid, false);

  for (const pid of holders) {
    const exited = await waitForExit(pid, 4000);
    if (!exited) killTree(pid, true);
  }
}

// ---------------- commands ----------------

async function stop({ silent = false } = {}) {
  const pid = readPid();

  if (pid) {
    if (process.platform === 'win32') {
      // No process groups here; taskkill /T walks the tree instead.
      killTree(pid, false);
    } else {
      try {
        // Negative PID targets the whole process group, so Next's
        // children go down with the supervisor rather than orphaned.
        process.kill(-pid, 'SIGTERM');
      } catch {
        killTree(pid, false);
      }
    }

    const exited = await waitForExit(pid, 5000);
    if (!exited) {
      if (process.platform === 'win32') {
        killTree(pid, true);
      } else {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          /* already gone */
        }
      }
    }
  }

  await freePort();
  if (existsSync(pidFile)) rmSync(pidFile);
  if (existsSync(modeFile)) rmSync(modeFile);

  if (!silent) console.log('Dev server stopped.');
}

function readMode() {
  try {
    return readFileSync(modeFile, 'utf8').trim() === 'prod' ? 'prod' : 'dev';
  } catch {
    return 'dev';
  }
}

/**
 * Build in the FOREGROUND, before anything is detached.
 *
 * Two reasons it belongs here rather than in the supervisor. A build
 * takes minutes and prints things worth reading, and a detached process
 * writing to a log file hides all of it. And keeping the build out of
 * the supervisor means a crash-restart re-serves the existing build
 * instantly, instead of rebuilding under a viewer who is mid-sentence.
 */
function build() {
  console.log('\n  Building for production. This takes a minute.\n');
  const result = spawnSync(process.execPath, [NEXT_BIN, 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error('\n  Build failed. Nothing was started.\n');
    process.exit(result.status ?? 1);
  }
}

async function start({ mode = 'dev', prebuilt = false } = {}) {
  mkdirSync(runDir, { recursive: true });

  if (readPid()) {
    console.log(`Already running at ${URL} (${readMode()} mode)`);
    return;
  }

  // The `demo` command builds before it stops the running server, so it
  // passes prebuilt. Anything else asking for prod mode builds here.
  if (mode === 'prod' && !prebuilt) build();

  await freePort();

  const out = openSync(logFile, 'a');
  const child = spawn(process.execPath, [resolve(root, 'scripts/supervisor.mjs')], {
    cwd: root,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, PORT: String(PORT), ASC_SERVE_MODE: mode },
  });

  writeFileSync(pidFile, String(child.pid));
  writeFileSync(modeFile, mode);
  child.unref();

  const ready = await waitForHttp(45_000);
  if (ready) {
    const note =
      mode === 'prod'
        ? 'production build. This is what the product actually feels like.'
        : 'dev. Routes compile on first visit. Use serve:demo to record.';
    console.log(`\n  ASCPlatform is running at ${URL}\n  ${note}\n`);
  } else {
    console.log(
      `\n  Started (pid ${child.pid}) but ${URL} did not answer yet.\n  Check: npm run serve:logs\n`,
    );
  }
}

async function waitForHttp(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(URL, { redirect: 'manual' });
      if (response.status > 0) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function status() {
  const pid = readPid();
  const holders = portHolders();

  if (pid && holders.length > 0) {
    console.log(`Running — pid ${pid}, ${readMode()} mode, listening on ${URL}`);
  } else if (pid) {
    console.log(`Supervisor alive (pid ${pid}) but nothing is listening on ${PORT}.`);
  } else if (holders.length > 0) {
    console.log(`Something else holds port ${PORT}: ${holders.join(', ')}`);
  } else {
    console.log('Not running.');
  }
}

function logs() {
  if (!existsSync(logFile)) {
    console.log('No log yet — start the server first.');
    return;
  }
  spawn('tail', ['-n', '80', '-f', logFile], { stdio: 'inherit' });
}

// ---------------- dispatch ----------------

const command = process.argv[2] ?? 'start';

switch (command) {
  case 'start':
    await start({ mode: 'dev' });
    break;
  case 'demo':
    /* Build BEFORE stopping anything.
     *
     * Restart rather than refuse, because the usual reason to run this
     * is that a dev server is already up and the recording is about to
     * start. But stopping first meant a build error took the site down
     * and left nothing serving, which is the worst possible moment for
     * localhost to go dark. Build first, and a failed build leaves the
     * running server untouched. */
    build();
    await stop({ silent: true });
    await start({ mode: 'prod', prebuilt: true });
    break;
  case 'stop':
    await stop();
    break;
  case 'restart': {
    // Come back in whatever mode was running, so a restart mid-demo does
    // not silently drop back to dev.
    const mode = readMode();
    await stop({ silent: true });
    await start({ mode });
    break;
  }
  case 'status':
    await status();
    break;
  case 'logs':
    logs();
    break;
  default:
    console.error(
      `Unknown command "${command}". Use start|demo|stop|restart|status|logs.`,
    );
    process.exit(1);
}
