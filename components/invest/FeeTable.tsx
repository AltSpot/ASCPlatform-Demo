'use client';

/**
 * The all-in cost, itemized. Every dollar the investor will ever pay,
 * known on day one — this component is the promise the product makes.
 */
import { feeBreakdown } from '@/lib/fees';
import { money } from '@/lib/format';
import type { DealFees } from '@/lib/domain';

export default function FeeTable({
  fees,
  amount,
  itemized = true,
}: {
  fees: DealFees;
  amount: number;
  itemized?: boolean;
}) {
  const breakdown = feeBreakdown(fees, amount);

  return (
    <>
      <div className="fee-row">
        <span className="l">Investment</span>
        <span className="r">{money(breakdown.amount)}</span>
      </div>

      <div className="fee-row">
        <span className="l">Platform fee — {fees.platform}%</span>
        <span className="r">{money(breakdown.platform)}</span>
      </div>

      <div className="fee-row">
        <span className="l">Admin reserve — up to {fees.adminMax}%</span>
        <span className="r">{money(breakdown.adminTotal)}</span>
      </div>

      {itemized &&
        breakdown.adminItems.map((item) => (
          <div className="fee-sub" key={item.label}>
            · {item.label} — {item.pct}% ({money(item.amt)})
          </div>
        ))}

      <div className="fee-sub">
        Unused admin reserve is returned to investors at close.
      </div>

      <div className="fee-row total">
        <span className="l">All-in today</span>
        <span className="r">{money(breakdown.allIn)}</span>
      </div>

      <div className="fee-row">
        <span className="l">Carry at exit — {fees.carryNote.toLowerCase()}</span>
        <span className="r">{fees.carry}% of profits</span>
      </div>
    </>
  );
}
