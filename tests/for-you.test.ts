import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { pickLibrary, pickWire, type ForYouSignals } from '../lib/terminal/for-you';

const BASE: ForYouSignals = {
  classes: [],
  heldCount: 0,
  awaitingEscrow: false,
  inEscrow: false,
  newToInvesting: false,
  targetPositions: 20,
};

const ALL = [
  'how-altspot-is-paid',
  'what-a-secondary-actually-buys',
  'twenty-positions-equal-weight',
  'accreditation-explained',
  'inside-a-data-room',
  'private-markets-q3-2026',
  'the-denominator-problem',
];

describe('what the Terminal leads with', () => {
  test('a subscription waiting on escrow leads, and says why', () => {
    const picks = pickLibrary({ ...BASE, awaitingEscrow: true, heldCount: 5 }, ALL);
    assert.equal(picks[0].slug, 'how-altspot-is-paid');
    assert.match(picks[0].reason, /waiting to go to escrow/);
    assert.equal(picks.length, 3);
  });

  test('the reason counts positions against the target', () => {
    const picks = pickLibrary({ ...BASE, heldCount: 5 }, ALL);
    assert.equal(picks[0].reason, 'You hold 5 of 20 positions');
  });

  test('it never picks a piece the library does not have, or the same piece twice', () => {
    const picks = pickLibrary({ ...BASE, classes: ['secondary'], newToInvesting: true }, [
      'inside-a-data-room',
      'the-denominator-problem',
    ]);
    assert.deepEqual(
      picks.map((p) => p.slug),
      ['inside-a-data-room', 'the-denominator-problem'],
    );
  });

  test('every pick carries a reason in words', () => {
    for (const pick of pickLibrary({ ...BASE, classes: ['secondary'], inEscrow: true }, ALL)) {
      assert.ok(pick.reason.length > 8);
      assert.doesNotMatch(pick.reason, /—/);
    }
  });

  test('the wire follows the classes a member voted for, and falls back to the newest', () => {
    const wire = [
      { id: 1, category: 'Venture' },
      { id: 2, category: 'Secondaries' },
      { id: 3, category: 'Real assets' },
    ];
    assert.deepEqual(
      pickWire({ ...BASE, classes: ['secondary'] }, wire).map((w) => w.id),
      [2],
    );
    assert.deepEqual(
      pickWire(BASE, wire, 2).map((w) => w.id),
      [1, 2],
    );
  });
});
