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
import { CircleAlert, CircleCheck, Eye, PanelRightOpen, Radar, Sparkles, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import CompanyLogo from '@/components/CompanyLogo';
import AssetClassTag from '@/components/AssetClassTag';
import FundingProgress from '@/components/FundingProgress';
import DealPeek from '@/components/marketplace/DealPeek';
import WatchStar from '@/components/marketplace/WatchStar';
import type { DealShelfItem, SubscriptionView } from '@/lib/domain';
import { ACCREDITATION_STEP } from '@/lib/domain';
import { compact, money } from '@/lib/format';
import { bandIsLight } from '@/lib/brand';
import { positionHref, type PositionStageView } from '@/lib/position-stage';
import { dealLead, dealRound, isJustOpened, STAGE_RUNGS, stageRung } from '@/lib/funding';

import s from './Marketplace.module.css';

export default function DealCard({
  deal,
  resume,
  watched,
  fromRadar = false,
  votedAmount,
  investedAmount,
  stage,
  radarSourced = false,
  onWatchChange,
}: {
  deal: DealShelfItem;
  /** This member's live subscription into the deal, if there is one. */
  resume?: SubscriptionView;
  watched: boolean;
  /** The member voted for this company on the Radar before it opened. */
  fromRadar?: boolean;
  /** What they voted, so the card can say it. */
  votedAmount?: number;
  /** What the member has in this deal, once they are in it. */
  investedAmount?: number;
  /** Where the member stands in this deal, for the quick look. */
  stage?: PositionStageView;
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
  /* ALREADY IN (Tyler, 2026-09-19). A small chip on the art was the only
     sign a member held a deal, and the card still asked them to "View
     deal" like any other. A deal they are in now says so three ways: a
     filled green status, a band across the body stating what they put in,
     and a main button that goes to their position rather than the pitch.
     The ring round the card is the same green, so it is findable in a
     grid without reading. */
  const inDeal = deal.youAreIn && !resume;

  const primary = inDeal ? (
    <Link className="btn btn-ghost btn-sm" href={positionHref(deal.id)}>
      Your position
    </Link>
  ) : resume ? (
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
    <Link className="btn btn-ghost btn-orb btn-sm" href={`/deals/${deal.id}`}>
      View deal
    </Link>
  );

  const round = dealRound(deal);
  const rung = stageRung(round);

  const viewOnly = !deal.subscribable && !resume;
  const full = !resume && !deal.youAreIn && deal.members > 0 && deal.members >= deal.investorCap;
  const justOpened = isJustOpened(deal.launchedAt);

  /* One status, in order of what a member most needs to know. */
  const status = resume
    ? {
        tone: 'action',
        icon: CircleAlert,
        label: resume.state === 'docs_signed' ? 'Signed · complete it' : 'Started',
        title: resume.state === 'docs_signed'
          ? 'You signed. You have ten days from signing to send your subscription to escrow.'
          : 'You started this investment. Finish signing to reserve your spot.',
      }
    : deal.youAreIn
    ? deal.status === 'closed'
      ? { tone: 'in', icon: CircleCheck, label: 'You invested', title: 'You are in this SPV' }
      : { tone: 'in', icon: CircleCheck, label: 'In escrow', title: 'Your money is in escrow until the deal closes' }
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
    <div
      className={full ? `card deal-card ${s.fullCard}` : 'card deal-card'}
      data-voted={fromRadar ? 'true' : undefined}
      data-in={inDeal ? 'true' : undefined}
    >
      <div
        className={`thumb ${s.art}`}
        style={{ background: deal.art }}
        data-light={bandIsLight(deal.id) ? 'true' : undefined}
      >
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
          <CompanyLogo className={s.cardMark} slug={deal.id} logoUrl={deal.logoUrl} />
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
                You voted{votedAmount ? ` ${compact(votedAmount)}` : ''}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="deal-body">
        <div className={s.title}>
          <h3>{deal.name}</h3>
          {/* THE STAGE, ON ITS OWN (Tyler, 2026-09-19). It was the second half
              of a grey line. Now it is a pill in ink with a five-step meter
              from seed to late stage, so a member scanning the shelf can
              tell a Series A from a secondary without reading; who leads
              stays beside it as the quiet word. */}
          <span className={s.stageRow}>
            {round ? (
              <span
                className={s.stagePill}
                title={rung ? `${round}: stage ${rung} of ${STAGE_RUNGS}, earliest to latest` : round}
              >
                {rung ? (
                  <span className={s.rungs} aria-hidden="true">
                    {Array.from({ length: STAGE_RUNGS }, (_, i) => (
                      <span key={i} data-on={i < rung} />
                    ))}
                  </span>
                ) : null}
                {round}
              </span>
            ) : null}
            <span className={s.meta}>{dealLead(deal)}</span>
            <span className={s.classTag}>
              <AssetClassTag assetClass={deal.assetClass} />
            </span>
          </span>
        </div>

        <p className={s.headline}>{deal.headline}</p>

        {inDeal ? (
          <p className={s.inBand}>
            <CircleCheck size={15} strokeWidth={1.9} aria-hidden="true" />
            <span>
              {deal.status === 'closed' ? (
                investedAmount ? (
                  <>
                    You invested <b>{money(investedAmount)}</b>
                  </>
                ) : (
                  'You are invested in this deal'
                )
              ) : investedAmount ? (
                <>
                  <b>{money(investedAmount)}</b> in escrow
                </>
              ) : (
                'Your money is in escrow'
              )}
            </span>
            <small>{deal.status === 'closed' ? 'Closed' : 'Until the deal closes'}</small>
          </p>
        ) : null}

        <FundingProgress deal={deal} compact />

        <div className={`deal-actions ${s.cardActions}`}>
          <button
            type="button"
            className={`btn btn-quiet btn-sm ${s.peekButton}`}
            onClick={() => setPeek(true)}
            aria-label={`Quick look at ${deal.name}`}
          >
            <PanelRightOpen size={14} strokeWidth={1.7} aria-hidden="true" />
            Quick look
          </button>
          {primary}
        </div>
      </div>

      <DealPeek
        deal={deal}
        resume={resume}
        stage={stage}
        open={peek}
        onClose={() => setPeek(false)}
      />
    </div>
  );
}
