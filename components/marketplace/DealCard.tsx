'use client';

/**
 * One deal, as a card.
 *
 * STRUCTURE (Tyler, 2026-09-17: the pills were crowding each other). Every
 * mark on the card has one fixed seat, and no seat holds more than one
 * kind of thing:
 *
 *   art, top left       ONE status, the most important that applies:
 *                       your own unfinished investment first, then View
 *                       only, SPV full, or Just opened
 *   art, top right      the star
 *   art, bottom left    the member's own marks: Saved, You voted
 *   body                the name, then the deal type and round as one
 *                       quiet line, the headline, the funding bar, and
 *                       Quick look beside the main button
 *
 * The deal type used to be a chip on the art, fighting the status for the
 * same corner; it reads better as the line under the name, where the
 * deal page's hero puts it too. Where a member is mid-way through a deal,
 * the main button says so (Finish signing, Complete investment) in the
 * .btn-action style, and the status seat says why.
 *
 * COHESIVE, BUT NOT ALIKE. The art band is the one place a company is
 * itself: its drawn mark on a ground lit by its hue (lib/brand.ts).
 * Everything else is the platform's.
 *
 * No fee or carry figure anywhere on it.
 */
import { CircleAlert, Eye, PanelRightOpen, Radar, Sparkles, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import FundingProgress from '@/components/FundingProgress';
import DealPeek from '@/components/marketplace/DealPeek';
import WatchStar from '@/components/marketplace/WatchStar';
import type { DealShelfItem, SubscriptionView } from '@/lib/domain';
import { ACCREDITATION_STEP } from '@/lib/domain';
import { dealChip, isJustOpened } from '@/lib/funding';

import s from './Marketplace.module.css';

export default function DealCard({
  deal,
  resume,
  watched,
  fromRadar = false,
  radarSourced = false,
  onWatchChange,
}: {
  deal: DealShelfItem;
  /** This member's live subscription into the deal, if there is one. */
  resume?: SubscriptionView;
  watched: boolean;
  /** The member voted for this company on the Radar before it opened. */
  fromRadar?: boolean;
  /** The deal came off the Radar (whoever voted). */
  radarSourced?: boolean;
  /** Lets a shelf that tracks saves hear about them. */
  onWatchChange?: (watched: boolean) => void;
}) {
  const [peek, setPeek] = useState(false);

  if (deal.redacted) {
    return (
      <div className="card deal-card">
        <div className="thumb" style={{ background: deal.art }} />
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

  /* A deal the member started asks them to finish, in the one button
     style that out-ranks every View deal on the shelf. */
  const primary = resume ? (
    resume.state === 'docs_signed' ? (
      <Link className="btn btn-action btn-sm" href={`/payment/${resume.id}`}>
        Complete investment
      </Link>
    ) : (
      <Link className="btn btn-action btn-sm" href={`/invest/${deal.id}`}>
        Finish signing
      </Link>
    )
  ) : (
    <Link className="btn btn-gold btn-sm" href={`/deals/${deal.id}`}>
      View deal
    </Link>
  );

  const viewOnly = !deal.subscribable && !resume;
  const full = !resume && deal.members > 0 && deal.members >= deal.investorCap;
  const justOpened = isJustOpened(deal.launchedAt);

  /* One status, in order of what a member most needs to know. */
  const status = resume
    ? {
        tone: 'action',
        icon: CircleAlert,
        label: resume.state === 'docs_signed' ? 'Signed · complete it' : 'Started',
        title: resume.state === 'docs_signed'
          ? 'You signed. Send your subscription to escrow before admissions close.'
          : 'You started this investment. Finish signing to reserve your spot.',
      }
    : viewOnly
    ? { tone: 'quiet', icon: Eye, label: 'View only', title: 'Opened before you joined' }
    : full
      ? { tone: 'quiet', icon: Users, label: 'SPV full', title: 'At its member limit. Join the waitlist on the deal.' }
      : justOpened
        ? radarSourced
          ? { tone: 'new', icon: Radar, label: 'Just opened', title: 'Just opened, from the Radar' }
          : { tone: 'new', icon: Sparkles, label: 'Just opened', title: 'Opened in the last three weeks' }
        : null;

  return (
    <div className={full ? `card deal-card ${s.fullCard}` : 'card deal-card'}>
      <div className={`thumb ${s.art}`} style={{ background: deal.art }}>
        {status ? (
          <span className={s.status} data-tone={status.tone} title={status.title}>
            <status.icon size={11} strokeWidth={2} aria-hidden="true" />
            {status.label}
            {status.tone === 'new' && radarSourced ? (
              <span className="sr-only">, from the Radar</span>
            ) : null}
          </span>
        ) : null}

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

        {watched || fromRadar ? (
          <span className={s.mine}>
            {watched ? (
              <span className={s.mineChip} data-kind="saved">
                <Star size={10} strokeWidth={2.2} aria-hidden="true" />
                Saved
              </span>
            ) : null}
            {fromRadar ? (
              <span className={s.mineChip} data-kind="voted">
                <Radar size={10} strokeWidth={2.2} aria-hidden="true" />
                You voted
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="deal-body">
        <div className={s.title}>
          <h3>{deal.name}</h3>
          <span className={s.meta}>{dealChip(deal)}</span>
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
