'use client';

/**
 * A Radar company, in the side panel. Built to be scanned, not read.
 *
 * Every block answers one question with a figure or a picture first and
 * as few words as will carry it:
 *
 *   How loud is it?      demand in dollars, members, rank, and a bar
 *   Where is it?         a secondary: the price strip, target band and
 *                        market; a primary: the round picture, last round,
 *                        valuation and the round we would source into
 *   What is it?          the one-line description
 *   Why, and why not?    the first sentence of each case, as two lists
 *   Why is it here?      one line
 *
 * The vote sits at the top, in the header, so the thing the panel is for
 * never scrolls away. The research paragraphs that used to open the old
 * dialog are cut to their first sentence: the rest of each sentence was
 * support for a point already made.
 */
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  Radar as RadarIcon,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import AssetClassIcon from '@/components/AssetClassIcon';
import BackerMark from '@/components/BackerMark';
import { compact } from '@/lib/format';
import {
  ASSET_CLASSES,
  INDUSTRIES,
  nextRoundLabel,
  priceFromCents,
  valuationShort,
  type RadarCompanyView,
} from '@/lib/terminal/radar';

import s from './RadarDetail.module.css';

/** The first sentence of a point: the claim without its support. */
function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : text).trim();
}

export function RadarDetailHeader({
  company,
  plate,
  vote,
}: {
  company: RadarCompanyView;
  plate: ReactNode;
  /** The vote control or the member's vote. */
  vote: ReactNode;
}) {
  return (
    <div className={s.header}>
      <div className={s.identity}>
        <span className={s.plate}>{plate}</span>
        <div className={s.who}>
          <h2 className={s.name}>{company.name}</h2>
          <div className={s.taxo}>
            <span className={s.chip}>
              <AssetClassIcon assetClass={company.assetClass} size={11} />
              {ASSET_CLASSES[company.assetClass].label}
            </span>
            <span className={s.chip}>{INDUSTRIES[company.industry]}</span>
          </div>
        </div>
      </div>
      <div className={s.vote}>{vote}</div>
    </div>
  );
}

