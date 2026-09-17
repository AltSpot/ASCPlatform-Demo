/**
 * Where a raise stands, in the words the deal is actually closed on.
 *
 * Work order screen 5. The old header said how much of the allocation
 * was subscribed and how much remained, which is the wrong question for
 * an escrow-first raise: a deal closes when it reaches its MINIMUM, and
 * the allocation is only how far it may go. So the four fields are
 * RAISED SO FAR, MINIMUM TO CLOSE, CLOSING DATE and ESCROW STATUS, and
 * the bar is drawn on the allocation's scale with the minimum marked:
 * a solid track up to the minimum, a fainter one beyond it for the
 * "up to", and gold for what is in.
 *
 * `compact` is the card and row form: the bar and one line.
 *
 * No 'use client'. The rules are lib/funding.ts.
 */
import { Check, Lock } from 'lucide-react';

import { dateStr, money } from '@/lib/format';
import { ESCROW_LABEL, fundingView, type FundingInput } from '@/lib/funding';

import s from './FundingProgress.module.css';

export default function FundingProgress({
  deal,
  compact = false,
  showAdmissions = false,
  layout = 'grid',
}: {
  /** 'row' puts the four fields in one line (a full-width strip). */
  layout?: 'grid' | 'row';
  deal: FundingInput;
  compact?: boolean;
  /** Add the ADMISSIONS CLOSE line (the deal page and checkout). */
  showAdmissions?: boolean;
}) {
  const f = fundingView(deal);

  const label = f.minimumMet ? (
    <span className={s.met}>
      <Check size={12} strokeWidth={2} aria-hidden="true" />
      Minimum met
    </span>
  ) : (
    <span>{f.toMinimumPct}% of minimum</span>
  );

  const bar = (
    <div
      className={s.bar}
      role="img"
      aria-label={
        f.minimumMet
          ? `Minimum met. ${money(f.raised)} raised of up to ${money(f.allocation)}.`
          : `${f.toMinimumPct} percent of the minimum raised.`
      }
    >
      <span className={s.toMinimum} style={{ width: `${f.minimumAtPct}%` }} />
      <span className={s.fill} style={{ width: `${Math.max(2, f.ofAllocationPct)}%` }} />
      {f.minimumAtPct < 100 ? (
        <span className={s.tick} style={{ left: `${f.minimumAtPct}%` }} />
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <div className={s.compact}>
        {bar}
        <p className={s.caption}>{label}</p>
      </div>
    );
  }

  return (
    <div className={s.full} data-layout={layout}>
      <dl className={s.fields}>
        <div className={s.field}>
          <dt>Raised so far</dt>
          <dd>{money(f.raised)}</dd>
        </div>
        <div className={s.field}>
          <dt>Minimum to close</dt>
          <dd>{money(f.minimum)}</dd>
        </div>
        <div className={s.field}>
          <dt>Closing date</dt>
          <dd>{dateStr(f.closesAt ?? deal.targetClose)}</dd>
        </div>
        <div className={s.field}>
          <dt>Escrow status</dt>
          <dd className={s.escrow}>
            <Lock size={13} strokeWidth={1.8} aria-hidden="true" />
            {ESCROW_LABEL[f.escrow]}
          </dd>
        </div>
      </dl>

      {bar}
      <p className={s.caption}>
        {label}
        <span>Up to {money(f.allocation)}</span>
      </p>

      {showAdmissions && f.escrow === 'held' && f.admissionsCloseAt ? (
        <p className={s.admissions}>
          {f.admissionsOpen ? 'Admissions close' : 'Admissions closed'} ·{' '}
          {dateStr(f.admissionsCloseAt)}
          {deal.members && deal.investorCap ? (
            <span className={s.members}>
              {' '}
              · {Math.min(deal.members, deal.investorCap)} of {deal.investorCap} members
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
