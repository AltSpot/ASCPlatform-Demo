/**
 * Fee math, and the promise the product makes about it.
 *
 * The economics AltSpot commits to are one 5% management fee charged once
 * at closing, and 10% carried interest on profits at exit. Nothing else. No
 * annual fees, no capital calls, no admin reserve.
 *
 * Most of this file is not arithmetic. The arithmetic is four lines and it
 * is easy. What is hard is keeping the model from quietly growing a third
 * charge two years from now, in a place nobody thought to look. So these
 * tests assert the SHAPE of the fee model as much as its values: the module
 * exports one function, the breakdown carries four fields, and the amount
 * due at closing is the subscription plus the management fee and nothing
 * else. A new fee cannot be added without one of them failing.
 *
 * lib/subscription-sections.test.ts holds the other half of this: that the
 * executed agreement states the same numbers. The two are meant to be the
 * same promise written twice.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import * as feesModule from '@/lib/fees';
import { feeBreakdown } from '@/lib/fees';
import { money } from '@/lib/format';
import type { DealFees } from '@/lib/domain';

/** The rates every deal in the product carries. */
const ASCP: DealFees = { management: 5, carry: 10 };

/** Reads a rendered figure back out of the string the investor sees. */
const parseMoney = (rendered: string) => Number(rendered.replace(/[$,]/g, ''));

describe('the fee model is exactly two numbers', () => {
  test('lib/fees.ts exports one function and nothing else', () => {
    // A second export here would be a second fee. Adding `annualFee`,
    // `capitalCall` or `adminReserve` fails this line, which is the point.
    assert.deepEqual(Object.keys(feesModule).sort(), ['feeBreakdown']);
  });

  test('a fee breakdown carries four fields and no others', () => {
    // The type system permits widening FeeBreakdown. This does not. Any
    // new charge has to surface as a new key, so this is where a fee model
    // that has grown a third component gets caught.
    assert.deepEqual(Object.keys(feeBreakdown(ASCP, 100_000)).sort(), [
      'allIn',
      'amount',
      'carry',
      'management',
    ]);
  });

  test('the breakdown takes no holding period, term or year, so no fee can recur', () => {
    // An annual fee needs a time dimension to be computed against. There
    // is none: the same subscription produces the same charge forever.
    const first = feeBreakdown(ASCP, 100_000);
    const later = feeBreakdown(ASCP, 100_000);
    assert.deepEqual(later, first);
    assert.deepEqual(feeBreakdown(ASCP, 100_000), first);
  });
});

describe('the 5% management fee, charged once at closing', () => {
  test('the minimum investment is charged $500 and settles at $10,500', () => {
    const breakdown = feeBreakdown(ASCP, 10_000);
    assert.equal(breakdown.amount, 10_000);
    assert.equal(breakdown.management, 500);
    assert.equal(breakdown.allIn, 10_500);
  });

  test('the fee is a straight percentage of the subscription at every size', () => {
    for (const amount of [10_000, 25_000, 100_000, 250_000, 1_000_000, 100_000_000]) {
      const breakdown = feeBreakdown(ASCP, amount);
      assert.equal(
        breakdown.management,
        amount * 0.05,
        `management fee on ${amount} is not 5%`,
      );
    }
  });

  test('the amount due at closing is the subscription plus the fee and nothing else', () => {
    // The single most important line in this file. If a charge is ever
    // introduced that the investor pays but this sum does not include,
    // the checkout summary, the agreement and the funding page stop
    // agreeing, which is the exact failure lib/fees.ts exists to prevent.
    for (const amount of [10_000, 12_345, 25_000, 999_999, 1_000_000]) {
      const breakdown = feeBreakdown(ASCP, amount);
      assert.equal(
        breakdown.allIn,
        breakdown.amount + breakdown.management,
        `all-in on ${amount} contains a charge that is not the management fee`,
      );
    }
  });

  test('a deal with no management fee costs exactly the subscription', () => {
    const breakdown = feeBreakdown({ management: 0, carry: 10 }, 50_000);
    assert.equal(breakdown.management, 0);
    assert.equal(breakdown.allIn, 50_000);
  });

  test('the management rate is read from the deal, not hardcoded', () => {
    // Every seeded deal is 5, but the rate lives on the deal record. The
    // math must follow the record, or a deal could show one number and
    // charge another.
    assert.equal(feeBreakdown({ management: 2, carry: 10 }, 100_000).management, 2_000);
    assert.equal(feeBreakdown({ management: 7.5, carry: 10 }, 100_000).management, 7_500);
  });
});

