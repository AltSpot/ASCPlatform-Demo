'use client';

/**
 * Explore, on the dashboard: every way into the shelf, one press each.
 *
 * ONE PANEL, NOT FOUR STACKS (2026-09-17). The four ways to slice the
 * shelf (asset class, who leads, stage, industry) are a menu down the left
 * of a single glass panel; the slices of the chosen one fill the right as
 * tiles, and switching lets them rise in. The section is one row tall
 * whichever group is open, so it no longer pushes Your investments a
 * screen further down.
 *
 * Each tile is a link to the marketplace already filtered to that slice,
 * with how many deals are open in it. A slice with nothing open is not
 * shown. Definitions: lib/explore.ts, which the marketplace reads back.
 */
import { ArrowUpRight, Factory, Layers, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import AssetClassIcon from '@/components/AssetClassIcon';
import SliceIcon from '@/components/SliceIcon';
import type { ExploreGroup, ExploreTile } from '@/lib/explore';

import s from './ExploreTiles.module.css';


const GROUP_GLYPH: Record<string, LucideIcon> = {
  'Asset class': Layers,
  'Who leads': Users,
  Stage: TrendingUp,
  Industry: Factory,
};

function Glyph({ tile }: { tile: ExploreTile }) {
  if (tile.axis === 'class') return <AssetClassIcon assetClass={tile.key} size={16} />;
  return (
    <span className={s.glyph}>
      <SliceIcon slice={tile.key} size={16} />
    </span>
  );
}

export default function ExploreTiles({ groups }: { groups: ExploreGroup[] }) {
  const [active, setActive] = useState(0);
  if (groups.length === 0) return null;
  const group = groups[Math.min(active, groups.length - 1)];

  return (
    <div className={`card ${s.panel}`}>
      <div className={s.menu} role="tablist" aria-label="Explore by">
        {groups.map((g, i) => {
          const Icon = GROUP_GLYPH[g.title] ?? Layers;
          const on = g === group;
          return (
            <button
              key={g.title}
              type="button"
              role="tab"
              aria-selected={on}
              className={s.menuItem}
              onClick={() => setActive(i)}
            >
              <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
              <span className={s.menuLabel}>{g.title}</span>
              <span className={s.menuCount}>{g.tiles.length}</span>
            </button>
          );
        })}
      </div>

      <div className={s.tiles} role="tabpanel" key={group.title} aria-label={group.title}>
        {group.tiles.map((tile, i) => (
          <Link
            key={`${tile.axis}:${tile.key}`}
            href={tile.href}
            className={s.tile}
            style={{ ['--i' as string]: i }}
          >
            <span className={s.tileTop}>
              <Glyph tile={tile} />
              <ArrowUpRight className={s.go} size={15} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className={s.label}>{tile.label}</span>
            <span className={s.count}>
              {tile.count} open {tile.count === 1 ? 'deal' : 'deals'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
