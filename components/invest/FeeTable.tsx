'use client';

/**
 * What a subscription costs, and where the money waits. Work order
 * screen 8, on the fee counsel confirmed 2026-09-17 (lib/fees.ts).
 *
 * THREE LINES AND A TOTAL (Tyler, 2026-09-19: "as easy to digest as
 * possible"). What a member reads at a glance is the sum: their
 * investment, the management fee reserve, and what goes to escrow. One
 * quiet line under it gives their share of the flat SPV fee as the range
 * it can land in. Everything else counsel's wording requires, both halves
 * of the management fee, how the flat fee is shared pro rata, pass-
 * throughs at cost, escrow interest, is one press away under "How the
 * fees work", in full, never trimmed. With SHOW_FEE_TERMS off the fee
 * rows name the fee and point at the memorandum, and there is no total,
 * because a total is a figure. Carry is not on this screen.
 */
import { ChevronDown, Lock } from 'lucide-react';

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

import s from './FeeTable.module.css';

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
  const shareText =
    share.atAllocation === share.atMinimum
      ? money(share.atMinimum)
      : `${money(share.atAllocation)} to ${money(share.atMinimum)}`;
  const investedPct = breakdown.allIn > 0 ? (breakdown.amount / breakdown.allIn) * 100 : 100;

  return (
    <div className={s.table}>
      <div className={s.row}>
        <span>Your investment</span>
        <span className={s.figure}>{money(breakdown.amount)}</span>
      </div>

      {SHOW_FEE_TERMS ? (
        <>
          <div className={s.row}>
            <span>
              <Term q="What are the fees?" quiet>
                Management fee reserve
              </Term>{' '}
              <small>{reservePercent()}%, once</small>
            </span>
            <span className={s.figure}>{money(breakdown.reserve)}</span>
          </div>

          <div className={`${s.row} ${s.total}`}>
            <span>You send to escrow</span>
            <span className={s.figure}>{money(breakdown.allIn)}</span>
          </div>
          {/* The sum as a shape: almost all of it is the investment. */}
          <div className={s.split} aria-hidden="true">
            <span style={{ width: `${investedPct}%` }} />
            <span />
          </div>

          <p className={s.quiet}>
            Your share of the {money(FEE_TERMS.flatPerSpv)} SPV fee, settled at close:{' '}
            <b>{shareText}</b>
          </p>

          <details className={s.more}>
            <summary>
              How the fees work
              <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
            </summary>
            <dl>
              <div>
                <dt>Management fee</dt>
                <dd>
                  {FEE_TERMS.annualPercent}% a year of what you commit, {FEE_TERMS.termYears} years
                  funded once at closing and drawn as it is earned. {managementFeeHalves()}
                </dd>
              </div>
              <div>
                <dt>Formation and administration fee</dt>
                <dd>
                  A flat {money(FEE_TERMS.flatPerSpv)} per SPV, paid once by the SPV and disclosed
                  in the memorandum. Your share is pro rata to your capital committed and settled
                  at close, so it depends on the SPV&rsquo;s final size: {money(share.atAllocation)}{' '}
                  if the round fills to {money(allocationTotal)}, {money(share.atMinimum)} if it
                  closes at its {money(minimumToClose)} minimum. Not charged to you separately.
                </dd>
              </div>
              <div>
                <dt>Everything else</dt>
                <dd>
                  {PASS_THROUGH_LINE} {ESCROW_INTEREST_LINE} {NOT_A_PERCENT_OF_RAISE}
                </dd>
              </div>
            </dl>
          </details>
        </>
      ) : (
        <>
          <div className={s.row}>
            <span>Management fee</span>
            <span className={s.figure}>In the memorandum</span>
          </div>
          <p className={s.quiet}>
            {managementFeeHalves()} {PASS_THROUGH_LINE}
          </p>
        </>
      )}

      <p className={s.held}>
        <Lock size={12} strokeWidth={1.8} aria-hidden="true" />
        Held in escrow until close
        {cutoff !== null ? <> · admissions close {dateStr(cutoff)}</> : null}
      </p>
      <p className={s.held}>{NO_CAPITAL_CALLS}</p>
    </div>
  );
}
