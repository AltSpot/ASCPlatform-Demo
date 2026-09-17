/**
 * The demo tenant's data (work order screen 18), read as text so a later
 * edit to the seed cannot quietly break a rule the demo is filmed under.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const seed = readFileSync('prisma/seed.ts', 'utf8');

describe('demo seed data', () => {
  test('no deal carries a figure for an AltSpot or sponsor position', () => {
    assert.doesNotMatch(seed, /altspotCommitted: [1-9]/);
    assert.doesNotMatch(seed, /committedNote: '[^']/);
    assert.doesNotMatch(seed, /\$600,000|Principal acquirer|acquired as principal|AltSpot acquired/i);
  });

  test('no return scenarios on a deal page', () => {
    assert.doesNotMatch(seed, /scenarios:\s*\[/);
  });

  test('at least one partner-led deal, and every open deal has a minimum to close', () => {
    assert.match(seed, /lead: 'partner'/);
    const ids = [...seed.matchAll(/^\s{4}id: '([a-z-]+)',$/gm)].map((m) => m[1]);
    const funding = seed.slice(seed.indexOf('const FUNDING'), seed.indexOf('};', seed.indexOf('const FUNDING')));
    for (const id of ids) {
      assert.ok(
        funding.includes(`  ${id}: { minimum:`) || funding.includes(`'${id}': { minimum:`),
        `${id} has no minimum to close`,
      );
    }
  });

  test('no fee or carry figure is written into deal data', () => {
    assert.doesNotMatch(seed, /10% carr|5% management|carried interest on profits/i);
  });
});
