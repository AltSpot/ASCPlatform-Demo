#!/usr/bin/env node
/**
 * Keeps the Next server alive.
 *
 * Launched detached by scripts/dev-server.mjs — not meant to be run by
 * hand. If Next exits for any reason other than a deliberate stop, it is
 * restarted after a short backoff, so the tab you left open on
 * localhost:4000 keeps working.
 *
 * A rapid crash loop (5 failures inside a minute) gives up rather than
 * spinning forever, and says so in the log.
 *
 * TWO MODES, AND THE DIFFERENCE IS NOT COSMETIC. `dev` runs
 * `next dev --turbopack`: routes compile the first time they are
 * visited, which costs seconds on that first visit, and React runs
 * unminified with its development warnings. `prod` runs `next start`
 * against a build the manager has already produced, which is what the
 * platform actually feels like: measured on this machine, the same
 * pages go from multi-second first paints and a 1.8s stall mid-scroll
 * to 9-29ms server renders, 60fps scrolling and 23-76ms navigations.
 *
 * Anything anyone watches — a demo, a recording, a walkthrough on a
 * call — runs in `prod`. `dev` is for writing code.
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT ?? '4000';

/* The manager sets this. Default is dev, so nothing that already calls
   this script by hand changes behaviour. */
const MODE = process.env.ASC_SERVE_MODE === 'prod' ? 'prod' : 'dev';

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

/* Next's own entry point, run on this Node rather than through npx.
   `npx` is a shell script on Windows and spawn() will not find it
   without a shell, which is how this silently failed to start there
   while an older server kept answering on the port. Going straight at
   the binary needs no shell and no quoting on any platform. */
const NEXT_BIN = resolve(root, 'node_modules/next/dist/bin/next');

/* `next start` serves the build the manager made before spawning us, so
   there is nothing to compile here and a restart is near-instant. */
const NEXT_ARGS =
  MODE === 'prod' ? ['start', '-p', PORT] : ['dev', '--turbopack', '-p', PORT];

function startNext() {
  log(`starting next ${NEXT_ARGS[0]} on port ${PORT} (${MODE} mode)`);

  child = spawn(process.execPath, [NEXT_BIN, ...NEXT_ARGS], {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;

    log(`next ${NEXT_ARGS[0]} exited (code=${code} signal=${signal})`);

    const now = Date.now();
    crashes = crashes.filter((t) => now - t < CRASH_WINDOW_MS);
    crashes.push(now);

    if (crashes.length >= MAX_CRASHES) {
      log(
        `next ${NEXT_ARGS[0]} failed ${MAX_CRASHES} times in under a minute — ` +
          `not restarting. Fix the error above, then run: npm run serve:restart`,
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
