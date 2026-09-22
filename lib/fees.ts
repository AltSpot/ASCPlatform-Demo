/**
 * Fee math and fee words, stated once.
 *
 * THE MODEL, confirmed by counsel 2026-09-17 (docs/structure-decisions-
 * sept-2026.md section 15, items 5 and 8):
 *
 *   a management fee                  FEE_TERMS.annualPercent of committed
 *                                     capital a year, FEE_TERMS.termYears
 *                                     years prefunded into a reserve at
 *                                     closing and drawn as earned. If the
 *                                     vehicle ends early, the unearned
 *                                     balance is returned at liquidation.
 *                                     If it runs longer, the fee keeps
 *                                     accruing and is paid from
 *                                     distributions before carried interest.
 *   a formation and administration    FEE_TERMS.flatPerSpv, flat, per SPV,
 *   fee                               for enumerated services, disclosed in
 *                                     the memorandum. The SPV pays it once;
 *                                     each member bears a pro rata share by
 *                                     capital committed, settled at close.
 *   pass-throughs                     blue sky, tax, K-1 and other SPV
 *                                     expenses, at cost.
 *   escrow interest                   belongs to investors; float may be
 *                                     applied only to pass-through expenses.
 *
 * Nothing anywhere is priced as a percentage of capital raised or paid per
 * investor (counsel: broker-dealer line). THE RESERVE COMES OUT OF THE
 * INVESTMENT (Tyler, 2026-09-21): a member sends their investment to
 * escrow and nothing more; at closing the management fee reserve and their
 * share of the flat fee are taken from it, and the rest goes to work in
 * the company. No capital calls, nothing billed annually.
 *
 * Carried interest is CARRY_PERCENT of profits at exit.
 *
 * WHAT MAY BE SHOWN. Fee figures render behind SHOW_FEE_TERMS (on since
 * counsel confirmed) and carry behind SHOW_CARRY_TERMS. The math runs
 * either way; the flags change words, never money. Every surface that
 * talks about fees or carry takes its words from here.
 *
 * Nothing here may depend on how a member arrived on the platform.
 *
 * Pure and isomorphic.
 */
import { CARRY_PERCENT, FEE_TERMS, SHOW_CARRY_TERMS, SHOW_FEE_TERMS } from './config';
import { money } from './format';

export interface FeeTerms {
  flatPerSpv: number;
  annualPercent: number;
  termYears: number;
}

export interface FeeBreakdown {
  /** The investment: what the member sends to escrow, all of it. */
  amount: number;
  /** The management fee reserve, taken from the investment at closing. */
  reserve: number;
  /** One year of the management fee on this investment. */
  annual: number;
  /** What goes to escrow. The same as the investment: nothing is added. */
  allIn: number;
  /** The investment less the reserve, before the flat fee share. */
  afterReserve: number;
}

/** The reserve as a percent of a subscription (1% a year for 5 years: 5). */
export function reservePercent(terms: FeeTerms = FEE_TERMS): number {
  return terms.annualPercent * terms.termYears;
}

export function feeBreakdown(amount: number, terms: FeeTerms = FEE_TERMS): FeeBreakdown {
  const safe = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  const reserve = Math.round((safe * reservePercent(terms)) / 100);
  const annual = Math.round((safe * terms.annualPercent) / 100);
  return { amount: safe, reserve, annual, allIn: safe, afterReserve: safe - reserve };
}

/**
 * A member's pro rata share of the flat SPV fee, for a given final size
 * of the SPV. The SPV pays the fee once; this is what the member's share
 * of it comes to, settled at close, and it is only known once the raise
 * is. Integer dollars, rounded up so shares never sum short.
 */
export function flatFeeShare(
  amount: number,
  spvTotal: number,
  terms: FeeTerms = FEE_TERMS,
): number {
  if (!(amount > 0) || !(spvTotal > 0)) return 0;
  return Math.ceil((terms.flatPerSpv * Math.min(amount, spvTotal)) / spvTotal);
}

/**
 * The range a member's share of the flat fee can land in: highest if the
 * SPV closes at its minimum, lowest if it fills its allocation. Both are
 * shown at checkout so the member sees the whole range before signing.
 */
export function flatFeeShareRange(
  amount: number,
  minimumToClose: number,
  allocationTotal: number,
  terms: FeeTerms = FEE_TERMS,
): { atMinimum: number; atAllocation: number } {
  const floor = Math.max(minimumToClose, amount);
  const ceiling = Math.max(allocationTotal, floor);
  return {
    atMinimum: flatFeeShare(amount, floor, terms),
    atAllocation: flatFeeShare(amount, ceiling, terms),
  };
}

/**
 * The member's share of the flat fee as an estimate, and at cap. The
 * estimate assumes the SPV closes at what is already raised plus this
 * investment, held between the minimum and the allocation; at cap is the
 * share if the allocation fills, the smallest it can be. The share at the
 * minimum is not shown as a headline: on a small vehicle it reads as a
 * worst case the raise has usually passed.
 */
export function adminFeeEstimate(
  amount: number,
  raised: number,
  minimumToClose: number,
  allocationTotal: number,
  terms: FeeTerms = FEE_TERMS,
): { estimate: number; atCap: number } {
  const ceiling = Math.max(allocationTotal, minimumToClose, amount);
  const expected = Math.min(ceiling, Math.max(minimumToClose, Math.max(0, raised) + amount));
  return {
    estimate: flatFeeShare(amount, expected, terms),
    atCap: flatFeeShare(amount, ceiling, terms),
  };
}

