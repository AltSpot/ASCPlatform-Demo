#!/usr/bin/env node
/**
 * Wipe and rebuild the demo database.
 *
 *   npm run db:reset
 *
 * Drops the SQLite file, re-applies every migration, and re-seeds the
 * four deals. Investors, commitments and documents are all cleared, so
 * the next login starts a fresh walkthrough.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* Run a local binary on this Node rather than through npx.

   `npx` is a shell script on Windows and execFileSync will not find it
   without a shell, so this failed with ENOENT there and the reset never
   ran. Going straight at the package's own entry point needs no shell
   and no quoting on any platform. Same fix as scripts/supervisor.mjs. */
function run(pkgBin, args) {
  execFileSync(process.execPath, [resolve(root, pkgBin), ...args], {
    cwd: root,
    stdio: 'inherit',
  });
}

// SQLite keeps sidecar files when WAL is enabled; remove them too.
for (const suffix of ['', '-journal', '-wal', '-shm']) {
  const file = resolve(root, `ascplatform.db${suffix}`);
  if (existsSync(file)) {
    rmSync(file);
    console.log(`Removed ascplatform.db${suffix}`);
  }
}

console.log('\nApplying migrations…');
run('node_modules/prisma/build/index.js', ['migrate', 'deploy']);

console.log('\nSeeding deals…');
run('node_modules/tsx/dist/cli.mjs', ['prisma/seed.ts']);

console.log('\nDatabase reset. Sign in with any email and password to start fresh.');
