/**
 * Deal preferences (lib/preferences.ts): quick to answer, blank means
 * any, and matching never depends on anything but the deal and the answers.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  EVERYTHING,
  isOpenToEverything,
  matchesPreferences,
  parsePreferences,
} from '@/lib/preferences';

const CALDER = { assetClass: 'venture', industry: 'energy-climate', leadType: 'altspot', stage: 'Series A Preferred', minInvestment: 10_000 };
const KESTREL = { assetClass: 'venture', industry: 'aerospace-defense', leadType: 'partner', stage: 'Series C Preferred', minInvestment: 25_000 };
const GROWTH = { assetClass: 'fund', industry: null, leadType: 'altspot', stage: 'Fund I', minInvestment: 25_000 };

describe('parsing a submission', () => {
  test('unknown keys and duplicates are dropped', () => {
    const p = parsePreferences({
      assetClasses: ['venture', 'venture', 'crypto'],
      industries: ['energy-climate', 'nope'],
      stages: ['early', 'x'],
      leads: ['partner', 'me'],
      checkSize: '25-50',
      notifyMatches: false,
    });
    assert.deepEqual(p.assetClasses, ['venture']);
    assert.deepEqual(p.industries, ['energy-climate']);
    assert.deepEqual(p.stages, ['early']);
    assert.deepEqual(p.leads, ['partner']);
    assert.equal(p.checkSize, '25-50');
    assert.equal(p.notifyMatches, false);
  });

  test('an empty body is no filter at all', () => {
    assert.equal(isOpenToEverything(parsePreferences({})), true);
  });
});

describe('matching', () => {
  test('everything matches everything', () => {
    for (const deal of [CALDER, KESTREL, GROWTH]) assert.equal(matchesPreferences(deal, EVERYTHING), true);
  });

  test('every answered question has to agree; a blank question is any', () => {
    const p = parsePreferences({ assetClasses: ['venture'], stages: ['early'] });
    assert.equal(matchesPreferences(CALDER, p), true);
    assert.equal(matchesPreferences(KESTREL, p), false);
    assert.equal(matchesPreferences(GROWTH, p), false);
  });

  test('a check size rules out deals whose minimum is above it', () => {
    const small = parsePreferences({ checkSize: '10-25' });
    assert.equal(matchesPreferences(CALDER, small), true);
    assert.equal(matchesPreferences({ ...KESTREL, minInvestment: 50_000 }, small), false);
  });
});
