/**
 * The "Most popular" formula, pinned.
 *
 * The weights are a product decision (money over attention over votes),
 * so a change to them should fail here before it changes what every
 * member sees first on the dashboard.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  POPULARITY_WEIGHTS,
  popularityScore,
  rankByPopularity,
  type PopularityInput,
} from '../lib/popularity';

const deal = (over: Partial<PopularityInput> & { id: string }): PopularityInput => ({
  subscribedShare: 0,
  watchers: 0,
  radarDollars: 0,
  daysToClose: 30,
  ...over,
});

describe('the weights', () => {
  test('sum to one, money first', () => {
    const { subscribed, watchers, radar } = POPULARITY_WEIGHTS;
    assert.equal(Math.round((subscribed + watchers + radar) * 100), 100);
    assert.ok(subscribed > watchers && watchers > radar);
  });
});

describe('popularityScore', () => {
  test('a fully subscribed, most-watched, loudest deal scores one', () => {
    const item = deal({ id: 'a', subscribedShare: 1, watchers: 12, radarDollars: 5_000_000 });
    assert.equal(popularityScore(item, 12, 5_000_000), 1);
  });

  test('watchers and radar are shares of the largest, not absolutes', () => {
    const item = deal({ id: 'a', watchers: 3, radarDollars: 1_000_000 });
    const score = popularityScore(item, 12, 4_000_000);
    assert.equal(
      Math.round(score * 1000),
      Math.round((POPULARITY_WEIGHTS.watchers * 0.25 + POPULARITY_WEIGHTS.radar * 0.25) * 1000),
    );
  });

  test('a shelf with no watchers and no votes scores on money alone', () => {
    const item = deal({ id: 'a', subscribedShare: 0.5 });
    assert.equal(popularityScore(item, 0, 0), POPULARITY_WEIGHTS.subscribed * 0.5);
  });

  test('out-of-range inputs are clamped rather than trusted', () => {
    const item = deal({ id: 'a', subscribedShare: 1.8, watchers: 40 });
    assert.equal(popularityScore(item, 10, 0), POPULARITY_WEIGHTS.subscribed + POPULARITY_WEIGHTS.watchers);
  });
});

describe('rankByPopularity', () => {
  test('money committed outranks attention alone', () => {
    const ranked = rankByPopularity([
      deal({ id: 'watched', watchers: 20 }),
      deal({ id: 'funded', subscribedShare: 0.9 }),
    ]);
    assert.deepEqual(
      ranked.map((d) => d.id),
      ['funded', 'watched'],
    );
  });

  test('a tie goes to the deal closing soonest', () => {
    const ranked = rankByPopularity([
      deal({ id: 'later', subscribedShare: 0.5, daysToClose: 40 }),
      deal({ id: 'sooner', subscribedShare: 0.5, daysToClose: 3 }),
    ]);
    assert.equal(ranked[0].id, 'sooner');
  });

  test('an empty shelf ranks to an empty list', () => {
    assert.deepEqual(rankByPopularity([]), []);
  });

  test('the input is not mutated', () => {
    const input = [deal({ id: 'b' }), deal({ id: 'a', subscribedShare: 1 })];
    rankByPopularity(input);
    assert.equal(input[0].id, 'b');
  });
});
