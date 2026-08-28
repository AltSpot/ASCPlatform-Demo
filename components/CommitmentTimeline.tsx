/**
 * What is owed, and by when.
 *
 * The 10-day funding window is a real deadline with a real consequence:
 * an unfunded commitment expires and the allocation returns to the
 * deal. That was living as a number inside a status chip. Here it is a
 * dated line an investor can plan against.
 *
 * Sorted by urgency rather than by deal, because the only question this
 * answers is "what do I have to do next".
 */
import Link from 'next/link';

import CompanyMark from '@/components/CompanyMark';
import { dateStr, money } from '@/lib/format';

import s from './CommitmentTimeline.module.css';

export interface CommitmentDue {
  id: string;
  dealId: string;
  dealName: string;
  logoUrl: string | null;
  amount: number;
  fundingDeadline: string | null;
  daysRemaining: number;
}

/** Inside this many days the deadline stops being background information. */
const URGENT_DAYS = 3;

export default function CommitmentTimeline({ due }: { due: CommitmentDue[] }) {
  if (due.length === 0) {
    return (
      <div className="card">
        <p className="tiny">
          Nothing is due. Commitments appear here the moment you sign, with the
          date the 10 day funding window closes.
        </p>
      </div>
    );
  }

  const sorted = [...due].sort((a, b) => a.daysRemaining - b.daysRemaining);
  const owed = sorted.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="card">
      <div className={s.list}>
        {sorted.map((item) => {
          const urgent = item.daysRemaining <= URGENT_DAYS;
          /* The window is ten days, so the bar reads as "how much of it
             is gone" rather than an arbitrary proportion. */
          const spent = Math.min(100, Math.max(0, ((10 - item.daysRemaining) / 10) * 100));

          return (
            <div className={s.row} key={item.id} data-urgent={urgent}>
              <CompanyMark
                name={item.dealName}
                logoUrl={item.logoUrl}
                size={34}
              />

              <div className={s.who}>
                <b className={s.name}>{item.dealName}</b>
                <span className={s.meta}>
                  {money(item.amount)} due by {dateStr(item.fundingDeadline)}
                </span>
              </div>

              <div className={s.window}>
                <div className={s.track}>
                  <div className={s.fill} style={{ width: `${spent}%` }} />
                </div>
                <span className={s.left}>
                  {item.daysRemaining <= 0
                    ? 'Due today'
                    : `${item.daysRemaining} day${item.daysRemaining === 1 ? '' : 's'} left`}
                </span>
              </div>

              <Link className="btn btn-gold btn-sm" href={`/payment/${item.id}`}>
                Fund now
              </Link>
            </div>
          );
        })}
      </div>

      <p className={s.foot}>
        <b>{money(owed)}</b> committed and awaiting funding. An unfunded
        commitment expires when its window closes and the allocation returns to
        the deal. Nothing else happens, and nothing is charged.
      </p>
    </div>
  );
}
