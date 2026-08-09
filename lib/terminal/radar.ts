/**
 * AltSpot Radar — the watchlist members vote on.
 *
 * Radar is not the shelf. Nothing here is offered, nothing here is
 * being raised for, and AltSpot holds no position in any of it. These
 * are widely held private companies that members recognise, listed so
 * they can tell us which one they want the community to buy into next
 * and how much they would put behind it. The tally is demand signal
 * that feeds sourcing. It is not an order book.
 *
 * WHAT IS REAL AND WHAT IS NOT:
 *   · The company names, sectors and descriptions are real and public.
 *     A member should recognise what they are looking at.
 *   · Every number is ILLUSTRATIVE DEMO DATA. The market average, the
 *     last-round reference and the AltSpot target range are placeholders
 *     shaped like the real thing. The Radar section states this on the
 *     page, in plain language, next to the numbers.
 *   · `baselineInvestors` and `baselineDollars` are seeded demand so a
 *     fresh demo does not show an empty board. Real indications from
 *     lib/repositories/radar.ts are added on top. In production the
 *     baselines are zero and the tally is entirely real.
 *
 * DEMO SEAM. Replacing this means:
 *   · `listRadarCompanies()` keeps its signature and returns
 *     `RadarCompany[]` in display order.
 *   · Per-share figures stay integer cents. No floats, same rule as
 *     every other money value in the product.
 *   · `baselineInvestors` and `baselineDollars` go to zero.
 */

export interface RadarCompany {
  /** Stable key. Also the value persisted on RadarInterest.companySlug. */
  slug: string;
  name: string;
  sector: string;
  /** What the company does. Public, factual, no financial claims. */
  description: string;
  /** Illustrative indicative secondary price, in integer cents. */
  marketAverageCents: number;
  /** The period the indicative price is meant to describe. */
  marketAverageAsOf: string;
  /** Illustrative last primary round reference, e.g. "Series J". */
  lastRoundLabel: string;
  /** Illustrative post-money reference, in integer dollars. */
  lastRoundValuation: number;
  /** AltSpot's illustrative entry range, in integer cents per share. */
  targetLowCents: number;
  targetHighCents: number;
  /** Smallest indication the form accepts, in integer dollars. */
  minIndication: number;
  /** DEMO SEAM: seeded demand. Zero in production. */
  baselineInvestors: number;
  /** DEMO SEAM: seeded demand, integer dollars. Zero in production. */
  baselineDollars: number;
}

