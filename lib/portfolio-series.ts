/**
 * The portfolio, quarter by quarter.
 *
 * Pure and isomorphic, like lib/fees.ts and lib/format.ts, and here
 * rather than in the repository for the same reason: the carry-forward
 * rule is the part that is easy to get wrong, it needs no database to
 * exercise, and a rule the product depends on should fail a test before
 * it fails a review.
 *
 * A private portfolio has no daily price. It has a reported mark per
 * position per period, and between periods the number does not move.
 * Everything here preserves that: a mark is carried forward until the
 * next one is reported, and a position contributes nothing to a period
 * before the money went in.
 */
import type { MarkView } from './repositories/marks';

/** One quarter of the portfolio's history. */
export interface PortfolioPeriod {
  /** "Q3 2026". The label the axis prints. */
  label: string;
  /** The date these readings are as of, ISO. */
  at: string;
  /** Cumulative contributions as of the end of this quarter. */
  paidIn: number;
  /** Marked value of everything still held at the end of this quarter. */
  value: number;
  /** Cumulative cash returned as of the end of this quarter. */
  distributed: number;
  /** Contributions made during this quarter. */
  contributedInPeriod: number;
  /** Return of capital received during this quarter. */
  capitalInPeriod: number;
  /** Gain received during this quarter. */
  gainInPeriod: number;
}

export interface PositionInput {
  id: string;
  amount: number;
  /** When the money went in. A position before this is not held. */
  fundedAt: string | null;
  /** When it exited, if it has. After this there is nothing to mark. */
  realizedAt: string | null;
  /** The latest mark, used to close out the final period. */
  currentValue: number | null;
}

interface CashflowInput {
  subscriptionId: string;
  paidAt: string;
  amount: number;
  kind: 'return_of_capital' | 'gain';
}

function quarterEnd(year: number, quarter: number): Date {
  return new Date(Date.UTC(year, quarter * 3, 0, 23, 59, 59));
}

function quarterOf(iso: string): { year: number; quarter: number } {
  const date = new Date(iso);
  return {
    year: date.getUTCFullYear(),
    quarter: Math.floor(date.getUTCMonth() / 3) + 1,
  };
}

/**
 * From the first contribution to `now`. Reads no clock of its own, so
 * the same inputs always produce the same chart and the server and the
 * client cannot disagree about which quarter it is.
 */
export function buildPortfolioSeries(
  positions: PositionInput[],
  marks: MarkView[],
  cashflows: CashflowInput[],
  now: Date,
): PortfolioPeriod[] {
  const funded = positions.filter((position) => position.fundedAt);
  if (funded.length === 0) return [];

  const first = funded.reduce(
    (earliest, position) =>
      position.fundedAt! < earliest ? position.fundedAt! : earliest,
    funded[0].fundedAt!,
  );

  const start = quarterOf(first);
  const end = quarterOf(now.toISOString());

  /* Marks per position, oldest first, so the carry-forward is a scan
     rather than a filter per quarter. */
  const byPosition = new Map<string, MarkView[]>();
  for (const mark of marks) {
    const list = byPosition.get(mark.subscriptionId) ?? [];
    list.push(mark);
    byPosition.set(mark.subscriptionId, list);
  }

  const periods: PortfolioPeriod[] = [];

  for (
    let year = start.year, quarter = start.quarter;
    year < end.year || (year === end.year && quarter <= end.quarter);
    quarter === 4 ? ((year += 1), (quarter = 1)) : (quarter += 1)
  ) {
    const close = quarterEnd(year, quarter);
    const closeIso = close.toISOString();
    /* The current quarter is not over. Its readings are as of today,
       which is what a member expects the last point to mean. */
    const asOf = close > now ? now.toISOString() : closeIso;

    let paidIn = 0;
    let value = 0;
    let contributedInPeriod = 0;

    for (const position of positions) {
      if (!position.fundedAt || position.fundedAt > asOf) continue;

      paidIn += position.amount;

      const fundedQuarter = quarterOf(position.fundedAt);
      if (fundedQuarter.year === year && fundedQuarter.quarter === quarter) {
        contributedInPeriod += position.amount;
      }

      /* Realized: nothing left to mark. The result is in the cash. */
      if (position.realizedAt && position.realizedAt <= asOf) continue;

      /* The most recent mark at or before this date, carried forward.
         With no mark yet, a position is held at what was paid for it,
         which is what a vehicle reports before its first remark. */
      const reported = (byPosition.get(position.id) ?? [])
        .filter((mark) => mark.asOf <= asOf)
        .at(-1);

      value += reported ? reported.value : position.amount;
    }

    let distributed = 0;
    let capitalInPeriod = 0;
    let gainInPeriod = 0;

    for (const flow of cashflows) {
      if (flow.paidAt > asOf) continue;
      distributed += flow.amount;

      const paidQuarter = quarterOf(flow.paidAt);
      if (paidQuarter.year === year && paidQuarter.quarter === quarter) {
        if (flow.kind === 'gain') gainInPeriod += flow.amount;
        else capitalInPeriod += flow.amount;
      }
    }

    periods.push({
      label: `Q${quarter} ${year}`,
      at: asOf,
      paidIn,
      value,
      distributed,
      contributedInPeriod,
      capitalInPeriod,
      gainInPeriod,
    });
  }

  return periods;
}
