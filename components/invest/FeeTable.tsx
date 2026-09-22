'use client';

/**
 * What a subscription costs, and where the money waits. Work order
 * screen 8, on the fee counsel confirmed 2026-09-17 (lib/fees.ts).
 *
 * THE FEES COME OFF THE TOP (Tyler, 2026-09-21). A member sends their
 * investment to escrow and nothing more. The table reads down from it:
 * the management fee reserved up front (with what one year comes to),
 * the admin fee in words (Tyler, 2026-09-21: explained, not subtracted,
 * for now: the share depends on the vehicle's final size), and what goes
 * to work in the company after the reserve. Everything else counsel's
 * wording requires, both halves
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
  reservePercent,
} from '@/lib/fees';
import { dateStr, money } from '@/lib/format';
import { admissionCutoff } from '@/lib/funding';

import s from './FeeTable.module.css';

export default function FeeTable({
  amount,
  targetClose,
  company,
}: {
  amount: number;
  /** The deal's closing date, for the admission cut-off. */
  targetClose: string;
  /** The vehicle's size, kept for when the admin share is shown as a figure again. */
  minimumToClose: number;
  allocationTotal: number;
  /** What is left of the allocation, for how much is raised already. */
  allocationRemaining?: number;
  /** The company the money goes to work in. */
  company?: string;
}) {
  const breakdown = feeBreakdown(amount);
  const cutoff = admissionCutoff(targetClose);
  const atWork = breakdown.afterReserve;
  const atWorkPct = breakdown.amount > 0 ? (atWork / breakdown.amount) * 100 : 100;

  return (
    <div className={s.table}>
      <div className={s.row}>
        <span>
          Your investment <small>sent to escrow</small>
        </span>
        <span className={s.figure}>{money(breakdown.amount)}</span>
      </div>

      {SHOW_FEE_TERMS ? (
        <>
          <div className={s.row}>
            <span>
              <Term q="What are the fees?" quiet>
                Management fee
              </Term>{' '}
              <small>
                {FEE_TERMS.annualPercent}% a year ({money(breakdown.annual)} a year), reserved up
                front
              </small>
            </span>
            <span className={s.figure}>&minus;{money(breakdown.reserve)}</span>
          </div>

          <div className={s.row}>
            <span>
              Admin fee{' '}
              <small>
                {money(FEE_TERMS.flatPerSpv)} per vehicle, shared pro rata across its investors
              </small>
            </span>
            <span className={s.figure}>At close</span>
          </div>

          <div className={`${s.row} ${s.total}`}>
            <span>
              Goes to work{company ? <> in {company}</> : null} <small>before the admin fee</small>
            </span>
            <span className={s.figure}>&asymp; {money(atWork)}</span>
          </div>
          {/* The sum as a shape: almost all of it goes to work. */}
          <div className={s.split} aria-hidden="true">
            <span style={{ width: `${atWorkPct}%` }} />
            <span />
          </div>

          <p className={s.quiet}>
            The fees come out of your investment, not on top of it. You send{' '}
            <b>{money(breakdown.amount)}</b>{' '}
            and nothing more. Your share of the admin fee
            also comes out of it at close, once the vehicle&rsquo;s final size is known.
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
                  {FEE_TERMS.annualPercent}% a year of what you commit. {FEE_TERMS.termYears} years
                  ({reservePercent()}%, {money(breakdown.reserve)} here) are reserved from your
                  investment at closing and drawn as earned. {managementFeeHalves()}
                </dd>
              </div>
              <div>
                <dt>Admin fee</dt>
                <dd>
                  A flat {money(FEE_TERMS.flatPerSpv)} formation and administration fee per
                  vehicle, for its lifetime, disclosed in the memorandum. It is shared pro rata
                  across every investor by capital committed and settled at close, so your share
                  depends on the vehicle&rsquo;s final size: the larger the vehicle, the smaller
                  each share. Taken from your investment, never billed separately.
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
