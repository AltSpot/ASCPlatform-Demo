'use client';

/**
 * Filtering by taxonomy: asset class and industry.
 *
 * Shared by the Radar board and the deal shelf, which ask the same
 * question of the same two axes. It was written for Radar and moved
 * here when the shelf needed it.
 *
 * Three decisions worth stating.
 *
 * Only classes with something behind them show. A filter is a way of
 * narrowing what is already on the page, and a chip that cannot narrow
 * anything is chrome.
 *
 * THE CLASSES ARE ONE CHOICE, NOT FIVE SWITCHES (Tyler, 2026-09-21). An
 * "All" option leads, exactly one option is always chosen, and one
 * outline in the warm ramp glides from the old choice to the new one
 * (components/ui/useSlidingIndicator), so a member moving from Venture
 * to Funds sees the choice move rather than one light going out and
 * another coming on. Pressing the chosen class again goes back to All.
 * It is a radio group to a keyboard: arrows move and choose, Home and
 * End jump. The chosen option is outlined, never filled, so its word is
 * page ink at rest and on hover (a filled champagne pill went white on
 * hover and could not be read). Each class carries its glyph in its
 * category tint, the same glyph and tint as the tag on every card, and
 * that is the only colour on the row.
 *
 * FOLDED ON THE MARKETPLACE BAR (Tyler, 2026-09-21). With `collapsible`
 * the classes sit behind one pill on the bar's own line: "Asset class",
 * or the chosen class in its glyph and outline. Pressing it unrolls the
 * options to the right like a scroll opening: the drawer animates to its
 * measured width in pixels (smoother than any fractional-grid trick) and
 * the chips follow one after another. The pieces take part in the bar's
 * own line (display: contents), so the industry menu stays where it is
 * and only drops to a second line when the bar runs out of room. A press
 * outside, Escape or the pill again rolls them back up.
 *
 * Industry is one menu rather than a second row of pills. Twelve pills
 * is a wall; the menu lives in IndustryMenu, which draws its own list.
 */
import { ChevronRight, LayoutGrid, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

import { ASSET_CLASS_GLYPH } from '@/components/AssetClassIcon';
import { useSlidingIndicator } from '@/components/ui/useSlidingIndicator';
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
  badges,
  collapsible = false,
}: {
  /** Fold the classes behind one pill that unrolls to the right. */
  collapsible?: boolean;
  /** A quiet count beside each class, e.g. open deals. Omitted where zero. */
  badges?: Partial<Record<AssetClass, number>>;
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
  const present = ASSET_CLASS_KEYS.filter((key) => (counts[key] ?? 0) > 0);
  /* null is All. */
  const options: (AssetClass | null)[] = [null, ...present];
  const allBadge = badges
    ? present.reduce((sum, key) => sum + (badges[key] ?? 0), 0)
    : 0;

  const row = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const expanded = !collapsible || open;
  const box = useSlidingIndicator(row, `${value.assetClass ?? 'all'}:${expanded}`);

  /* Roll the classes back up on a press outside or Escape. */
  useEffect(() => {
    if (!collapsible || !open) return;
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [collapsible, open]);

  /* The drawer's natural width, so it can open to exactly that. */
  const [natural, setNatural] = useState(0);
  useLayoutEffect(() => {
    if (!collapsible) return;
    const el = row.current;
    if (!el) return;
    const measure = () => setNatural(el.scrollWidth);
    measure();
    const observer = new ResizeObserver(measure);
    for (const child of Array.from(el.children)) observer.observe(child);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [collapsible, present.length]);

  const chosen = value.assetClass;
  const ChosenGlyph = chosen && !open ? ASSET_CLASS_GLYPH[chosen] : SlidersHorizontal;

  function choose(next: AssetClass | null) {
    onChange({ ...value, assetClass: next });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const at = options.indexOf(value.assetClass);
    let next = at;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (at + 1) % options.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (at - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;
    event.preventDefault();
    choose(options[next]);
    row.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus();
  }

  return (
    <div
      ref={root}
      className={inline ? `${s.filters} ${s.filtersInline}` : s.filters}
      data-collapsible={collapsible || undefined}
      data-open={expanded}
    >
      {collapsible ? (
        <button
          type="button"
          className={s.drawerToggle}
          aria-expanded={open}
          aria-controls="asset-class-options"
          title={open ? 'Close asset classes' : undefined}
          data-chosen={chosen !== null}
          style={chosen ? { ['--chip-tint' as string]: ASSET_CLASSES[chosen].tint } : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <ChosenGlyph className={s.chipGlyph} size={13} strokeWidth={1.75} aria-hidden="true" />
          {open ? <span className={s.srOnly}>Asset class</span> : chosen ? ASSET_CLASSES[chosen].label : 'Asset class'}
          <ChevronRight className={s.drawerChev} size={13} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : null}
      <div
        className={collapsible ? s.drawer : undefined}
        aria-hidden={collapsible && !open ? true : undefined}
        style={collapsible ? { width: open ? natural : 0 } : undefined}
      >
      <div
        ref={row}
        id={collapsible ? 'asset-class-options' : undefined}
        className={s.filterRow}
        role="radiogroup"
        aria-label="Asset class"
        onKeyDown={onKeyDown}
      >
        {box ? (
          <span
            className={s.indicator}
            aria-hidden="true"
            style={{
              width: box.width,
              height: box.height,
              transform: `translate(${box.x}px, ${box.y}px)`,
            }}
          />
        ) : null}
        {options.map((key, index) => {
          const on = value.assetClass === key;
          const Glyph = key ? ASSET_CLASS_GLYPH[key] : LayoutGrid;
          const count = key ? badges?.[key] : allBadge;
          return (
            <button
              key={key ?? 'all'}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on && expanded ? 0 : -1}
              data-active={on}
              className={s.filterChip}
              style={{
                ['--chip-i' as string]: index,
                ...(key ? { ['--chip-tint' as string]: ASSET_CLASSES[key].tint } : {}),
              }}
              onClick={() => choose(on && key ? null : key)}
            >
              <Glyph className={s.chipGlyph} size={13} strokeWidth={1.75} aria-hidden="true" />
              {key ? ASSET_CLASSES[key].label : 'All'}
              {count ? <span className={s.filterCount}>{count}</span> : null}
            </button>
          );
        })}
      </div>
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
