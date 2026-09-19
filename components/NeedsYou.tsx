/**
 * What needs the member, in one place, above everything else.
 *
 * A first-time investor's second question, after "what is it worth", is
 * "is anything waiting on me". The answer used to be scattered: a
 * funding deadline inside an expanded table row, a lapsed commitment in
 * its own banner, and a Radar name going live nowhere at all. This
 * strip is the one answer. It renders nothing when nothing is waiting,
 * which for most members on most days is the case, and that absence is
 * itself the message.
 *
 * The list itself is built in lib/needs-you.ts, which the bell on the
 * rail (components/NotificationBell) reads too, so the strip and the
 * bell always agree. Each row is one sentence and one button; the page
 * below carries the detail. `lineOf` and `actionOf` are exported so the
 * bell's panel says exactly what the strip says.
 *
 * Server component. The rows are derived on the server from the same
 * subscriptions and Radar board the rest of the page reads.
 */
import Link from 'next/link';

import { dateStr, money } from '@/lib/format';
import { keyOf, toneOf, type NeedsYouItem } from '@/lib/needs-you';

import s from './NeedsYou.module.css';

export type { NeedsYouItem } from '@/lib/needs-you';

export default function NeedsYou({ items }: { items: NeedsYouItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className={s.strip} aria-label="Needs you">
      {items.map((item) => (
        <div className={s.row} key={keyOf(item)} data-tone={toneOf(item)}>
          <span className={s.mark} aria-hidden="true" />
          <p className={s.line}>{lineOf(item)}</p>
          {actionOf(item)}
        </div>
      ))}
    </section>
  );
}

export function lineOf(item: NeedsYouItem) {
  switch (item.kind) {
    case 'fund':
      return (
        <>
          Send {money(item.amount)} to escrow for <b>{item.dealName}</b> by {dateStr(item.deadline)}
          {item.daysLeft > 0 ? (
            <>
              , <span className={s.clock}>{daysCopy(item.daysLeft)}</span>.
            </>
          ) : (
            <>, <span className={s.clock}>due today</span>.</>
          )}
        </>
      );
    case 'sign':
      return (
        <>
          Your {money(item.amount)} investment in <b>{item.dealName}</b> is waiting for your
          signature.
        </>
      );
    case 'live':
      return (
        <>
          <b>{item.dealName}</b>, which you voted {money(item.voted)} for on the Radar, is open
          now. Closes {item.closes}.
        </>
      );
    case 'lapsed':
      return (
        <>
          Your {money(item.amount)} commitment to <b>{item.dealName}</b> was not in escrow within
          its window, and the spot was released.
        </>
      );
  }
}

export function actionOf(item: NeedsYouItem) {
  switch (item.kind) {
    case 'fund':
      return (
        <Link className="btn btn-action btn-sm" href={`/payment/${item.id}`}>
          Complete investment
        </Link>
      );
    case 'sign':
      return (
        <Link className="btn btn-action btn-sm" href={`/invest/${item.dealId}`}>
          Finish signing
        </Link>
      );
    case 'live':
      return (
        <Link className="btn btn-gold btn-sm" href={`/deals/${item.dealId}`}>
          See the deal
        </Link>
      );
    case 'lapsed':
      return (
        <Link className="btn btn-ghost btn-sm" href={`/deals/${item.dealId}`}>
          Re-open deal
        </Link>
      );
  }
}

function daysCopy(days: number): string {
  return days === 1 ? '1 day left' : `${days} days left`;
}
