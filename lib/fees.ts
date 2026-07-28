/**
 * Fee math — the economics shown across the product.
 *
 *   5% platform fee
 *   up to 2% admin reserve, itemized; unused remainder returned at close
 *   10% carry standard · 20% on AltSpot-led deals
 *   collected once at closing · no annual fees · no capital calls, ever
 *
 * Pure functions, no I/O: the same module runs on the server when a
 * document is generated and in the browser as the amount field changes,
 * so the two can never disagree.
 */
import type { DealFees } from './domain';

export interface AdminItem {
  label: string;
  pct: number;
  amt: number;
}

export interface FeeBreakdown {
  amount: number;
  platform: number;
  adminItems: AdminItem[];
  adminTotal: number;
  allIn: number;
  carry: number;
  carryNote: string;
}

/**
 * The admin reserve is disclosed line by line rather than as one number.
 * These percentages sum to the 2% cap.
 */
export const ADMIN_ITEMS: readonly { label: string; pct: number }[] = [
  { label: 'SPV formation & legal', pct: 0.8 },
  { label: 'Fund administration', pct: 0.5 },
  { label: 'Tax preparation & K-1 delivery', pct: 0.4 },
  { label: 'Banking, escrow & compliance', pct: 0.3 },
];

export function feeBreakdown(fees: DealFees, amount: number): FeeBreakdown {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  const platform = (safeAmount * fees.platform) / 100;
  const adminItems = ADMIN_ITEMS.map((item) => ({
    label: item.label,
    pct: item.pct,
    amt: (safeAmount * item.pct) / 100,
  }));
  const adminTotal = (safeAmount * fees.adminMax) / 100;

  return {
    amount: safeAmount,
    platform,
    adminItems,
    adminTotal,
    allIn: safeAmount + platform + adminTotal,
    carry: fees.carry,
    carryNote: fees.carryNote,
  };
}