/**
 * Carry at a given rate on a profit. A loss or a break-even carries
 * nothing.
 */
export function carryOn(profit: number, percent: number = CARRY_PERCENT): number {
  return profit > 0 ? (profit * percent) / 100 : 0;
}

// ---------------- the words ----------------

/** Said wherever the fee is described, whether or not figures show. */
export const NO_CAPITAL_CALLS = 'Nothing billed annually. No capital calls.';

/** Counsel's line, both halves (2026-09-17). */
export const MANAGEMENT_FEE_BOTH_HALVES =
  'If the vehicle ends early, the unused balance is returned. If it runs longer, the fee continues to accrue and is paid from distributions before carried interest.';

/**
 * The same two halves, with carry named only while the carry switch is
 * on: a surface that hides the carry figure cannot introduce the word.
 */
export function managementFeeHalves(showCarry: boolean = SHOW_CARRY_TERMS): string {
  return showCarry
    ? MANAGEMENT_FEE_BOTH_HALVES
    : 'If the vehicle ends early, the unused balance is returned. If it runs longer, the fee continues to accrue and is paid from distributions first.';
}

export const PASS_THROUGH_LINE =
  'Blue sky, tax, K-1 and other SPV expenses pass through at cost.';

export const ESCROW_INTEREST_LINE =
  'Interest earned in escrow belongs to investors; any float is applied only to pass-through expenses.';

export const NOT_A_PERCENT_OF_RAISE =
  'Nothing is priced as a percentage of capital raised or charged per investor.';

export interface FeeRow {
  label: string;
  /** The figure or the two words a member reads first. No sentence. */
  short: string;
  detail: string;
}

/**
 * The deal page's cost rows (work order screen 6). With the flag off,
 * one row that names the fee and points at the memorandum, and no figure.
 */
export function dealFeeRows(
  showFees: boolean = SHOW_FEE_TERMS,
  showCarry: boolean = SHOW_CARRY_TERMS,
  terms: FeeTerms = FEE_TERMS,
): FeeRow[] {
  const halves = managementFeeHalves(showCarry);
  const rows: FeeRow[] = showFees
    ? [
        {
          label: 'Management fee',
          short: `${terms.annualPercent}% a year, reserved up front`,
          detail: `${terms.annualPercent}% per year of committed capital. ${terms.termYears} years (${reservePercent(terms)}%) are reserved from your investment at closing, not added to it. ${halves}`,
        },
        {
          label: 'Admin fee',
          short: `${money(terms.flatPerSpv)} per vehicle, pro rata`,
          detail: `A flat ${money(terms.flatPerSpv)} formation and administration fee per vehicle, for its lifetime, disclosed in the memorandum. It is shared pro rata across every investor by capital committed and taken from the investment at close.`,
        },
        { label: 'SPV expenses', short: 'At cost', detail: PASS_THROUGH_LINE },
        { label: 'Escrow interest', short: 'Yours', detail: ESCROW_INTEREST_LINE },
      ]
    : [
        {
          label: 'Management fee',
          short: 'In the memorandum',
          detail: `Reserved from the investment at close, disclosed in the memorandum. ${halves} ${PASS_THROUGH_LINE}`,
        },
      ];

  const carry = carryRow(showCarry);
  return carry ? [...rows, carry] : rows;
}

/**
 * What the fees come to on one amount, for the deal page's cost cards:
 * the management fee a year and in total reserved, and the admin fee in
 * words, with no figure taken off (Tyler, 2026-09-21: explained, not
 * subtracted, while the share depends on the final size). Keyed by the
 * row label.
 */
export function feeExampleLines(
  amount: number,
  raised: number,
  minimumToClose: number,
  allocationTotal: number,
  terms: FeeTerms = FEE_TERMS,
): Record<string, string> {
  if (!(amount > 0)) return {};
  void raised;
  void minimumToClose;
  void allocationTotal;
  const b = feeBreakdown(amount, terms);
  return {
    'Management fee': `${money(b.annual)} a year on ${money(b.amount)}, ${money(b.reserve)} reserved`,
    'Admin fee': 'Your share settles at close',
  };
}

/** The carry row (work order screen 7), or nothing at all when off. */
export function carryRow(show: boolean = SHOW_CARRY_TERMS): FeeRow | null {
  return show
    ? { label: 'Carried interest', short: `${CARRY_PERCENT}% of profits`, detail: `${CARRY_PERCENT}% of profits at exit` }
    : null;
}

/** One sentence for prose: Spot, the document panels. */
export function feeSentence(
  showFees: boolean = SHOW_FEE_TERMS,
  showCarry: boolean = SHOW_CARRY_TERMS,
  terms: FeeTerms = FEE_TERMS,
): string {
  const halves = managementFeeHalves(showCarry);
  const fee = showFees
    ? `A management fee of ${terms.annualPercent}% per year of committed capital, with ${terms.termYears} years (${reservePercent(terms)}%) reserved from the investment at closing, not added to it, and drawn as earned. ${halves} And a flat ${money(terms.flatPerSpv)} lifetime formation and administration fee per vehicle, disclosed in the memorandum and shared pro rata across its investors by capital committed. ${PASS_THROUGH_LINE} ${ESCROW_INTEREST_LINE}`
    : `A management fee reserved from the investment at closing, set out in the memorandum. ${halves} ${PASS_THROUGH_LINE}`;
  const carry = showCarry ? ` ${CARRY_PERCENT}% carried interest on profits at exit.` : '';
  return `${fee}${carry} ${NO_CAPITAL_CALLS}`;
}