describe('10% carried interest, on profits at exit only', () => {
  test('carry is passed through as a percentage, never as a dollar charge', () => {
    const breakdown = feeBreakdown(ASCP, 100_000);
    assert.equal(breakdown.carry, 10);
    // Carry is 10 percent, not ten dollars and not $10,000. If it were
    // ever converted to money here it would read as due today.
    assert.notEqual(breakdown.carry, 100_000 * 0.1);
  });

  test('changing the carry rate never changes what is due at closing', () => {
    // Carry is charged on profits at exit. Nothing about it can reach the
    // amount an investor wires today.
    const base = feeBreakdown({ management: 5, carry: 10 }, 250_000);
    for (const carry of [0, 20, 50, 100]) {
      const other = feeBreakdown({ management: 5, carry }, 250_000);
      assert.equal(other.allIn, base.allIn, `carry ${carry} moved the all-in figure`);
      assert.equal(other.management, base.management);
    }
  });
});

describe('money is integer dollars', () => {
  test('an integer subscription with a rate that divides cleanly stays integral', () => {
    for (const amount of [10_000, 20_000, 25_000, 1_000_000]) {
      const { management, allIn } = feeBreakdown(ASCP, amount);
      assert.ok(Number.isInteger(management), `fee on ${amount} is fractional`);
      assert.ok(Number.isInteger(allIn), `all-in on ${amount} is fractional`);
    }
  });

  test('a subscription not divisible by 20 yields a fractional fee, and the display still adds up', () => {
    // Documented behaviour, deliberately not asserted as integral.
    // Subscriptions are validated as integers with a floor, not a step, so
    // $10,001 is a legal amount and 5% of it is $500.05. That figure is
    // derived and never persisted, and because the subscription itself is
    // an integer, the rendered fee and the rendered all-in round in step.
    // The three numbers an investor reads therefore always reconcile.
    const breakdown = feeBreakdown(ASCP, 10_001);
    assert.equal(breakdown.management, 500.05);
    assert.equal(Number.isInteger(breakdown.management), false);

    for (const amount of [10_001, 10_010, 10_030, 12_345, 999_999]) {
      const { management, allIn } = feeBreakdown(ASCP, amount);
      assert.equal(
        parseMoney(money(allIn)),
        amount + parseMoney(money(management)),
        `the checkout summary for ${amount} does not add up as displayed`,
      );
    }
  });

  test('large subscriptions do not drift on floating point', () => {
    const breakdown = feeBreakdown(ASCP, 100_000_000);
    assert.equal(breakdown.management, 5_000_000);
    assert.equal(breakdown.allIn, 105_000_000);
  });
});

describe('an amount that is not a real subscription costs nothing', () => {
  test('zero, negative, missing and non-finite amounts collapse to zero', () => {
    // The amount arrives from a number field in a browser. It is a real
    // input and it must never produce a negative charge or a NaN total.
    for (const amount of [0, -1, -100_000, NaN, Infinity, -Infinity]) {
      const breakdown = feeBreakdown(ASCP, amount);
      assert.equal(breakdown.amount, 0, `amount ${amount}`);
      assert.equal(breakdown.management, 0, `management on ${amount}`);
      assert.equal(breakdown.allIn, 0, `all-in on ${amount}`);
    }
  });

  test('a refused amount still reports the deal carry, so the panel never blanks', () => {
    assert.equal(feeBreakdown(ASCP, 0).carry, 10);
  });
});
