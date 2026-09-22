/**
 * The performance metrics every surface reads.
 *
 * The rule that matters most here: a multiple counts distributions. A
 * position that returned its cost and still holds a stake is not a
 * 1.0x, and the dashboard reported exactly that while Portfolio did
 * not. These tests exist so the two cannot drift apart again.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { readFileSync } from 'node:fs';

import {
  bookMetrics,
  irr,
  ledgerBook,
  moic,
  positionFlows,
  totalValue,
  unrealized,
} from '../lib/portfolio-metrics';

const NOW = new Date('2026-08-31T12:00:00.000Z');

describe('one position', () => {
  test('total value counts cash already returned', () => {
    const p = { invested: 10_000, fairValue: 8_000, realized: 6_000 };
    assert.equal(totalValue(p), 14_000);
  });

  /* The bug this pins. Mark over cost calls this position a 0.8x when
     it has in fact returned 1.4x of what went in. */
  test('MOIC counts distributions, not the mark alone', () => {
    const p = { invested: 10_000, fairValue: 8_000, realized: 6_000 };
    assert.equal(moic(p), 1.4);
    assert.notEqual(moic(p), p.fairValue / p.invested);
  });

  test('a fully realized position keeps its multiple after the mark goes', () => {
    const p = { invested: 18_000, fairValue: 0, realized: 43_200 };
    assert.equal(moic(p), 2.4);
  });

  test('unrealized is the mark against cost, and goes negative', () => {
    assert.equal(unrealized({ invested: 30_000, fairValue: 24_900, realized: 0 }), -5_100);
  });

  test('a multiple over nothing invested has no answer, not an infinite one', () => {
    assert.equal(moic({ invested: 0, fairValue: 5_000, realized: 0 }), null);
  });
});

describe('the book', () => {
  const BOOK = [
    { invested: 50_000, fairValue: 58_400, realized: 6_000 },
    { invested: 30_000, fairValue: 24_900, realized: 0 },
    { invested: 18_000, fairValue: 0, realized: 43_200 },
  ];

  test('DPI and RVPI always sum to TVPI', () => {
    const m = bookMetrics(BOOK);
    assert.equal(m.dpi + m.rvpi, m.tvpi);
  });

  test('TVPI is total value over invested', () => {
    const m = bookMetrics(BOOK);
    assert.equal(m.invested, 98_000);
    assert.equal(m.totalValue, 132_500);
    assert.equal(m.tvpi.toFixed(4), (132_500 / 98_000).toFixed(4));
  });

  test('a realized position still counts toward invested', () => {
    /* Dropping an exit from the denominator flatters every ratio built
       on it, which is the most common way these figures are massaged. */
    assert.equal(bookMetrics(BOOK).invested, 98_000);
  });

  test('unrealized is measured against the cost still at work', () => {
    const m = bookMetrics([
      { invested: 50_000, fairValue: 58_400, realized: 0 },
      { invested: 18_000, fairValue: 0, realized: 43_200, exited: true },
    ]);
    assert.equal(m.liveCost, 50_000);
    assert.equal(m.unrealized, 8_400);
    /* All in, the book is up total value minus everything contributed. */
    assert.equal(m.gain, 58_400 + 43_200 - 68_000);
  });

  test('an empty book reports zero rather than dividing by it', () => {
    const m = bookMetrics([]);
    assert.equal(m.tvpi, 0);
    assert.equal(m.dpi, 0);
    assert.equal(m.rvpi, 0);
  });
});

describe('IRR', () => {
  test('doubling over exactly one year is 100%', () => {
    const rate = irr(
      [
        { at: '2025-08-31T00:00:00.000Z', amount: -10_000 },
        { at: '2026-08-31T00:00:00.000Z', amount: 20_000 },
      ],
      NOW,
    );
    assert.ok(rate !== null);
    assert.equal(rate!.toFixed(3), '1.000');
  });

  test('money back sooner beats the same money later', () => {
    const quick = irr(
      [
        { at: '2024-08-31T00:00:00.000Z', amount: -10_000 },
        { at: '2025-08-31T00:00:00.000Z', amount: 15_000 },
      ],
      NOW,
    );
    const slow = irr(
      [
        { at: '2024-08-31T00:00:00.000Z', amount: -10_000 },
        { at: '2026-08-31T00:00:00.000Z', amount: 15_000 },
      ],
      NOW,
    );
    assert.ok(quick !== null && slow !== null);
    assert.ok(quick! > slow!, `${quick} should beat ${slow}`);
  });

  test('a loss reports a negative rate', () => {
    const rate = irr(
      [
        { at: '2024-08-31T00:00:00.000Z', amount: -10_000 },
        { at: '2026-08-31T00:00:00.000Z', amount: 6_000 },
      ],
      NOW,
    );
    assert.ok(rate !== null && rate < 0);
  });

  /* An IRR on six weeks of data is noise with a decimal point. These
     four cases are why the return type is nullable. */
  test('too little history has no rate', () => {
    assert.equal(
      irr(
        [
          { at: '2026-08-20T00:00:00.000Z', amount: -10_000 },
          { at: '2026-08-31T00:00:00.000Z', amount: 10_400 },
        ],
        NOW,
      ),
      null,
    );
  });

  test('nothing back has no rate', () => {
    assert.equal(
      irr([{ at: '2024-01-01T00:00:00.000Z', amount: -10_000 }], NOW),
      null,
    );
  });

  test('nothing out has no rate', () => {
    assert.equal(
      irr(
        [
          { at: '2024-01-01T00:00:00.000Z', amount: 10_000 },
          { at: '2025-01-01T00:00:00.000Z', amount: 4_000 },
        ],
        NOW,
      ),
      null,
    );
  });

  test('an unparseable date has no rate rather than a wrong one', () => {
    assert.equal(
      irr(
        [
          { at: 'not a date', amount: -10_000 },
          { at: '2026-01-01T00:00:00.000Z', amount: 12_000 },
        ],
        NOW,
      ),
      null,
    );
  });

  test('several distributions are each discounted from their own date', () => {
    const rate = irr(
      [
        { at: '2024-08-31T00:00:00.000Z', amount: -20_000 },
        { at: '2025-08-31T00:00:00.000Z', amount: 10_000 },
        { at: '2026-08-31T00:00:00.000Z', amount: 14_400 },
      ],
      NOW,
    );
    assert.ok(rate !== null);
    /* 10,000/1.1346 + 14,400/1.1346^2 = 8,815 + 11,186 = 20,000 out. */
    assert.equal(rate!.toFixed(4), '0.1346');

    /* And each flow really is discounted from its own date: the same
       24,400 arriving entirely at the end is worth a lower rate. */
    const lumped = irr(
      [
        { at: '2024-08-31T00:00:00.000Z', amount: -20_000 },
        { at: '2026-08-31T00:00:00.000Z', amount: 24_400 },
      ],
      NOW,
    );
    assert.ok(lumped !== null && lumped < rate!);
  });
});

