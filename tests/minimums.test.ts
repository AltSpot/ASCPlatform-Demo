import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { defaultMinInvestment, explainMinimum, minimumBand, MINIMUM_FROM } from '../lib/minimums';
import { chanceOfAtLeastOne, sleevePlan, sleeveProgress, SLEEVE } from '../lib/portfolio-plan';

describe('the minimum investment rule', () => {
  test('$10K standard, $5K under $250K, $25K over $1M', () => {
    assert.equal(defaultMinInvestment(200_000), 5_000);
    assert.equal(defaultMinInvestment(250_000), 10_000);
    assert.equal(defaultMinInvestment(750_000), 10_000);
    assert.equal(defaultMinInvestment(1_000_000), 10_000);
    assert.equal(defaultMinInvestment(1_000_001), 25_000);
    assert.equal(defaultMinInvestment(2_000_000), 25_000);
    assert.deepEqual(
      [200_000, 500_000, 3_000_000].map(minimumBand),
      ['floor', 'standard', 'large'],
    );
  });

  test('"from" is the floor and nothing below it', () => {
    assert.equal(MINIMUM_FROM, 5_000);
    for (const size of [1, 100_000, 249_999, 250_000, 5_000_000]) {
      assert.ok(defaultMinInvestment(size) >= MINIMUM_FROM);
    }
  });

  test('a lead can set a minimum by hand, and the page says so', () => {
    assert.match(explainMinimum(25_000, 2_000_000), /over \$1,000,000/);
    assert.match(explainMinimum(10_000, 2_000_000), /Set by the lead/);
  });
});

describe('portfolio construction', () => {
  test('the odds of holding one outlier', () => {
    const pct = (bets: number) => Math.round(chanceOfAtLeastOne(bets) * 100);
    assert.equal(pct(20), 64);
    assert.equal(pct(10), 40);
    assert.equal(pct(5), 23);
    assert.equal(pct(0), 0);
  });

  test('the sleeve for $2M and $5M lands in the $10K to $25K band', () => {
    const two = sleevePlan(2_000_000);
    assert.equal(two.sleeveLow, 100_000);
    assert.equal(two.sleeveHigh, 200_000);
    assert.equal(two.perDealHigh, 10_000);
    const five = sleevePlan(5_000_000);
    assert.equal(five.perDealHigh, 25_000);
    assert.ok(two.dealsPerYear > 6 && two.dealsPerYear < 7);
    assert.equal(SLEEVE.targetPositions, 20);
  });

  test('progress against the count, and the weight of the largest position', () => {
    const p = sleeveProgress([10_000, 10_000, 30_000, 0]);
    assert.equal(p.count, 3);
    assert.equal(p.percent, 15);
    assert.equal(p.largestSharePercent, 60);
    assert.equal(p.equalWeightPercent, 5);
  });
});
