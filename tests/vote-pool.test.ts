import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { VOTE_LADDER, VOTE_MAX, VOTE_MIN } from '../lib/terminal/radar';
import { canStep, poolShares, poolTotal, stepVote } from '../lib/vote-pool';

describe('a vote nudged from the dashboard', () => {
  test('moves one stop along the Radar ladder, in its own band', () => {
    assert.equal(stepVote(25_000, 1), 30_000);
    assert.equal(stepVote(25_000, -1), 20_000);
    assert.equal(stepVote(100_000, 1), 125_000);
    assert.equal(stepVote(100_000, -1), 90_000);
  });

  test('only ever lands on a value the Radar would also offer', () => {
    for (const stop of VOTE_LADDER) {
      assert.ok(VOTE_LADDER.includes(stepVote(stop, 1)));
      assert.ok(VOTE_LADDER.includes(stepVote(stop, -1)));
    }
  });

  test('stops at the ends and says so', () => {
    assert.equal(stepVote(VOTE_MIN, -1), VOTE_MIN);
    assert.equal(stepVote(VOTE_MAX, 1), VOTE_MAX);
    assert.equal(canStep(VOTE_MIN, -1), false);
    assert.equal(canStep(VOTE_MAX, 1), false);
    assert.equal(canStep(25_000, 1), true);
  });

  test('an older vote between stops steps to its neighbour, not past it', () => {
    assert.equal(stepVote(27_000, 1), 30_000);
    assert.equal(stepVote(27_000, -1), 25_000);
    assert.equal(stepVote(23_000, 1), 25_000);
    assert.equal(stepVote(23_000, -1), 20_000);
  });
});

describe('the pool', () => {
  const votes = [
    { slug: 'a', amount: 50_000 },
    { slug: 'b', amount: 25_000 },
    { slug: 'c', amount: 25_000 },
  ];

  test('totals what was voted', () => {
    assert.equal(poolTotal(votes), 100_000);
  });

  test('shares describe the spread and sum to a hundred', () => {
    const shares = poolShares(votes);
    assert.deepEqual(shares.map((s) => s.percent), [50, 25, 25]);
    assert.equal(shares.reduce((sum, s) => sum + s.percent, 0), 100);
  });

  test('raising one vote takes nothing from another: it is not a budget', () => {
    const raised = poolShares([{ slug: 'a', amount: 60_000 }, ...votes.slice(1)]);
    assert.equal(raised[1].amount, 25_000);
    assert.equal(raised[2].amount, 25_000);
  });

  test('an empty pool has no shares to divide', () => {
    assert.deepEqual(poolShares([]), []);
    assert.equal(poolShares([{ slug: 'a', amount: 0 }])[0].percent, 0);
  });
});
