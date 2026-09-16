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
 * Spot keeps its `SpotBot*` names: renaming the API surface buys
 * nothing a member can see. Copy says vote. Code says interest.
 *
 * THE FACE IS THE VOTE. A board of twenty is scanned, not read, so the
 * card carries only what a member needs in order to vote: who it is,
 * what class of deal it would be, how loud the demand already is, and
 * the button. Everything else, the description, the three prices, who
 * led the last round, the two cases and the news, lives in the detail
 * dialog, which opens over the page and never moves it.
 *
 * The dialog is portalled to <body>. Inside the card it sat under the
 * card's own overflow clip and hover transform, and opening it scrolled
 * the page to the top. In the top layer from <body> it does neither.
 */
import { ArrowUpRight, X } from 'lucide-react';
import { useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import BackerMark from '@/components/BackerMark';
import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';
import { EMPTY, compact, money } from '@/lib/format';
import {
  ASSET_CLASSES,
  INDUSTRIES,
  priceFromCents,
  valuationShort,
  type RadarCompanyView,
} from '@/lib/terminal/radar';

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
  /** This company's share of the loudest demand on the board, 0 to 1. */
  demandShare,
}: {
  company: RadarCompanyView;
  demandShare: number;
}) {
  const toast = useToast();

  const [view, setView] = useState(company);
  const [editing, setEditing] = useState(false);
  /* The scale is behind a button. Twenty open scales on one board is a
     wall of sliders; one press opens the one you mean to move. */
  const [voting, setVoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* True once on the client, false in the server render, so the portal
     target exists before it is used. */
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const dialog = useRef<HTMLDialogElement>(null);

  const voted = view.yourAmount !== null && !editing;
  const research = view.research;
  const hasNews = research.news.length > 0;

  async function vote(amount: number) {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const next = await api.indicateRadarInterest(view.slug, amount);
      setView(next);
      setEditing(false);
      setVoting(false);
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

  const plate = view.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={s.logo} src={view.logoUrl} alt="" aria-hidden="true" />
  ) : (
    <span className={s.monogram} aria-hidden="true">
      {monogram(view.name)}
    </span>
  );

  const openDetail = () => {
    const el = dialog.current;
    if (!el || el.open) return;
    el.showModal();
  };

  const detail = (
    <dialog
      ref={dialog}
      className={s.researchDialog}
      aria-label={`${view.name}: the detail`}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className={s.researchFrame}>
        <header className={s.researchHead}>
          <div className={s.plateLg}>{plate}</div>
          <div className={s.researchIdentity}>
            <h3 className={s.researchName}>{view.name}</h3>
            <div className={s.researchTaxo}>
              <span className={s.sector}>{ASSET_CLASSES[view.assetClass].label}</span>
              <span className={s.industry}>{INDUSTRIES[view.industry]}</span>
            </div>
            {view.backing ? <BackerMark backing={view.backing} className={s.researchBacking} /> : null}
          </div>
          <button
            type="button"
            className={s.researchClose}
            onClick={() => dialog.current?.close()}
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className={s.researchBody}>
          <p className={s.researchLede}>{view.description}</p>

          {/* The three reference prices as tiles. The one that is
              AltSpot's rather than the market's is marked by colour. */}
          <div className={s.figures}>
            <div className={s.figure}>
              <span className={s.figureKey}>Market average</span>
              <span className={s.figureValue}>{priceFromCents(view.marketAverageCents)}</span>
              <span className={s.figureNote}>{view.marketAverageAsOf}</span>
            </div>
            <div className={s.figure}>
              <span className={s.figureKey}>Last round</span>
              <span className={s.figureValue}>{valuationShort(view.lastRoundValuation)}</span>
              <span className={s.figureNote}>{view.lastRoundLabel}</span>
            </div>
            <div className={`${s.figure} ${s.figureOurs}`}>
              <span className={s.figureKey}>Our target</span>
              <span className={s.figureValue}>
                {priceFromCents(view.targetLowCents)} – {priceFromCents(view.targetHighCents)}
              </span>
              <span className={s.figureNote}>Per share, if we source it</span>
            </div>
          </div>

          <section className={s.block}>
            <div className={s.blockKey}>What it does</div>
            <p className={s.prose}>{research.business}</p>
          </section>

          <div className={s.cases}>
            <section className={`${s.block} ${s.case}`}>
              <div className={s.blockKey}>The bull case</div>
              <ul className={`${s.points} ${s.bull}`}>
                {research.bull.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>

            <section className={`${s.block} ${s.case}`}>
              <div className={s.blockKey}>The bear case</div>
              <ul className={`${s.points} ${s.bear}`}>
                {research.bear.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className={s.block}>
            <div className={s.blockKey}>Why we are tracking it</div>
            <p className={s.prose}>{research.watching}</p>
          </section>

          {hasNews ? (
            <section className={s.block}>
              <div className={s.blockKey}>Latest news</div>
              <ul className={s.news}>
                {research.news.map((item) => (
                  <li key={item.url}>
                    <a
                      className={s.newsLink}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <span className={s.newsTitle}>{item.title}</span>
                      <span className={s.newsMeta}>
                        {item.publisher} · {item.date || EMPTY}
                        <ArrowUpRight
                          className={s.out}
                          size={10}
                          strokeWidth={1.6}
                          aria-hidden="true"
                        />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              {research.newsroomUrl ? (
                <a
                  className={s.newsroom}
                  href={research.newsroomUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  All news from {view.name}
                </a>
              ) : null}
            </section>
          ) : null}

          <p className={s.caveat}>
            AltSpot holds no position in {view.name} and is not offering it. Every figure
            here is illustrative. The two cases are our plain-language reading of public
            information, not research and not a recommendation.
          </p>
        </div>
      </div>
    </dialog>
  );

  return (
    <article className={s.card} data-indicated={view.yourAmount !== null}>
      {/* One masked texture per card, per the V18 card spec. Decorative
          and behind everything. */}
      <span className={s.texture} aria-hidden="true" />

      <header className={s.head}>
        <div className={s.plate}>{plate}</div>
        <div className={s.identity}>
          <h3 className={s.name}>{view.name}</h3>
          <span className={s.sector}>{ASSET_CLASSES[view.assetClass].label}</span>
        </div>
      </header>

      {/* Demand is the headline. It is the whole reason the board
          exists, and it is ranked on it. */}
      <div className={s.demand}>
        <div className={s.demandTop}>
          <span className={s.demandValue}>{compact(view.interestDollars)}</span>
          <span className={s.demandWho}>
            {view.interestInvestors.toLocaleString('en-US')} voted
          </span>
        </div>
        <div className={s.demandBar}>
          <div
            className={s.demandFill}
            style={{ width: `${Math.max(6, Math.round(demandShare * 100))}%` }}
          />
        </div>
      </div>

      {voted ? (
        <div className={s.done}>
          <span className={s.doneText}>
            You voted <b>{money(view.yourAmount ?? 0)}</b>
          </span>
          <button type="button" className={s.change} onClick={() => setEditing(true)}>
            Change
          </button>
        </div>
      ) : voting || editing ? (
        <VoteScale
          company={view.name}
          current={view.yourAmount}
          busy={busy}
          error={error}
          onVote={vote}
          onCancel={() => {
            setEditing(false);
            setVoting(false);
            setError(null);
          }}
        />
      ) : (
        <button
          type="button"
          className="btn btn-vote btn-sm btn-block"
          onClick={() => setVoting(true)}
        >
          Cast your vote
        </button>
      )}

      <button type="button" className={s.disclose} onClick={openDetail}>
        <span className={s.discloseLabel}>Details</span>
        <ArrowUpRight size={13} strokeWidth={1.6} aria-hidden="true" />
      </button>

      {mounted ? createPortal(detail, document.body) : null}
    </article>
  );
}
