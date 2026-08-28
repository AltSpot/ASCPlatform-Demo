'use client';

/**
 * Filters for the Radar board: asset class and industry.
 *
 * Both offer only the values actually on the board. The industry
 * taxonomy in lib/terminal/radar.ts is the full private-markets set so
 * a new name has a bucket waiting, but a filter that resolves to an
 * empty board is worse than no filter, so the control is built from
 * what is present rather than from the type.
 *
 * Asset class carries its tint and its Lucide mark. Industry is a plain
 * pill: two coloured axes competing on one row reads as decoration, and
 * the asset class is the one an investor screens on first.
 */
import { Layers, Sprout, TrendingUp, Building2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  ASSET_CLASSES,
  INDUSTRIES,
  type AssetClass,
  type Industry,
} from '@/lib/terminal/radar';

import s from './Radar.module.css';

/** One mark per class, from the deck's own vocabulary. */
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

export interface RadarFilterState {
  assetClass: AssetClass | null;
  industry: Industry | null;
}

export default function RadarFilters({
  classes,
  industries,
  value,
  onChange,
  showing,
  total,
}: {
  /** Asset classes present on the board, in taxonomy order. */
  classes: AssetClass[];
  /** Industries present on the board, in taxonomy order. */
  industries: Industry[];
  value: RadarFilterState;
  onChange: (next: RadarFilterState) => void;
  showing: number;
  total: number;
}) {
  const filtered = value.assetClass !== null || value.industry !== null;

  // One axis with a single option cannot filter anything.
  const showClasses = classes.length > 1;
  const showIndustries = industries.length > 1;
  if (!showClasses && !showIndustries) return null;

  return (
    <div className={s.filters}>
      {showClasses && (
        <div className={s.filterRow}>
          <span className={s.filterLabel}>Asset class</span>
          {classes.map((key) => {
            const Icon = CLASS_ICON[key];
            const on = value.assetClass === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                className={`${s.filterChip} ${CLASS_TINT[key]} ${on ? s.filterOn : ''}`}
                onClick={() =>
                  onChange({ ...value, assetClass: on ? null : key })
                }
              >
                <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
                {ASSET_CLASSES[key].label}
              </button>
            );
          })}
        </div>
      )}

      {showIndustries && (
        <div className={s.filterRow}>
          <span className={s.filterLabel}>Industry</span>
          {industries.map((key) => {
            const on = value.industry === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                className={`${s.filterChip} ${on ? s.filterOn : ''}`}
                onClick={() => onChange({ ...value, industry: on ? null : key })}
              >
                {INDUSTRIES[key]}
              </button>
            );
          })}
        </div>
      )}

      {filtered && (
        <div className={s.filterFoot}>
          <span className={s.filterCount}>
            {showing} of {total}
          </span>
          <button
            type="button"
            className={s.filterClear}
            onClick={() => onChange({ assetClass: null, industry: null })}
          >
            <X size={12} strokeWidth={1.6} aria-hidden="true" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
