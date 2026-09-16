/**
 * A deal the member may read but not join.
 *
 * Rule 506(b): a member may subscribe only to offerings that opened after
 * their relationship with AltSpot was established. A deal that opened
 * before that is still shown in full, and in every place the page would
 * offer "Begin investment" it says why not instead. No button, no link
 * into the subscription flow: the invest page and the subscription API
 * both refuse it as well, so this is the explanation, not the control.
 *
 * Three sizes for the three places the ask appears: the hero, the sticky
 * nav, and the close at the foot of the page.
 */
import { Eye } from 'lucide-react';
import Link from 'next/link';

import { dateStr } from '@/lib/format';
import { viewOnlyCopy, type RelationshipView } from '@/lib/relationship';

import s from './Deal.module.css';

export default function ViewOnly({
  relationship,
  size,
}: {
  relationship: RelationshipView;
  size: 'hero' | 'nav' | 'closing';
}) {
  const line = viewOnlyCopy(relationship, dateStr);

  if (size === 'nav') {
    return (
      <span className="chip neutral" title={line}>
        <Eye size={13} strokeWidth={1.6} aria-hidden="true" />
        View only
      </span>
    );
  }

  if (size === 'closing') {
    return (
      <div className={s.closing}>
        <div>
          <div className={`eyebrow ${s.viewOnlyEyebrow}`}>
            <Eye size={14} strokeWidth={1.6} aria-hidden="true" />
            View only
          </div>
          <p className={s.closingNote}>{line}</p>
        </div>
        <Link className="btn btn-ghost" href="/marketplace">
          Back to the marketplace
        </Link>
      </div>
    );
  }

  return (
    <p className={s.viewOnly}>
      <Eye size={16} strokeWidth={1.6} aria-hidden="true" />
      <span>{line}</span>
    </p>
  );
}
