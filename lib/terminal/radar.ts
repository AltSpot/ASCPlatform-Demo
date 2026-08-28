/**
 * AltSpot Radar — the private companies AltSpot is tracking.
 *
 * Radar is not the shelf. Nothing here is offered, nothing here is
 * being raised for, and AltSpot holds no position in any of it. These
 * are widely held private companies that members recognise, listed so
 * they can tell us which one they want the community to buy into next
 * and how much they would put behind it. The tally is demand signal
 * that feeds sourcing. It is not an order book.
 *
 * Four names, deliberately. A board that scans in one screen gets read.
 *
 * WHAT IS REAL AND WHAT IS NOT:
 *   · The company names, sectors and descriptions are real and public.
 *     A member should recognise what they are looking at.
 *   · `research.news` is REAL. Every link points at the company's own
 *     newsroom and was checked to resolve. Headlines are quoted as the
 *     publisher wrote them. Nothing in here is invented, ever: an
 *     invented headline attributed to a real company is the one thing
 *     this file must never contain. If a link cannot be verified it
 *     does not ship, and the newsroom index takes its place.
 *   · `research.business`, `research.bull`, `research.bear` and
 *     `research.watching` are EDITORIAL. They are AltSpot's own
 *     plain-language reading of public information, written to be
 *     structural rather than numeric: business model, moat,
 *     competition, concentration, capital intensity, regulation. No
 *     price targets, no return claims, no forecasts. Same line the
 *     rest of the product holds. Explains, never advises.
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
 *   · The editorial fields get whatever review a published opinion
 *     needs. The news links stay real or they go.
 */

/** One published item, linked so a member can go and read it. */
export interface RadarNewsLink {
  /** The headline as the publisher wrote it. Never paraphrased. */
  title: string;
  /** Who published it. The company's own newsroom, in every case here. */
  publisher: string;
  /** Absolute URL. Verified to resolve before it ships. */
  url: string;
  /** Publication date as shown by the publisher. */
  date: string;
}

/**
 * The expandable half of a Radar card. All editorial except `news`.
 *
 * Written to be read by someone deciding whether they care, not by
 * someone deciding whether to buy. Structural, non-numeric, and short.
 */
export interface RadarResearch {
  /** Plain-language summary of how the company makes money. */
  business: string;
  /** The structural case for. Short lines, no figures, no forecasts. */
  bull: string[];
  /** The structural case against, held to the same standard. */
  bear: string[];
  /** Why AltSpot is tracking it, in sourcing and process terms. */
  watching: string;
  /** Real, resolvable links. Company newsrooms and official posts. */
  news: RadarNewsLink[];
  /** The company's own newsroom index, for everything not listed. */
  newsroomUrl: string;
}

/**
 * Asset classes AltSpot actually transacts in. The deck's line is the
 * scope: institutional venture and growth equity positions taken onto
 * the balance sheet, plus the secondary and real-asset routes into the
 * same companies. Anything outside these four is not a Radar name.
 *
 * The two cool tints are the V18 category set, which exists for exactly
 * this: taxonomy, never chrome.
 */
export const ASSET_CLASSES = {
  venture: { label: 'Venture', tint: 'gold' },
  growth: { label: 'Growth equity', tint: 'signal' },
  secondary: { label: 'Secondaries', tint: 'secondary' },
  'real-asset': { label: 'Real assets', tint: 'realasset' },
} as const;

export type AssetClass = keyof typeof ASSET_CLASSES;

/**
 * The industry taxonomy. Deliberately the standard private-markets set
 * rather than only what is on the board today, so a name added next
 * week has a bucket waiting instead of inventing one. The filter offers
 * only the industries actually present, because a control that filters
 * to nothing is worse than no control.
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

export interface RadarCompany {
  /** Stable key. Also the value persisted on RadarInterest.companySlug. */
  slug: string;
  name: string;
  /** Drives the label and the tint. One source, so they cannot drift. */
  industry: Industry;
  assetClass: AssetClass;
  /** What the company does. Public, factual, no financial claims. */
  description: string;
  /**
   * The company's own mark, served from /public. Optional: a company
   * without one falls back to a monogram on the same plate, so the
   * board never looks half-finished while marks are being collected.
   * Drop an SVG at public/brand/companies/<slug>.svg and point here.
   */
  logoUrl?: string;
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
  /** The expandable research section. Editorial, plus real links. */
  research: RadarResearch;
}

