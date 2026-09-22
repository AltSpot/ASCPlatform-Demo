/**
 * The performance metrics, defined once.
 *
 * VENTURE VOCABULARY, DELIBERATELY. These are the terms an LP sees on a
 * capital account statement, and using anything else on a private-markets
 * product signals that the person who built it has not read one:
 *
 *   Invested      capital contributed to the position. Cost basis.
 *                 Not "paid in": paid-in capital implies drawdowns
 *                 against a commitment, and AltSpot never calls capital.
 *   Fair value    the latest reported mark on what is still held. The
 *                 unrealized half. Zero once a position exits.
 *   Realized      cash actually distributed back. Operating distributions
 *                 and exit proceeds together.
 *   Total value   fair value plus realized. What the position is worth
 *                 counting money already returned.
 *   Unrealized    fair value minus the cost still at work.
 *   MOIC          total value over invested, for ONE position.
 *   TVPI          the same ratio across a book. DPI is its realized
 *                 half, RVPI its unrealized half, and DPI + RVPI = TVPI.
 *   IRR           annualized money-weighted return. The one metric that
 *                 knows a dollar back in year two beats the same dollar
 *                 in year nine, which is most of what venture is about.
 *
 * MOIC AND TVPI COUNT DISTRIBUTIONS. A multiple computed as mark over
 * cost reports a position that has returned its cost and still holds a
 * stake as a 1.0x. The dashboard used to do exactly that while Portfolio
 * did not, so the same position carried two different multiples on two
 * pages. Everything reads this file now.
 *
 * Pure and isomorphic, like lib/fees.ts. No I/O, no clock: `asOf` is
 * passed in, so the server and the browser cannot disagree.
 */

import { BOOK_STATES, type SubscriptionState } from '@/lib/domain';

/** One position, reduced to the four figures every metric is built on. */
export interface PositionEconomics {
  /** Capital contributed. Integer dollars. */
  invested: number;
  /** Latest reported mark on what is still held. Zero once realized. */
  fairValue: number;
  /** Cash distributed back, operating and exit together. */
  realized: number;
  /**
   * True once the position has exited. Its cost still counts as invested
   * (DPI and TVPI are ratios against everything contributed) but it is
   * no longer capital at work, so it drops out of the unrealized base.
   */
  exited?: boolean;
}

export function totalValue(p: PositionEconomics): number {
  return p.fairValue + p.realized;
}

/** Fair value minus cost. Negative on a position marked below cost. */
export function unrealized(p: PositionEconomics): number {
  return p.fairValue - p.invested;
}

/**
 * Multiple on invested capital, for one position. Null when nothing has
 * been invested, because a ratio over zero is not "infinite return", it
 * is a question that has no answer.
 */
export function moic(p: PositionEconomics): number | null {
  return p.invested > 0 ? totalValue(p) / p.invested : null;
}

export interface BookMetrics {
  /** Everything contributed, exited positions included. */
  invested: number;
  /** The cost of what is still held. The base for unrealized. */
  liveCost: number;
  fairValue: number;
  realized: number;
  totalValue: number;
  /** Fair value minus live cost. */
  unrealized: number;
  /** Total value minus invested. What the book is up or down, all in. */
  gain: number;
  /** Distributions to invested. The realized half of TVPI. */
  dpi: number;
  /** Residual value to invested. The unrealized half. */
  rvpi: number;
  /** Total value to invested. Always dpi + rvpi. */
  tvpi: number;
}

export function bookMetrics(positions: PositionEconomics[]): BookMetrics {
  const invested = positions.reduce((sum, p) => sum + p.invested, 0);
  const fairValue = positions.reduce((sum, p) => sum + p.fairValue, 0);
  const realized = positions.reduce((sum, p) => sum + p.realized, 0);
  const liveCost = positions.reduce(
    (sum, p) => sum + (p.exited ? 0 : p.invested),
    0,
  );

  const dpi = invested > 0 ? realized / invested : 0;
  const rvpi = invested > 0 ? fairValue / invested : 0;

  return {
    invested,
    liveCost,
    fairValue,
    realized,
    totalValue: fairValue + realized,
    unrealized: fairValue - liveCost,
    gain: fairValue + realized - invested,
    dpi,
    rvpi,
    /* Summed rather than recomputed, so the three can never round into
       disagreeing with each other on screen. */
    tvpi: dpi + rvpi,
  };
}

// ---------------- the ledger ----------------

/**
 * A subscription as the ledger sees it. The shape of SubscriptionView,
 * narrowed to what the arithmetic needs so a test can build one in a
 * line.
 */
export interface LedgerPosition {
  id: string;
  state: string;
  amount: number;
  currentValue: number | null;
  realizedAt: string | null;
}

export interface LedgerBook extends BookMetrics {
  /** Positions still held and not exited. */
  liveCount: number;
  /** Positions that have exited. */
  realizedCount: number;
  /** Money in escrow for deals that have not closed. Beside the book, never in it. */
  inEscrow: number;
  /** How many subscriptions that escrow figure covers. */
  inEscrowCount: number;
}

