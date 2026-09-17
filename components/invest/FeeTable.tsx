'use client';

/**
 * What a subscription costs, and where the money waits. Work order
 * screen 8, on the fee model decided Sept 16 (lib/fees.ts).
 *
 * The rows: the subscription, then the management fee. With
 * SHOW_FEE_TERMS on, the fee is the reserve in dollars and the total is
 * what goes to escrow; with it off, the fee row names the fee and points
 * at the memorandum, and there is no total, because a total is a figure.
 * Under the rows, always: held in escrow until close, when admissions
 * close, and no capital calls. Carry is not on this screen.
 */
import { Lock } from 'lucide-react';

import { FEE_TERMS, SHOW_FEE_TERMS } from '@/lib/config';
import { NO_CAPITAL_CALLS, feeBreakdown, reservePercent } from '@/lib/fees';
import { dateStr, money } from '@/lib/format';
import { admissionCutoff } from '@/lib/funding';

export default function FeeTable({
  amount,
  targetClose,
}: {
  amount: number;
  /** The deal's closing date, for the admission cut-off. */
  targetClose: string;
}) {
  const breakdown = feeBreakdown(amount);
  const cutoff = admissionCutoff(targetClose);

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
              Management fee reserve ({FEE_TERMS.annualPercent}% a year for{' '}
              {FEE_TERMS.termYears} years, {reservePercent()}%)
            </span>
            <span className="r">{money(breakdown.reserve)}</span>
          </div>
          <div className="fee-row total">
            <span className="l">Sent to escrow</span>
            <span className="r">{money(breakdown.allIn)}</span>
          </div>
          <div className="fee-sub" style={{ paddingLeft: 0 }}>
            Drawn down as it is earned; anything unearned comes back to you. The SPV
            also pays a flat {money(FEE_TERMS.flatPerSpv)} fee, disclosed in the
            memorandum.
          </div>
        </>
      ) : (
        <div className="fee-row">
          <span className="l">Management fee</span>
          <span className="r">Disclosed in the memorandum</span>
        </div>
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
