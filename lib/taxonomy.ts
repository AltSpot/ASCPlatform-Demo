/**
 * How AltSpot classifies what it holds and what it tracks.
 *
 * Lives here rather than in lib/terminal/radar.ts because deals need it
 * too: the portfolio page groups holdings by the same two axes Radar
 * filters on, and two copies of a taxonomy is one copy too many.
 *
 * Pure and isomorphic. No database, no server-only imports, so the
 * client charts can read the labels straight from the source.
 */

/**
 * Asset classes AltSpot actually transacts in. The deck's line is the
 * scope: institutional venture and growth equity positions taken onto
 * the balance sheet, plus the secondary and real-asset routes into the
 * same companies, and the funds that hold several of them at once.
 *
 * A fund is its own class rather than a wrapper around one of the
 * others, because what an investor gets from it, several positions and
 * a manager choosing between them, is not what any single-company
 * class gives them.
 *
 * The cool tints are the V18 category set, which exists for exactly
 * this: taxonomy, never chrome.
 *
 * A TINT NAMES A TOKEN RATHER THAN A VALUE. These were hex literals,
 * which meant the allocation bars and legend swatches kept the dark
 * palette when the rest of the product turned over: a tint here is
 * handed to React as an inline style, and inline styles do not cascade,
 * so nothing downstream could correct them. The values now live in
 * app/globals.css with every other colour on the platform, where a
 * theme can restate them. This module stays pure and isomorphic: a
 * tint is still just a string, and a string is all the caller wanted.
 */
export const ASSET_CLASSES = {
  venture: { label: 'Venture', tint: 'var(--as-cat-venture)' },
  growth: { label: 'Growth equity', tint: 'var(--as-cat-growth)' },
  secondary: { label: 'Secondaries', tint: 'var(--as-cat-secondary)' },
  'real-asset': { label: 'Real assets', tint: 'var(--as-cat-realasset)' },
  fund: { label: 'Funds', tint: 'var(--as-cat-fund)' },
} as const;

export type AssetClass = keyof typeof ASSET_CLASSES;

export const ASSET_CLASS_KEYS = Object.keys(ASSET_CLASSES) as AssetClass[];

export function isAssetClass(value: string): value is AssetClass {
  return value in ASSET_CLASSES;
}

/**
 * The industry taxonomy. Deliberately the standard private-markets set
 * rather than only what is held today, so a deal added next week has a
 * bucket waiting instead of inventing one.
 */
export const INDUSTRIES = {
  'artificial-intelligence': 'Artificial intelligence',
  'enterprise-software': 'Enterprise software',
  'data-infrastructure': 'Data infrastructure',
  cybersecurity: 'Cybersecurity',
  fintech: 'Financial technology',
  healthcare: 'Healthcare and life sciences',
  'aerospace-defense': 'Aerospace and defense',
  'energy-climate': 'Energy and climate',
  industrials: 'Industrials and manufacturing',
  'consumer-marketplaces': 'Consumer and marketplaces',
  'logistics-supply-chain': 'Logistics and supply chain',
  'real-estate': 'Real estate',
} as const;

export type Industry = keyof typeof INDUSTRIES;

export const INDUSTRY_KEYS = Object.keys(INDUSTRIES) as Industry[];

export function isIndustry(value: string): value is Industry {
  return value in INDUSTRIES;
}

/**
 * What a multi-deal fund is grouped as. A fund spans industries by
 * construction, so pretending it has one would misstate the exposure
 * it actually gives you.
 */
export const DIVERSIFIED = 'Diversified' as const;

/** Label for an industry key, or the diversified bucket when there is none. */
export function industryLabel(key: string | null | undefined): string {
  if (!key) return DIVERSIFIED;
  return isIndustry(key) ? INDUSTRIES[key] : DIVERSIFIED;
}

/**
 * A color per industry for the allocation charts. Deliberately warm:
 * these are portfolio surfaces, and the category tints are reserved for
 * asset class, which is the axis they were defined for. The twelve
 * values are --as-ind-1 through --as-ind-12 in app/globals.css; see the
 * note on ASSET_CLASSES for why they are tokens and not literals.
 */
export const INDUSTRY_TINTS: string[] = Array.from(
  { length: 12 },
  (_unused, i) => `var(--as-ind-${i + 1})`,
);
