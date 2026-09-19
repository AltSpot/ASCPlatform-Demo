'use client';

/**
 * The Radar board.
 *
 * Ranked by how much money the membership has put behind each name, so
 * the answer to "what should we buy next" is the first thing read. The
 * demand bar is relative to the loudest name on the board, which is the
 * only comparison that means anything here.
 *
 * A client island only because the filters hold state. The data still
 * arrives from the server fully formed; nothing here fetches.
 */
import { useMemo, useState } from 'react';

import { ASSET_CLASS_KEYS } from '@/lib/taxonomy';
import {
  INDUSTRIES,
  type AssetClass,
  type Industry,
  type RadarCompanyView,
} from '@/lib/terminal/radar';

import RadarCard from './RadarCard';
import TaxonomyFilters, {
  type TaxonomyFilterState,
} from '@/components/filters/TaxonomyFilters';
import { RADAR_SORT_LABEL, rankRadar, type RadarSort } from '@/lib/radar-rank';

import s from './Radar.module.css';

/** Taxonomy order, so the controls do not reshuffle as names change. */
const INDUSTRY_ORDER = Object.keys(INDUSTRIES) as Industry[];

export default function RadarBoard({
  companies,
  filter,
  mineOnly = false,
  voted,
  onVoted,
  daySeed = 0,
}: {
  /** The day, from the server, which turns the Featured order's quiet seats. */
  daySeed?: number;
  companies: RadarCompanyView[];
  /** Show only the names the member voted for. */
  mineOnly?: boolean;
  /** Slugs the member has voted for, kept live by the page. */
  voted?: string[];
  onVoted?: (slug: string) => void;
  /** See DealShelf: the marketplace owns one row for both lanes. */
  filter?: TaxonomyFilterState;
}) {
  const [own, setOwn] = useState<TaxonomyFilterState>({
    assetClass: null,
    industry: null,
  });
  const filters = filter ?? own;
  const [legalOpen, setLegalOpen] = useState(false);

  /* The order is lib/radar-rank.ts: Featured deals one proven name, one
     moving name and one quiet name in turn, with the quiet seats rotating
     by the day, so no name is stuck at the bottom. The other sorts are the
     pools on their own. */
  const [sort, setSort] = useState<RadarSort>('featured');
  const ranked = useMemo(
    () => rankRadar(companies, sort, daySeed),
    [companies, sort, daySeed],
  );

  /* Class counts cover the whole taxonomy, including the classes with
     nothing on the board: the filter row states what AltSpot tracks,
     and "none yet" is a real answer to give a member screening for it.
     Industries are built from the data, because a select with twelve
     options that mostly resolve to nothing is a worse control than a
     short one. */
  const counts = useMemo(() => {
    const tally = Object.fromEntries(
      ASSET_CLASS_KEYS.map((key) => [key, 0]),
    ) as Record<AssetClass, number>;
    for (const company of ranked) tally[company.assetClass] += 1;
    return tally;
  }, [ranked]);

  const industriesPresent = useMemo(() => {
    const present = new Set(ranked.map((c) => c.industry));
    return INDUSTRY_ORDER.filter((k) => present.has(k));
  }, [ranked]);

  const industryCounts = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const company of ranked) {
      tally[company.industry] = (tally[company.industry] ?? 0) + 1;
    }
    return tally;
  }, [ranked]);

  const shown = useMemo(
    () =>
      ranked.filter(
        (c) =>
          (filters.assetClass === null || c.assetClass === filters.assetClass) &&
          (filters.industry === null || c.industry === filters.industry) &&
          (!mineOnly || (voted ? voted.includes(c.slug) : c.yourAmount !== null)),
      ),
    [ranked, filters, mineOnly, voted],
  );

  if (companies.length === 0) return null;

  const loudest = Math.max(1, ...companies.map((c) => c.interestDollars));

  return (
    <>
      {filter ? null : (
        <TaxonomyFilters
          counts={counts}
          industries={industriesPresent}
          industryCounts={industryCounts}
          value={own}
          onChange={setOwn}
        />
      )}

      {mineOnly && shown.length === 0 ? (
        <p className={s.mineEmpty}>No votes yet. Vote on any name to follow it.</p>
      ) : null}

      <div className={s.sortRow} role="group" aria-label="Order the Radar">
        <span className={s.sortKey}>Order</span>
        {(Object.keys(RADAR_SORT_LABEL) as RadarSort[]).map((key) => (
          <button
            key={key}
            type="button"
            className={s.sortPill}
            aria-pressed={sort === key}
            onClick={() => setSort(key)}
            title={
              key === 'featured'
                ? 'One leading name, one rising name and one you might have missed, in turn. The quiet names rotate daily.'
                : key === 'top'
                  ? 'By dollars voted'
                  : key === 'rising'
                    ? 'By the share of votes cast in the last two weeks'
                    : 'Newest on the Radar first'
            }
          >
            {RADAR_SORT_LABEL[key]}
          </button>
        ))}
      </div>

      <div className={s.board}>
        {shown.map((company) => (
          <RadarCard
            key={company.slug}
            company={company}
            demandShare={company.interestDollars / loudest}
            rank={ranked.indexOf(company) + 1}
            total={ranked.length}
            onVoted={onVoted}
          />
        ))}
      </div>

      {/* The line that has to be read stays on the page. The full text
          stays one tap away rather than four paragraphs under every
          board, which is how a disclosure gets scrolled past. */}
      <div className={s.disclosure}>
        <p className={s.disclosureLead}>
          Voting is not a commitment. It reserves nothing, moves no money, and
          nothing on this page is being offered.
        </p>

        <button
          type="button"
          className={s.disclosureToggle}
          aria-expanded={legalOpen}
          aria-controls="radar-disclosure"
          onClick={() => setLegalOpen((was) => !was)}
        >
          {legalOpen ? 'Hide the full disclosure' : 'Read the full disclosure'}
        </button>

        <div id="radar-disclosure" hidden={!legalOpen}>
          <p>
            Radar is a demand signal. AltSpot does not hold a position in any
            company listed here, is not raising for any of them, and is not
            offering any security on this page. A vote is not a commitment,
            reserves nothing, and never moves money. Company names and
            descriptions are public information. Every figure shown, including
            the market average, the last-round reference and the AltSpot target
            range, is illustrative demo data rather than market data, and no
            figure here is a forecast or a claim about any outcome.
          </p>
          <p>
            The research section on each card is written by AltSpot. What the
            company does, the bull case, the bear case and why we are tracking
            it are our plain-language reading of public information. They are
            not investment research, not a recommendation, not a forecast, and
            not advice about whether any company is worth owning. They are
            summaries, they are incomplete by design, and they can be wrong or
            go out of date. The news links go to the companies&rsquo; own
            newsrooms. Those publishers wrote that material, not us, and we do
            not endorse it. Read the primary source and reach your own view.
          </p>
        </div>
      </div>
    </>
  );
}
