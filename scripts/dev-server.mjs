#!/usr/bin/env node
/**
 * Dev server supervisor.
 *
 *   npm run serve            start (detached, survives this terminal)
 *   npm run serve:restart    restart
 *   npm run serve:stop       stop
 *   npm run serve:status     is it up?
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
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runDir = resolve(root, '.run');
const pidFile = resolve(runDir, 'dev-server.pid');
const logFile = resolve(runDir, 'dev-server.log');

const PORT = Number(process.env.PORT ?? 4000);
const URL = `http://localhost:${PORT}`;

// ---------------- helpers ----------------

function quiet(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

/** PIDs currently listening on the port. */
function portHolders() {
  return quiet('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(Number);
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
  for (const pid of holders) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
  }

  for (const pid of holders) {
    const exited = await waitForExit(pid, 4000);
    if (!exited) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
}

// ---------------- commands ----------------

async function stop({ silent = false } = {}) {
  const pid = readPid();

  if (pid) {
    try {
      // Negative PID targets the whole process group, so Next's children
      // go down with the supervisor instead of being orphaned.
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* already gone */
      }
    }
    const exited = await waitForExit(pid, 5000);
    if (!exited) {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }

  await freePort();
  if (existsSync(pidFile)) rmSync(pidFile);

  if (!silent) console.log('Dev server stopped.');
}

async function start() {
  mkdirSync(runDir, { recursive: true });

  if (readPid()) {
    console.log(`Already running at ${URL}`);
    return;
  }

  await freePort();

  const out = openSync(logFile, 'a');
  const child = spawn(process.execPath, [resolve(root, 'scripts/supervisor.mjs')], {
    cwd: root,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, PORT: String(PORT) },
  });

  writeFileSync(pidFile, String(child.pid));
  child.unref();

  const ready = await waitForHttp(45_000);
  if (ready) {
    console.log(`\n  ASCPlatform is running at ${URL}\n`);
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
    console.log(`Running — pid ${pid}, listening on ${URL}`);
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
    await start();
    break;
  case 'stop':
    await stop();
    break;
  case 'restart':
    await stop({ silent: true });
    await start();
    break;
  case 'status':
    await status();
    break;
  case 'logs':
    logs();
    break;
  default:
    console.error(`Unknown command "${command}". Use start|stop|restart|status|logs.`);
    process.exit(1);
}