describe('positionFlows', () => {
  test('the current mark is the terminal inflow, so a live position has a rate', () => {
    const flows = positionFlows(
      { invested: 10_000, fairValue: 14_000, fundedAt: '2024-08-31T00:00:00.000Z' },
      [],
      NOW,
    );

    assert.equal(flows.length, 2);
    assert.equal(flows[0].amount, -10_000);
    assert.equal(flows[1].amount, 14_000);
    assert.ok(irr(flows, NOW)! > 0);
  });

  test('an unfunded commitment produces no flows at all', () => {
    assert.deepEqual(
      positionFlows({ invested: 50_000, fairValue: 0, fundedAt: null }, [], NOW),
      [],
    );
  });
});

describe('the ledger', () => {
  const SUBS = [
    { id: 'a', state: 'closed', amount: 50_000, currentValue: 58_400, realizedAt: null },
    { id: 'b', state: 'accepted', amount: 30_000, currentValue: 24_900, realizedAt: null },
    { id: 'c', state: 'closed', amount: 18_000, currentValue: 18_000, realizedAt: '2026-03-31' },
    /* In escrow for a deal that has not closed: beside the book, not in it. */
    { id: 'f', state: 'funded', amount: 25_000, currentValue: null, realizedAt: null },
    /* Signed, not yet funded: a reservation, not capital. */
    { id: 'd', state: 'docs_signed', amount: 50_000, currentValue: null, realizedAt: null },
    { id: 'e', state: 'expired', amount: 25_000, currentValue: null, realizedAt: null },
  ];
  const DISTRIBUTIONS = [
    { subscriptionId: 'a', amount: 6_000 },
    { subscriptionId: 'c', amount: 43_200 },
  ];

  test('only held positions count, and an exit keeps its cost', () => {
    const m = ledgerBook(SUBS, DISTRIBUTIONS);
    assert.equal(m.invested, 98_000);
    assert.equal(m.liveCost, 80_000);
    assert.equal(m.liveCount, 2);
    assert.equal(m.realizedCount, 1);
  });

  test('an exited position contributes no fair value, whatever its row says', () => {
    const m = ledgerBook(SUBS, DISTRIBUTIONS);
    assert.equal(m.fairValue, 83_300);
    assert.equal(m.realized, 49_200);
    assert.equal(m.totalValue, 132_500);
  });

  test('money in escrow is reported beside the book, never counted as invested', () => {
    const m = ledgerBook(SUBS, DISTRIBUTIONS);
    assert.equal(m.inEscrow, 25_000);
    assert.equal(m.inEscrowCount, 1);
    assert.equal(m.invested, 98_000);
  });

  test('a position with no mark yet is carried at cost', () => {
    const m = ledgerBook(
      [{ id: 'x', state: 'closed', amount: 10_000, currentValue: null, realizedAt: null }],
      [],
    );
    assert.equal(m.fairValue, 10_000);
    assert.equal(m.gain, 0);
  });

  /* The dashboard once summed held positions itself and reported
     $125,000 invested while Portfolio, counting the exit, reported
     $143,000. Both pages must total through ledgerBook and neither may
     add up subscription amounts on its own. */
  test('the dashboard and Portfolio total the book through one function', () => {
    for (const page of [
      'app/(portal)/dashboard/page.tsx',
      'app/(portal)/portfolio/page.tsx',
    ]) {
      const source = readFileSync(page, 'utf8');
      assert.match(source, /\bledgerBook\(/, `${page} does not call ledgerBook`);
      assert.doesNotMatch(
        source,
        /const (invested|value|fairValue|totalValue) = .*reduce\(/,
        `${page} totals the book on its own`,
      );
    }
  });
});
