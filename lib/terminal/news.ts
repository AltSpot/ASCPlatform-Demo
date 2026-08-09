/**
 * Terminal — private-markets news.
 *
 * DEMO SEAM. There is no good free private-markets news API, so the
 * headlines below are a hand-written fixture set. Everything the rest of
 * the app can see is the async interface at the bottom of this file.
 *
 * PRODUCTION CONTRACT — replacing this is a one-function change:
 *   · `getMarketNews(options)` keeps its signature and keeps returning
 *     `NewsItem[]` sorted newest first, already trimmed to `limit`.
 *   · `id` must be stable for the life of the story (it is a React key
 *     and, later, a read-state key).
 *   · `publishedAt` is an ISO 8601 instant in UTC. The fixture derives
 *     it from `minutesAgo` so the rail never looks stale; a real feed
 *     returns the wire timestamp and `minutesAgo` disappears with the
 *     fixture.
 *   · `category` must be one of NEWS_CATEGORIES. A real feed maps its
 *     own taxonomy onto this list rather than widening it, because the
 *     chips are styled per category.
 *   · `url` is optional. When absent the card is not a link, which is
 *     what keeps the demo honest: nothing here pretends to be a story
 *     you can go and read.
 *   · Failure returns an empty array. It never throws. The rail has a
 *     quiet empty state and the page must survive a dead wire.
 *
 * Editorial rule for the fixture: no invented financials, funding
 * amounts or valuations attributed to a real company. Company-specific
 * items name fictional companies only. Items that name a real
 * institution stick to matters of public record and structure.
 */

