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
import { ArrowLeftRight, Building2, Layers, Sprout, TrendingUp, type LucideIcon } from 'lucide-react';

import { ASSET_CLASSES, isAssetClass, type AssetClass } from '@/lib/taxonomy';

export const ASSET_CLASS_GLYPH: Record<AssetClass, LucideIcon> = {
  venture: Sprout,
  growth: TrendingUp,
  secondary: ArrowLeftRight,
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
  const Glyph = ASSET_CLASS_GLYPH[assetClass];
  const { label } = ASSET_CLASSES[assetClass];

  return (
    <span
      className={className}
      title={label}
      role="img"
      aria-label={label}
      style={{
        display: 'inline-grid',
        placeItems: 'center',
        /* MINIMAL BY DESIGN (Tyler, 2026-09-21). This was a tinted glyph in a
           tinted bubble, a rocket for venture among them. A bare line icon
           in the quiet ink says the same thing and looks like a finance
           product. Category colour is for slices of a chart, not icons. */
        width: size + 4,
        height: size + 4,
        color: 'var(--as-text-muted)',
        flex: 'none',
      }}
    >
      <Glyph size={size + 2} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
