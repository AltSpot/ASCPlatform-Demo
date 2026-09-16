/**
 * AltSpot Radar — the private companies AltSpot is tracking.
 *
 * Radar is not the shelf. Nothing here is offered, nothing here is
 * being raised for, and AltSpot holds no position in any of it. These
 * are widely held private companies that members recognize, listed so
 * they can tell us which one they want the community to buy into next
 * and how much they would put behind it. The tally is demand signal
 * that feeds sourcing. It is not an order book.
 *
 * Twenty names, so the board reads as a market rather than a shortlist.
 *
 * WHAT IS REAL AND WHAT IS NOT:
 *   · EVERY COMPANY HERE IS INVENTED (since 2026-09-16). The real
 *     names that were listed are in lib/terminal/radar.archive.txt,
 *     held pending legal approval. Descriptions are one line each,
 *     because the card clamps to two and a sentence cut off by a
 *     clamp reads as a mistake. What the company does, at length, is
 *     in `research.business`.
 *   · `research.news` is REAL or it is EMPTY. A real company's links
 *     point at its own newsroom and were checked to resolve, quoted as
 *     the publisher wrote them. An invented company carries no news
 *     and no newsroom, and the card hides the section. An invented
 *     headline is the one thing this file must never contain.
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
  /** Real, resolvable links, or none. Never an invented one. */
  news: RadarNewsLink[];
  /** The company's own newsroom index. Absent for an invented company. */
  newsroomUrl?: string;
}

/* The taxonomy is shared with deals, so it lives in lib/taxonomy.ts.
   Re-exported here because every Radar call site already imports from
   this module and there is nothing to gain from making them all move. */
import type { Backing } from '../backers';
import type { AssetClass, Industry } from '../taxonomy';
import { compact } from '../format';

export {
  ASSET_CLASSES,
  INDUSTRIES,
  type AssetClass,
  type Industry,
} from '../taxonomy';

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
  /**
   * The deal on the shelf that sources this name, once there is one.
   * This is the Radar loop closing: a member said what they wanted, and
   * the dashboard can tell them it has arrived. Set when the deal is
   * listed, cleared when it closes; never inferred from a matching slug.
   */
  dealId?: string;
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
  /**
   * Who led the company's last round, when it is worth saying. Invented
   * firms from lib/backers.ts; see the DEMO SEAM there.
   */
  backing?: Backing;
}

