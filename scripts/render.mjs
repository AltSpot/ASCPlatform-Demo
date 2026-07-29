#!/usr/bin/env node
/**
 * Render control from the terminal, so the dashboard is optional.
 *
 *   npm run deploy            trigger a deploy and follow it to completion
 *   npm run deploy:status     latest deploy state
 *   npm run deploy:logs       recent build + runtime logs
 *   npm run deploy:env        show configured env vars (values redacted)
 *   npm run deploy:wake       warm the free instance before a walkthrough
 *
 * Auto-deploy on push is already on, so `git push` deploys by itself.
 * This exists for the cases push does not cover: watching a deploy land,
 * reading why a build failed, and waking a slept instance before a demo.
 *
 * The API key is read from .env, which is gitignored. It is never printed.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.render.com/v1';

function env(name) {
  if (process.env[name]) return process.env[name];

  const file = resolve(root, '.env');
  if (!existsSync(file)) return null;

  const line = readFileSync(file, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith(`${name}=`));
  return line ? line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '') : null;
}

const KEY = env('RENDER_API_KEY');
const SERVICE = env('RENDER_SERVICE_ID');

if (!KEY) {
  console.error('RENDER_API_KEY not found in .env or the environment.');
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    throw new Error(`Render API ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

/** Resolve the service once, so the id never has to be pasted around. */
async function serviceId() {
  if (SERVICE) return SERVICE;

  const list = await api('/services?limit=20');
  const services = list.map((row) => row.service ?? row).filter((s) => s.type === 'web_service');

  if (services.length === 0) throw new Error('No web service found on this account.');
  return services[0].id;
}

function stamp(iso) {
  return iso ? new Date(iso).toISOString().replace('T', ' ').slice(0, 19) : '—';
}

// ---------------- commands ----------------

async function status() {
  const id = await serviceId();
  const [service, deploys] = await Promise.all([
    api(`/services/${id}`),
    api(`/services/${id}/deploys?limit=5`),
  ]);

  console.log(`\n  ${service.name}   ${service.serviceDetails?.url ?? ''}`);
  console.log(`  suspended: ${service.suspended}   autoDeploy: ${service.autoDeploy}\n`);
  console.log('  recent deploys');

  for (const row of deploys) {
    const d = row.deploy ?? row;
    console.log(
      `    ${String(d.status).padEnd(14)} ${stamp(d.finishedAt ?? d.createdAt)}  ${(d.commit?.message ?? '').split('\n')[0].slice(0, 54)}`,
    );
  }
  console.log('');
}

/** Trigger a deploy and block until it lands, so failures surface here. */
async function deploy() {
  const id = await serviceId();
  const started = await api(`/services/${id}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'do_not_clear' }),
  });

  const deployId = started.id ?? started.deploy?.id;
  console.log(`  deploy ${deployId} queued`);

  const TERMINAL = ['live', 'build_failed', 'update_failed', 'canceled', 'deactivated'];
  const deadline = Date.now() + 15 * 60_000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 10_000));

    const row = await api(`/services/${id}/deploys/${deployId}`);
    const d = row.deploy ?? row;
    process.stdout.write(`\r  status: ${String(d.status).padEnd(20)}`);

    if (TERMINAL.includes(d.status)) {
      console.log('');
      if (d.status !== 'live') {
        console.error(`\n  Deploy did not go live: ${d.status}`);
        console.error('  Run: npm run deploy:logs\n');
        process.exit(1);
      }
      console.log('\n  Live.\n');
      return;
    }
  }

  console.error('\n  Timed out waiting for the deploy.\n');
  process.exit(1);
}

async function logs() {
  const id = await serviceId();
  const owner = (await api(`/services/${id}`)).ownerId;

  const res = await api(
    `/logs?ownerId=${owner}&resource=${id}&limit=100&direction=backward`,
  );
  const entries = (res.logs ?? []).reverse();

  if (entries.length === 0) {
    console.log('  No log entries returned.');
    return;
  }
  for (const entry of entries) {
    console.log(`  ${stamp(entry.timestamp)}  ${entry.message}`);
  }
}

async function showEnv() {
  const id = await serviceId();
  const vars = await api(`/services/${id}/env-vars?limit=50`);

  console.log('\n  environment variables');
  for (const row of vars) {
    const v = row.envVar ?? row;
    // Values can hold credentials. Show only that the key is set.
    console.log(`    ${v.key.padEnd(22)} set`);
  }
  console.log('');
}

/** Free instances sleep after ~15 minutes. Warm one before a walkthrough. */
async function wake() {
  const id = await serviceId();
  const url = (await api(`/services/${id}`)).serviceDetails?.url;
  if (!url) throw new Error('Service has no URL yet.');

  console.log(`  waking ${url} …`);
  const began = Date.now();
  const res = await fetch(url, { redirect: 'manual' });
  const seconds = ((Date.now() - began) / 1000).toFixed(1);

  console.log(`  HTTP ${res.status} in ${seconds}s. Awake.\n`);
}

const COMMANDS = { status, deploy, logs, env: showEnv, wake };
const command = process.argv[2] ?? 'status';

if (!COMMANDS[command]) {
  console.error(`Unknown command "${command}". Use: ${Object.keys(COMMANDS).join(' | ')}`);
  process.exit(1);
}

COMMANDS[command]().catch((error) => {
  console.error(`\n  ${error.message}\n`);
  process.exit(1);
});
