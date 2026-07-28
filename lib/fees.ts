/**
 * Fee math — the economics shown across the product.
 *
 *   5% management fee, charged ONCE at closing
 *   10% carried interest on profits at exit, on every deal
 *   nothing else: no annual fees, no capital calls
 *
 * That is the whole model. If a second fee ever appears here, it has to
 * appear in the subscription documents too — this module and the
 * agreement are supposed to be the same promise stated twice.
 *
 * Pure functions, no I/O: the same code runs on the server when a
 * document is generated and in the browser as the amount field changes,
 * so the two can never disagree.
 */
import type { DealFees } from './domain';

export interface FeeBreakdown {
  amount: number;
  /** One-time management fee, collected at closing. */
  management: number;
  /** Investment + management fee. The full amount due today. */
  allIn: number;
  /** Carried interest percentage, applied to profits at exit only. */
  carry: number;
}

export function feeBreakdown(fees: DealFees, amount: number): FeeBreakdown {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const management = (safeAmount * fees.management) / 100;

  return {
    amount: safeAmount,
    management,
    allIn: safeAmount + management,
    carry: fees.carry,
  };
}
