'use client';

/**
 * One Radar company, with the vote attached.
 *
 * Client island because the whole point is that voting feels instant:
 * pick a level, press once, the card settles into its voted state and
 * the tally moves. No navigation, no reload.
 *
 * The server is the authority on every rule enforced here. The minimum,
 * the maximum and the slug are all re-checked in
 * app/api/radar/interest/route.ts. What this component does is spare
 * the member a round trip to be told something obvious.
 *
 * WHAT THE MEMBER READS IS A VOTE. The code keeps the `indicate`
 * identifiers, `/api/radar/interest` and `RadarInterest`, the same way
 * Spot keeps its `SpotBot*` names. Copy says vote. Code says interest.
 *
 * THE FACE IS THE VOTE. A board of twenty is scanned, so the card
 * carries who it is (the company's own mark, and a faint wash of its
 * colour so no two neighbours look alike), how loud the demand is, and
 * the vote. A voted card says so in words, with the amount, on a gold
 * band across its foot: a member scanning the board for their own names
 * finds them without reading a figure.
 *
 * DETAILS is a labelled button, not a bare info glyph, and it opens the
 * right-hand panel (components/SidePanel, components/radar/RadarDetail)
 * where the vote is also on hand.
 */
import { CircleCheck, PanelRightOpen, Pencil, Users, Vote } from 'lucide-react';
import { useState } from 'react';

import AssetClassIcon from '@/components/AssetClassIcon';
import SidePanel from '@/components/SidePanel';
import { useToast } from '@/components/Toast';
import { brandOf } from '@/lib/brand';
import { announceNeedsYouChanged } from '@/lib/needs-you';
import { api, ApiError } from '@/lib/client/api';
import { compact, money } from '@/lib/format';
import type { RadarCompanyView } from '@/lib/terminal/radar';

import RadarDetail, { RadarDetailHeader } from './RadarDetail';
import VoteScale from './VoteScale';
import s from './Radar.module.css';