export const NEWS_CATEGORIES = [
  'Venture',
  'Secondaries',
  'Regulation',
  'Exits',
  'Fundraising',
  'Private credit',
  'Real assets',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface NewsItem {
  /** Stable for the life of the story. */
  id: string;
  headline: string;
  /** One or two sentences. Enough to decide whether to care. */
  dek: string;
  /** Wire or desk that filed it. */
  source: string;
  category: NewsCategory;
  /** ISO 8601, UTC. */
  publishedAt: string;
  /**
   * "14m ago", already rendered.
   *
   * Computed here rather than in a component on purpose. Reading the
   * clock during render makes a component impure and invites a
   * server/client hydration mismatch, so the wire hands down a string
   * and every card on the page agrees about what time it is. Callers
   * are per-request, so it is never stale.
   */
  age: string;
  /** Present only when there is somewhere real to send the reader. */
  url?: string;
  /** At most one item carries this. It gets the lead treatment. */
  lead?: boolean;
}

interface NewsFixture extends Omit<NewsItem, 'publishedAt' | 'age'> {
  /** Age at render time, so the rail is never visibly stale. */
  minutesAgo: number;
}

/**
 * DEMO SEAM — fixture wire. Sources are invented desks, not real
 * publications, so no story is ever misattributed.
 */
const FIXTURES: NewsFixture[] = [
  {
    id: 'wire-secondary-pricing-firms',
    headline: 'Secondary pricing firms for the third straight month',
    dek: 'Bids on late-stage software names narrowed against last marks again in July. Brokers report more single-name interest and fewer whole-portfolio blocks.',
    source: 'Secondaries Desk',
    category: 'Secondaries',
    minutesAgo: 34,
    lead: true,
  },
  {
    id: 'wire-506c-guidance',
    headline: 'SEC staff guidance clears a lighter path for 506(c) verification',
    dek: 'A no-action letter published in March lets issuers rely on high minimum investment amounts plus written representations. Sponsors are updating subscription packets to match.',
    source: 'Regulatory Desk',
    category: 'Regulation',
    minutesAgo: 96,
  },
  {
    id: 'wire-synthera-series-c',
    headline: 'Synthera AI prices its Series C with no structure attached',
    dek: 'The clinical-workflow company closed a preferred round at a flat 1x non-participating preference. No ratchet, no pay-to-play, no cumulative dividend.',
    source: 'Cap Table Weekly',
    category: 'Venture',
    minutesAgo: 148,
  },
  {
    id: 'wire-continuation-vehicles',
    headline: 'Continuation vehicles keep absorbing what the IPO window will not',
    dek: 'Sponsors moved another cohort of 2019 vintage assets into single-asset continuation funds this quarter. LPs are asking harder questions about who sets the price.',
    source: 'The Private Ledger',
    category: 'Exits',
    minutesAgo: 210,
  },
  {
    id: 'wire-direct-lending-spreads',
    headline: 'Direct lending spreads compress as banks re-enter the middle market',
    dek: 'Unitranche pricing on sponsor-backed deals tightened again. Private credit managers are defending terms rather than yield.',
    source: 'Fieldstone Wire',
    category: 'Private credit',
    minutesAgo: 275,
  },
  {
    id: 'wire-meridian-recap',
    headline: 'Meridian Logistics recapitalizes ahead of its cold-chain build',
    dek: 'The operator took on a minority growth investment to fund four regional facilities. Existing holders were not cut back.',
    source: 'Fieldstone Wire',
    category: 'Fundraising',
    minutesAgo: 340,
  },
  {
    id: 'wire-emerging-manager-fundraise',
    headline: 'Emerging managers are closing smaller funds faster',
    dek: 'First-time funds under $100 million are reaching final close in fewer months than the 2021 cohort, while anything above $500 million is taking longer.',
    source: 'The Private Ledger',
    category: 'Fundraising',
    minutesAgo: 430,
  },
  {
    id: 'wire-tender-offers-normalize',
    headline: 'Company-run tender offers are becoming an annual event',
    dek: 'More late-stage boards now schedule employee liquidity on a calendar rather than reacting to secondary broker pressure. Pricing is set off the last primary round.',
    source: 'Secondaries Desk',
    category: 'Secondaries',
    minutesAgo: 520,
  },
  {
    id: 'wire-data-center-power',
    headline: 'Power interconnect queues are now the binding constraint on data center deals',
    dek: 'Sponsors underwriting compute capacity are pricing utility timelines, not construction timelines. Sites with executed interconnect agreements trade at a premium.',
    source: 'Fieldstone Wire',
    category: 'Real assets',
    minutesAgo: 690,
  },
  {
    id: 'wire-valuation-marks-lag',
    headline: 'Private marks are still catching up to the public comp set',
    dek: 'Quarterly reported marks moved less than the listed comparables again. Auditors are pushing managers to explain the gap in writing.',
    source: 'Cap Table Weekly',
    category: 'Venture',
    minutesAgo: 880,
  },
  {
    id: 'wire-northwind-exit',
    headline: 'Northwind Grid agrees to a strategic sale',
    dek: 'The grid-analytics company will be acquired by a listed industrial buyer. Terms were not disclosed and the deal is subject to regulatory review.',
    source: 'The Private Ledger',
    category: 'Exits',
    minutesAgo: 1030,
  },
  {
    id: 'wire-qsbs-planning',
    headline: 'QSBS planning is moving earlier in the deal cycle',
    dek: 'Advisors are checking qualified small business stock eligibility at term sheet rather than at exit. Entity choice and gross asset tests are the two failure points.',
    source: 'Regulatory Desk',
    category: 'Regulation',
    minutesAgo: 1240,
  },
  {
    id: 'wire-spv-fee-disclosure',
    headline: 'Investors are pressing SPV sponsors on stacked fees',
    dek: 'Allocators report finding two and sometimes three layers of carry between themselves and the underlying company. Single-layer structures are being asked for by name.',
    source: 'Fieldstone Wire',
    category: 'Venture',
    minutesAgo: 1480,
  },
  {
    id: 'wire-industrial-rents',
    headline: 'Industrial rent growth slows without giving back the last two years',
    dek: 'Net effective rents flattened across most coastal submarkets. Landlords are trading concessions for term rather than cutting headline rates.',
    source: 'Fieldstone Wire',
    category: 'Real assets',
    minutesAgo: 1720,
  },
  {
    id: 'wire-lp-co-invest',
    headline: 'Co-investment demand is outrunning co-investment supply',
    dek: 'LPs continue to ask for deal-by-deal allocation with no fee and no carry. Sponsors are rationing it toward the funds they want re-upped.',
    source: 'The Private Ledger',
    category: 'Fundraising',
    minutesAgo: 1980,
  },
];

export interface MarketNewsOptions {
  /** Newest N stories. Defaults to the whole wire. */
  limit?: number;
}

/**
 * The private-markets wire, newest first.
 *
 * Async by construction: the fixture resolves immediately, and a real
 * feed drops in behind this signature without touching a caller.
 * Never throws. A dead wire is an empty rail, not an error page.
 */
export async function getMarketNews(
  options: MarketNewsOptions = {},
): Promise<NewsItem[]> {
  const now = Date.now();

  const items = FIXTURES.map(({ minutesAgo, ...rest }) => {
    const publishedAt = new Date(now - minutesAgo * 60_000).toISOString();
    return { ...rest, publishedAt, age: relativeTime(publishedAt, now) };
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return options.limit ? items.slice(0, options.limit) : items;
}

/**
 * "14m ago", "3h ago", "2d ago".
 *
 * Pure: `now` is always passed in, never read from the clock, so this
 * is safe to call from anywhere and gives the same answer twice.
 */
export function relativeTime(iso: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
