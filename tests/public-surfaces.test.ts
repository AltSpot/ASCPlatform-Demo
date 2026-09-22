/**
 * Logged-out surfaces name no offering (Rule 506(b), work order screen 4).
 *
 * Everything in public/ is served to anyone, and the login page and the
 * site-wide metadata (tab title, link previews, social cards) are what a
 * logged-out visitor or a crawler reads. None of them may carry a deal
 * name, a deal id, or a Radar company name. The names are read from the
 * seed and the Radar source as text, so a new deal or company is covered
 * the moment it is added.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

function collect(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].map((m) => m[1]);
}

const seed = readFileSync('prisma/seed.ts', 'utf8');
const radar = readFileSync('lib/terminal/radar.ts', 'utf8');

/* AltSpot's own fund carries the brand name, which is on every page. */
const OWN = new Set(['growth-fund', 'AltSpot Growth Fund']);

const NAMES = [
  ...collect(seed, /^\s{4}id: '([a-z0-9-]+)',$/gm),
  ...collect(seed, /^\s{4}name: '([^']+)',$/gm),
  ...collect(radar, /^\s{4}slug: '([a-z0-9-]+)',$/gm),
  ...collect(radar, /^\s{4}name: '([^']+)',$/gm),
].filter((n) => !OWN.has(n) && n.length > 3);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function mentions(text: string): string[] {
  const lower = text.toLowerCase();
  return NAMES.filter((name) => lower.includes(name.toLowerCase()));
}

describe('logged-out surfaces', () => {
  test('the name list was actually read', () => {
    assert.ok(NAMES.includes('calder'), 'deal ids not found in the seed');
    assert.ok(NAMES.some((n) => n === 'cinder'), 'Radar slugs not found');
  });

  test('no file under public/ is named after a deal or Radar company', () => {
    const hits = walk('public').filter((file) => mentions(path.basename(file)).length > 0);
    assert.deepEqual(hits, []);
  });

  test('no text file under public/ names one', () => {
    const hits = walk('public')
      .filter((file) => /\.(svg|txt|json|html|xml|webmanifest)$/.test(file))
      .flatMap((file) => mentions(readFileSync(file, 'utf8')).map((n) => `${file}: ${n}`));
    assert.deepEqual(hits, []);
  });

  for (const file of ['app/layout.tsx', 'app/page.tsx', 'components/LoginForm.tsx', 'app/Login.module.css']) {
    test(`${file} names no offering`, () => {
      assert.deepEqual(mentions(readFileSync(file, 'utf8')), []);
    });
  }

  test('link previews carry the platform line only', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8');
    assert.match(layout, /The new standard for private market ownership\./);
    assert.match(layout, /openGraph/);
  });
});

describe('no real vendor or bank on a member-facing screen', () => {
  const NAMES = ['Plaid', 'Modern Treasury', 'J.P. Morgan', 'JPMorgan', 'Anvil', 'Postmark', 'Chase', 'Bank of America', 'Wells Fargo', 'Charles Schwab', 'Mercury'];
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next') continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (entry.endsWith('.tsx')) out.push(full);
    }
    return out;
  };
  test('no component renders a vendor name, and PARTNERS is never interpolated into copy', () => {
    const offenders: string[] = [];
    for (const file of [...walk('components'), ...walk('app')]) {
      /* Strip comments and identifiers: only rendered text and string literals matter. */
      const src = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\b(Plaid[A-Z]\w*|\w+Plaid\w*)\b/g, '');
      if (/\{PARTNERS\./.test(src)) offenders.push(`${file}: interpolates PARTNERS`);
      for (const name of NAMES) {
        if (new RegExp(`[>'"\`\\s]${name.replace('.', '\\.')}[<'"\`\\s,.]`).test(src)) offenders.push(`${file}: ${name}`);
      }
    }
    assert.deepEqual(offenders, []);
  });
});
