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

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
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
run('npx', ['prisma', 'migrate', 'deploy']);

console.log('\nSeeding deals…');
run('npx', ['tsx', 'prisma/seed.ts']);

console.log('\nDatabase reset. Sign in with any email and password to start fresh.');
