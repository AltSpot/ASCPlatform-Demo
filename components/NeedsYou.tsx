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
 * Four things can appear here, in the order a member would want to hear
 * them: a commitment to fund (it has a clock), a document to sign, a
 * Radar name that has gone live (the loop closing: they said what they
 * wanted and it arrived), and a commitment that lapsed (nothing to do
 * but decide whether to start again). Each row is one sentence and one
 * button. The page below carries the detail.
 *
 * Server component. The rows are derived on the server from the same
 * subscriptions and Radar board the rest of the page reads, so this
 * cannot disagree with the table under it.
 */
import Link from 'next/link';

import { dateStr, money } from '@/lib/format';

import s from './NeedsYou.module.css';

export type NeedsYouItem =
  | {
      kind: 'fund';
      id: string;
      dealName: string;
      amount: number;
      /** Null only if the signature never set a window. Read as due today. */
      deadline: string | null;
      daysLeft: number;
    }
  | { kind: 'sign'; dealId: string; dealName: string; amount: number }
  | { kind: 'live'; dealId: string; dealName: string; voted: number; closes: string }
  | { kind: 'lapsed'; id: string; dealId: string; dealName: string; amount: number };

/** Inside this many days a funding deadline stops being background. */
const URGENT_DAYS = 3;

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

function keyOf(item: NeedsYouItem): string {
  switch (item.kind) {
    case 'fund':
    case 'lapsed':
      return `${item.kind}:${item.id}`;
    case 'sign':
    case 'live':
      return `${item.kind}:${item.dealId}`;
  }
}

function toneOf(item: NeedsYouItem): 'urgent' | 'quiet' | 'live' {
  if (item.kind === 'fund') return item.daysLeft <= URGENT_DAYS ? 'urgent' : 'quiet';
  if (item.kind === 'lapsed') return 'urgent';
  if (item.kind === 'live') return 'live';
  return 'quiet';
}

function lineOf(item: NeedsYouItem) {
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
          Your {money(item.amount)} commitment to <b>{item.dealName}</b> was not in escrow by the
          admission cut-off, and the spot was released.
        </>
      );
  }
}

function actionOf(item: NeedsYouItem) {
  switch (item.kind) {
    case 'fund':
      return (
        <Link className="btn btn-gold btn-sm" href={`/payment/${item.id}`}>
          Send to escrow
        </Link>
      );
    case 'sign':
      return (
        <Link className="btn btn-gold btn-sm" href={`/invest/${item.dealId}`}>
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