const COMPANIES: RadarCompany[] = [
  {
    slug: 'openai',
    name: 'OpenAI',
    industry: 'artificial-intelligence',
    assetClass: 'growth',
    logoUrl: '/openai-logo.svg',
    description:
      'Research lab and product company behind ChatGPT and the GPT model family, selling models to developers and enterprises.',
    marketAverageCents: 21_450,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Late-stage primary',
    lastRoundValuation: 300_000_000_000,
    targetLowCents: 19_800,
    targetHighCents: 22_600,
    minIndication: 10_000,
    baselineInvestors: 412,
    baselineDollars: 9_640_000,
    research: {
      business:
        'OpenAI trains large models and sells access to them three ways: consumer subscriptions to ChatGPT, an API that developers build on, and enterprise agreements. It also commits heavily to the compute that serves those models, because serving is the largest recurring cost in the business.',
      bull: [
        'Distribution is the moat. ChatGPT is the default consumer surface for AI, and defaults are hard to unseat.',
        'One body of research is sold three ways: consumer, developer, enterprise. Research cost amortises across all of it.',
        'Owning more of the serving stack means efficiency gains can be passed to customers as price, which pulls workloads toward the platform.',
        'Enterprise adoption moves from experiments to workflows once the model is inside the tools people already use.',
      ],
      bear: [
        'Capital intensity is the whole story. Compute is committed years ahead of the demand it is meant to serve.',
        'Frontier capability keeps converging. If the models commoditise, the premium moves to whoever owns distribution or the lowest cost.',
        'Concentration cuts both ways: a small number of infrastructure partners, and a small number of products carrying the revenue.',
        'Regulatory surface is unusually wide for a company this young: safety rules, copyright, and consumer protection all land at once.',
        'The corporate structure is complicated and governance has been publicly contested before.',
      ],
      watching:
        'Members ask about it more than anything else. Demand is not the problem, supply is. Access at this size usually arrives as a fund inside a fund, with fees at every layer and transfer restrictions that decide what you actually own. Nothing is sourced today, and we would only bring it if the structure and the total cost held up.',
      news: [
        {
          title: 'From asking to doing: How the world is putting ChatGPT to work',
          publisher: 'OpenAI',
          url: 'https://openai.com/index/how-the-world-is-putting-chatgpt-to-work/',
          date: 'August 6, 2026',
        },
        {
          title: 'Building abundant intelligence',
          publisher: 'OpenAI',
          url: 'https://openai.com/index/building-abundant-intelligence/',
          date: 'July 31, 2026',
        },
        {
          title: 'Advancing the price-performance frontier with GPT-5.6',
          publisher: 'OpenAI',
          url: 'https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/',
          date: 'July 30, 2026',
        },
      ],
      newsroomUrl: 'https://openai.com/news/',
    },
  },
  {
    slug: 'spacex',
    name: 'SpaceX',
    industry: 'aerospace-defense',
    assetClass: 'secondary',
    description:
      'Launch provider and operator of the Starlink satellite internet network, with a reusable rocket fleet flying commercial and government payloads.',
    marketAverageCents: 18_500,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Employee tender',
    lastRoundValuation: 350_000_000_000,
    targetLowCents: 17_200,
    targetHighCents: 19_600,
    minIndication: 10_000,
    baselineInvestors: 388,
    baselineDollars: 8_150_000,
    research: {
      business:
        'Two businesses under one roof. Launch sells rides to orbit for commercial and government customers on rockets SpaceX builds and reuses. Starlink sells satellite internet by subscription to consumers, enterprises, aviation and maritime. The company has since widened further, acquiring xAI in February 2026 and announcing Terafab, a semiconductor plant built with Tesla.',
      bull: [
        'Reuse is a genuine cost advantage, and it compounds. Every flown booster makes the next launch cheaper than a competitor who builds a new one.',
        'Starlink turns a launch company into a subscription network. Recurring revenue behind a moat of spectrum, ground stations and orbital slots.',
        'Vertical integration is real here: it launches its own satellites on its own rockets, so the constellation is not hostage to anyone else’s manifest.',
        'Government demand for assured access to space is durable and does not track the technology cycle.',
      ],
      bear: [
        'Capital intensity on every front. Rockets, a constellation that needs constant replenishment, and now a chip plant all consume cash long before they return any.',
        'Key-person concentration is unusually high, and the company has never pretended otherwise.',
        'Regulation and geopolitics sit on the critical path: launch licences, spectrum allocation, export control, and customers whose budgets move with politics.',
        'Recent moves take the company well past launch and connectivity. Breadth can be strength or it can be drift, and it is early to tell which.',
        'Satellite internet competition is arriving, funded by states as much as by markets.',
      ],
      watching:
        'Second most asked for, after OpenAI. Shares that reach individual investors are almost always employee tender paper, and the company decides when those windows open. Transfer restrictions and rights of first refusal are the whole question. Nothing is sourced today.',
      news: [
        {
          title: 'Breaking Ground on Terafab in Texas',
          publisher: 'SpaceX',
          url: 'https://www.spacex.com/updates#terafab',
          date: 'August 6, 2026',
        },
        {
          title: 'First Starship Interplanetary Human Spaceflight Mission',
          publisher: 'SpaceX',
          url: 'https://www.spacex.com/updates#first-starship-interplanetary-mission',
          date: 'May 21, 2026',
        },
        {
          title: 'xAI joins SpaceX to Accelerate Humanity’s Future',
          publisher: 'SpaceX',
          url: 'https://www.spacex.com/updates#xai-joins-spacex',
          date: 'February 2, 2026',
        },
      ],
      newsroomUrl: 'https://www.spacex.com/updates/',
    },
  },
  {
    slug: 'anthropic',
    name: 'Anthropic',
    industry: 'artificial-intelligence',
    assetClass: 'growth',
    description:
      'AI safety company building the Claude models and selling them through an API, apps and cloud marketplaces.',
    marketAverageCents: 16_400,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Late-stage primary',
    lastRoundValuation: 183_000_000_000,
    targetLowCents: 15_200,
    targetHighCents: 17_400,
    minIndication: 10_000,
    baselineInvestors: 356,
    baselineDollars: 7_820_000,
    research: {
      business:
        'Anthropic builds the Claude models and sells them mostly to businesses: an API developers build on, Claude apps for teams, and resale through the cloud marketplaces its customers already buy from. Coding and agent workloads are a large share of what the models are used for.',
      bull: [
        'Enterprise-first distribution. Selling through the major clouds means landing inside procurement that already exists rather than building it.',
        'The safety posture is commercial as much as ethical. Regulated buyers need a vendor who can satisfy a risk committee.',
        'Coding and agent workloads are sticky. Once a model is wired into a build pipeline, switching is an engineering project, not a preference.',
        'A narrower product surface means less to defend and a clearer story to sell.',
      ],
      bear: [
        'The same capital problem every frontier lab has. Training and serving run ahead of revenue, and the next model always costs more than the last.',
        'Cloud partners are also competitors. Channel power sits with whoever owns the customer relationship.',
        'A smaller consumer footprint means less free brand and less of the everyday usage data a default app collects.',
        'Open-weight models set a price floor under the whole category, whatever the frontier is doing.',
        'Enterprise revenue concentrates. A handful of large accounts can carry more of the book than is comfortable.',
      ],
      watching:
        'Members compare it to OpenAI and want to see both before they pick a side. Sourcing looks the same as well: the paper that reaches outside investors is secondary, usually several layers from the cap table, with fees at each layer. Nothing is sourced today.',
      news: [
        {
          title: 'Introducing Claude Opus 5',
          publisher: 'Anthropic',
          url: 'https://www.anthropic.com/news/claude-opus-5',
          date: 'July 24, 2026',
        },
        {
          title:
            'Cognizant and Anthropic expand their partnership to bring Claude to enterprise clients',
          publisher: 'Anthropic',
          url: 'https://www.anthropic.com/news/cognizant-anthropic',
          date: 'July 27, 2026',
        },
        {
          title: 'Our position on open-weights models',
          publisher: 'Anthropic',
          url: 'https://www.anthropic.com/news/position-open-weights-models',
          date: 'July 27, 2026',
        },
      ],
      newsroomUrl: 'https://www.anthropic.com/news',
    },
  },
  {
    slug: 'databricks',
    name: 'Databricks',
    industry: 'data-infrastructure',
    assetClass: 'growth',
    logoUrl: '/databricks-logo.svg',
    description:
      'Data and AI platform built on the lakehouse architecture, used by enterprises to run analytics and machine learning on their own data.',
    marketAverageCents: 12_850,
    marketAverageAsOf: 'Q2 indicative',
    lastRoundLabel: 'Series K',
    lastRoundValuation: 62_000_000_000,
    targetLowCents: 11_800,
    targetHighCents: 13_400,
    minIndication: 10_000,
    baselineInvestors: 274,
    baselineDollars: 5_310_000,
    research: {
      business:
        'Databricks sells the platform enterprises use to store their data and run analytics and AI on top of it, deployed on the cloud the customer already uses. Customers pay for what they consume rather than for seats, and the platform keeps expanding by acquisition into governance, security and adjacent tooling.',
      bull: [
        'It sits where the data already is. Governance, lineage and permissions are the hardest things in a stack to rip out once a company runs on them.',
        'Consumption pricing means revenue grows with the customer’s own workloads instead of with headcount.',
        'Open table formats are a real wedge against warehouse lock-in, and buyers have been asking for that exit for years.',
        'AI is a workload that lives on enterprise data. The platform that governs the data is a plausible place to run it.',
      ],
      bear: [
        'It competes with the clouds it runs on, and with a very well capitalised direct rival, on the same accounts.',
        'Consumption revenue cuts both ways. When budgets tighten, usage falls in the same quarter, with nothing contracted to cushion it.',
        'The acquisition habit widens the surface area. Integration is where platform companies quietly lose years.',
        'Enterprise data has been re-platformed repeatedly. Nothing says the lakehouse is the last architecture.',
        'It has been private a long time, which means a large employee base holding paper and expecting a path to liquidity.',
      ],
      watching:
        'The least glamorous name here and the easiest to check. Enterprise software with named customers, published releases and a long private history leaves a trail you can follow. It is also the one where shares are most likely to come from early holders directly, which is the simplest structure to explain. Nothing is sourced today.',
      news: [
        {
          title:
            'Databricks Completes Acquisition of Panther: Accelerating the Security Lakehouse Era',
          publisher: 'Databricks',
          url: 'https://www.databricks.com/blog/databricks-completes-acquisition-panther-accelerating-security-lakehouse-era',
          date: 'August 3, 2026',
        },
        {
          title: 'Unity AI Gateway is Generally Available',
          publisher: 'Databricks',
          url: 'https://www.databricks.com/blog/unity-ai-gateway-generally-available',
          date: 'August 4, 2026',
        },
        {
          title:
            'Databricks joins the Open Secure AI Alliance to advance AI safety and security',
          publisher: 'Databricks',
          url: 'https://www.databricks.com/blog/databricks-joins-open-secure-ai-alliance-advance-ai-safety-and-security',
          date: 'August 4, 2026',
        },
      ],
      newsroomUrl: 'https://www.databricks.com/blog',
    },
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

/** The tracked companies, in display order. */
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
