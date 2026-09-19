/**
 * The member's own clock to reach escrow (Tyler, 2026-09-19).
 *
 * Two dates live near a signed subscription and they are not the same
 * date. ADMISSIONS CLOSE belongs to the deal: it is when the SPV stops
 * taking members, and it is the same for everyone. THE ESCROW WINDOW
 * belongs to the member: ESCROW_WINDOW_DAYS from the day they signed. The
 * page that said "26 days to go" was showing the deal's date to a member
 * whose own date was ten days out, so this states the member's clock and
 * nothing else: the day they signed, the day the money is due, and the
 * days left out of the ten, over a bar that runs from one date to the
 * other. The deal's date is mentioned once, in a sentence, as the deal's.
 *
 * Everything is computed by `escrowWindow` in lib/funding.ts, so the
 * dashboard's timeline and the payment page cannot disagree. No hooks:
 * renders on the server or inside a client island.
 */
import { ESCROW_WINDOW_DAYS } from '@/lib/config';
import { dateStr } from '@/lib/format';
import { escrowWindow } from '@/lib/funding';

import s from './EscrowClock.module.css';

export default function EscrowClock({
  signedAt,
  deadline,
  admissionsClose,
  daysLeft,
  compact = false,
}: {
  signedAt: string | null;
  deadline: string | null;
  /** When the deal stops admitting members, if it is later than the deadline. */
  admissionsClose?: string | number | null;
  /** Whole days left, computed on the server so first paint and hydration agree. */
  daysLeft: number;
  /** The dashboard's dropdown: no sentence about admissions. */
  compact?: boolean;
}) {
  const span = escrowWindow(signedAt, deadline, 0);
  if (!span) return null;
  const clock = { ...span, daysLeft: Math.min(span.windowDays, Math.max(0, daysLeft)) };

  const urgent = clock.daysLeft <= 3;
  const admissions =
    admissionsClose && new Date(admissionsClose).getTime() > clock.dueAt + 12 * 3_600_000
      ? dateStr(admissionsClose)
      : null;

  return (
    <div className={s.clock} data-urgent={urgent}>
      <div className={s.facts}>
        <span className={s.fact}>
          <span className={s.key}>You signed</span>
          <span className={s.value}>{dateStr(clock.signedAt)}</span>
        </span>
        <span className={s.fact}>
          <span className={s.key}>Send by</span>
          <span className={s.value}>{dateStr(clock.dueAt)}</span>
        </span>
        <span className={s.fact} data-lead="true">
          <span className={s.key}>Days left</span>
          <span className={s.value}>
            {clock.daysLeft <= 0 ? (
              'Due today'
            ) : (
              <>
                {clock.daysLeft} <small>of {clock.windowDays}</small>
              </>
            )}
          </span>
        </span>
      </div>

      <div
        className={s.track}
        role="img"
        aria-label={`Day ${Math.min(clock.windowDays, clock.windowDays - clock.daysLeft)} of ${clock.windowDays}`}
      >
        {Array.from({ length: clock.windowDays }, (_, i) => (
          <span key={i} className={s.day} data-spent={i < clock.windowDays - clock.daysLeft} />
        ))}
      </div>
      <div className={s.ends}>
        <span>Signed {dateStr(clock.signedAt)}</span>
        <span>Due {dateStr(clock.dueAt)}</span>
      </div>

      {compact ? null : (
        <p className={s.rule}>
          Once you sign, you have {ESCROW_WINDOW_DAYS} days to send your money to escrow. After{' '}
          {dateStr(clock.dueAt)} the subscription lapses and your spot goes to the next member.
          Nothing is charged.
          {admissions
            ? ` The deal itself keeps admitting members until ${admissions}; that date is the deal's, not yours.`
            : ''}
        </p>
      )}
    </div>
  );
}
