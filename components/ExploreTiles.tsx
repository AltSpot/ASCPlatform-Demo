/**
 * Explore, on the dashboard: every way into the shelf, one press each.
 *
 * Four rows of small tiles (asset class, who leads, stage, industry),
 * each a link to the marketplace already filtered to that slice, with how
 * many deals are open in it. A slice with nothing open is not shown: a
 * tile that leads to an empty shelf is a dead end. The definitions are
 * lib/explore.ts, which the marketplace reads back from the URL.
 *
 * No 'use client'. Before offerings open to a member there are no deals,
 * so there are no tiles and the section is not rendered at all.
 */
import {
  Boxes,
  Building2,
  Cpu,
  CreditCard,
  Database,
  Factory,
  Handshake,
  HeartPulse,
  Landmark,
  Plane,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Truck,
  Zap,
  Mountain,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import AssetClassIcon from '@/components/AssetClassIcon';
import type { ExploreGroup, ExploreTile } from '@/lib/explore';

import s from './ExploreTiles.module.css';

const GLYPH: Record<string, LucideIcon> = {
  altspot: ShieldCheck,
  partner: Handshake,
  seed: Sprout,
  early: TrendingUp,
  growth: Mountain,
  late: Landmark,
  'artificial-intelligence': Cpu,
  'enterprise-software': Boxes,
  'data-infrastructure': Database,
  cybersecurity: Shield,
  fintech: CreditCard,
  healthcare: HeartPulse,
  'aerospace-defense': Plane,
  'energy-climate': Zap,
  industrials: Factory,
  'consumer-marketplaces': ShoppingBag,
  'logistics-supply-chain': Truck,
  'real-estate': Building2,
};

function Glyph({ tile }: { tile: ExploreTile }) {
  if (tile.axis === 'class') return <AssetClassIcon assetClass={tile.key} size={15} />;
  const Icon = GLYPH[tile.key] ?? Boxes;
  return (
    <span className={s.glyph}>
      <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}

export default function ExploreTiles({ groups }: { groups: ExploreGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div className={s.groups}>
      {groups.map((group) => (
        <div className={s.group} key={group.title}>
          <p className={s.groupTitle}>{group.title}</p>
          <div className={s.tiles}>
            {group.tiles.map((tile, i) => (
              <Link
                key={`${tile.axis}:${tile.key}`}
                href={tile.href}
                className={s.tile}
                style={{ ['--i' as string]: i }}
              >
                <Glyph tile={tile} />
                <span className={s.label}>{tile.label}</span>
                <span className={s.count}>
                  {tile.count} open
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
