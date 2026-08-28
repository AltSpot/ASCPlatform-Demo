'use client';

/**
 * One Radar company, with the ask attached.
 *
 * Client island because the whole point is that indicating interest
 * feels instant: type an amount, press once, the card settles into its
 * confirmed state and the tally moves. No navigation, no reload.
 *
 * The server is the authority on every rule enforced here. The minimum,
 * the maximum and the slug are all re-checked in
 * app/api/radar/interest/route.ts. What this component does is spare
 * the member a round trip to be told something obvious.
 *
 * Reading order is deliberate. Demand is the headline, because Radar
 * exists to answer "what should we buy next" and demand is the answer.
 * The reference prices come second, and AltSpot's own target range gets
 * its own panel, because it is the one figure here that is ours rather
 * than the market's.
 */
import { Building2, Layers, Sprout, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId, useState } from 'react';

import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';
import { EMPTY, money } from '@/lib/format';
import {
  ASSET_CLASSES,
  INDUSTRIES,
  MAX_INDICATION,
  priceFromCents,
  valuationShort,
  type AssetClass,
  type RadarCompanyView,
} from '@/lib/terminal/radar';

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

/** $9.6M, $412K, $9,640. Compact enough for a one-line tally. */
function compactDollars(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions >= 100 ? Math.round(millions) : millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 10_000) return `$${Math.round(value / 1000)}K`;
  return money(value);
}

/**
 * Asset class carries the mark and the tint. The two cool tints are the
 * V18 category set, which exists for exactly this: taxonomy, never
 * chrome. Matching lib/terminal/radar.ts, which is the source.
 */
const CLASS_ICON: Record<AssetClass, LucideIcon> = {
  venture: Sprout,
  growth: TrendingUp,
  secondary: Layers,
  'real-asset': Building2,
};

const CLASS_TINT: Record<AssetClass, string> = {
  venture: s.tintGold,
  growth: s.tintSignal,
  secondary: s.tintSecondary,
  'real-asset': s.tintRealasset,
};

