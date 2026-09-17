'use client';

/**
 * What a subscription costs, and where the money waits. Work order
 * screen 8, on the fee counsel confirmed 2026-09-17 (lib/fees.ts).
 *
 * The rows, all of them, at checkout: the subscription; the management
 * fee reserve in dollars with both halves of the rule under it (returned
 * if the vehicle ends early, accrues and is paid from distributions
 * before carry if it runs longer); the total sent to escrow; then the
 * member's share of the flat formation and administration fee, which the
 * SPV pays once and members bear pro rata to capital committed, shown as
 * the range it can land in because it is only known when the SPV's final
 * size is; then pass-throughs at cost and escrow interest. With
 * SHOW_FEE_TERMS off, the fee rows name the fee and point at the
 * memorandum, and there is no total, because a total is a figure. Under
 * the rows, always: held in escrow until close, when admissions close,
 * and no capital calls. Carry is not on this screen.
 */
import { Lock } from 'lucide-react';

import Term from '@/components/Term';
import { FEE_TERMS, SHOW_FEE_TERMS } from '@/lib/config';
import {
  ESCROW_INTEREST_LINE,
  managementFeeHalves,
  NO_CAPITAL_CALLS,
  NOT_A_PERCENT_OF_RAISE,
  PASS_THROUGH_LINE,
  feeBreakdown,
  flatFeeShareRange,
  reservePercent,
} from '@/lib/fees';
import { dateStr, money } from '@/lib/format';
import { admissionCutoff } from '@/lib/funding';

export default function FeeTable({
  amount,
  targetClose,
  minimumToClose,
  allocationTotal,
}: {
  amount: number;
  /** The deal's closing date, for the admission cut-off. */
  targetClose: string;
  /** The SPV's smallest and largest final size, for the pro rata share. */
  minimumToClose: number;
  allocationTotal: number;
}) {
  const breakdown = feeBreakdown(amount);
  const cutoff = admissionCutoff(targetClose);
  const share = flatFeeShareRange(amount, minimumToClose, allocationTotal);
  const sharePct = (dollars: number) =>
    amount > 0 ? `${((dollars / amount) * 100).toFixed(2)}%` : '0%';

  return (
    <>
      <div className="fee-row">
        <span className="l">Your subscription</span>
        <span className="r">{money(breakdown.amount)}</span>
      </div>

      {SHOW_FEE_TERMS ? (
        <>
          <div className="fee-row">
            <span className="l">
              <Term q="What are the fees?" quiet>
                Management fee reserve
              </Term>{' '}
              ({FEE_TERMS.annualPercent}% a year, {FEE_TERMS.termYears} years,{' '}
              {reservePercent()}% funded now)
            </span>
            <span className="r">{money(breakdown.reserve)}</span>
          </div>
          <div className="fee-sub" style={{ paddingLeft: 0 }}>
            Drawn as it is earned. {managementFeeHalves()}
          </div>
          <div className="fee-row total">
            <span className="l">Sent to escrow</span>
            <span className="r">{money(breakdown.allIn)}</span>
          </div>

          <div className="fee-row">
            <span className="l">Your share of the {money(FEE_TERMS.flatPerSpv)} formation and administration fee</span>
            <span className="r">
              {share.atAllocation === share.atMinimum
                ? money(share.atMinimum)
                : `${money(share.atAllocation)} to ${money(share.atMinimum)}`}
            </span>
          </div>
          <div className="fee-sub" style={{ paddingLeft: 0 }}>
            Flat per SPV, paid once by the SPV and disclosed in the memorandum. Your share is pro
            rata to your capital committed and is settled at close, so it depends on the SPV&rsquo;s
            final size: about {sharePct(share.atAllocation)} of your subscription if the round
            fills to {money(allocationTotal)}, up to {sharePct(share.atMinimum)} if it closes at
            its {money(minimumToClose)} minimum. Not charged to you separately, and not a
            percentage of the raise.
          </div>

          <div className="fee-sub" style={{ paddingLeft: 0 }}>
            {PASS_THROUGH_LINE} {ESCROW_INTEREST_LINE} {NOT_A_PERCENT_OF_RAISE}
          </div>
        </>
      ) : (
        <>
          <div className="fee-row">
            <span className="l">Management fee</span>
            <span className="r">Disclosed in the memorandum</span>
          </div>
          <div className="fee-sub" style={{ paddingLeft: 0 }}>
            {managementFeeHalves()} {PASS_THROUGH_LINE}
          </div>
        </>
      )}

      <div className="fee-sub" style={{ paddingLeft: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Lock size={12} strokeWidth={1.8} aria-hidden="true" />
        Held in escrow until close
        {cutoff !== null ? <> · Admissions close {dateStr(cutoff)}</> : null}
      </div>
      <div className="fee-sub" style={{ paddingLeft: 0 }}>
        {NO_CAPITAL_CALLS}
      </div>
    </>
  );
}
