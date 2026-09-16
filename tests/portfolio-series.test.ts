/**
 * The quarterly series behind the portfolio value curve and the cash
 * flow chart.
 *
 * The rules being pinned here are the ones a chart gets silently wrong:
 * a mark carries forward until the next one is reported, a position
 * contributes nothing before it is funded, and a realized position
 * stops being marked without its value vanishing from the history.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildPortfolioSeries } from '../lib/portfolio-series';

const NOW = new Date('2026-08-30T12:00:00.000Z');

function position(over: Partial<Parameters<typeof buildPortfolioSeries>[0][number]> = {}) {
  return {
    id: 'sub-1',
    amount: 10_000,
    fundedAt: '2026-01-15T00:00:00.000Z',
    realizedAt: null,
    currentValue: 12_000,
    ...over,
  };
}

describe('buildPortfolioSeries', () => {
  test('an unfunded book has no history to draw', () => {
    assert.deepEqual(
      buildPortfolioSeries([position({ fundedAt: null })], [], [], NOW),
      [],
    );
  });

  test('runs from the quarter of the first contribution to the current one', () => {
    const series = buildPortfolioSeries([position()], [], [], NOW);

    assert.equal(series[0].label, 'Q1 2026');
    assert.equal(series.at(-1)!.label, 'Q3 2026');
    assert.equal(series.length, 3);
  });

  test('a position is worth nothing in a quarter before it was funded', () => {
    const series = buildPortfolioSeries(
      [position({ fundedAt: '2026-05-02T00:00:00.000Z' })],
      [],
      [],
      NOW,
    );

    assert.equal(series[0].label, 'Q2 2026');
    assert.equal(series[0].paidIn, 10_000);
  });

  test('a contribution lands in its own quarter and nowhere else', () => {
    const series = buildPortfolioSeries([position()], [], [], NOW);

    assert.deepEqual(
      series.map((period) => period.contributedInPeriod),
      [10_000, 0, 0],
    );
    /* Cumulative, so it never falls back to zero after the quarter the
       money went in. */
    assert.deepEqual(
      series.map((period) => period.paidIn),
      [10_000, 10_000, 10_000],
    );
  });

  test('with no mark yet a position is held at what was paid for it', () => {
    const series = buildPortfolioSeries([position()], [], [], NOW);
    assert.deepEqual(
      series.map((period) => period.value),
      [10_000, 10_000, 10_000],
    );
  });

  /* The one that matters. A mark reported once has to persist through
     the quarters that follow it, or the curve drops to cost every
     period nobody remarked the position. */
  test('a mark carries forward until the next one is reported', () => {
    const series = buildPortfolioSeries(
      [position()],
      [
        {
          subscriptionId: 'sub-1',
          asOf: '2026-03-31T23:59:59.000Z',
          value: 11_000,
          basis: 'vehicle',
        },
      ],
      [],
      NOW,
    );

    assert.deepEqual(
      series.map((period) => period.value),
      [11_000, 11_000, 11_000],
    );
  });

  test('a later mark supersedes an earlier one', () => {
    const series = buildPortfolioSeries(
      [position()],
      [
        { subscriptionId: 'sub-1', asOf: '2026-03-31T23:59:59.000Z', value: 11_000, basis: 'vehicle' },
        { subscriptionId: 'sub-1', asOf: '2026-06-30T23:59:59.000Z', value: 9_000, basis: 'vehicle' },
      ],
      [],
      NOW,
    );

    assert.deepEqual(
      series.map((period) => period.value),
      [11_000, 9_000, 9_000],
    );
  });

  test('a mark reported after a quarter closes does not reach back into it', () => {
    const series = buildPortfolioSeries(
      [position()],
      [
        { subscriptionId: 'sub-1', asOf: '2026-06-30T23:59:59.000Z', value: 15_000, basis: 'vehicle' },
      ],
      [],
      NOW,
    );

    assert.equal(series[0].value, 10_000);
    assert.equal(series[1].value, 15_000);
  });

  /* A realized position leaves the marked value the quarter it exits.
     Its result is in the distributions, and the two together are what
     the curve draws. Counting both would double it. */
  test('a realized position stops being marked from the quarter it exits', () => {
    const series = buildPortfolioSeries(
      [position({ realizedAt: '2026-05-10T00:00:00.000Z', currentValue: 0 })],
      [
        { subscriptionId: 'sub-1', asOf: '2026-03-31T23:59:59.000Z', value: 14_000, basis: 'vehicle' },
      ],
      [
        {
          subscriptionId: 'sub-1',
          paidAt: '2026-05-10T00:00:00.000Z',
          amount: 14_000,
          kind: 'return_of_capital' as const,
        },
      ],
      NOW,
    );

    assert.equal(series[0].value, 14_000, 'held in the quarter before it exited');
    assert.equal(series[1].value, 0, 'nothing left to mark after the exit');
    assert.equal(series[1].distributed, 14_000);

    /* Total value is continuous across the exit: the mark becomes cash
       rather than disappearing. */
    assert.deepEqual(
      series.map((period) => period.value + period.distributed),
      [14_000, 14_000, 14_000],
    );
  });

  test('a realized position still counts toward what was paid in', () => {
    const series = buildPortfolioSeries(
      [position({ realizedAt: '2026-05-10T00:00:00.000Z', currentValue: 0 })],
      [],
      [],
      NOW,
    );

    assert.deepEqual(
      series.map((period) => period.paidIn),
      [10_000, 10_000, 10_000],
    );
  });

  test('return of capital and gain are counted apart in the quarter they arrive', () => {
    const series = buildPortfolioSeries(
      [position()],
      [],
      [
        { subscriptionId: 'sub-1', paidAt: '2026-04-02T00:00:00.000Z', amount: 3_000, kind: 'return_of_capital' as const },
        { subscriptionId: 'sub-1', paidAt: '2026-04-09T00:00:00.000Z', amount: 1_000, kind: 'gain' as const },
      ],
      NOW,
    );

    assert.equal(series[1].capitalInPeriod, 3_000);
    assert.equal(series[1].gainInPeriod, 1_000);
    assert.equal(series[1].distributed, 4_000);

    /* Cumulative afterwards, per-period only in its own quarter. */
    assert.equal(series[2].distributed, 4_000);
    assert.equal(series[2].capitalInPeriod, 0);
    assert.equal(series[2].gainInPeriod, 0);
  });

  test('the last period reads as of today, not the end of the quarter', () => {
    const series = buildPortfolioSeries([position()], [], [], NOW);
    assert.equal(series.at(-1)!.at, NOW.toISOString());
  });

  test('several positions sum into one series', () => {
    const series = buildPortfolioSeries(
      [
        position({ id: 'a', amount: 10_000 }),
        position({ id: 'b', amount: 25_000, fundedAt: '2026-04-04T00:00:00.000Z' }),
      ],
      [],
      [],
      NOW,
    );

    assert.deepEqual(
      series.map((period) => period.paidIn),
      [10_000, 35_000, 35_000],
    );
  });
});
