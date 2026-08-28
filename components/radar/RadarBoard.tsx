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

import {
  ASSET_CLASSES,
  INDUSTRIES,
  type AssetClass,
  type Industry,
  type RadarCompanyView,
} from '@/lib/terminal/radar';

import RadarCard from './RadarCard';
import RadarFilters, { type RadarFilterState } from './RadarFilters';
import s from './Radar.module.css';

/** Taxonomy order, so the controls do not reshuffle as names change. */
const CLASS_ORDER = Object.keys(ASSET_CLASSES) as AssetClass[];
const INDUSTRY_ORDER = Object.keys(INDUSTRIES) as Industry[];

export default function RadarBoard({
  companies,
}: {
  companies: RadarCompanyView[];
}) {
  const [filters, setFilters] = useState<RadarFilterState>({
    assetClass: null,
    industry: null,
  });

  const ranked = useMemo(
    () => [...companies].sort((a, b) => b.interestDollars - a.interestDollars),
    [companies],
  );

  /* Which values are actually on the board. Built from the data rather
     than the type, so a filter can never resolve to an empty board. */
  const present = useMemo(() => {
    const classes = new Set(ranked.map((c) => c.assetClass));
    const industries = new Set(ranked.map((c) => c.industry));
    return {
      classes: CLASS_ORDER.filter((k) => classes.has(k)),
      industries: INDUSTRY_ORDER.filter((k) => industries.has(k)),
    };
  }, [ranked]);

  const shown = useMemo(
    () =>
      ranked.filter(
        (c) =>
          (filters.assetClass === null || c.assetClass === filters.assetClass) &&
          (filters.industry === null || c.industry === filters.industry),
      ),
    [ranked, filters],
  );

  if (companies.length === 0) return null;

  /* Rank is the company's place on the whole board, not its place in the
     filtered view. A name is the third loudest whether or not you are
     looking at every name. */
  const rankOf = new Map(ranked.map((c, i) => [c.slug, i + 1]));
  const loudest = ranked[0].interestDollars || 1;

  return (
    <>
      <RadarFilters
        classes={present.classes}
        industries={present.industries}
        value={filters}
        onChange={setFilters}
        showing={shown.length}
        total={ranked.length}
      />

      <div className={s.board}>
        {shown.map((company) => (
          <RadarCard
            key={company.slug}
            company={company}
            demandShare={company.interestDollars / loudest}
            rank={rankOf.get(company.slug) ?? 1}
          />
        ))}
      </div>

      <div className={s.disclosure}>
        <b>What Radar is, and what it is not</b>
        <p>
          Radar is a demand signal. AltSpot does not hold a position in any
          company listed here, is not raising for any of them, and is not
          offering any security on this page. Indicating interest is not a
          commitment, reserves nothing, and never moves money. Company names and
          descriptions are public information. Every figure shown, including the
          market average, the last-round reference and the AltSpot target range,
          is illustrative demo data rather than market data, and no figure here
          is a forecast or a claim about any outcome.
        </p>
        <p>
          The research section on each card is written by AltSpot. What the
          company does, the bull case, the bear case and why we are tracking it
          are our plain-language reading of public information. They are not
          investment research, not a recommendation, not a forecast, and not
          advice about whether any company is worth owning. They are summaries,
          they are incomplete by design, and they can be wrong or go out of
          date. The news links go to the companies&rsquo; own newsrooms. Those
          publishers wrote that material, not us, and we do not endorse it. Read
          the primary source and reach your own view.
        </p>
      </div>
    </>
  );
}