export default function RadarDetail({
  company,
  rank,
  total,
  demandShare,
  dealHref,
}: {
  company: RadarCompanyView;
  /** 1-indexed place on the board by dollars voted. */
  rank: number;
  total: number;
  demandShare: number;
  /** Set when the name is an open deal this member may see. */
  dealHref?: string;
}) {
  const research = company.research;

  /* The price strip's scale: a little air either side of every price. */
  const prices = [company.targetLowCents, company.targetHighCents, company.marketAverageCents];
  const lo = Math.min(...prices) * 0.9;
  const hi = Math.max(...prices) * 1.1;
  const at = (cents: number) => ((cents - lo) / (hi - lo)) * 100;

  return (
    <div className={s.detail}>
      {dealHref ? (
        <Link className={s.live} href={dealHref}>
          <span className="live-dot" aria-hidden="true" />
          <span className={s.liveText}>This name is open as a deal now</span>
          <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      ) : null}

      <p className={s.lede}>{company.description}</p>

      {/* How loud is it. */}
      <section className={s.block} aria-label="Demand">
        <div className={s.demandRow}>
          <div className={s.big}>
            <span className={s.bigValue}>{compact(company.interestDollars)}</span>
            <span className={s.bigKey}>voted</span>
          </div>
          <div className={s.small}>
            <span className={s.smallValue}>
              <Users size={14} strokeWidth={1.6} aria-hidden="true" />
              {company.interestInvestors.toLocaleString('en-US')}
            </span>
            <span className={s.bigKey}>members</span>
          </div>
          <div className={s.small}>
            <span className={s.smallValue}>
              #{rank}
              <span className={s.of}>of {total}</span>
            </span>
            <span className={s.bigKey}>on the board</span>
          </div>
        </div>
        <div className={s.meter} role="img" aria-label={`Demand ${Math.round(demandShare * 100)} percent of the loudest name`}>
          <span style={{ width: `${Math.max(4, Math.round(demandShare * 100))}%` }} />
        </div>
      </section>

      {/* Where is it. A SHARE PRICE IS A SECONDARY'S FACT (Tyler, 2026-09-21).
          A target band and a market price only mean something where there
          is a market: a block of existing shares changing hands. For a
          venture or growth name, which AltSpot would join in its next
          round, the picture is the ladder: last round, what it said the
          company was worth, and the round we would source into. */}
      {company.assetClass === 'secondary' ? (
      <section className={s.block} aria-label="Price picture">
        <div className={s.blockKey}>
          <Crosshair size={13} strokeWidth={1.7} aria-hidden="true" />
          Price per share
        </div>
        <div className={s.strip}>
          <span
            className={s.band}
            style={{
              left: `${at(company.targetLowCents)}%`,
              width: `${Math.max(2, at(company.targetHighCents) - at(company.targetLowCents))}%`,
            }}
          />
          <span className={s.marker} style={{ left: `${at(company.marketAverageCents)}%` }} />
        </div>
        <div className={s.legend}>
          <span className={s.legendItem}>
            <i className={s.swatchBand} aria-hidden="true" />
            Our target {priceFromCents(company.targetLowCents)} to{' '}
            {priceFromCents(company.targetHighCents)}
          </span>
          <span className={s.legendItem}>
            <i className={s.swatchMarker} aria-hidden="true" />
            Market {priceFromCents(company.marketAverageCents)}
          </span>
        </div>
        <div className={s.facts}>
          <span>
            <b>{company.lastRoundLabel}</b> last round
          </span>
          <span>
            <b>{valuationShort(company.lastRoundValuation)}</b> valuation
          </span>
          {company.backing ? <BackerMark backing={company.backing} className={s.backer} /> : null}
        </div>
      </section>
      ) : (
      <section className={s.block} aria-label="Round picture">
        <div className={s.blockKey}>
          <Crosshair size={13} strokeWidth={1.7} aria-hidden="true" />
          The round
        </div>
        <div className={s.roundRow}>
          <div className={s.roundCell}>
            <span className={s.roundValue}>{company.lastRoundLabel}</span>
            <span className={s.bigKey}>last round</span>
          </div>
          <div className={s.roundCell}>
            <span className={s.roundValue}>{valuationShort(company.lastRoundValuation)}</span>
            <span className={s.bigKey}>post-money, last round</span>
          </div>
          <div className={s.roundCell}>
            <span className={s.roundValue}>{nextRoundLabel(company.lastRoundLabel) ?? 'Next round'}</span>
            <span className={s.bigKey}>what we would source</span>
          </div>
        </div>
        <div className={s.facts}>
          <span>
            <b>{ASSET_CLASSES[company.assetClass]?.label ?? company.assetClass}</b>
            {' · '}
            {INDUSTRIES[company.industry] ?? company.industry}
          </span>
          {company.backing ? <BackerMark backing={company.backing} className={s.backer} /> : null}
        </div>
      </section>
      )}

      {/* Why, and why not. */}
      <section className={s.cases} aria-label="The two cases">
        <div className={s.case}>
          <div className={s.blockKey}>
            <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
            For
          </div>
          <ul className={`${s.points} ${s.bull}`}>
            {research.bull.map((point) => (
              <li key={point}>{firstSentence(point)}</li>
            ))}
          </ul>
        </div>
        <div className={s.case}>
          <div className={`${s.blockKey} ${s.bearKey}`}>
            <ArrowDownRight size={13} strokeWidth={1.8} aria-hidden="true" />
            Against
          </div>
          <ul className={`${s.points} ${s.bear}`}>
            {research.bear.map((point) => (
              <li key={point}>{firstSentence(point)}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why is it here. */}
      <p className={s.why}>
        <RadarIcon size={14} strokeWidth={1.7} aria-hidden="true" />
        {firstSentence(research.watching)}
      </p>

      <p className={s.caveat}>
        AltSpot holds no position in {company.name} and is not offering it. Every figure is
        illustrative. The two cases are our reading of public information, not a
        recommendation.
      </p>
    </div>
  );
}