const COMPANIES: RadarCompany[] = [
  // ------------------------------------------------------------------
  //  TWENTY INVENTED COMPANIES (2026-09-16). None of these exists. The
  //  four real names that were here are in lib/terminal/radar.archive.txt
  //  pending legal approval. Every figure is demo data. Fictional
  //  companies carry no news: an invented headline is the one thing
  //  this file must never hold, so `news` is empty and the card hides
  //  the section.
  // ------------------------------------------------------------------
  {
    slug: 'aurelia',
    name: 'Aurelia Labs',
    industry: 'artificial-intelligence',
    assetClass: 'secondary',
    dealId: 'aurelia',
    description: 'The lab behind the Aurelia assistant, sold to consumers, developers and enterprises.',
    marketAverageCents: 18_400,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Employee tender',
    lastRoundValuation: 200_000_000_000,
    targetLowCents: 16_600,
    targetHighCents: 19_200,
    minIndication: 10_000,
    baselineInvestors: 398,
    baselineDollars: 9_400_000,
    backing: { firm: 'ashgrove', role: 'prior' },
    research: {
      business: 'Aurelia trains frontier models and sells access three ways: a consumer subscription to its assistant, an API developers build on, and enterprise agreements. Serving those models is the largest recurring cost in the business.',
      bull: ['Distribution is the moat. The assistant is the default consumer surface, and defaults are hard to unseat.', 'One body of research is sold three ways, so research cost amortises across all of it.', 'Enterprise adoption moves from pilots to workflows once the model is inside the tools people already use.'],
      bear: ['Capital intensity is the whole story. Compute is committed years ahead of the demand it serves.', 'Frontier capability keeps converging. If models commoditise, the premium moves to distribution or cost.', 'Revenue is concentrated in a small number of products and a small number of infrastructure partners.'],
      watching: 'The most-asked-for name on the platform. AltSpot sourced a block, and it is on the shelf now; votes here still tell us how much more to go and find.',
      news: [],
    },
  },
  {
    slug: 'cinder',
    name: 'Cinder Silicon',
    industry: 'artificial-intelligence',
    assetClass: 'secondary',
    description: 'Inference chips and the software that runs models on them, sold to clouds and large labs.',
    marketAverageCents: 6_120,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series E',
    lastRoundValuation: 28_000_000_000,
    targetLowCents: 5_400,
    targetHighCents: 6_300,
    minIndication: 10_000,
    baselineInvestors: 301,
    baselineDollars: 7_100_000,
    backing: { firm: 'cobaltpeak', role: 'prior' },
    research: {
      business: 'Cinder designs chips built only for running trained models, not training them, and sells them with the compiler and runtime that make a model fast on that hardware. Customers are clouds and the largest labs.',
      bull: ['Inference is where the volume is. Every model is trained once and run billions of times.', 'A purpose-built part beats a general one on cost per token, which is the number buyers compare.', 'The software stack is the lock-in; a customer who has tuned for Cinder does not move casually.'],
      bear: ['The incumbent chip vendor is the best-resourced company in the industry and is not standing still.', 'Foundry capacity is allocated, not bought, and a young company is at the back of the queue.', 'Cloud customers build their own silicon and can stop buying at any time.'],
      watching: 'Late-stage secondaries in semiconductors come up when early investors need liquidity ahead of a listing. We are tracking who holds what. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'ferrule',
    name: 'Ferrule Robotics',
    industry: 'industrials',
    assetClass: 'venture',
    dealId: 'ferrule',
    description: 'Mobile manipulation robots that pick loose, irregular items in logistics warehouses.',
    marketAverageCents: 2_140,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series B',
    lastRoundValuation: 175_000_000,
    targetLowCents: 1_900,
    targetHighCents: 2_200,
    minIndication: 10_000,
    baselineInvestors: 264,
    baselineDollars: 6_300_000,
    research: {
      business: 'Ferrule builds robots that reach into mixed totes and pick single items, the last part of the warehouse still done by hand. It charges per pick, so a customer pays for throughput rather than for hardware.',
      bull: ['Per-pick pricing removes the capital decision. Adding a cell is an operations call, not a board one.', 'Grasp success improves with every site, and Ferrule has more live sites than anyone we can find.', 'The customer base is the largest logistics operators, who standardise once something works.'],
      bear: ['Hardware carries service, warranty and supply exposure that software does not.', 'A handful of logistics customers drive most revenue.', 'Per-pick revenue falls with customer volume in a downturn.'],
      watching: 'The most-voted industrial name on the board for two quarters. AltSpot led the Series B and it is on the shelf now.',
      news: [],
    },
  },
  {
    slug: 'tessellate',
    name: 'Tessellate Data',
    industry: 'data-infrastructure',
    assetClass: 'secondary',
    dealId: 'tessellate',
    description: 'The unified data and AI platform large enterprises run analytics and models on.',
    marketAverageCents: 11_900,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series K',
    lastRoundValuation: 62_000_000_000,
    targetLowCents: 10_800,
    targetHighCents: 12_400,
    minIndication: 10_000,
    baselineInvestors: 240,
    baselineDollars: 5_800_000,
    research: {
      business: 'Tessellate sells a platform for storing, governing and running AI on enterprise data, priced on consumption. It runs on the public clouds and competes with the clouds’ own data products.',
      bull: ['Every enterprise AI project starts with the data, and the data is already here.', 'Consumption pricing on a growing workload; the base grows without a new sale.', 'Cash-flow positive at scale, which is rare at this size.'],
      bear: ['The platforms it runs on are also its competitors.', 'Consumption revenue falls when customers cut workloads.', 'A listing would reprice the private marks in either direction.'],
      watching: 'The least glamorous name here and the easiest to check: named customers, published releases, a long private history. A block is on the shelf now.',
      news: [],
    },
  },
  {
    slug: 'orrery',
    name: 'Orrery Space',
    industry: 'aerospace-defense',
    assetClass: 'venture',
    description: 'Orbital tugs that move, refuel and retire satellites already in space.',
    marketAverageCents: 3_350,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series B',
    lastRoundValuation: 640_000_000,
    targetLowCents: 2_900,
    targetHighCents: 3_400,
    minIndication: 10_000,
    baselineInvestors: 205,
    baselineDollars: 4_900_000,
    backing: { firm: 'sableridge', role: 'prior' },
    research: {
      business: 'Orrery flies small tugs that dock with satellites in orbit to move them, top up their fuel or bring them down at end of life. It sells missions to satellite operators and to governments.',
      bull: ['Tens of thousands of satellites are going up and none of them can service themselves.', 'A mission is sold before it flies, so revenue is visible a year out.', 'Government customers pay for debris removal as a matter of policy, not preference.'],
      bear: ['Every mission is a launch, and launches fail.', 'Insurance and regulatory approval for docking are slow and can stall a manifest.', 'Large satellite operators could build servicing in-house.'],
      watching: 'Space hardware with contracted missions is a rare combination. We are tracking the manifest and who is on it. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'quillon',
    name: 'Quillon Security',
    industry: 'cybersecurity',
    assetClass: 'venture',
    description: 'Identity and access control for the software agents now acting inside companies.',
    marketAverageCents: 1_720,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series B',
    lastRoundValuation: 310_000_000,
    targetLowCents: 1_500,
    targetHighCents: 1_750,
    minIndication: 10_000,
    baselineInvestors: 171,
    baselineDollars: 4_200_000,
    backing: { firm: 'northlight', role: 'prior' },
    research: {
      business: 'Quillon issues, scopes and revokes credentials for AI agents and service accounts the way identity providers do for people. It sells to security teams at large enterprises by seat of agent.',
      bull: ['Agents now outnumber people inside a large company and none of them had an identity system built for them.', 'Security budgets survive downturns.', 'A control plane for agents becomes the place every other tool has to plug into.'],
      bear: ['The large identity vendors can add this as a feature.', 'The category is new, and a new category can stall while buyers decide who owns it.', 'Selling to security teams is slow and reference-driven.'],
      watching: 'The fastest-moving new category in enterprise software this year. We are watching which vendor the large identity platforms partner with rather than build against. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'bramble',
    name: 'Bramble Storage',
    industry: 'energy-climate',
    assetClass: 'venture',
    description: 'Iron-air batteries that store grid power for days rather than hours.',
    marketAverageCents: 2_480,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series C',
    lastRoundValuation: 1_100_000_000,
    targetLowCents: 2_150,
    targetHighCents: 2_500,
    minIndication: 10_000,
    baselineInvestors: 160,
    baselineDollars: 3_800_000,
    backing: { firm: 'cobaltpeak', role: 'prior' },
    research: {
      business: 'Bramble makes batteries from iron, air and water that discharge over several days, and sells them to utilities that need to carry renewable power across a windless week. The chemistry is cheap per kilowatt-hour and slow, which is the point.',
      bull: ['Multi-day storage is the missing piece of a renewable grid and lithium cannot do it economically.', 'Utility contracts run for decades.', 'Iron is the cheapest and most available material there is.'],
      bear: ['Manufacturing at grid scale has not been done yet, and first plants run late.', 'Utility procurement is slow and political.', 'Round-trip efficiency is low, so the economics depend on very cheap input power.'],
      watching: 'Climate hardware that a utility has actually contracted for. We are tracking the first plant and its delivery dates. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'pellucid',
    name: 'Pellucid Diagnostics',
    industry: 'healthcare',
    assetClass: 'growth',
    description: 'AI pathology that reads tissue slides for the labs that diagnose cancer.',
    marketAverageCents: 4_060,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series D',
    lastRoundValuation: 900_000_000,
    targetLowCents: 3_600,
    targetHighCents: 4_100,
    minIndication: 10_000,
    baselineInvestors: 128,
    baselineDollars: 3_100_000,
    backing: { firm: 'halcyon', role: 'prior' },
    research: {
      business: 'Pellucid digitises pathology slides and runs models that flag what a pathologist should look at first. It sells to hospital and reference labs per slide, and to drug developers for trial work.',
      bull: ['There are not enough pathologists, and the shortage is getting worse.', 'Per-slide pricing on a volume that only grows.', 'Regulatory clearances already in hand for the main indications.'],
      bear: ['Reimbursement for AI-assisted reads is still being decided.', 'Hospital IT procurement is measured in years.', 'The large lab chains could build or buy their own.'],
      watching: 'A growth-stage healthcare company with clearances and revenue is exactly what members keep asking for. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'wexley',
    name: 'Wexley',
    industry: 'fintech',
    assetClass: 'secondary',
    description: 'Global payroll and contractor payments for companies hiring in dozens of countries.',
    marketAverageCents: 9_800,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series F',
    lastRoundValuation: 12_000_000_000,
    targetLowCents: 8_600,
    targetHighCents: 9_900,
    minIndication: 10_000,
    baselineInvestors: 112,
    baselineDollars: 2_700_000,
    backing: { firm: 'bellwether', role: 'prior' },
    research: {
      business: 'Wexley runs payroll, benefits and compliance for companies employing people in countries where they have no entity, and takes a fee per employee per month plus a spread on the money it moves.',
      bull: ['Remote hiring across borders is structural, not cyclical.', 'Compliance is the moat: every country is its own rulebook and Wexley has written the software for most of them.', 'Two revenue lines, subscription and payments, on the same customer.'],
      bear: ['Employment law changes can remove a market overnight.', 'Competitors are well funded and price aggressively.', 'Payments float income falls with interest rates.'],
      watching: 'A late-stage fintech with a profitable core. Early investors are looking for liquidity, which is when blocks appear. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'saltmarsh',
    name: 'Saltmarsh Bio',
    industry: 'healthcare',
    assetClass: 'venture',
    description: 'Engineered enzymes made at industrial scale for drug and food manufacturers.',
    marketAverageCents: 2_920,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series C',
    lastRoundValuation: 720_000_000,
    targetLowCents: 2_550,
    targetHighCents: 2_950,
    minIndication: 10_000,
    baselineInvestors: 101,
    baselineDollars: 2_400_000,
    research: {
      business: 'Saltmarsh designs enzymes for specific manufacturing steps and produces them at scale, replacing chemical processes with biological ones. Customers are drug and food manufacturers, sold per kilogram under multi-year supply agreements.',
      bull: ['A biological step is cheaper and cleaner than the chemical one it replaces, so the sale is on cost.', 'Supply agreements run for years once a customer has qualified a process.', 'The design platform gets faster with every enzyme it has built.'],
      bear: ['Qualification into a regulated process takes years.', 'A small number of customers carry most revenue.', 'Fermentation capacity is expensive to build and slow to fill.'],
      watching: 'Industrial biology with signed supply agreements rather than a science story. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'atlasforge',
    name: 'Atlas Forge',
    industry: 'industrials',
    assetClass: 'growth',
    description: 'Metal 3D-printing at production scale for aerospace and energy parts.',
    marketAverageCents: 5_140,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Growth',
    lastRoundValuation: 1_600_000_000,
    targetLowCents: 4_500,
    targetHighCents: 5_200,
    minIndication: 10_000,
    baselineInvestors: 88,
    baselineDollars: 2_100_000,
    backing: { firm: 'sableridge', role: 'prior' },
    research: {
      business: 'Atlas Forge prints metal parts that used to be machined or cast, for aerospace, defense and energy customers, and sells finished parts rather than printers. It is profitable and growing on long-term supply contracts.',
      bull: ['Selling parts, not printers, means the customer never has to learn the technology.', 'Qualified aerospace parts carry decade-long supply commitments.', 'Profitable, so the growth is funded by the business.'],
      bear: ['Capital intensive: every new line is a plant.', 'Aerospace demand is lumpy and program-driven.', 'Traditional machining keeps getting cheaper too.'],
      watching: 'A profitable industrial with contracted demand, which is the kind of growth deal we like to bring. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'harrow',
    name: 'Harrow Labs',
    industry: 'artificial-intelligence',
    assetClass: 'venture',
    description: 'Voice agents that take the calls for field-service and home-repair businesses.',
    marketAverageCents: 1_260,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series A',
    lastRoundValuation: 140_000_000,
    targetLowCents: 1_100,
    targetHighCents: 1_300,
    minIndication: 10_000,
    baselineInvestors: 84,
    baselineDollars: 1_900_000,
    research: {
      business: 'Harrow answers the phone for plumbers, electricians and HVAC companies, books the job and dispatches it. It charges per booked job, so it is paid only when it produces revenue for the customer.',
      bull: ['Missed calls are lost jobs, and small service businesses miss most of them.', 'Paid per booking, so the value is obvious on the customer’s own numbers.', 'A fragmented market with hundreds of thousands of buyers and no incumbent.'],
      bear: ['Voice agents are becoming a commodity feature of every scheduling tool.', 'Small-business churn is high.', 'The model quality it depends on is rented from the labs.'],
      watching: 'Applied AI with a price tied to an outcome. Early, and we are watching retention more than growth. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'lantern',
    name: 'Lantern Health',
    industry: 'healthcare',
    assetClass: 'growth',
    description: 'Primary care clinics for seniors, paid a fixed amount per patient to keep them well.',
    marketAverageCents: 3_780,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series D',
    lastRoundValuation: 2_200_000_000,
    targetLowCents: 3_300,
    targetHighCents: 3_800,
    minIndication: 10_000,
    baselineInvestors: 70,
    baselineDollars: 1_600_000,
    backing: { firm: 'halcyon', role: 'prior' },
    research: {
      business: 'Lantern runs clinics for patients on Medicare Advantage plans and is paid a fixed monthly amount per patient. It keeps what it does not spend, so its business is keeping people out of hospital.',
      bull: ['The payment model rewards exactly the care that patients want more of.', 'Each clinic is a repeatable unit with known economics.', 'Demographics: the patient population grows every year for decades.'],
      bear: ['Government reimbursement rates are set annually and can be cut.', 'A clinic takes years to fill and loses money until it does.', 'Regulatory scrutiny of the payment model is rising.'],
      watching: 'Healthcare services at growth stage, with unit economics you can read clinic by clinic. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'fathom',
    name: 'Fathom Compute',
    industry: 'data-infrastructure',
    assetClass: 'venture',
    description: 'Scheduling software that keeps expensive GPU clusters fully used.',
    marketAverageCents: 1_540,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series B',
    lastRoundValuation: 380_000_000,
    targetLowCents: 1_350,
    targetHighCents: 1_580,
    minIndication: 10_000,
    baselineInvestors: 61,
    baselineDollars: 1_400_000,
    research: {
      business: 'Fathom sells software that schedules training and inference jobs across a company’s GPUs so the hardware sits idle less. It is priced as a share of the compute cost it saves.',
      bull: ['GPUs are the most expensive thing most AI companies own and most of them sit idle a third of the time.', 'Priced on savings, so the sale is arithmetic.', 'Works across clouds, which the clouds’ own tools do not.'],
      bear: ['The clouds and the chip vendor ship schedulers for free.', 'A small number of large customers carry the revenue.', 'If compute gets cheap, the savings shrink with it.'],
      watching: 'Infrastructure software that sells on a number the buyer already tracks. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'marrow',
    name: 'Marrow Foods',
    industry: 'consumer-marketplaces',
    assetClass: 'venture',
    description: 'Dairy proteins made by fermentation, sold to food manufacturers as an ingredient.',
    marketAverageCents: 980,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series B',
    lastRoundValuation: 260_000_000,
    targetLowCents: 850,
    targetHighCents: 1_000,
    minIndication: 10_000,
    baselineInvestors: 55,
    baselineDollars: 1_200_000,
    research: {
      business: 'Marrow makes the proteins in milk without the cow, by fermentation, and sells them by the tonne to food companies that use them in cheese, yoghurt and protein products.',
      bull: ['An ingredient sale to manufacturers, not a consumer brand, so no marketing spend.', 'Price parity with dairy is close on the highest-value proteins.', 'Large food companies have public commitments they need suppliers for.'],
      bear: ['Fermentation capacity is scarce and expensive.', 'Regulatory approval differs by country and takes years.', 'Dairy prices fall too, and the target moves.'],
      watching: 'Consumer biology sold business-to-business. We are watching contracted volume, not press. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'ledgerline',
    name: 'Ledgerline',
    industry: 'fintech',
    assetClass: 'venture',
    description: 'Treasury software for mid-sized companies: cash, forecasting and bank connections in one place.',
    marketAverageCents: 1_120,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series A',
    lastRoundValuation: 95_000_000,
    targetLowCents: 980,
    targetHighCents: 1_150,
    minIndication: 10_000,
    baselineInvestors: 47,
    baselineDollars: 1_000_000,
    research: {
      business: 'Ledgerline connects a company’s bank accounts and shows finance teams where the cash is and where it will be. It sells to companies too big for a spreadsheet and too small for a treasury department, by subscription.',
      bull: ['A large, underserved middle market that the big treasury vendors ignore.', 'Once the banks are connected the product is hard to leave.', 'Finance teams buy in any economy; cash visibility matters more in a bad one.'],
      bear: ['The accounting platforms could add this.', 'Bank connectivity is fragile and expensive to maintain.', 'Small deal sizes mean a long road to scale.'],
      watching: 'Early fintech with a clear buyer and real retention. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'greyloch',
    name: 'Greyloch',
    industry: 'cybersecurity',
    assetClass: 'secondary',
    description: 'Security operations software that investigates and closes alerts without an analyst.',
    marketAverageCents: 7_640,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series F',
    lastRoundValuation: 9_500_000_000,
    targetLowCents: 6_700,
    targetHighCents: 7_700,
    minIndication: 10_000,
    baselineInvestors: 40,
    baselineDollars: 900_000,
    backing: { firm: 'ashgrove', role: 'prior' },
    research: {
      business: 'Greyloch sells a platform that takes the alerts a security team receives, investigates them automatically and closes the ones that are noise. It is late-stage, sells to the largest enterprises and is widely expected to list.',
      bull: ['Security teams cannot hire their way out of alert volume, and this is the tool that absorbs it.', 'Large, sticky enterprise contracts.', 'A listing would give secondary holders a path to liquidity.'],
      bear: ['Every large security vendor is building the same thing.', 'A listing can price below the last private round.', 'Enterprise renewals concentrate risk in a few accounts.'],
      watching: 'Late-stage secondaries appear here when early holders sell ahead of a listing. We are tracking who is selling. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'cairn',
    name: 'Cairn Power',
    industry: 'energy-climate',
    assetClass: 'venture',
    description: 'Power electronics that let datacenters draw more from the same grid connection.',
    marketAverageCents: 1_880,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series B',
    lastRoundValuation: 420_000_000,
    targetLowCents: 1_650,
    targetHighCents: 1_900,
    minIndication: 10_000,
    baselineInvestors: 36,
    baselineDollars: 800_000,
    research: {
      business: 'Cairn builds the converters and controls that sit between a datacenter and the grid, letting an operator run more load through an existing connection and ride through disturbances. It sells hardware with a software subscription.',
      bull: ['Grid connections are the constraint on new datacenters, and this makes an existing one worth more.', 'Hardware plus subscription on a customer that never turns anything off.', 'The buyers are the best-capitalised companies in the world.'],
      bear: ['Utility approval for the equipment is slow and varies by region.', 'The large electrical equipment vendors can compete on price and scale.', 'A slowdown in datacenter building would hit demand immediately.'],
      watching: 'Adjacent to the grid thesis behind our lead deal, from the demand side rather than the study side. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'vireo',
    name: 'Vireo Water',
    industry: 'industrials',
    assetClass: 'venture',
    description: 'Membrane systems that treat industrial wastewater for reuse on site.',
    marketAverageCents: 1_340,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Series B',
    lastRoundValuation: 230_000_000,
    targetLowCents: 1_180,
    targetHighCents: 1_360,
    minIndication: 10_000,
    baselineInvestors: 28,
    baselineDollars: 600_000,
    research: {
      business: 'Vireo installs treatment systems at factories and chip fabs that clean process water for reuse rather than discharge, and is paid per cubic metre treated under long service contracts.',
      bull: ['Water permits are now the constraint on new industrial sites in many regions.', 'Paid per cubic metre for as long as the plant runs.', 'Semiconductor fabs are the most water-intensive buildings being built and there are dozens planned.'],
      bear: ['Each installation is a project with its own engineering risk.', 'Long sales cycles tied to plant construction timelines.', 'Incumbent water companies are large and patient.'],
      watching: 'Industrial infrastructure with contracted service revenue. Nothing is sourced today.',
      news: [],
    },
  },
  {
    slug: 'solenne',
    name: 'Solenne Aerospace',
    industry: 'aerospace-defense',
    assetClass: 'growth',
    description: 'Flat satellite terminals that connect ships, trains and aircraft to orbit.',
    marketAverageCents: 2_760,
    marketAverageAsOf: 'Q3 indicative',
    lastRoundLabel: 'Growth',
    lastRoundValuation: 1_300_000_000,
    targetLowCents: 2_450,
    targetHighCents: 2_800,
    minIndication: 10_000,
    baselineInvestors: 22,
    baselineDollars: 500_000,
    research: {
      business: 'Solenne makes flat, electronically steered antennas that keep moving vehicles connected to satellite networks, and sells them to airlines, shipping lines and rail operators along with a service subscription.',
      bull: ['Every new satellite constellation needs terminals on the ground, and terminals are a smaller, more competitive market than launch.', 'Hardware sold with a recurring service line.', 'Profitable and growing on airline fleet deals.'],
      bear: ['The constellation operators can build their own terminals.', 'Airline capital spending is cyclical.', 'Component supply is concentrated in a few chip suppliers.'],
      watching: 'A profitable growth-stage hardware company in a market with a clear driver. Nothing is sourced today.',
      news: [],
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
  /**
   * Where this name sits in the member's own priority order, 1-indexed,
   * or null if they have never reordered. A display preference, not a
   * claim about the company: Your Radar lets a member drag their names
   * into the order they care about them.
   */
  yourRank: number | null;
}

/** Largest indication the form will take. Guards a fat finger, not a rule. */
export const MAX_INDICATION = 25_000_000;

/**
 * The vote ladder.
 *
 * Radar asks members to vote a name up the board, and the size of the
 * vote is how strongly they mean it. The slider runs the whole range
 * rather than offering four buttons, but it moves between round
 * numbers rather than continuously: nobody means $37,412, and a
 * control that lets you land there reads like a price entry rather
 * than a show of hands.
 *
 * The steps get coarser as the numbers get larger, which is how people
 * actually think about money. $5,000 matters at the bottom of the
 * range and is noise at the top, so the ladder spends its resolution
 * where the difference is real.
 *
 * Every entry is integer dollars, same rule as every other money value
 * in the product.
 */
function ladder(): number[] {
  /* [upper bound, step] pairs, read in order from VOTE_MIN. */
  const bands: [number, number][] = [
    [25_000, 5_000],
    [100_000, 10_000],
    [250_000, 25_000],
    [500_000, 50_000],
    [1_000_000, 100_000],
    [2_500_000, 250_000],
    [5_000_000, 500_000],
  ];

  const stops: number[] = [VOTE_MIN];
  let value = VOTE_MIN;

  for (const [limit, step] of bands) {
    /* Start at the first multiple of this band's step above where the
       last band left off, so every stop is a round number in its own
       band and each band boundary is hit exactly. */
    let next = Math.ceil((value + 1) / step) * step;
    while (next <= limit) {
      stops.push(next);
      value = next;
      next += step;
    }
  }
  return stops;
}

/** Smallest vote the scale offers. The server re-checks it. */
export const VOTE_MIN = 10_000;

/** Largest the scale offers today. MAX_INDICATION still guards the API. */
export const VOTE_MAX = 5_000_000;

/** Every value the slider can land on, ascending. */
export const VOTE_LADDER: number[] = ladder();

/**
 * Where every vote starts. Not the minimum: the minimum reads as the
 * cheapest thing you are allowed to say, and this is a show of hands
 * rather than an order. $25,000 is the number most members land on
 * anyway, so it is the honest default and it is one drag from
 * anywhere.
 */
export const VOTE_DEFAULT = 25_000;

/** Labelled anchors under the scale. Tappable, so the ladder has shortcuts. */
export const VOTE_ANCHORS = [25_000, 100_000, 500_000, 1_000_000, 5_000_000] as const;

/** The ladder index nearest an amount. Used to place an existing vote. */
export function voteIndexOf(amount: number): number {
  let best = 0;
  let distance = Infinity;
  VOTE_LADDER.forEach((stop, index) => {
    const gap = Math.abs(stop - amount);
    if (gap < distance) {
      distance = gap;
      best = index;
    }
  });
  return best;
}

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

/**
 * A per-share price with the cents dropped when they are zero.
 *
 * For the glance strip on the card face, where "$198.00 – $226.00" is
 * two characters too wide to sit beside two other figures. Exact, never
 * rounded: the cents disappear only when there are none.
 */
export function priceCompact(cents: number): string {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact valuation reference: $300B, $62B, $1.4B. The one compactor. */
export function valuationShort(dollars: number): string {
  return compact(dollars);
}
