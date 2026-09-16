'use client';

/**
 * Filtering by taxonomy: asset class and industry.
 *
 * Shared by the Radar board and the deal shelf, which ask the same
 * question of the same two axes. It was written for Radar and moved
 * here when the shelf needed it.
 *
 * Two decisions worth stating.
 *
 * Only classes with something behind them show. The row used to carry
 * every class AltSpot transacts in, each with an icon, a count and its
 * own category colour, and a disabled zero for the empty ones: five
 * coloured pills announcing a taxonomy before the member had seen a
 * single deal. A filter is a way of narrowing what is already on the
 * page, and a chip that cannot narrow anything is chrome. The classes
 * that are present show as quiet neutral chips, one lit when chosen,
 * with nothing on them but the word.
 *
 * Industry is one menu rather than a second row of pills. Twelve pills
 * is a wall, it pushed the board below the fold, and on a phone it was
 * four lines of chrome before the first company. The menu itself lives
 * in IndustryMenu, which draws its own list rather than handing the
 * open state to the operating system.
 */
import { X } from 'lucide-react';

import { ASSET_CLASSES } from '@/lib/terminal/radar';
import { ASSET_CLASS_KEYS } from '@/lib/taxonomy';
import type { AssetClass, Industry } from '@/lib/terminal/radar';

import IndustryMenu from './IndustryMenu';
import s from './TaxonomyFilters.module.css';

export interface TaxonomyFilterState {
  assetClass: AssetClass | null;
  industry: Industry | null;
}

export default function TaxonomyFilters({
  counts,
  industries,
  industryCounts,
  value,
  onChange,
  inline = false,
}: {
  /** Set inside another bar, so no margin of its own. */
  inline?: boolean;
  /** How many names sit in each class. Zero is a legitimate answer. */
  counts: Record<AssetClass, number>;
  /** Industries present on the board, in taxonomy order. */
  industries: Industry[];
  /** How many names sit in each industry. */
  industryCounts: Record<string, number>;
  value: TaxonomyFilterState;
  onChange: (next: TaxonomyFilterState) => void;
}) {
  const filtered = value.assetClass !== null || value.industry !== null;

  return (
    <div className={inline ? `${s.filters} ${s.filtersInline}` : s.filters}>
      <div className={s.filterRow} role="group" aria-label="Filter by asset class">
        {ASSET_CLASS_KEYS.filter((key) => (counts[key] ?? 0) > 0).map((key) => {
          const on = value.assetClass === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              className={on ? `${s.filterChip} ${s.filterOn}` : s.filterChip}
              onClick={() => onChange({ ...value, assetClass: on ? null : key })}
            >
              {ASSET_CLASSES[key].label}
            </button>
          );
        })}
      </div>

      <div className={s.filterFoot}>
        <IndustryMenu
          industries={industries}
          counts={industryCounts}
          value={value.industry}
          onChange={(industry) => onChange({ ...value, industry })}
        />

        {filtered ? (
          <button type="button" className={s.filterClear} onClick={() => onChange({ assetClass: null, industry: null })}>
            <X size={12} strokeWidth={1.6} aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
