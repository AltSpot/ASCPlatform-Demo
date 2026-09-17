/**
 * Quick filters (lib/explore.ts): the dashboard's Explore tiles and the
 * marketplace URL have to mean the same slice.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  exploreGroups,
  matchesQuickFilter,
  parseQuickFilter,
  quickFilterHref,
  stageBucket,
} from '@/lib/explore';

const DEALS = [
  { id: 'a', assetClass: 'venture', industry: 'energy-climate', leadType: 'altspot', stage: 'Series A Preferred' },
  { id: 'b', assetClass: 'venture', industry: 'industrials', leadType: 'altspot', stage: 'Seed Preferred' },
  { id: 'c', assetClass: 'venture', industry: 'aerospace-defense', leadType: 'partner', stage: 'Series C Preferred' },
  { id: 'd', assetClass: 'secondary', industry: 'artificial-intelligence', leadType: 'altspot', stage: 'Late stage · issuer-approved' },
  { id: 'e', assetClass: 'growth', industry: 'logistics-supply-chain', leadType: 'altspot', stage: 'Growth Preferred' },
];

describe('stage buckets', () => {
  test('read from the stage line', () => {
    assert.deepEqual(DEALS.map(stageBucket), ['early', 'seed', 'growth', 'late', 'growth']);
    assert.equal(stageBucket({ stage: 'Fund I · $10M target', assetClass: 'fund' }), null);
  });
});

describe('the URL round trip', () => {
  test('a tile link parses back to the same filter', () => {
    const href = quickFilterHref({ lead: 'partner', stage: 'growth' });
    const params = Object.fromEntries(new URL(href, 'http://x').searchParams);
    const f = parseQuickFilter(params);
    assert.equal(f.lead, 'partner');
    assert.equal(f.stage, 'growth');
    assert.deepEqual(DEALS.filter((d) => matchesQuickFilter(d, f)).map((d) => d.id), ['c']);
  });

  test('unknown values are ignored rather than filtering to nothing', () => {
    const f = parseQuickFilter({ class: 'crypto', lead: 'someone', stage: 'x', industry: 'nope' });
    assert.deepEqual(f, { assetClass: null, industry: null, lead: null, stage: null });
  });
});

describe('explore groups', () => {
  test('only slices with something open, counts right', () => {
    const groups = exploreGroups(DEALS);
    const lead = groups.find((g) => g.title === 'Who leads')!;
    assert.deepEqual(lead.tiles.map((t) => [t.key, t.count]), [['altspot', 4], ['partner', 1]]);
    const classes = groups.find((g) => g.title === 'Asset class')!;
    assert.ok(!classes.tiles.some((t) => t.key === 'fund'), 'a class with nothing open is shown');
  });

  test('no deals, no groups', () => {
    assert.deepEqual(exploreGroups([]), []);
  });
});
