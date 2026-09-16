/**
 * One deal, as a card.
 *
 * The same card wherever a deal is offered: the marketplace shelf and
 * the dashboard's Most popular. A member who learns to read it once
 * has read it everywhere.
 *
 * WHAT A CARD SAYS. It is read in a grid of ten by someone deciding
 * which one to open, and the grid has to show two rows without a
 * scroll, so the card is short and every line on it does one job:
 *
 *   the art band     the mark, the tag, and a Radar glyph when it applies
 *   the name
 *   the one line     the headline, two lines at most
 *   the bar          how much is spoken for
 *   the button
 *
 * Minimum, closing date, what is left and who else is on the round are
 * on the deal page, not here (Tyler, 2026-09-17): the card is for
 * choosing which deal to open, and a row of figures on each of ten
 * cards was more reading than choosing.
 *
 * The fee and the carry are not here: 5% and 10% on every deal AltSpot
 * has ever done, stated once above the grid and in full on the deal
 * page. The blurb is not here: it is the deal page's paragraph.
 *
 * A card for a member who is not yet a verified accredited investor
 * carries no figures at all. Not blurred figures: the server never sent
 * them (see lib/repositories/deals.ts). What is left is the company, the
 * sector and the one line, which is enough to know the deal exists.
 *
 * No 'use client': nothing here holds state, so a server page can
 * render it directly. The star inside it is its own client island.
 */
import { Radar } from 'lucide-react';
import Link from 'next/link';

import WatchStar from '@/components/marketplace/WatchStar';
import type { DealShelfItem, SubscriptionView } from '@/lib/domain';
import { ACCREDITATION_STEP } from '@/lib/domain';

import s from './Marketplace.module.css';

export default function DealCard({
  deal,
  resume,
  watched,
  fromRadar = false,
}: {
  deal: DealShelfItem;
  /** This member's live subscription into the deal, if there is one. */
  resume?: SubscriptionView;
  watched: boolean;
  /**
   * The member voted for this company on the Radar and AltSpot went and
   * got it. The one line on the card that proves the mechanic: shown,
   * on the deal it applies to, rather than claimed in a slogan.
   */
  fromRadar?: boolean;
}) {
  const primary = deal.redacted ? (
    <Link
      className="btn btn-ghost btn-sm btn-block"
      href={`/wizard?step=${ACCREDITATION_STEP}&then=${deal.id}`}
    >
      Get verified
    </Link>
  ) : resume ? (
    resume.state === 'docs_signed' ? (
      <Link className="btn btn-gold btn-sm btn-block" href={`/payment/${resume.id}`}>
        Fund commitment
      </Link>
    ) : (
      <Link className="btn btn-gold btn-sm btn-block" href={`/invest/${deal.id}`}>
        Resume investment
      </Link>
    )
  ) : (
    <Link className="btn btn-gold btn-sm btn-block" href={`/deals/${deal.id}`}>
      View deal
    </Link>
  );

  return (
    <div className="card deal-card">
      <div className="thumb" style={{ background: deal.art }}>
        <span className="chip">{deal.tag}</span>
        <WatchStar dealId={deal.id} dealName={deal.name} initialWatched={watched} />
        {deal.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="deal-logo-hero" src={deal.logoUrl} alt="" aria-hidden="true" />
        )}

        {/* The member's own state, on the artwork. */}
        {resume ? (
          <span className={s.resumeChip}>
            {resume.state === 'docs_signed' ? 'Awaiting funding' : 'In progress'}
          </span>
        ) : null}

        {/* A deal the member voted for before it opened, as one gold
            glyph on the art rather than a line of copy under the name. */}
        {fromRadar ? (
          <span
            className={s.fromRadar}
            role="img"
            aria-label="From your Radar"
            title="From your Radar"
          >
            <Radar size={14} strokeWidth={1.7} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="deal-body">
        <div className={s.title}>
          <h3>{deal.name}</h3>
        </div>

        <p className={s.headline}>{deal.redacted ? deal.blurb : deal.headline}</p>

        {deal.redacted ? (
          <LockedFigures />
        ) : (
          <Allocation total={deal.allocationTotal} remaining={deal.allocationRemaining} />
        )}

        <div className="deal-actions">{primary}</div>
      </div>
    </div>
  );
}

/**
 * How much of the allocation is spoken for. One bar and one figure: the
 * percentage. The dollars are on the deal page.
 */
function Allocation({ total, remaining }: { total: number; remaining: number }) {
  const pct =
    total > 0
      ? Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)))
      : 0;

  return (
    <div className={s.alloc} aria-label={`${pct}% subscribed`}>
      <div className={s.allocBar}>
        <div className={s.allocFill} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className={s.allocPct}>{pct}%</span>
    </div>
  );
}

/**
 * Where the facts and the allocation bar sit on an open card. Quiet
 * rules rather than fake numbers: there is no value here to
 * approximate, because none was sent.
 */
function LockedFigures() {
  return (
    <div className={s.locked}>
      <div className={s.lockedRows} aria-hidden="true">
        <span style={{ width: '58%' }} />
        <span style={{ width: '76%' }} />
      </div>
      <p className={s.lockedNote}>Terms open once you are verified.</p>
    </div>
  );
}


