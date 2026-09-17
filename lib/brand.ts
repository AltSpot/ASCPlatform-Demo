/**
 * DEMO SEAM. The invented companies' brand colours, for cards.
 *
 * One hue per company, from lib/brand-hues.json, the same file the marks
 * are drawn from (scripts/make-marks.mjs). A card uses it twice and no
 * more: the art band behind the mark, and a faint glow on a Radar card.
 * Everything else on a card stays in the platform's own tokens, which is
 * what keeps thirty companies reading as one marketplace.
 *
 * Pure and isomorphic. Real companies bring their own marks and colours
 * and this file goes with the JSON.
 */
import BRAND_HUES from './brand-hues.json';

export interface Brand {
  /** The company's colour. */
  hue: string;
  /** Its light end, for the top of a gradient. */
  light: string;
  /** The dark ground its mark sits on. */
  tile: string;
}

const TABLE = BRAND_HUES as unknown as Record<string, Brand | string | undefined>;

export function brandOf(slug: string): Brand | null {
  const entry = TABLE[slug];
  return entry && typeof entry === 'object' ? entry : null;
}

/** The art band behind a company's mark: its tile, lit by its hue. */
export function brandArt(slug: string): string | null {
  const b = brandOf(slug);
  if (!b) return null;
  return `radial-gradient(120% 140% at 85% 10%,${b.hue}66 0%,${b.hue}00 55%),linear-gradient(135deg,${b.tile} 0%,${b.tile} 45%,${b.hue}40 125%)`;
}