export default function RadarCard({
  company,
  /** This company's share of the loudest demand on the board, 0 to 1. */
  demandShare,
  /** Position on the board, 1-indexed. The board is ranked by demand. */
  rank,
}: {
  company: RadarCompanyView;
  demandShare: number;
  rank: number;
}) {
  const toast = useToast();

  const [view, setView] = useState(company);
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Folded by default. The board has to scan in one screen, which is
     the entire reason the cards are compact. */
  const [open, setOpen] = useState(false);
  const panelId = `${useId()}-research`;

  const confirmed = view.yourAmount !== null && !editing;
  const research = view.research;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const parsed = Math.round(Number(amount.replace(/[^0-9.]/g, '')));

    if (!Number.isFinite(parsed) || parsed < view.minIndication) {
      setError(`Minimum ${money(view.minIndication)}`);
      return;
    }
    if (parsed > MAX_INDICATION) {
      setError(`Maximum ${money(MAX_INDICATION)}`);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const next = await api.indicateRadarInterest(view.slug, parsed);
      setView(next);
      setEditing(false);
      setAmount('');
      toast(
        <>
          Noted. <b>{view.name}</b> now shows your interest.
        </>,
      );
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : 'Could not save that. Try again.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={s.card} data-indicated={view.yourAmount !== null}>
      {/* One masked texture per card, per the V18 card spec. Decorative
          and behind everything. */}
      <span className={s.texture} aria-hidden="true" />

      <header className={s.head}>
        <div className={s.plate}>
          {view.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={s.logo} src={view.logoUrl} alt="" aria-hidden="true" />
          ) : (
            <span className={s.monogram} aria-hidden="true">
              {monogram(view.name)}
            </span>
          )}
        </div>

        <div className={s.identity}>
          <h3 className={s.name}>{view.name}</h3>
          <div className={s.taxo}>
            <span className={`${s.sector} ${CLASS_TINT[view.assetClass]}`}>
              {(() => {
                const Icon = CLASS_ICON[view.assetClass];
                return <Icon size={11} strokeWidth={1.6} aria-hidden="true" />;
              })()}
              {ASSET_CLASSES[view.assetClass].label}
            </span>
            <span className={s.industry}>{INDUSTRIES[view.industry]}</span>
          </div>
        </div>

        <span className={s.rank} aria-label={`Rank ${rank} by demand`}>
          {String(rank).padStart(2, '0')}
        </span>
      </header>

      <p className={s.about}>{view.description}</p>

      {/* Demand is the headline. It is the whole reason the board
          exists, and it is ranked on it. */}
      <div className={s.demand}>
        <div className={s.demandTop}>
          <span className={s.demandValue}>{compactDollars(view.interestDollars)}</span>
          <span className={s.demandWho}>
            {view.interestInvestors.toLocaleString('en-US')} members
          </span>
        </div>
        <div className={s.demandBar}>
          <div
            className={s.demandFill}
            style={{ width: `${Math.max(6, Math.round(demandShare * 100))}%` }}
          />
        </div>
        <span className={s.demandKey}>Indicated so far</span>
      </div>

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
      </div>

      {/* The one figure on this card that is AltSpot's rather than the
          market's, so it gets its own surface. */}
      <div className={s.target}>
        <span className={s.targetKey}>AltSpot target</span>
        <span className={s.targetValue}>
          {priceFromCents(view.targetLowCents)} to {priceFromCents(view.targetHighCents)}
        </span>
        <span className={s.targetNote}>Per share, if we source it</span>
      </div>

      <div className={s.research}>
        <button
          type="button"
          id={`${panelId}-toggle`}
          className={s.disclose}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((was) => !was)}
        >
          <span className={s.discloseLabel}>
            {open ? 'Hide the research' : 'Read the research'}
          </span>
          <svg
            className={s.chev}
            viewBox="0 0 12 12"
            width="12"
            height="12"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Kept in the DOM so the fold can animate. `visibility: hidden`
            in the closed state is what keeps the links out of the tab
            order and out of the accessibility tree. */}
        <div
          id={panelId}
          className={s.panel}
          data-open={open}
          role="region"
          aria-labelledby={`${panelId}-toggle`}
        >
          <div className={s.panelInner}>
            <div className={s.panelBody}>
              <section className={s.block}>
                <div className={s.blockKey}>What it does</div>
                <p className={s.prose}>{research.business}</p>
              </section>

              <section className={s.block}>
                <div className={s.blockKey}>The bull case</div>
                <ul className={`${s.points} ${s.bull}`}>
                  {research.bull.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>

              <section className={s.block}>
                <div className={s.blockKey}>The bear case</div>
                <ul className={`${s.points} ${s.bear}`}>
                  {research.bear.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </section>

              <section className={s.block}>
                <div className={s.blockKey}>Why we are tracking it</div>
                <p className={s.prose}>{research.watching}</p>
              </section>

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
                          <svg
                            className={s.out}
                            viewBox="0 0 12 12"
                            width="10"
                            height="10"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path
                              d="M4 8l4-4M4.5 3.6H8.4V7.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  className={s.newsroom}
                  href={research.newsroomUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  All news from {view.name}
                </a>
              </section>

              <p className={s.caveat}>
                AltSpot holds no position in {view.name} and is not offering it.
                The two cases above are our plain-language reading of public
                information, not research and not a recommendation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={s.ask}>
        {confirmed ? (
          <div className={s.done}>
            <span className={s.doneText}>
              You indicated <b>{money(view.yourAmount ?? 0)}</b>
            </span>
            <button
              type="button"
              className={s.change}
              onClick={() => {
                setAmount(String(view.yourAmount ?? ''));
                setEditing(true);
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className={s.askRow}>
              <div className={s.amountWrap}>
                <span className={s.currency}>$</span>
                <input
                  className={s.amount}
                  type="number"
                  inputMode="numeric"
                  min={view.minIndication}
                  max={MAX_INDICATION}
                  step={1000}
                  value={amount}
                  placeholder={String(view.minIndication)}
                  aria-label={`Amount you would put behind ${view.name}`}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>
              <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>
                {busy ? 'Saving' : view.yourAmount === null ? 'Indicate' : 'Update'}
              </button>
            </div>
            <div className={s.hint} data-error={error !== null}>
              {error ?? `Minimum ${money(view.minIndication)}. Not a commitment.`}
            </div>
          </form>
        )}
      </div>
    </article>
  );
}
