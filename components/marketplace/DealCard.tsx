'use client';

/**
 * One deal, as a card.
 *
 * WHAT A CARD SAYS. It is read in a grid of ten by someone deciding
 * which one to open, so every line does one job:
 *
 *   the art band     the company's own mark on its own colour, the deal
 *                    type chip, the star, and the member's own state
 *   the name
 *   the one line     the headline, two lines at most
 *   the bar          raised against the minimum to close
 *   two buttons      Quick look (the side panel) and View deal
 *
 * COHESIVE, BUT NOT ALIKE. Every card has the same shape, type and
 * controls, and the platform's gold is the only accent in the body. The
 * art band is the one place a company is itself: its drawn mark on a
 * ground lit by its hue (lib/brand.ts), so ten cards read as ten
 * companies, not ten navy gradients.
 *
 * YOURS, IN WORDS. A saved deal says "Saved" and a deal the member voted
 * for on the Radar says "You voted", as labelled chips on the art. The
 * unexplained gold rim that used to mean either is gone. A deal the
 * member is mid-way through says where they are instead.
 *
 * Minimum, closing date and who else is on the round are in the quick
 * look and on the deal page, not on the card (Tyler, 2026-09-17). No
 * fee or carry figure anywhere on it.
 */
import { Eye, PanelRightOpen, Radar, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import FundingProgress from '@/components/FundingProgress';
import DealPeek from '@/components/marketplace/DealPeek';
import WatchStar from '@/components/marketplace/WatchStar';
import type { DealShelfItem, SubscriptionView } from '@/lib/domain';
import { ACCREDITATION_STEP } from '@/lib/domain';
import { dealChip } from '@/lib/funding';

import s from './Marketplace.module.css';

export default function DealCard({
  deal,
  resume,
  watched,
  fromRadar = false,
  onWatchChange,
}: {
  deal: DealShelfItem;
  /** This member's live subscription into the deal, if there is one. */
  resume?: SubscriptionView;
  watched: boolean;
  /** The member voted for this company on the Radar before it opened. */
  fromRadar?: boolean;
  /** Lets a shelf that tracks saves hear about them. */
  onWatchChange?: (watched: boolean) => void;
}) {
  const [peek, setPeek] = useState(false);

  if (deal.redacted) {
    return (
      <div className="card deal-card">
        <div className="thumb" style={{ background: deal.art }}>
          <span className="chip">{deal.tag}</span>
        </div>
        <div className="deal-body">
          <div className={s.title}>
            <h3>{deal.name}</h3>
          </div>
          <p className={s.headline}>{deal.blurb}</p>
          <div className="deal-actions">
            <Link
              className="btn btn-ghost btn-sm btn-block"
              href={`/wizard?step=${ACCREDITATION_STEP}&then=${deal.id}`}
            >
              Finish your questionnaire
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primary = resume ? (
    resume.state === 'docs_signed' ? (
      <Link className="btn btn-gold btn-sm" href={`/payment/${resume.id}`}>
        Send to escrow
      </Link>
    ) : (
      <Link className="btn btn-gold btn-sm" href={`/invest/${deal.id}`}>
        Resume
      </Link>
    )
  ) : (
    <Link className="btn btn-gold btn-sm" href={`/deals/${deal.id}`}>
      View deal
    </Link>
  );

  const viewOnly = !deal.subscribable && !resume;

  return (
    <div className="card deal-card">
      <div className={`thumb ${s.art}`} style={{ background: deal.art }}>
        <span className="chip">{dealChip(deal)}</span>
        <WatchStar
          dealId={deal.id}
          dealName={deal.name}
          initialWatched={watched}
          onChange={onWatchChange}
        />
        {deal.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.cardMark} src={deal.logoUrl} alt="" aria-hidden="true" />
        )}

        {/* The member's own state, in words, bottom left. */}
        <span className={s.states}>
          {resume ? (
            <span className={`${s.state} ${s.stateProgress}`}>
              {resume.state === 'docs_signed' ? 'Signed · send to escrow' : 'In progress'}
            </span>
          ) : null}
          {watched ? (
            <span className={`${s.state} ${s.stateSaved}`}>
              <Star size={11} strokeWidth={2} aria-hidden="true" />
              Saved
            </span>
          ) : null}
          {fromRadar ? (
            <span className={`${s.state} ${s.stateVoted}`}>
              <Radar size={11} strokeWidth={2} aria-hidden="true" />
              You voted
            </span>
          ) : null}
        </span>

        {/* View-only under Rule 506(b): opened before this member joined. */}
        {viewOnly ? (
          <span className={s.viewOnlyMark} title="Opened before you joined">
            <Eye size={12} strokeWidth={1.8} aria-hidden="true" />
            View only
          </span>
        ) : null}
      </div>

      <div className="deal-body">
        <div className={s.title}>
          <h3>{deal.name}</h3>
        </div>

        <p className={s.headline}>{deal.headline}</p>

        <FundingProgress deal={deal} compact />

        <div className={`deal-actions ${s.cardActions}`}>
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${s.peekButton}`}
            onClick={() => setPeek(true)}
            aria-label={`Quick look at ${deal.name}`}
          >
            <PanelRightOpen size={14} strokeWidth={1.7} aria-hidden="true" />
            Quick look
          </button>
          {primary}
        </div>
      </div>

      <DealPeek deal={deal} resume={resume} open={peek} onClose={() => setPeek(false)} />
    </div>
  );
}