/**
 * The book, straight from the ledger.
 *
 * THE ONE PLACE A PAGE TOTALS A MEMBER'S POSITIONS. The dashboard and
 * Portfolio both call this, which is what stops "Invested" meaning one
 * number on one page and a different number on the next. Only money in a
 * closed vehicle counts (BOOK_STATES): a signed commitment is a
 * reservation, and money in escrow is waiting on a deal that may yet hand
 * it back, so both stay out. Escrow is totalled separately as `inEscrow`.
 * An exited position keeps its cost in invested and contributes nothing
 * to fair value; its mark, if one is still on the row, is ignored.
 */
export function ledgerBook(
  subscriptions: LedgerPosition[],
  distributions: { subscriptionId: string; amount: number }[],
): LedgerBook {
  const realizedBySub = new Map<string, number>();
  for (const d of distributions) {
    realizedBySub.set(
      d.subscriptionId,
      (realizedBySub.get(d.subscriptionId) ?? 0) + d.amount,
    );
  }

  const held = subscriptions.filter((s) =>
    BOOK_STATES.includes(s.state as SubscriptionState),
  );
  const escrowed = subscriptions.filter((s) => s.state === 'funded');
  const positions: PositionEconomics[] = held.map((s) => {
    const exited = s.realizedAt !== null;
    return {
      invested: s.amount,
      fairValue: exited ? 0 : (s.currentValue ?? s.amount),
      realized: realizedBySub.get(s.id) ?? 0,
      exited,
    };
  });

  const realizedCount = positions.filter((p) => p.exited).length;
  return {
    ...bookMetrics(positions),
    liveCount: positions.length - realizedCount,
    realizedCount,
    inEscrow: escrowed.reduce((sum, s) => sum + s.amount, 0),
    inEscrowCount: escrowed.length,
  };
}

// ---------------- IRR ----------------

/** A dated cash flow. Negative out of the investor, positive back. */
export interface CashFlow {
  /** ISO date. */
  at: string;
  amount: number;
}

const DAY_MS = 86_400_000;
const YEAR_DAYS = 365;

function npv(flows: { years: number; amount: number }[], rate: number): number {
  return flows.reduce(
    (sum, flow) => sum + flow.amount / Math.pow(1 + rate, flow.years),
    0,
  );
}

/**
 * Money-weighted annualized return over dated flows, plus the current
 * fair value as a terminal inflow.
 *
 * Bisection, not Newton. Newton is faster and diverges on exactly the
 * shapes a private book produces: a long flat stretch with one large
 * distribution at the end gives the derivative almost nothing to work
 * with. Bisection over a bracketed range always converges and 200
 * iterations is instant on a book this size.
 *
 * Returns null rather than a number whenever the answer would be
 * meaningless: nothing invested, nothing returned, less than a month of
 * history, or no sign change to bracket. An IRR printed on six weeks of
 * data is noise with a decimal point, and printing it is worse than an
 * honest dash.
 */
export function irr(flows: CashFlow[], asOf: Date): number | null {
  if (flows.length < 2) return null;

  const times = flows.map((flow) => new Date(flow.at).getTime());
  if (times.some((time) => Number.isNaN(time))) return null;

  const start = Math.min(...times);
  const span = (asOf.getTime() - start) / DAY_MS;
  if (span < 30) return null;

  const dated = flows.map((flow, index) => ({
    years: (times[index] - start) / DAY_MS / YEAR_DAYS,
    amount: flow.amount,
  }));

  const out = dated.filter((f) => f.amount < 0);
  const back = dated.filter((f) => f.amount > 0);
  if (out.length === 0 || back.length === 0) return null;

  /* -99% to +1000%. Below -100% the discount factor is undefined, and
     above ten times money the figure stops being reported anyway. */
  let low = -0.9999;
  let high = 10;

  let atLow = npv(dated, low);
  let atHigh = npv(dated, high);
  if (atLow * atHigh > 0) return null;

  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    const atMid = npv(dated, mid);

    if (Math.abs(atMid) < 0.0001) return mid;
    if (atLow * atMid < 0) {
      high = mid;
      atHigh = atMid;
    } else {
      low = mid;
      atLow = atMid;
    }
  }

  return (low + high) / 2;
}

/**
 * The flows one position produces: the contribution when it funded,
 * every distribution since, and its current mark as a terminal inflow
 * on `asOf`.
 *
 * The terminal value is what makes this an IRR on a live position
 * rather than only on a realized one. It is an unrealized figure and
 * the surface showing it has to say so.
 */
export function positionFlows(
  position: {
    invested: number;
    fairValue: number;
    fundedAt: string | null;
  },
  distributions: CashFlow[],
  asOf: Date,
): CashFlow[] {
  if (!position.fundedAt) return [];

  return [
    { at: position.fundedAt, amount: -position.invested },
    ...distributions,
    { at: asOf.toISOString(), amount: position.fairValue },
  ];
}