/** Initials for the monogram: "Anduril Industries" becomes AI. */
function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function RadarCard({
  company,
  demandShare,
  rank,
  total,
  onVoted,
  onWithdrawn,
}: {
  company: RadarCompanyView;
  /** This company's share of the loudest demand on the board, 0 to 1. */
  demandShare: number;
  /** Place on the board by dollars voted, 1-indexed. */
  rank: number;
  total: number;
  /** Lets the page count this vote in Yours without a reload. */
  onVoted?: (slug: string) => void;
  /** The member took their vote back. */
  onWithdrawn?: (slug: string) => void;
}) {
  const toast = useToast();

  const [view, setView] = useState(company);
  const [editing, setEditing] = useState(false);
  /* The scale is behind a button. Twenty open scales on one board is a
     wall of sliders; one press opens the one you mean to move. */
  const [voting, setVoting] = useState(false);
  const [panel, setPanel] = useState(false);
  const [panelVoting, setPanelVoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voted = view.yourAmount !== null;
  const brand = brandOf(view.slug);

  async function vote(amount: number) {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const next = await api.indicateRadarInterest(view.slug, amount);
      announceNeedsYouChanged();
      setView(next);
      onVoted?.(next.slug);
      setEditing(false);
      setVoting(false);
      setPanelVoting(false);
      toast(
        <>
          Vote counted. <b>{view.name}</b> moves on the board.
        </>,
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not save that. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api.withdrawRadarInterest(view.slug);
      announceNeedsYouChanged();
      setView(next);
      onWithdrawn?.(next.slug);
      setEditing(false);
      setVoting(false);
      setPanelVoting(false);
      toast(
        <>
          Vote removed. <b>{view.name}</b> no longer counts yours.
        </>,
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Could not remove that. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  const plate = view.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={s.logo} src={view.logoUrl} alt="" aria-hidden="true" />
  ) : (
    <span className={s.monogram} aria-hidden="true">
      {monogram(view.name)}
    </span>
  );

  const cancel = () => {
    setEditing(false);
    setVoting(false);
    setPanelVoting(false);
    setError(null);
  };

  const panelVote = panelVoting ? (
    <VoteScale
      company={view.name}
      current={view.yourAmount}
      busy={busy}
      error={error}
      onVote={vote}
      onCancel={cancel}
          onRemove={remove}
    />
  ) : voted ? (
    <div className={s.votedBand}>
      <CircleCheck size={16} strokeWidth={1.8} aria-hidden="true" />
      <span className={s.votedText}>
        You voted <b>{money(view.yourAmount ?? 0)}</b>
      </span>
      <button type="button" className={s.votedEdit} onClick={() => setPanelVoting(true)}>
        Change
      </button>
    </div>
  ) : (
    <button
      type="button"
      className={`btn btn-primary btn-sm btn-block ${s.voteButton}`}
      onClick={() => setPanelVoting(true)}
    >
      <Vote size={15} strokeWidth={1.6} aria-hidden="true" />
      Vote on {view.name}
    </button>
  );

  return (
    <article
      className={s.card}
      data-indicated={voted}
      style={brand ? { ['--brand' as string]: brand.hue } : undefined}
    >
      {/* One masked texture per card, per the V18 card spec, and the
          company's own colour as a faint wash. Decorative. */}
      <span className={s.texture} aria-hidden="true" />
      <span className={s.wash} aria-hidden="true" />

      <header className={s.head}>
        <div className={s.plate}>{plate}</div>
        <div className={s.identity}>
          <h3 className={s.name}>{view.name}</h3>
          <button
            type="button"
            className={s.detailsButton}
            onClick={() => setPanel(true)}
            aria-label={`Details on ${view.name}`}
          >
            <PanelRightOpen size={13} strokeWidth={1.7} aria-hidden="true" />
            Details
          </button>
        </div>
      </header>

      <p className={s.about}>{view.description}</p>

      {/* Demand is the headline. It is the whole reason the board
          exists, and it is ranked on it. */}
      <div className={s.demand}>
        <div className={s.demandTop}>
          <span className={s.demandValue}>{compact(view.interestDollars)}</span>
          <span className={s.demandMeta}>
            <AssetClassIcon assetClass={view.assetClass} size={12} />
            <span
              className={s.demandWho}
              title={`${view.interestInvestors.toLocaleString('en-US')} members voted`}
            >
              <Users size={13} strokeWidth={1.6} aria-hidden="true" />
              {view.interestInvestors.toLocaleString('en-US')}
              <span className="sr-only"> members voted</span>
            </span>
          </span>
        </div>
        <div className={s.demandBar}>
          <div
            className={s.demandFill}
            style={{ width: `${Math.max(6, Math.round(demandShare * 100))}%` }}
          />
        </div>
      </div>

      {voted && !editing ? (
        <div className={s.votedBand}>
          <CircleCheck size={16} strokeWidth={1.8} aria-hidden="true" />
          <span className={s.votedText}>
            You voted <b>{compact(view.yourAmount ?? 0)}</b>
          </span>
          <button
            type="button"
            className={s.votedEdit}
            onClick={() => setEditing(true)}
            aria-label="Change your vote"
            title="Change your vote"
          >
            <Pencil size={13} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      ) : voting || editing ? (
        <VoteScale
          company={view.name}
          current={view.yourAmount}
          busy={busy}
          error={error}
          onVote={vote}
          onCancel={cancel}
          onRemove={remove}
        />
      ) : (
        <button
          type="button"
          className={`btn btn-ghost btn-sm btn-block ${s.voteButton}`}
          onClick={() => setVoting(true)}
        >
          <Vote size={15} strokeWidth={1.6} aria-hidden="true" />
          Vote
        </button>
      )}

      <SidePanel
        open={panel}
        onClose={() => {
          setPanel(false);
          setPanelVoting(false);
        }}
        label={`${view.name}: details`}
        header={<RadarDetailHeader company={view} plate={plate} vote={panelVote} />}
      >
        <RadarDetail
          company={view}
          rank={rank}
          total={total}
          demandShare={demandShare}
          dealHref={view.dealId ? `/deals/${view.dealId}` : undefined}
        />
      </SidePanel>
    </article>
  );
}