const COMPANIES: RadarCompany[] = [
  {
    slug: 'openai',
    name: 'OpenAI',
    sector: 'Artificial intelligence',
    description:
      'Research lab and product company behind ChatGPT and the GPT model family, selling models to developers and enterprises.',
    marketAverageCents: 21_450,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Late-stage primary',
    lastRoundValuation: 300_000_000_000,
    targetLowCents: 19_800,
    targetHighCents: 22_600,
    minIndication: 25_000,
    baselineInvestors: 412,
    baselineDollars: 9_640_000,
  },
  {
    slug: 'anthropic',
    name: 'Anthropic',
    sector: 'Artificial intelligence',
    description:
      'AI safety company building the Claude models and selling them through an API, apps and cloud marketplaces.',
    marketAverageCents: 16_400,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Late-stage primary',
    lastRoundValuation: 183_000_000_000,
    targetLowCents: 15_200,
    targetHighCents: 17_400,
    minIndication: 25_000,
    baselineInvestors: 356,
    baselineDollars: 7_820_000,
  },
  {
    slug: 'spacex',
    name: 'SpaceX',
    sector: 'Aerospace',
    description:
      'Launch provider and operator of the Starlink satellite internet network, with a reusable rocket fleet flying commercial and government payloads.',
    marketAverageCents: 18_500,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Employee tender',
    lastRoundValuation: 350_000_000_000,
    targetLowCents: 17_200,
    targetHighCents: 19_600,
    minIndication: 25_000,
    baselineInvestors: 388,
    baselineDollars: 8_150_000,
  },
  {
    slug: 'databricks',
    name: 'Databricks',
    sector: 'Data infrastructure',
    description:
      'Data and AI platform built on the lakehouse architecture, used by enterprises to run analytics and machine learning on their own data.',
    marketAverageCents: 12_850,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Series K',
    lastRoundValuation: 62_000_000_000,
    targetLowCents: 11_800,
    targetHighCents: 13_400,
    minIndication: 25_000,
    baselineInvestors: 274,
    baselineDollars: 5_310_000,
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    sector: 'Payments',
    description:
      'Payments infrastructure for online businesses, covering card acceptance, billing, marketplaces and treasury services.',
    marketAverageCents: 3_320,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Employee tender',
    lastRoundValuation: 91_500_000_000,
    targetLowCents: 3_040,
    targetHighCents: 3_480,
    minIndication: 25_000,
    baselineInvestors: 241,
    baselineDollars: 4_470_000,
  },
  {
    slug: 'anduril',
    name: 'Anduril Industries',
    sector: 'Defense technology',
    description:
      'Defense manufacturer building autonomous systems, counter-drone hardware and the Lattice command software that ties them together.',
    marketAverageCents: 6_280,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Series G',
    lastRoundValuation: 30_500_000_000,
    targetLowCents: 5_700,
    targetHighCents: 6_600,
    minIndication: 25_000,
    baselineInvestors: 198,
    baselineDollars: 3_260_000,
  },
  {
    slug: 'ramp',
    name: 'Ramp',
    sector: 'Fintech',
    description:
      'Corporate cards, bill payment and spend management software sold to finance teams as a single system.',
    marketAverageCents: 4_160,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Series E',
    lastRoundValuation: 22_500_000_000,
    targetLowCents: 3_750,
    targetHighCents: 4_300,
    minIndication: 25_000,
    baselineInvestors: 143,
    baselineDollars: 2_180_000,
  },
  {
    slug: 'canva',
    name: 'Canva',
    sector: 'Software',
    description:
      'Visual design platform used by individuals and teams for documents, presentations, video and brand assets in the browser.',
    marketAverageCents: 3_940,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Employee tender',
    lastRoundValuation: 32_000_000_000,
    targetLowCents: 3_500,
    targetHighCents: 4_150,
    minIndication: 25_000,
    baselineInvestors: 117,
    baselineDollars: 1_640_000,
  },
];

/**
 * A Radar company as one investor sees it: the reference data above,
 * plus the tally, plus their own indication.
 *
 * Declared here rather than in the repository because the browser needs
 * the type too, and lib/repositories/* is server-only.
 */
export interface RadarCompanyView extends RadarCompany {
  /** Members who have indicated, seeded baseline included. */
  interestInvestors: number;
  /** Dollars indicated, seeded baseline included. Integer dollars. */
  interestDollars: number;
  /** This member's own indication, or null if they have not made one. */
  yourAmount: number | null;
}

/** Largest indication the form will take. Guards a fat finger, not a rule. */
export const MAX_INDICATION = 25_000_000;

/** The watchlist, in display order. */
export async function listRadarCompanies(): Promise<RadarCompany[]> {
  return COMPANIES;
}

export function findRadarCompany(slug: string): RadarCompany | null {
  return COMPANIES.find((company) => company.slug === slug) ?? null;
}

/**
 * Per-share prices carry cents, so they get their own formatter rather
 * than bending `money()` in lib/format.ts, which speaks whole dollars.
 */
export function priceFromCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact valuation reference: $300B, $62B, $1.4B. */
export function valuationShort(dollars: number): string {
  if (dollars >= 1_000_000_000) {
    const billions = dollars / 1_000_000_000;
    return `$${billions >= 100 ? Math.round(billions) : billions.toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (dollars >= 1_000_000) {
    const millions = dollars / 1_000_000;
    return `$${millions >= 100 ? Math.round(millions) : millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  return `$${dollars.toLocaleString('en-US')}`;
}
