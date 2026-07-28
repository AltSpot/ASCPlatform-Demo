'use client';

/**
 * The all-in cost. Every dollar the investor will ever pay, known on
 * day one — this component is the promise the product makes.
 *
 * One fee today, one fee at exit. Nothing else belongs in this table.
 */
import { feeBreakdown } from '@/lib/fees';
import { money } from '@/lib/format';
import type { DealFees } from '@/lib/domain';

export default function FeeTable({
  fees,
  amount,
}: {
  fees: DealFees;
  amount: number;
}) {
  const breakdown = feeBreakdown(fees, amount);

  return (
    <>
      <div className="fee-row">
        <span className="l">Investment</span>
        <span className="r">{money(breakdown.amount)}</span>
      </div>

      <div className="fee-row">
        <span className="l">Management fee — {fees.management}%, one time</span>
        <span className="r">{money(breakdown.management)}</span>
      </div>

      <div className="fee-row total">
        <span className="l">All-in today</span>
        <span className="r">{money(breakdown.allIn)}</span>
      </div>

      <div className="fee-sub" style={{ paddingLeft: 0 }}>
        Plus {fees.carry}% carried interest on profits at exit. No annual fees. No
        capital calls.
      </div>
    </>
  );
}
