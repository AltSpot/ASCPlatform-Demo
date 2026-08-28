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
 * same companies.
 *
 * The two cool tints are the V18 category set, which exists for exactly
 * this: taxonomy, never chrome.
 */
export const ASSET_CLASSES = {
  venture: { label: 'Venture', tint: '#C79A4B' },
  growth: { label: 'Growth equity', tint: '#F39807' },
  secondary: { label: 'Secondaries', tint: '#7CB4F5' },
  'real-asset': { label: 'Real assets', tint: '#55D0B0' },
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
  'aerospace-defense': 'Aerospace and defence',
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
 * A colour per industry for the allocation charts. Deliberately warm:
 * these are portfolio surfaces, and the category tints are reserved for
 * asset class, which is the axis they were defined for.
 */
export const INDUSTRY_TINTS: string[] = [
  '#C79A4B',
  '#F39807',
  '#E5661A',
  '#E6C77A',
  '#F08A4B',
  '#A07A22',
  '#FFB84D',
  '#8A6D35',
  '#D4AE72',
  '#B8924A',
  '#F2E394',
  '#6C6459',
];
