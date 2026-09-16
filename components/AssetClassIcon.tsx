/**
 * An asset class as one small tinted glyph instead of a word.
 *
 * Cards on the marketplace were carrying the class as a text line under
 * every name, which is twenty repetitions of "Venture" on one board. The
 * glyph says the same thing in the corner, in the class's own category
 * tint (the documented taxonomy exception), and the word is still there
 * for a screen reader and on hover.
 *
 * Tint is applied to the stroke and to a faint plate behind it, never to
 * a fill or a border, so a board of mixed classes stays quiet.
 */
import { Building2, Layers, Repeat2, Rocket, TrendingUp, type LucideIcon } from 'lucide-react';

import { ASSET_CLASSES, isAssetClass, type AssetClass } from '@/lib/taxonomy';

const GLYPH: Record<AssetClass, LucideIcon> = {
  venture: Rocket,
  growth: TrendingUp,
  secondary: Repeat2,
  'real-asset': Building2,
  fund: Layers,
};

export default function AssetClassIcon({
  assetClass,
  size = 15,
  className,
}: {
  assetClass: string;
  size?: number;
  className?: string;
}) {
  if (!isAssetClass(assetClass)) return null;
  const Glyph = GLYPH[assetClass];
  const { label, tint } = ASSET_CLASSES[assetClass];

  return (
    <span
      className={className}
      title={label}
      role="img"
      aria-label={label}
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        width: size + 15,
        height: size + 15,
        borderRadius: 'var(--r-pill)',
        color: tint,
        background: `color-mix(in srgb, ${tint} 13%, transparent)`,
        flex: 'none',
      }}
    >
      <Glyph size={size} strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}
