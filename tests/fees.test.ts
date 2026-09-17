/**
 * Fee math and fee words (docs/structure-decisions-sept-2026.md section
 * 15; work order screens 6, 7 and 8).
 *
 * The model: a flat fee per SPV, plus an annualized management fee of 1%
 * a year for five years, funded at closing as a reserve (5% of the
 * subscription), drawn down as earned, unearned amounts refunded. Carry
 * is 20% of profits at exit. No capital calls.
 *
 * Two things matter as much as the arithmetic. The shape: what goes to
 * escrow is the subscription plus the reserve and nothing else, so a new
 * charge cannot appear without a test failing. And the switches: with
 * SHOW_FEE_TERMS and SHOW_CARRY_TERMS off, no fee or carry figure appears
 * in any word this module produces.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { CARRY_PERCENT, FEE_TERMS, SHOW_CARRY_TERMS, SHOW_FEE_TERMS } from '@/lib/config';
import {
  NO_CAPITAL_CALLS,
  carryOn,
  carryRow,
  dealFeeRows,
  feeBreakdown,
  feeSentence,
  reservePercent,
} from '@/lib/fees';

const FIGURE = /\d+(\.\d+)?\s*%|\$\s?\d/;

describe('the model', () => {
  test('is the decided terms: $10,000 per SPV, 1% a year for five years, 20% carry', () => {
    assert.equal(FEE_TERMS.flatPerSpv, 10_000);
    assert.equal(FEE_TERMS.annualPercent, 1);
    assert.equal(FEE_TERMS.termYears, 5);
    assert.equal(reservePercent(), 5);
    assert.equal(CARRY_PERCENT, 20);
  });

  test('fees show by default since counsel confirmed them; carry stays off', () => {
    assert.equal(SHOW_FEE_TERMS, true);
    assert.equal(SHOW_CARRY_TERMS, false);
  });
});

describe('feeBreakdown', () => {
  test('the reserve is additive: escrow receives subscription plus reserve, nothing else', () => {
    const b = feeBreakdown(25_000);
    assert.deepEqual(Object.keys(b).sort(), ['allIn', 'amount', 'reserve']);
    assert.equal(b.reserve, 1_250);
    assert.equal(b.allIn, 26_250);
  });

  test('money stays in integer dollars', () => {
    for (const amount of [10_000, 10_001, 33_333, 1_234_567]) {
      const b = feeBreakdown(amount);
      assert.ok(Number.isInteger(b.reserve));
      assert.equal(b.allIn, b.amount + b.reserve);
    }
  });

  test('a missing, negative or non-finite amount is zero, not a charge', () => {
    for (const amount of [0, -5_000, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.deepEqual(feeBreakdown(amount), { amount: 0, reserve: 0, allIn: 0 });
    }
  });

  test('the reserve follows the terms it is given', () => {
    assert.equal(feeBreakdown(100_000, { flatPerSpv: 0, annualPercent: 2, termYears: 3 }).reserve, 6_000);
  });
});

describe('carry', () => {
  test('is a share of profit, and nothing on a loss', () => {
    assert.equal(carryOn(50_000), 10_000);
    assert.equal(carryOn(0), 0);
    assert.equal(carryOn(-20_000), 0);
  });
});

describe('the words', () => {
  test('off: the deal page names the fee, points at the memorandum, and shows no figure', () => {
    const rows = dealFeeRows(false, false);
    assert.equal(rows.length, 1);
    for (const row of rows) assert.doesNotMatch(`${row.label} ${row.detail}`, FIGURE);
    assert.match(rows[0].detail, /memorandum/);
  });

  test('off: no carry line anywhere', () => {
    assert.equal(carryRow(false), null);
    assert.doesNotMatch(feeSentence(false, false), /carr(y|ied)/i);
    assert.doesNotMatch(feeSentence(false, false), FIGURE);
  });

  test('on: the figures come from config', () => {
    const detail = dealFeeRows(true, true).map((r) => r.detail).join(' ');
    assert.match(detail, /1% per year of committed capital, 5 years/);
    assert.match(detail, /ends early.*returned/);
    assert.match(detail, /runs longer.*accrue.*distributions before carried interest/);
    assert.match(detail, /pro rata/);
    assert.match(detail, /pass through at cost/);
    assert.match(detail, /escrow belongs to investors/i);
    assert.match(detail, /\$10,000 per SPV/);
    assert.match(detail, /20% of profits at exit/);
  });

  test('no line ever calls the fee a percentage of capital raised, or says ten percent carry', () => {
    const all = [
      ...dealFeeRows(true, true).map((r) => r.detail),
      feeSentence(true, true),
      feeSentence(false, false),
    ].join(' ');
    assert.doesNotMatch(all, /of capital raised|10% carr|ten percent carr/i);
  });

  test('always says there are no capital calls', () => {
    assert.ok(feeSentence(false, false).includes(NO_CAPITAL_CALLS));
    assert.ok(feeSentence(true, true).includes(NO_CAPITAL_CALLS));
  });
});
