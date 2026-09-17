'use client';

/**
 * The bell on the rail: what needs the member, from any page.
 *
 * The dashboard's Needs you strip is the full answer, but a member on the
 * Terminal or mid-way through the marketplace should not have to go back
 * to it to learn a deadline is three days out. The bell carries the count
 * and opens the same rows in the right-hand panel (components/SidePanel),
 * built from the same list (lib/needs-you.ts) with the same words
 * (components/NeedsYou), so the two never disagree. Quiet when nothing is
 * waiting: a bell with a zero on it is noise.
 */
import { Bell, BellRing } from 'lucide-react';
import { useState } from 'react';

import { actionOf, lineOf } from '@/components/NeedsYou';
import SidePanel from '@/components/SidePanel';
import { keyOf, toneOf, type NeedsYouItem } from '@/lib/needs-you';

import s from './NotificationBell.module.css';

export default function NotificationBell({ items }: { items: NeedsYouItem[] }) {
  const [open, setOpen] = useState(false);
  const count = items.length;
  const urgent = items.some((item) => toneOf(item) === 'urgent');

  return (
    <>
      <button
        type="button"
        className={s.bell}
        data-live={count > 0}
        data-urgent={urgent}
        data-tour="bell"
        onClick={() => setOpen(true)}
        aria-label={
          count === 0
            ? 'Notifications. Nothing needs you right now.'
            : `Notifications. ${count} ${count === 1 ? 'thing needs' : 'things need'} you.`
        }
        title={count === 0 ? 'Nothing needs you' : `${count} waiting on you`}
      >
        {count > 0 ? (
          <BellRing size={16} strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <Bell size={16} strokeWidth={1.6} aria-hidden="true" />
        )}
        {count > 0 ? (
          <span className={s.count} aria-hidden="true">
            {count}
          </span>
        ) : null}
      </button>

      <SidePanel
        open={open}
        onClose={() => setOpen(false)}
        label="What needs you"
        header={
          <>
            <p className="eyebrow">Needs you</p>
            <h2 className={s.title}>
              {count === 0
                ? 'Nothing is waiting on you.'
                : `${count} ${count === 1 ? 'thing needs' : 'things need'} you.`}
            </h2>
          </>
        }
      >
        {count === 0 ? (
          <p className={s.none}>
            When a commitment has a deadline, a document is waiting for your signature, or a
            company you voted for opens, it appears here and on your dashboard.
          </p>
        ) : (
          <ul className={s.list}>
            {items.map((item) => (
              <li className={s.row} key={keyOf(item)} data-tone={toneOf(item)}>
                <span className={s.mark} aria-hidden="true" />
                <p className={s.line}>{lineOf(item)}</p>
                <div className={s.action} onClick={() => setOpen(false)}>
                  {actionOf(item)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SidePanel>
    </>
  );
}
