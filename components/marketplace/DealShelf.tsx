'use client';

/**
 * The shelf: every deal open for subscription right now.
 *
 * Each card carries the sector, the minimum, the close and how much of
 * the round is spoken for. AltSpot's own commitment is stored on the
 * deal but no longer printed on it, by Tyler's direction (2026-09-14).
 * The card itself is components/marketplace/DealCard, shared with the
 * dashboard's "Open now" so a deal looks the same wherever it is
 * offered.
 *
 * The filters are the Radar board's, moved to components/filters and
 * pointed at the shelf. Two surfaces asking the same question of the
 * same two axes should not answer it with two different controls.
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';

import TaxonomyFilters, {
  type TaxonomyFilterState,
} from '@/components/filters/TaxonomyFilters';
import DealCard from '@/components/marketplace/DealCard';
import type { DealShelfItem, SubscriptionView } from '@/lib/domain';
import {
  ASSET_CLASS_KEYS,
  INDUSTRY_KEYS,
  isAssetClass,
  type AssetClass,
} from '@/lib/taxonomy';

import s from './Marketplace.module.css';

export default function DealShelf({
  deals,
  resumable,
  watched,
  fromRadar = [],
  filter,
  bridgeHref,
}: {
  deals: DealShelfItem[];
  /** Live subscriptions, so a card can offer the way back in. */
  resumable: SubscriptionView[];
  /** Deal ids on this investor's watchlist. */
  watched: string[];
  /** Deal ids the member voted for on the Radar before they opened. */
  fromRadar?: string[];
  /**
   * When the page owns the filter row (the marketplace, where one row
   * serves both lanes) the shelf takes its state from above and draws
   * no row of its own. Left out, the shelf is self-contained.
   */
  filter?: TaxonomyFilterState;
  /** Where the last card in the grid points: the way to the Radar. */
  bridgeHref?: string;
}) {
  const [own, setOwn] = useState<TaxonomyFilterState>({
    assetClass: null,
    industry: null,
  });
  const filters = filter ?? own;

  const byDeal = useMemo(
    () => new Map(resumable.map((sub) => [sub.dealId, sub])),
    [resumable],
  );
  const saved = useMemo(() => new Set(watched), [watched]);
  const voted = useMemo(() => new Set(fromRadar), [fromRadar]);

  /* Counts cover the whole class taxonomy, including the classes with
     nothing open today: a member screening for real assets is entitled
     to be told none are open rather than left to wonder whether the
     filter is broken. Industries are built from what is on the shelf,
     because a menu of twelve that mostly resolve to nothing is a worse
     control than a short one. */
  const counts = useMemo(() => {
    const tally = Object.fromEntries(
      ASSET_CLASS_KEYS.map((key) => [key, 0]),
    ) as Record<AssetClass, number>;
    for (const deal of deals) {
      if (isAssetClass(deal.assetClass)) tally[deal.assetClass] += 1;
    }
    return tally;
  }, [deals]);

  const industryCounts = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const deal of deals) {
      if (deal.industry) tally[deal.industry] = (tally[deal.industry] ?? 0) + 1;
    }
    return tally;
  }, [deals]);

  const industries = useMemo(() => {
    const present = new Set(deals.map((deal) => deal.industry).filter(Boolean));
    return INDUSTRY_KEYS.filter((key) => present.has(key));
  }, [deals]);

  const shown = useMemo(
    () =>
      deals.filter(
        (deal) =>
          (filters.assetClass === null || deal.assetClass === filters.assetClass) &&
          (filters.industry === null || deal.industry === filters.industry),
      ),
    [deals, filters],
  );

  return (
    <>
      {filter ? null : (
        <TaxonomyFilters
          counts={counts}
          industries={industries}
          industryCounts={industryCounts}
          value={own}
          onChange={setOwn}
        />
      )}

      <div className="deal-grid">
        {shown.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            resume={byDeal.get(deal.id)}
            watched={saved.has(deal.id)}
            fromRadar={voted.has(deal.id)}
          />
        ))}

        {/* The bridge. The shelf and the Radar are one pipeline, and
            the last card on the shelf is where a member who did not
            find what they wanted is standing. It says what the next
            lane is for in the one sentence that matters. */}
        {bridgeHref ? (
          <Link className={s.bridge} href={bridgeHref}>
            <span className="eyebrow muted">Not here yet?</span>
            <span className={s.bridgeTitle}>Vote for what you want next.</span>
            <span className={s.bridgeNote}>
              Enough votes and AltSpot goes and sources it. Votes move no money.
            </span>
            <span className={s.bridgeArrow} aria-hidden="true">
              ↓
            </span>
          </Link>
        ) : null}
      </div>

      {/* The sentence that has to be read stays on the page; the rest
          folds, the same treatment the Radar board gives its disclosure.
          A `details` element rather than component state, because this
          renders on the server and the browser already knows how to open
          a disclosure. */}
      <details className={s.legal}>
        <summary className={s.legalLead}>
          Private investments involve substantial risk, including possible loss of
          the entire amount invested.
        </summary>
        <p>
          These deals are available only to verified accredited investors.
          Participation is subject to eligibility, documentation, and final
          acceptance. Demo environment. Deal terms, prices and allocations are
          illustrative and do not represent actual offerings.
        </p>
      </details>
    </>
  );
}
