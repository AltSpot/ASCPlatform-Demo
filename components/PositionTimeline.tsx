'use client';

/**
 * The timeline for one position that is still open, shown under its row
 * in Your positions.
 *
 * It used to be its own section further down the dashboard, which meant
 * a member read a position, saw "fund by ACH", and then had to find the
 * clock somewhere else. A commitment and its deadline are one thing.
 * They live together now.
 *
 * Three steps, always the same three, because a subscription only ever
 * goes one way: signed, funded, countersigned. What changes is where
 * the position has got to and what it is waiting on.
 *
 * The rail carries dates only where something has already happened. A
 * step that has not run yet was captioned with what it was waiting for,
 * which repeated in longer form the sentence directly beside it: the
 * deadline appeared three times on one row, in the bar, in the rail and
 * in the line. Once is enough.
 *
 * `daysRemaining` is computed on the server and passed in rather than
 * derived from the clock here, so the server and the client agree on
 * first paint.
 */
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { dateStr, money } from '@/lib/format';

import s from './PositionTimeline.module.css';

export interface OpenPosition {
  id: string;
  dealId: string;
  dealName: string;
  amount: number;
  /** Only the open states reach this component. */
  state: 'started' | 'docs_signed' | 'funded';
  signedAt: string | null;
  fundedAt: string | null;
  fundingDeadline: string | null;
  daysRemaining: number;
}

/** Inside this many days the window stops being background information. */
const URGENT_DAYS = 3;

/** The bar's scale: the last this many days before admissions close. */
const WINDOW_DAYS = 10;

export default function PositionTimeline({ position }: { position: OpenPosition }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const { state } = position;
  const signed = state === 'docs_signed' || state === 'funded';
  const funded = state === 'funded';
  const urgent = state === 'docs_signed' && position.daysRemaining <= URGENT_DAYS;

  /* How much of the ten days is gone. The bar reads as the window
     closing rather than as progress toward something good. */
  const spent = Math.min(
    100,
    Math.max(0, ((WINDOW_DAYS - position.daysRemaining) / WINDOW_DAYS) * 100),
  );

  async function cancel() {
    if (busy) return;
    setBusy(true);
    try {
      await api.cancelSubscription(position.id);
      toast('Commitment cancelled. Allocation released.');
      router.refresh();
    } catch {
      toast('Could not cancel that commitment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.wrap} data-urgent={urgent}>
      <ol className={s.steps}>
        <Step
          done={signed}
          current={state === 'started'}
          label="Documents signed"
          detail={signed ? dateStr(position.signedAt) : ''}
        />
        <Step
          done={funded}
          current={state === 'docs_signed'}
          label="In escrow"
          detail={funded ? dateStr(position.fundedAt) : ''}
        />
        <Step done={false} current={funded} label="Deal closes" detail="" />
      </ol>

      <div className={s.now}>
        {state === 'docs_signed' ? (
          <>
            <div className={s.track}>
              <div className={s.fill} style={{ width: `${spent}%` }} />
            </div>
            <p className={s.line}>
              <b className={s.left}>
                {position.daysRemaining <= 0
                  ? 'Due today'
                  : `${position.daysRemaining} day${position.daysRemaining === 1 ? '' : 's'} left`}
              </b>
              {money(position.amount)} to escrow by {dateStr(position.fundingDeadline)},
              when admissions close.
            </p>
            <div className={s.actions}>
              <Link className="btn btn-gold btn-sm" href={`/payment/${position.id}`}>
                Send to escrow
              </Link>
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={cancel}
                disabled={busy}
              >
                {busy ? 'Cancelling' : 'Cancel'}
              </button>
            </div>
          </>
        ) : state === 'started' ? (
          <>
            <p className={s.line}>
              <b className={s.left}>No clock yet</b>
Your allocation is reserved when you sign.
            </p>
            <div className={s.actions}>
              <Link className="btn btn-gold btn-sm" href={`/invest/${position.dealId}`}>
                Resume signing
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className={s.line}>
              <b className={s.left}>With AltSpot</b>
Received {dateStr(position.fundedAt)}. Countersigning is ours to do.
            </p>
            <div className={s.actions}>
              <Link className="btn btn-quiet btn-sm" href={`/deals/${position.dealId}`}>
                View deal
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** One step on the rail. Done, current, or still ahead. */
function Step({
  done,
  current,
  label,
  detail,
}: {
  done: boolean;
  current: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className={s.step} data-done={done} data-current={current}>
      <span className={s.mark} aria-hidden="true">
        {done ? <Check size={11} strokeWidth={2.2} /> : null}
      </span>
      <span className={s.stepLabel}>{label}</span>
      {detail ? <span className={s.stepDetail}>{detail}</span> : null}
    </li>
  );
}
