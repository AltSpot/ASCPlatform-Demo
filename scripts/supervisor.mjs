#!/usr/bin/env node
/**
 * Keeps `next dev` alive.
 *
 * Launched detached by scripts/dev-server.mjs — not meant to be run by
 * hand. If Next exits for any reason other than a deliberate stop, it is
 * restarted after a short backoff, so the tab you left open on
 * localhost:4000 keeps working.
 *
 * A rapid crash loop (5 failures inside a minute) gives up rather than
 * spinning forever, and says so in the log.
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT ?? '4000';

const RESTART_DELAY_MS = 1500;
const CRASH_WINDOW_MS = 60_000;
const MAX_CRASHES = 5;

let child = null;
let stopping = false;
let crashes = [];

// Become a process group leader so the manager can signal the whole tree.
try {
  process.setpgid?.(0, 0);
} catch {
  /* not fatal */
}

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function startNext() {
  log(`starting next dev on port ${PORT}`);

  child = spawn('npx', ['next', 'dev', '--turbopack', '-p', PORT], {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;

    log(`next dev exited (code=${code} signal=${signal})`);

    const now = Date.now();
    crashes = crashes.filter((t) => now - t < CRASH_WINDOW_MS);
    crashes.push(now);

    if (crashes.length >= MAX_CRASHES) {
      log(
        `next dev failed ${MAX_CRASHES} times in under a minute — not restarting. ` +
          `Fix the error above, then run: npm run serve:restart`,
      );
      process.exit(1);
    }

    setTimeout(startNext, RESTART_DELAY_MS);
  });
}

function shutdown(signal) {
  stopping = true;
  log(`received ${signal} — shutting down`);

  if (child) {
    child.kill('SIGTERM');
    setTimeout(() => {
      child?.kill('SIGKILL');
      process.exit(0);
    }, 4000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startNext();
