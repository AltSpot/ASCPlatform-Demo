/**
 * Fee math and fee words, stated once.
 *
 * THE MODEL (docs/structure-decisions-sept-2026.md section 15, decided
 * Sept 16, 2026). Counsel ruled out a fee computed as a percentage of
 * capital raised. What replaces it has two parts:
 *
 *   a flat fee per SPV                FEE_TERMS.flatPerSpv, charged to the
 *                                     SPV once, disclosed in the memorandum
 *   an annualized management fee      FEE_TERMS.annualPercent of committed
 *                                     capital a year for FEE_TERMS.termYears,
 *                                     funded at closing as a reserve, drawn
 *                                     down as earned, unearned amounts
 *                                     refunded to the member
 *
 * So a member funds their subscription plus the reserve, which is
 * additive by construction. There are no capital calls, and nothing is
 * billed annually: the annual fee is drawn from the reserve, not charged.
 *
 * Carried interest is CARRY_PERCENT of profits at exit.
 *
 * WHAT MAY BE SHOWN. Numbers render only behind SHOW_FEE_TERMS and
 * SHOW_CARRY_TERMS, both off until counsel signs off on the wording. The
 * math below runs either way; the flags change words, never money. Every
 * surface that talks about fees or carry takes its words from here, so a
 * flag cannot show a figure on one page and hide it on the next.
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
  /** The subscription. */
  amount: number;
  /** The management fee reserve funded at closing, integer dollars. */
  reserve: number;
  /** Subscription plus reserve: what goes to escrow. */
  allIn: number;
}

/** The reserve as a percent of a subscription (1% a year for 5 years: 5). */
export function reservePercent(terms: FeeTerms = FEE_TERMS): number {
  return terms.annualPercent * terms.termYears;
}

export function feeBreakdown(amount: number, terms: FeeTerms = FEE_TERMS): FeeBreakdown {
  const safe = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  const reserve = Math.round((safe * reservePercent(terms)) / 100);
  return { amount: safe, reserve, allIn: safe + reserve };
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

export interface FeeRow {
  label: string;
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
  const rows: FeeRow[] = showFees
    ? [
        {
          label: 'Management fee',
          detail: `${terms.annualPercent}% a year for ${terms.termYears} years, funded at close as a reserve (${reservePercent(terms)}% of your subscription). Unearned fee is returned.`,
        },
        {
          label: 'SPV fee',
          detail: `${money(terms.flatPerSpv)} per SPV, disclosed in the memorandum`,
        },
      ]
    : [
        {
          label: 'Management fee',
          detail: 'Funded once at close, disclosed in the memorandum',
        },
      ];

  const carry = carryRow(showCarry);
  return carry ? [...rows, carry] : rows;
}

/** The carry row (work order screen 7), or nothing at all when off. */
export function carryRow(show: boolean = SHOW_CARRY_TERMS): FeeRow | null {
  return show
    ? { label: 'Carried interest', detail: `${CARRY_PERCENT}% of profits at exit` }
    : null;
}

/** One sentence for prose: Spot, the document panels. */
export function feeSentence(
  showFees: boolean = SHOW_FEE_TERMS,
  showCarry: boolean = SHOW_CARRY_TERMS,
  terms: FeeTerms = FEE_TERMS,
): string {
  const fee = showFees
    ? `A management fee of ${terms.annualPercent}% a year for ${terms.termYears} years, funded once at closing as a reserve of ${reservePercent(terms)}% of your subscription and drawn down as it is earned, with anything unearned returned to you, plus a flat ${money(terms.flatPerSpv)} per SPV disclosed in the memorandum.`
    : 'A management fee funded once at closing, set out in the memorandum.';
  const carry = showCarry ? ` ${CARRY_PERCENT}% carried interest on profits at exit.` : '';
  return `${fee}${carry} ${NO_CAPITAL_CALLS}`;
}
