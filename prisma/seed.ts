/**
 * Marketplace seed.
 *
 * Fees and carry are not per deal: they are the platform's terms, in
 * lib/config.ts (FEE_TERMS, CARRY_PERCENT), and they render only behind
 * SHOW_FEE_TERMS and SHOW_CARRY_TERMS. The fees column is written empty.
 *
 * Calder Grid, the lead deal, is FICTIONAL: it mirrors the shape of a real
 * AltSpot deal package (structure, terms, checkout flow), but the company,
 * its numbers and its story are invented and mirror no real transaction. Every other company on the shelf is
 * invented too, with invented terms. No real company is named on a deal
 * page, no investor is named, no deal page carries a return projection,
 * and no deal carries a figure for any AltSpot or sponsor position
 * (work order screen 18).
 *
 * Idempotent: re-running upserts deals and leaves investor data alone.
 * Use `npm run db:reset` to wipe everything and start clean.
 */
import 'dotenv/config';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';
import { brandArt } from '../lib/brand';
import { defaultMinimumToClose } from '../lib/funding';
import { defaultMinInvestment } from '../lib/minimums';
import { investorCapFor } from '../lib/spv-rules';
import { feeSentence } from '../lib/fees';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./ascplatform.db',
});
const prisma = new PrismaClient({ adapter });

interface Metric {
  k: string;
  v: string;
  note?: string;
}

interface Term {
  k: string;
  v: string;
}

interface SeedDeal {
  id: string;
  name: string;
  entity: string;
  tag: string;
  kind: string;
  sector: string;
  stage: string;
  /** Asset class key from lib/taxonomy.ts. */
  assetClass: string;
  /** Industry key from lib/taxonomy.ts. Null for a multi-deal fund. */
  industry: string | null;
  art: string;
  logoUrl?: string;
  headline: string;
  summary?: string;
  pricePerShare?: string;
  blurb: string;
  risks: string;
  minInvestment: number;
  allocationTotal: number;
  allocationRemaining: number;
  /**
   * Display date the allocation closes. Open deals set `closesInDays`
   * instead and this is computed at seed time, because a fixed string
   * goes stale: a demo database seeded in August was still offering a
   * deal that closed in August when it was opened in October.
   */
  targetClose?: string;
  /** Days from the seed run. Open deals use this; closed deals do not. */
  closesInDays?: number;
  /**
   * Days before the seed run the offering opened to members. Rule 506(b):
   * a member may subscribe only to deals launched after their relationship
   * date, so this decides which deals a newer member sees view-only. Closed
   * deals derive it from targetClose.
   */
  launchedDaysAgo?: number;
  altspotCommitted: number;
  committedNote: string;
  sortOrder: number;
  /** 'open' is the shelf. 'closed' exists only for portfolio history. */
  status?: 'open' | 'closed';
  thesis: string[];
  metrics: Metric[];
  terms: Term[];
  preferredTerms?: Term[];
  whatWeLike?: string[];
  indicators?: Record<string,{value:string;note?:string}>;
  rounds?: Record<string,unknown>[];
  outcomes?: Record<string, unknown>;
  /** Illustrative scenarios (lib/scenarios.ts ScenarioSet). Invented data. */
  scenarios?: Record<string, unknown>;
  media: { type: string; label: string; series: number[]; caption: string };
  charts?: {
    key: string;
    label: string;
    unit: 'usd' | 'usd-k' | 'usd-m' | 'pct' | 'count';
    kind: 'area' | 'bar';
    points: { label: string; value: number }[];
    caption: string;
    source: string;
  }[];
  /** The other firms on the round. See lib/backers.ts. Invented. */
  backing?: { firm: string; role: 'led' | 'co-invest' | 'prior' }[];
  docs: string[];
  spotbot: { q: string; a: string }[];
  deck: {
    kicker: string;
    title: string;
    body: string[];
    stats?: { k: string; v: string }[];
  }[];
}

const DEALS: SeedDeal[] = [
  // ------------------------------------------------------------------
  //  CALDER GRID — fictional lead deal. Invented company, invented
  //  numbers; nothing here mirrors any real AltSpot transaction.
  // ------------------------------------------------------------------
  {
    id: 'calder',
    name: 'Calder Grid',
    entity: 'ASC Calder I, LLC',
    tag: 'AltSpot-led · Series A',
    kind: 'led',
    sector: 'Grid AI · Energy Infrastructure',
    stage: 'Series A Preferred',
    assetClass: 'venture',
    industry: 'energy-climate',
    art: 'linear-gradient(135deg,#0A1322 0%,#14325A 55%,#2E6FD1 115%)',
    logoUrl: '/api/marks/calder.svg',
    headline:
      'The intelligence layer for the electric grid.',
    blurb:
      'Physics-informed AI that compresses the utility interconnection studies every grid project waits on, from months to days.',
    thesis: [
      'The grid is the bottleneck for everything: AI datacenters, electrification, and 2,900 gigawatts of generation and storage waiting in interconnection queues. Every project in that queue needs studies before it connects, and the studies are the chokepoint.',
      'Calder replaces spreadsheet-era power-flow tooling with physics-informed models that produce regulator-ready studies in days instead of months, validated against the same reliability standards utilities are audited on.',
      'The data moat compounds. Every study Calder runs enriches a living model of the transmission system that no point-in-time consultant and no legacy vendor holds. Utility number twelve gets a better product because of the first eleven.',
      'AltSpot is leading the Series A at $30M pre-money, with a board observer seat, monthly financials and direct CEO access. Our investors see what we see.',
    ],
    // The standard set. Gaps are left genuinely empty rather than guessed:
    // they render as "Not disclosed" and are the diligence list to close.
    indicators: {
      revenue: { value: '$2.4M', note: 'Contracted ARR. 11 utilities, 4 top-10 renewable developers.' },
      growth: { value: '3.1x', note: 'Contracted ARR growth, trailing twelve months.' },
      grossMargin: { value: '79%', note: 'Software gross margin.' },
      burn: { value: '~$210K', note: 'Per month. 20+ months of runway post-round.' },
      entryMultiple: { value: '~12.5x', note: '$30M pre-money on $2.4M contracted ARR.' },
    },
    rounds: [
      {
        round: 'Seed',
        date: '2025',
        preMoney: '$12,000,000',
        note: 'Led by a deep-tech seed fund.',
      },
      {
        round: 'Series A',
        date: 'Aug 2026',
        preMoney: '$30,000,000',
        note: 'AltSpot-led. The round on offer.',
        current: true,
      },
    ],
    metrics: [
      { k: 'Contracted ARR', v: '$2.4M', note: '11 utilities · 4 top-10 developers' },
      { k: 'ARR growth', v: '3.1x', note: 'trailing twelve months' },
      { k: 'Study time', v: '6 days', note: 'vs. a 14-month industry median' },
      { k: 'Qualified pipeline', v: '$18M', note: '40+ utilities in procurement' },
      { k: 'Logo retention', v: '100%', note: 'no utility has ever left' },
      { k: 'Gross margin', v: '79%' },
      { k: 'Active interconnection queue', v: '2,900 GW' },
      { k: 'Monthly burn', v: '~$210K', note: 'disciplined, post-revenue' },
    ],
    summary:
      'Calder Grid sells physics-informed AI that runs the interconnection and planning studies the electric grid depends on, compressing a 14-month process into days. Contracted ARR is $2.4M across 11 investor-owned utilities and 4 of the ten largest renewable developers, up 3.1x in twelve months. AltSpot is leading the Series A.',
    whatWeLike: [
      'The buyer has no alternative that is both fast and audit-grade. Consultants are slow, legacy tools predate the engineers using them, and the queue roughly doubles every three years.',
      'Multi-year contracts with 100% logo retention. A utility that files Calder studies with its regulator has made a switching decision measured in decades.',
      'Every study compounds the dataset. Calder holds a living model of the transmission system that gets harder to replicate with each engagement.',
      'Demand is structural. AI datacenter load growth alone underwrites the queue for a decade, and every megawatt needs a study before it connects.',
      'A board observer seat, monthly financials and direct CEO access come with leading the round.',
    ],
    terms: [
      { k: 'Security', v: 'Series A Preferred Stock' },
      { k: 'Pre-money valuation', v: '$30,000,000' },
      { k: 'Round size', v: '$6,000,000' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Pro-rata rights', v: 'Yes' },
      { k: 'Option pool', v: '10% post-money' },
      { k: 'Board rights', v: 'Observer seat held by AltSpot' },
      { k: 'Reporting', v: 'Monthly financials to investors' },
    ],
    /* No return scenarios and no public comparables on a deal page
       (work order screen 18): a multiple beside an ARR figure reads as a
       projection whatever the caveat under it says. */
    outcomes: {},
    /* Illustrative scenarios to counsel's spec (2026-09-17), behind
       SHOW_RETURN_SCENARIOS. INVENTED DATA, invented comparables, for the
       demo only: every name below is fictional and says so. Downside
       first, total loss included, neutral labels, dilution modelled. */
    scenarios: {
      version: '2026-09-17.1',
      asOf: '2026-09-17',
      preparedBy: 'AltSpot Capital (demo environment, illustrative model)',
      numbersFrom:
        'Company-provided revenue plan, not independently verified. Exit values are assumptions, not forecasts.',
      inputs: {
        entryPreMoney: 30_000_000,
        roundSize: 6_000_000,
        spvInvestment: 2_000_000,
        dilutionToExitPercent: 30,
        exitYear: 6,
        basis: 'Equity value of the company at the assumed exit',
        metric: {
          label: 'Contracted ARR, company plan for year 3',
          value: '$9,000,000',
          source: 'Company-provided plan, June 2026. Not independently verified.',
        },
      },
      cases: [
        {
          label: 'Scenario A',
          exitValuation: 0,
          note: 'The company fails or is sold for less than its preferred stack. Nothing is recovered.',
        },
        {
          label: 'Scenario B',
          exitValuation: 45_000_000,
          note: 'Sold near the entry post-money after further dilution.',
        },
        {
          label: 'Scenario C',
          exitValuation: 150_000_000,
          note: 'An acquisition at roughly four times the entry post-money.',
        },
        {
          label: 'Scenario D',
          exitValuation: 400_000_000,
          note: 'A larger strategic outcome. Assumed, not forecast.',
        },
      ],
      comparables: [
        {
          name: 'Halden Grid Systems (fictional)',
          value: '$210M acquisition, 6.1x revenue',
          source: 'Demo data set, invented for the demo environment',
          pulledOn: '2026-09-10',
        },
        {
          name: 'Corbel Analytics (fictional)',
          value: '$95M Series C, 8.4x revenue',
          source: 'Demo data set, invented for the demo environment',
          pulledOn: '2026-09-10',
        },
        {
          name: 'Tallis Interconnect (fictional)',
          value: '$380M acquisition, 5.2x revenue',
          source: 'Demo data set, invented for the demo environment',
          pulledOn: '2026-09-10',
        },
      ],
      comparablesCriteria:
        'Grid and utility software companies acquired or financed between 2023 and 2026 at $50M to $500M, where a revenue figure was disclosed. Every entry is fictional, invented for the demo environment.',
      methodology: [
        'Ownership at close is the SPV investment divided by the post-money valuation.',
        'Ownership at exit applies the assumed dilution from future rounds to ownership at close.',
        'Proceeds in each case are ownership at exit multiplied by the assumed equity value, with no preference or ratchet modelled.',
        'IRR is the annualized multiple over the assumed years from close to exit; no interim distributions are assumed.',
      ],
      limitations: [
        'Exit values, timing and dilution are assumptions. Any of them may prove wrong by a wide margin.',
        'The preferred stack, ratchets, option pool refreshes and pay-to-play terms in later rounds are not modelled and can change outcomes materially.',
        'The revenue plan is the company’s and has not been independently verified.',
        'Comparable data describes other companies at other times and does not describe this one.',
        'Private investments are illiquid; there may be no exit at all.',
      ],
    },
    risks:
      'This is an early-stage venture investment and total loss of capital is possible. The vehicle is a single-purpose entity holding one position, so there is no diversification within it. Specific risks: utility sales cycles are long and budget-driven, and slippage of a few procurements materially changes the growth picture; regulators must continue accepting model-based studies, and a policy reversal would slow adoption; incumbent vendors and large consultancies are well capitalized and could bundle competing tools; and the position is illiquid with no public market and no promised exit timeline.',
    minInvestment: 10000,
    allocationTotal: 2000000,
    allocationRemaining: 640000,
    closesInDays: 19,
    launchedDaysAgo: 26,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 0,
    media: {
      type: 'metric',
      label: 'Contracted ARR',
      series: [150, 290, 480, 760, 1150, 1600, 2000, 2400],
      caption:
        'Contracted ARR in $K by quarter. Contracted figures verified with the company; pipeline is excluded here.',
    },

    /* WHAT A DATA ROOM ACTUALLY CONTAINS.

       Four series, because an investor reads them against each other
       rather than one at a time: revenue rising while margin holds is a
       different company from revenue rising while margin slips, and
       revenue rising without the customer count moving is a different
       one again. Each is tied to the artefact it came from, and each
       lands on a figure that already appears in the indicator set, so
       the chart and the number cannot disagree.

       DEMO SEAM. The quarterly detail is modelled; the end points are
       the figures AltSpot verified with the company. */
    charts: [
      {
        key: 'arr',
        label: 'Contracted ARR',
        unit: 'usd-k',
        kind: 'area',
        points: [
        { label: 'Q1 25', value: 150 },
        { label: 'Q2 25', value: 290 },
        { label: 'Q3 25', value: 480 },
        { label: 'Q4 25', value: 760 },
        { label: 'Q1 26', value: 1150 },
        { label: 'Q2 26', value: 1600 },
        { label: 'Q3 26', value: 2000 },
        { label: 'Q4 26', value: 2400 },
        ],
        caption: 'Signed, recurring, and net of one-time implementation fees.',
        source: 'Revenue schedule, verified against signed contracts',
      },
      {
        key: 'customers',
        label: 'Utilities under contract',
        unit: 'count',
        kind: 'bar',
        points: [
        { label: 'Q1 25', value: 1 },
        { label: 'Q2 25', value: 2 },
        { label: 'Q3 25', value: 3 },
        { label: 'Q4 25', value: 5 },
        { label: 'Q1 26', value: 6 },
        { label: 'Q2 26', value: 8 },
        { label: 'Q3 26', value: 10 },
        { label: 'Q4 26', value: 11 },
        ],
        caption: 'Multi-year agreements only. No utility has left.',
        source: 'Customer schedule and executed contracts',
      },
      {
        key: 'margin',
        label: 'Gross margin',
        unit: 'pct',
        kind: 'area',
        points: [
        { label: 'Q1 25', value: 61 },
        { label: 'Q2 25', value: 64 },
        { label: 'Q3 25', value: 68 },
        { label: 'Q4 25', value: 71 },
        { label: 'Q1 26', value: 73 },
        { label: 'Q2 26', value: 76 },
        { label: 'Q3 26', value: 78 },
        { label: 'Q4 26', value: 79 },
        ],
        caption: 'After compute and delivery. Rising as studies are automated.',
        source: 'Monthly management accounts',
      },
      {
        key: 'pipeline',
        label: 'Qualified pipeline',
        unit: 'usd-m',
        kind: 'bar',
        points: [
        { label: 'Q1 25', value: 2 },
        { label: 'Q2 25', value: 4 },
        { label: 'Q3 25', value: 6 },
        { label: 'Q4 25', value: 9 },
        { label: 'Q1 26', value: 11 },
        { label: 'Q2 26', value: 14 },
        { label: 'Q3 26', value: 16 },
        { label: 'Q4 26', value: 18 },
        ],
        caption: 'In procurement, not contracted. Modelled, not a signed figure.',
        source: 'Sales pipeline report',
      },
    ],
    docs: [
      'Private Placement Memorandum: ASC Calder I, LLC',
      'Subscription Agreement: ASC Calder I, LLC',
      'Operating Agreement: ASC Calder I, LLC',
      'Accredited Investor Questionnaire (Exhibit A)',
      'Funding Instructions',
    ],
    spotbot: [
      {
        q: 'What exactly am I buying?',
        a: 'Class B Common Units in ASC Calder I, LLC, a Delaware special-purpose vehicle formed by AltSpot to hold Series A Preferred Stock in Calder Grid, Inc. You own units in the SPV, not shares of Calder directly, and AltSpot Capital, LLC is the Manager. Subject to Manager acceptance and required documentation. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: `AltSpot organizes and advises the SPV. ${feeSentence()} Not legal, tax, or investment advice.`,
      },
      {
        q: 'What are the biggest risks?',
        a: 'Early-stage loss risk is real and total loss is possible. The vehicle holds one position, so there is no diversification. Utility procurement is slow, and a few slipped contracts change the growth picture. Regulatory acceptance of model-based studies must continue. The position is illiquid with no promised exit. Please read the risk factors in the Memorandum before subscribing.',
      },
      {
        q: 'What makes the data moat real?',
        a: 'Every study Calder runs adds validated detail to a living model of the transmission system: line ratings, congestion behavior, protection settings, study outcomes. That corpus makes the next study faster and more accurate, which wins the next utility, which grows the corpus. A new entrant starts from zero and a consultant starts over on every engagement. Details are in the Memorandum. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'The problem',
        title: 'The grid has a 2,900 gigawatt waiting room.',
        body: [
          'Everything the economy wants to build next, AI datacenters, factories, storage, generation, waits in an interconnection queue. Before anything connects, the utility must study how it affects the grid.',
          'Those studies run on decades-old power-flow tools and consultant spreadsheets. The median study takes 14 months, and the queue roughly doubles every three years.',
        ],
        stats: [
          { k: 'Active queue', v: '2,900 GW' },
          { k: 'Median study time', v: '14 mo' },
          { k: 'Study software TAM', v: '$9B' },
        ],
      },
      {
        kicker: 'The product',
        title: 'Regulator-grade studies in days, not months.',
        body: [
          'Calder runs physics-informed models of the transmission system that produce complete interconnection and planning studies in about six days, validated against the same NERC reliability standards utilities are audited on.',
          'Utilities file Calder studies directly with their regulators. This is not a copilot beside the workflow; it is the workflow.',
        ],
      },
      {
        kicker: 'The moat',
        title: 'Every study makes the next one smarter.',
        body: [
          'Each engagement adds validated grid detail to a living model no legacy vendor or consultant holds: line ratings, congestion behavior, protection settings, outcomes.',
          'The corpus makes the next study faster and more accurate, which wins the next utility, which grows the corpus. Compounding, in software form.',
        ],
      },
      {
        kicker: 'Why now',
        title: 'Load growth broke the old process.',
        body: [
          'For twenty years demand was flat and slow studies were tolerable. AI datacenters and electrification ended that: utilities are now mandated to clear queues they cannot clear with the old tools.',
          'Regulators have begun accepting model-based studies, and the first movers are already filing them.',
        ],
      },
      {
        kicker: 'Unit economics',
        title: 'Utilities sign for years, not projects.',
        body: [
          'Calder sells multi-year platform contracts, not per-study engagements. Logo retention is 100%, and expansion comes from adding study types and service territories.',
          'Gross margin is 79% today and rises with every study the models have already learned from.',
        ],
        stats: [
          { k: 'Logo retention', v: '100%' },
          { k: 'Gross margin', v: '79%' },
          { k: 'Net expansion', v: '135%' },
        ],
      },
      {
        kicker: 'Exit',
        title: 'Critical infrastructure software trades at a premium.',
        body: [
          'Critical-infrastructure software has consolidated steadily, and none of the grid software incumbents owns an AI-native study engine.',
          'Any outcome depends on exit timing, dilution and valuation. Nothing here is a projection.',
        ],
        stats: [
          { k: '$10M ARR', v: '3–4x' },
          { k: '$25M ARR', v: '7–10x' },
          { k: '$50M ARR', v: '14–19x' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  //  The shelf behind the lead: the AltSpot Growth Fund, then invented
  //  late-stage secondaries kept as a picture of the roadmap.
  // ------------------------------------------------------------------
  {
    id: 'growth-fund',
    name: 'AltSpot Growth Fund',
    entity: 'AltSpot Growth Fund I, LLC',
    tag: 'AltSpot fund · Fund I',
    kind: 'fund',
    sector: 'Multi-Deal Fund · Venture',
    stage: 'Fund I · $10M target',
    assetClass: 'fund',
    industry: null,
    art: 'linear-gradient(135deg,#3B2E12 0%,#8F6B25 55%,#C9A14A 100%)',
    logoUrl: '/brand/altspot-logo-black.png',
    headline: 'Every AltSpot-led deal in one commitment.',
    blurb:
      'One vehicle that invests in every AltSpot-led deal of the vintage automatically. One subscription, one K-1.',
    thesis: [
      'One subscription covers the vintage. The fund invests in every deal AltSpot leads over the deployment period, without the investor having to pick.',
      'Diversification is the point. A single early-stage position can go to zero. Ten to fifteen positions across the vintage means no single outcome decides the fund.',
      'AltSpot organizes and advises the fund. Commitments are funded in full at closing, so there are no capital calls.',
    ],
    metrics: [
      { k: 'Fund target', v: '$10M' },
      { k: 'Planned positions', v: '10–15' },
      { k: 'Minimum to close', v: '$5M' },
      { k: 'Deployment period', v: '18 mo' },
    ],
    terms: [
      { k: 'Vehicle', v: 'AltSpot Growth Fund I, LLC' },
      { k: 'Fund target', v: '$10,000,000' },
      { k: 'Deployment', v: '10 to 15 AltSpot-led deals' },
    ],
    risks:
      'The fund invests in early-stage and growth-stage private companies and total loss of capital is possible. Positions are selected by AltSpot during the vintage and are not known in advance, so you are underwriting the process, not a named company. Deployment pace depends on deal flow and may be slower than planned. Fund interests are illiquid with no secondary market and no promised exit timeline.',
    minInvestment: 25000,
    allocationTotal: 10000000,
    allocationRemaining: 6900000,
    closesInDays: 47,
    launchedDaysAgo: 13,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 3,
    media: {
      type: 'metric',
      label: 'Capital committed',
      series: [1.0, 1.4, 1.9, 2.4, 3.1],
      caption:
        'Committed capital in $M since the fund opened. Source: fund records.',
    },
    docs: [
      'Private Placement Memorandum: AltSpot Growth Fund I, LLC',
      'Subscription Agreement: AltSpot Growth Fund I, LLC',
      'Limited Liability Company Agreement',
      'Accredited Investor Questionnaire (Exhibit A)',
      'Funding Instructions',
    ],
    spotbot: [
      {
        q: 'What exactly am I buying?',
        a: 'Membership interests in AltSpot Growth Fund I, LLC, a $10M vehicle organized and advised by AltSpot. The fund invests in each AltSpot-led deal during the deployment period. You own interests in the fund, not shares of the underlying companies. Subject to Manager acceptance and required documentation. Not legal, tax, or investment advice.',
      },
      {
        q: 'Are there capital calls?',
        a: 'No. Your commitment is funded in full at closing and deployed by the fund from there. There are no capital calls on this fund or anywhere on AltSpot, and no annual fees. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: `${feeSentence()} Charged once at the fund level rather than per position. Not legal, tax, or investment advice.`,
      },
    ],
    deck: [
      {
        kicker: 'The structure',
        title: 'One commitment. The whole vintage.',
        body: [
          'The fund subscribes to every AltSpot-led deal during the deployment period, on the terms each deal is offered at. Investors get the vintage without picking, and without watching the marketplace for each close.',
          'Commitments are funded in full at closing. No capital calls, one K-1.',
        ],
        stats: [
          { k: 'Fund target', v: '$10M' },
          { k: 'Planned positions', v: '10–15' },
        ],
      },
      {
        kicker: 'Why a fund',
        title: 'The portfolio does the work one deal cannot.',
        body: [
          'Early-stage outcomes are skewed: a small number of positions drive the result, and any single one can go to zero. Spreading a commitment across the vintage is the structural answer.',
        ],
      },
    ],
  },
  // ------------------------------------------------------------------
  //  THE TWO SECONDARIES. Invented companies standing in for the real
  //  names that were here (see prisma/archive/real-companies.seed.txt, held
  //  pending legal approval). Same shape, same structure, demo numbers.
  // ------------------------------------------------------------------
  {
    id: 'aurelia',
    name: 'Aurelia Labs',
    entity: 'ASC Aurelia SPV, LLC',
    tag: 'Late-stage secondary',
    kind: 'secondary',
    sector: 'Foundation Models · Consumer AI',
    stage: 'Late stage · issuer-approved',
    assetClass: 'secondary',
    industry: 'artificial-intelligence',
    art: 'linear-gradient(135deg,#F7F4EC 0%,#E9E2D2 55%,#CDBFA2 115%)',
    headline: 'The assistant a quarter of the internet talks to, below its last tender.',
    blurb:
      'A secondary interest in Aurelia Labs, the lab behind the Aurelia assistant and the models it sells to consumers, developers and enterprises.',
    summary:
      'Aurelia Labs trains frontier models and sells them three ways: a consumer assistant with several hundred million weekly users, an API developers build on, and enterprise agreements. The SPV is buying this block from an early employee with issuer approval and full transfer documentation, at an implied $180B, a 10% discount to the spring employee tender.',
    thesis: [
      'Distribution at this scale is the hardest thing in software to replicate. The assistant is the default, and defaults are sticky.',
      'One body of research sold three ways. Research cost amortises across consumer, developer and enterprise revenue.',
      'Issuer-approved transfer at a real discount. No forwards, no synthetic exposure. The SPV holds the shares.',
    ],
    indicators: {
      revenue: { value: '~$9B', note: 'Annualized, reported.' },
      growth: { value: '2.4x', note: 'Annualized revenue, year over year.' },
      grossMargin: { value: 'Not disclosed' },
      burn: { value: 'Not disclosed', note: 'Compute commitments are the dominant cost.' },
      entryMultiple: { value: '~20x', note: '$180B implied on ~$9B annualized revenue.' },
    },
    rounds: [
      { round: 'Employee tender', date: 'Apr 2026', preMoney: '$200,000,000,000', note: 'Last price reference.' },
      { round: 'Secondary', date: 'Sep 2026', preMoney: '$180,000,000,000', note: 'AltSpot entry, 10% below the tender.', current: true },
    ],
    metrics: [
      { k: 'Implied valuation', v: '$180B' },
      { k: 'Discount to last tender', v: '10%' },
      { k: 'Weekly users', v: '400M+', note: 'reported' },
      { k: 'Annualized revenue', v: '~$9B', note: 'reported' },
    ],
    terms: [
      { k: 'Security', v: 'Common stock (secondary)' },
      { k: 'Implied valuation', v: '$180,000,000,000' },
      { k: 'Transfer', v: 'Issuer-approved under ROFR' },
    ],
    whatWeLike: [
      'The consumer default for AI, with a developer platform behind it.',
      'A discount that comes from the seller’s timetable, not from the company.',
      'Clean title through an approved transfer, held in one vehicle.',
    ],
    outcomes: {},
    risks:
      'Late-stage does not mean low-risk: the entry price is set by private-market marks that can fall, the company does not disclose audited financials to secondary holders, compute spending is enormous and ongoing, and frontier capability keeps converging across labs. The interest is illiquid until a realization event, and no IPO is scheduled or promised. Total loss of capital is possible.',
    minInvestment: 10000,
    allocationTotal: 3000000,
    allocationRemaining: 480000,
    closesInDays: 12,
    launchedDaysAgo: 44,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 1,
    media: { type: 'metric', label: 'Entry vs. last tender', series: [90, 100], caption: 'AltSpot entry indexed against the April 2026 employee tender (100).' },
    docs: ['Investment Memo: Aurelia Labs Secondary (AltSpot)', 'Subscription Agreement: ASC Aurelia SPV', 'Transfer & Issuer Approval Summary', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'What exactly am I buying?', a: 'Membership interests in ASC Aurelia SPV, LLC, a special purpose vehicle holding Aurelia Labs shares acquired in an issuer-approved secondary transfer. You own interests in the SPV, not the stock directly. Not legal, tax, or investment advice.' },
      { q: 'How was the price set?', a: 'AltSpot negotiated the block at an implied $180B, a 10% discount to the April 2026 employee tender. Discounts on approved secondaries reflect illiquidity and transfer friction, not a view on the company. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  {
    id: 'tessellate',
    name: 'Tessellate Data',
    entity: 'ASC Tessellate SPV, LLC',
    tag: 'Late-stage secondary',
    kind: 'secondary',
    sector: 'Data Platform · Enterprise AI',
    stage: 'Late stage · issuer-approved',
    assetClass: 'secondary',
    industry: 'data-infrastructure',
    art: 'linear-gradient(135deg,#140A08 0%,#4A1E14 55%,#B0432A 115%)',
    headline: 'The data platform underneath the enterprise AI build-out.',
    blurb:
      'A secondary interest in Tessellate, the unified data and AI platform that large enterprises run analytics and models on.',
    summary:
      'Tessellate sells the platform enterprises use to store, govern and run AI on their own data. Annualized revenue is about $3.2B, growing over 50% a year, with net revenue retention above 140%. The SPV is buying this block from an early investor with issuer approval at an implied $54B, a 12% discount to the last primary round.',
    thesis: [
      'Every enterprise AI project starts with the data, and the data is already on Tessellate.',
      'Consumption pricing on a growing workload. Retention above 140% means the base grows without a new sale.',
      'A 12% discount to the last round for the same shares, through an approved transfer.',
    ],
    indicators: {
      revenue: { value: '~$3.2B', note: 'Annualized, reported.' },
      growth: { value: '1.5x', note: 'Year over year.' },
      grossMargin: { value: '~78%', note: 'Reported, subscription.' },
      burn: { value: 'Cash-flow positive', note: 'Reported.' },
      entryMultiple: { value: '~17x', note: '$54B implied on ~$3.2B annualized revenue.' },
    },
    rounds: [
      { round: 'Series K', date: '2025', preMoney: '$62,000,000,000', note: 'Last primary round.' },
      { round: 'Secondary', date: 'Sep 2026', preMoney: '$54,000,000,000', note: 'AltSpot entry, 12% below the Series K.', current: true },
    ],
    metrics: [
      { k: 'Implied valuation', v: '$54B' },
      { k: 'Discount to last round', v: '12%' },
      { k: 'Annualized revenue', v: '~$3.2B' },
      { k: 'Net revenue retention', v: '140%+' },
    ],
    terms: [
      { k: 'Security', v: 'Common stock (secondary)' },
      { k: 'Implied valuation', v: '$54,000,000,000' },
      { k: 'Transfer', v: 'Issuer-approved under ROFR' },
    ],
    whatWeLike: [
      'Consumption revenue on the workload every enterprise is adding.',
      'Cash-flow positive at scale, which is rare for a private company this size.',
      'Clean title through an approved transfer.',
    ],
    outcomes: {},
    risks:
      'Late-stage does not mean low-risk: private marks can fall, the company does not disclose audited financials to secondary holders, the cloud platforms it runs on are also its competitors, and consumption revenue falls when customers cut workloads. The interest is illiquid until a realization event, with no IPO scheduled or promised. Total loss of capital is possible.',
    minInvestment: 10000,
    allocationTotal: 2500000,
    allocationRemaining: 900000,
    closesInDays: 26,
    launchedDaysAgo: 30,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 8,
    media: { type: 'metric', label: 'Entry vs. last round', series: [88, 100], caption: 'AltSpot entry indexed against the Series K (100).' },
    docs: ['Investment Memo: Tessellate Secondary (AltSpot)', 'Subscription Agreement: ASC Tessellate SPV', 'Transfer & Issuer Approval Summary', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'What exactly am I buying?', a: 'Membership interests in ASC Tessellate SPV, LLC, a special purpose vehicle holding Tessellate shares acquired in an issuer-approved secondary transfer. You own interests in the SPV, not the stock directly. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  // ------------------------------------------------------------------
  //  THE WIDER SHELF (added 2026-09-16). Six invented companies so the
  //  marketplace reads as a market: three venture rounds from seed to
  //  Series C, one growth-equity round and two late-stage secondaries.
  //  Every name, number and quote is demo data. Nothing here mirrors a
  //  real AltSpot transaction and none of these companies exists.
  // ------------------------------------------------------------------
  {
    id: 'ferrule',
    name: 'Ferrule Robotics',
    entity: 'ASC Ferrule I, LLC',
    tag: 'AltSpot-led · Series B',
    kind: 'led',
    sector: 'Warehouse Robotics · Industrials',
    stage: 'Series B Preferred',
    assetClass: 'venture',
    industry: 'industrials',
    art: 'linear-gradient(135deg,#1A1208 0%,#4A3312 55%,#A8772A 115%)',
    headline: 'Robot hands that pick what conveyor belts cannot.',
    blurb:
      'Mobile manipulation robots that pick loose, irregular items in third-party logistics warehouses, sold per pick rather than per robot.',
    summary:
      'Ferrule builds mobile manipulation robots for the part of the warehouse automation has never reached: loose, irregular items in mixed totes. It sells per pick, so a customer pays for throughput rather than hardware. Fleet revenue is $9.1M annualized across 14 sites, up 2.6x in twelve months, and three of the five largest third-party logistics operators are in paid pilots. Ferrule was the most-voted industrial name on the Radar before AltSpot sourced the round.',
    thesis: [
      'Every warehouse automation vendor stops at the tote. The last step, a hand reaching in for one item among many, is still a person, and it is the most expensive labour in the building.',
      'Per-pick pricing removes the capital decision. An operator adds a cell the way they add a shift, which is why pilots convert without a board approval cycle.',
      'The picking model improves with every site. Fourteen live deployments have produced a grasp dataset no lab can assemble, and the rate of first-attempt success is the moat.',
    ],
    indicators: {
      revenue: { value: '$9.1M', note: 'Annualized fleet revenue, 14 sites.' },
      growth: { value: '2.6x', note: 'Annualized revenue growth, trailing twelve months.' },
      grossMargin: { value: '48%', note: 'Blended, hardware amortized over pick revenue.' },
      burn: { value: '~$1.4M', note: 'Per month. 26 months of runway post-round.' },
      entryMultiple: { value: '~15x', note: '$140M pre-money on $9.1M annualized revenue.' },
    },
    rounds: [
      { round: 'Seed', date: '2023', preMoney: '$14,000,000', note: 'Robotics-focused seed fund led.' },
      { round: 'Series A', date: '2025', preMoney: '$52,000,000' },
      { round: 'Series B', date: 'Sep 2026', preMoney: '$140,000,000', note: 'AltSpot leading.', current: true },
    ],
    metrics: [
      { k: 'Annualized revenue', v: '$9.1M', note: '14 live sites' },
      { k: 'First-pick success', v: '97.4%', note: 'fleet average, trailing quarter' },
      { k: 'Picks per hour', v: '410', note: 'vs. ~180 for a manual picker' },
      { k: 'Pilots converting', v: '3 of 5', note: 'top-five 3PLs' },
    ],
    terms: [
      { k: 'Security', v: 'Series B Preferred Stock' },
      { k: 'Pre-money valuation', v: '$140,000,000' },
      { k: 'Round size', v: '$35,000,000' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Pro-rata rights', v: 'Yes' },
      { k: 'Board rights', v: 'Observer seat held by AltSpot' },
    ],
    whatWeLike: [
      'The customer pays for outcomes, not machines, so procurement is an operations decision rather than a capital one.',
      'Grasp success compounds with deployments, and Ferrule has more live sites than any competitor we can find.',
      'Members asked for this one. It was the most-voted industrial name on the Radar for two quarters.',
    ],
    outcomes: {},
    risks:
      'Early-stage venture. Total loss of capital is possible. Hardware businesses carry supply, service and warranty exposure that software does not; a small number of logistics customers drive most revenue; per-pick pricing means revenue falls with customer volume; and the position is illiquid with no promised exit.',
    minInvestment: 10000,
    allocationTotal: 2500000,
    allocationRemaining: 1650000,
    closesInDays: 27,
    launchedDaysAgo: 9,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 2,
    media: { type: 'metric', label: 'Annualized revenue', series: [900, 1400, 2100, 3500, 4600, 6200, 7800, 9100], caption: 'Annualized fleet revenue by quarter, $K. Source: monthly management accounts.' },
    charts: [
      { key: 'rev', label: 'Annualized revenue', unit: 'usd-k', kind: 'area', points: [['Q4 24', 900], ['Q1 25', 1400], ['Q2 25', 2100], ['Q3 25', 3500], ['Q4 25', 4600], ['Q1 26', 6200], ['Q2 26', 7800], ['Q3 26', 9100]].map(([label, value]) => ({ label: label as string, value: value as number })), caption: 'Fleet revenue, annualized from the last month of each quarter.', source: 'Monthly management accounts' },
      { key: 'sites', label: 'Live sites', unit: 'count', kind: 'bar', points: [['Q4 24', 2], ['Q1 25', 3], ['Q2 25', 4], ['Q3 25', 6], ['Q4 25', 8], ['Q1 26', 10], ['Q2 26', 12], ['Q3 26', 14]].map(([label, value]) => ({ label: label as string, value: value as number })), caption: 'Sites with at least one cell in paid production.', source: 'Deployment log' },
    ],
    backing: [{ firm: 'northlight', role: 'co-invest' }],
    docs: ['Investment Memo: Ferrule Robotics Series B', 'Subscription Agreement: ASC Ferrule I', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'Why did AltSpot pick this one?', a: 'Members did, first. Ferrule was the most-voted industrial name on the Radar for two quarters, and the company invited AltSpot to lead the round. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  {
    id: 'loomline',
    name: 'Loomline Health',
    entity: 'ASC Loomline I, LLC',
    tag: 'AltSpot-led · Series A',
    kind: 'led',
    sector: 'Cardiac Monitoring · Healthcare',
    stage: 'Series A Preferred',
    assetClass: 'venture',
    industry: 'healthcare',
    art: 'linear-gradient(135deg,#1B0D10 0%,#5A1F2A 55%,#B4475A 115%)',
    headline: 'The cardiologist’s inbox, triaged before it fills.',
    blurb:
      'Wearable cardiac monitoring with a clinical triage layer, sold to cardiology groups that are paid to keep patients out of hospital.',
    summary:
      'Loomline pairs a two-week wearable patch with a triage service that reads the data and escalates only what a cardiologist needs to see. It sells to cardiology groups paid under value-based contracts, where a prevented admission is revenue. Twenty-two practices are live, contracted revenue is $3.6M and net revenue retention is 138%.',
    thesis: [
      'Cardiology groups are moving onto contracts that pay for outcomes, and an outcome contract turns monitoring from a cost into the way the money is earned.',
      'The triage layer is the product. Raw monitoring data is a liability for a clinic; a short list of what matters is what they will pay for.',
      'Reimbursement already exists for the patch. Loomline is not waiting on a coverage decision to sell.',
    ],
    indicators: {
      revenue: { value: '$3.6M', note: 'Contracted annual revenue, 22 practices.' },
      growth: { value: '2.9x', note: 'Contracted revenue growth, trailing twelve months.' },
      grossMargin: { value: '61%', note: 'After patch cost and clinical staff.' },
      burn: { value: '~$480K', note: 'Per month. 22 months of runway post-round.' },
      entryMultiple: { value: '~11x', note: '$40M pre-money on $3.6M contracted revenue.' },
    },
    rounds: [
      { round: 'Seed', date: '2024', preMoney: '$9,000,000', note: 'Digital-health seed fund led.' },
      { round: 'Series A', date: 'Sep 2026', preMoney: '$40,000,000', note: 'AltSpot leading.', current: true },
    ],
    metrics: [
      { k: 'Contracted revenue', v: '$3.6M', note: '22 cardiology groups' },
      { k: 'Net revenue retention', v: '138%' },
      { k: 'Patients monitored', v: '18,400', note: 'trailing twelve months' },
      { k: 'Escalation rate', v: '4.1%', note: 'of monitored patients' },
    ],
    terms: [
      { k: 'Security', v: 'Series A Preferred Stock' },
      { k: 'Pre-money valuation', v: '$40,000,000' },
      { k: 'Round size', v: '$12,000,000' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Pro-rata rights', v: 'Yes' },
    ],
    whatWeLike: [
      'The buyer is paid to want this. Under an outcome contract, every avoided admission is margin, and monitoring is how they find it.',
      'Retention above 130% with no salesforce to speak of: practices add patients, not seats.',
      'Existing reimbursement for the device means the sale is clinical, not political.',
    ],
    outcomes: {},
    risks:
      'Early-stage venture. Total loss of capital is possible. Clinical services carry regulatory, liability and staffing risk; reimbursement rates can change; practice consolidation can concentrate the customer base; and the position is illiquid with no promised exit.',
    minInvestment: 10000,
    allocationTotal: 1500000,
    allocationRemaining: 1120000,
    closesInDays: 33,
    launchedDaysAgo: 22,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 3,
    media: { type: 'metric', label: 'Contracted revenue', series: [300, 520, 800, 1240, 1700, 2300, 2950, 3600], caption: 'Contracted annual revenue by quarter, $K.' },
    backing: [{ firm: 'bellwether', role: 'co-invest' }],
    docs: ['Investment Memo: Loomline Health Series A', 'Subscription Agreement: ASC Loomline I', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'Is this a device company or a software company?', a: 'Both, and that is the point of it. The patch is reimbursed hardware; the triage service is what the practice actually buys. Margin comes from the service. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  {
    id: 'basalt',
    name: 'Basalt Materials',
    entity: 'ASC Basalt I, LLC',
    tag: 'AltSpot-led · Seed',
    kind: 'led',
    sector: 'Low-carbon Cement · Industrials',
    stage: 'Seed Preferred',
    assetClass: 'venture',
    industry: 'industrials',
    art: 'linear-gradient(135deg,#0F0F0E 0%,#3A3934 55%,#8C8677 115%)',
    headline: 'Cement that pours the same and pollutes a fraction.',
    blurb:
      'A drop-in cement binder made from steel slag and captured CO2, produced on the customer’s site, certified to the same codes as Portland cement.',
    summary:
      'Basalt makes a cement binder from steel slag and captured carbon dioxide that meets the same building codes as Portland cement and pours the same way. The plant sits at the customer’s ready-mix site, so nothing is shipped. The first commercial plant has run for nine months at a Texas ready-mix operator; two more are contracted. This is the earliest-stage deal on the shelf and is sized accordingly.',
    thesis: [
      'Cement is eight percent of global emissions and nobody in the supply chain can change it without a product that passes the same code as the old one. Basalt’s does.',
      'On-site production turns a logistics business into a licensing one. The plant is small, the feedstock is local and the customer already owns the trucks.',
      'Steel slag is a disposal cost today. Basalt is paid to take it.',
    ],
    indicators: {
      revenue: { value: '$0.8M', note: 'Trailing twelve months, one commercial plant.' },
      growth: { value: 'n/a', note: 'First commercial year.' },
      grossMargin: { value: '34%', note: 'At one plant. Modelled at 55% with three.' },
      burn: { value: '~$320K', note: 'Per month. 24 months of runway post-round.' },
      entryMultiple: { value: 'n/a', note: 'Pre-revenue pricing; see the memo.' },
    },
    rounds: [
      { round: 'Pre-seed', date: '2025', preMoney: '$6,000,000', note: 'University spin-out, grant-backed.' },
      { round: 'Seed', date: 'Sep 2026', preMoney: '$18,000,000', note: 'AltSpot leading.', current: true },
    ],
    metrics: [
      { k: 'Plants contracted', v: '3', note: 'one live, two in build' },
      { k: 'Emissions vs. Portland', v: '-71%', note: 'third-party verified' },
      { k: 'Code certification', v: 'ASTM C1157', note: 'passed, all grades' },
    ],
    terms: [
      { k: 'Security', v: 'Seed Preferred Stock' },
      { k: 'Pre-money valuation', v: '$18,000,000' },
      { k: 'Round size', v: '$7,000,000' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Pro-rata rights', v: 'Yes' },
    ],
    whatWeLike: [
      'It passes the same test as the incumbent. Every other low-carbon cement asks the customer to change something.',
      'Feedstock the customer is currently paying to dispose of.',
      'A small round, sized to the stage. This is the seed deal on the shelf and is priced like one.',
    ],
    outcomes: {},
    risks:
      'Seed-stage venture, the earliest on the shelf. Total loss of capital is the most likely single outcome for a company at this stage. Process scale-up can fail; construction customers are conservative and slow; steel slag supply depends on a small number of mills; and the position is illiquid with no promised exit.',
    minInvestment: 10000,
    allocationTotal: 750000,
    allocationRemaining: 410000,
    closesInDays: 41,
    launchedDaysAgo: 15,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 5,
    media: { type: 'metric', label: 'Tonnes produced', series: [0, 0, 40, 180, 420, 760, 1100, 1500], caption: 'Binder produced per quarter, tonnes.' },
    backing: [{ firm: 'cobaltpeak', role: 'co-invest' }],
    docs: ['Investment Memo: Basalt Materials Seed', 'Subscription Agreement: ASC Basalt I', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'Why is the allocation so small?', a: 'Because the round is. A seed round of $7M does not have room for a $2M allocation, and AltSpot sizes its share to the stage. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  // ------------------------------------------------------------------
  //  MERIDEL BIO — the biotech deal (Tyler, 2026-09-17). Invented.
  // ------------------------------------------------------------------
  {
    id: 'meridel',
    name: 'Meridel Bio',
    entity: 'ASC Meridel I, LLC',
    tag: 'AltSpot-led · Series A',
    kind: 'led',
    sector: 'Enzyme Therapeutics · Biotech',
    stage: 'Series A Preferred',
    assetClass: 'venture',
    industry: 'healthcare',
    art: 'linear-gradient(135deg,#061A14 0%,#12483A 55%,#5EE0B5 115%)',
    headline: 'Enzymes that replace a missing one, made to last a month.',
    blurb:
      'Engineered replacement enzymes for rare metabolic disorders, built to stay active for weeks so patients dose monthly instead of weekly.',
    summary:
      'Meridel engineers replacement enzymes for rare inherited metabolic disorders, where the body cannot make one enzyme and patients today take weekly infusions for life. Its platform stabilises the enzyme so a single dose stays active for about a month. The lead programme finished a Phase 1 safety study this year and enters Phase 2 with this round. This is a biotech investment: its value turns on clinical results that have not happened yet.',
    thesis: [
      'Weekly infusion for life is the standard of care in these disorders. A monthly dose changes what treatment asks of a patient.',
      'The platform is the asset: the same stabilising approach applies across a family of enzyme deficiencies.',
      'Rare disease programmes carry orphan designation, which shortens review and extends exclusivity.',
    ],
    indicators: {
      revenue: { value: 'n/a', note: 'Clinical stage. No product revenue.' },
      growth: { value: 'n/a', note: 'Clinical stage.' },
      grossMargin: { value: 'n/a', note: 'Clinical stage.' },
      burn: { value: '~$1.1M', note: 'Per month. Funds Phase 2 readout.' },
      entryMultiple: { value: 'n/a', note: 'Priced on the programme; see the memo.' },
    },
    rounds: [
      { round: 'Seed', date: '2024', preMoney: '$14,000,000', note: 'Academic spin-out.' },
      { round: 'Series A', date: 'Sep 2026', preMoney: '$48,000,000', note: 'AltSpot leading.', current: true },
    ],
    metrics: [
      { k: 'Lead programme', v: 'Phase 2', note: 'entering with this round' },
      { k: 'Dosing interval', v: '~28 days', note: 'Phase 1, vs weekly today' },
      { k: 'Programmes', v: '3', note: 'one clinical, two preclinical' },
    ],
    terms: [
      { k: 'Security', v: 'Series A Preferred Stock' },
      { k: 'Pre-money valuation', v: '$48,000,000' },
      { k: 'Round size', v: '$22,000,000' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Pro-rata rights', v: 'Yes' },
    ],
    whatWeLike: [
      'A clear clinical question with a readout inside the time this round funds.',
      'One platform, several programmes, so a single result is not the whole company.',
      'Orphan indications, where the path to approval is narrower and better defined.',
    ],
    outcomes: {},
    risks:
      'Clinical-stage biotech. Total loss of capital is possible and common at this stage. The Phase 2 study can fail on safety or efficacy; manufacturing a stabilised enzyme at scale is unproven; regulators can require more trials than planned; rare disease markets are small; and the position is illiquid with no promised exit.',
    minInvestment: 10000,
    allocationTotal: 2200000,
    allocationRemaining: 1600000,
    closesInDays: 44,
    launchedDaysAgo: 6,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 6,
    media: { type: 'metric', label: 'Patients dosed', series: [0, 4, 9, 14, 18], caption: 'Phase 1 participants dosed, cumulative.' },
    docs: ['Investment Memo: Meridel Bio Series A', 'Subscription Agreement: ASC Meridel I', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'What has to go right?', a: 'The Phase 2 study. This round funds it to a readout, and the value of the company turns on that result. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  {
    id: 'kestrel',
    name: 'Kestrel Autonomy',
    entity: 'ASC Kestrel I, LLC',
    tag: 'Partner-led · Series C',
    kind: 'led',
    sector: 'Autonomous ISR · Aerospace & Defense',
    stage: 'Series C Preferred',
    assetClass: 'venture',
    industry: 'aerospace-defense',
    art: 'linear-gradient(135deg,#0B0F14 0%,#1C2B3A 55%,#4F7A9C 115%)',
    headline: 'Long-endurance drones that fly themselves and report back.',
    blurb:
      'Autonomous long-endurance aircraft and the software that turns their sensor feeds into reports, sold to allied governments on multi-year programs of record.',
    summary:
      'Kestrel builds long-endurance autonomous aircraft and the analysis software behind them, and sells both under multi-year government programs. Backlog is $210M across four allied customers, revenue was $58M last year and the company is approaching breakeven. AltSpot is co-investing alongside the round’s lead with a negotiated allocation.',
    thesis: [
      'Programs of record are the rarest revenue in private markets: multi-year, funded and slow to change. Kestrel holds four.',
      'The aircraft is the door; the software is the business. Analysis is licensed per feed and outlives the airframe.',
      'This is the latest-stage venture round on the shelf, with revenue and backlog that most Series C companies do not have.',
    ],
    indicators: {
      revenue: { value: '$58M', note: 'Fiscal 2025, audited.' },
      growth: { value: '1.8x', note: 'Year over year.' },
      grossMargin: { value: '52%', note: 'Blended aircraft and software.' },
      burn: { value: '~$0.9M', note: 'Per month, approaching breakeven.' },
      entryMultiple: { value: '~9x', note: '$520M pre-money on $58M revenue.' },
    },
    rounds: [
      { round: 'Series A', date: '2022', preMoney: '$60,000,000' },
      { round: 'Series B', date: '2024', preMoney: '$210,000,000' },
      { round: 'Series C', date: 'Sep 2026', preMoney: '$520,000,000', note: 'AltSpot co-investing with the lead.', current: true },
    ],
    metrics: [
      { k: 'Backlog', v: '$210M', note: 'four programs of record' },
      { k: 'Revenue, FY25', v: '$58M', note: 'audited' },
      { k: 'Aircraft in service', v: '46' },
      { k: 'Software attach', v: '100%', note: 'every airframe carries a licence' },
    ],
    terms: [
      { k: 'Security', v: 'Series C Preferred Stock' },
      { k: 'Pre-money valuation', v: '$520,000,000' },
      { k: 'Round size', v: '$90,000,000' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Information rights', v: 'Quarterly financials' },
    ],
    whatWeLike: [
      'Funded, multi-year government backlog that does not depend on a sales quarter.',
      'Software licensed per feed, so revenue grows with usage rather than only with new aircraft.',
      'A late venture round priced on real revenue, not on a story.',
    ],
    outcomes: {},
    risks:
      'Venture investment. Total loss of capital is possible. Government programs can be cut, delayed or rebid; export rules limit which customers can buy; the company holds concentrated customer exposure; defense investing carries reputational and regulatory considerations that some members may wish to weigh; and the position is illiquid with no promised exit.',
    minInvestment: 25000,
    allocationTotal: 4000000,
    allocationRemaining: 2300000,
    closesInDays: 16,
    launchedDaysAgo: 42,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 4,
    media: { type: 'metric', label: 'Backlog', series: [40, 55, 70, 95, 120, 150, 180, 210], caption: 'Contracted backlog by quarter, $M.' },
    backing: [{ firm: 'ashgrove', role: 'led' }],
    docs: ['Investment Memo: Kestrel Autonomy Series C', 'Subscription Agreement: ASC Kestrel I', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'What does partner-led mean here?', a: 'A syndicate partner leads this round and set its terms. AltSpot organizes and advises the SPV that members invest through, the same as on every deal. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  {
    id: 'northstar',
    name: 'Northstar Compute',
    entity: 'ASC Northstar SPV, LLC',
    tag: 'Late-stage secondary',
    kind: 'secondary',
    sector: 'GPU Cloud · Data Infrastructure',
    stage: 'Late stage · issuer-approved',
    assetClass: 'secondary',
    industry: 'data-infrastructure',
    art: 'linear-gradient(135deg,#07090F 0%,#141C33 55%,#3B4F8C 115%)',
    headline: 'Rented GPUs, at a discount to the last round.',
    blurb:
      'A secondary interest in Northstar, a GPU cloud that rents training and inference capacity to AI labs under multi-year contracts.',
    summary:
      'Northstar operates GPU clusters and rents them to AI labs and enterprises under contracts of one to four years. Contracted revenue is $1.9B and the company was last valued at $14B. The SPV is buying this block from an early investor at an implied $12.2B, a 13% discount to that round, with issuer approval and full transfer documentation.',
    thesis: [
      'Compute is sold out and contracted years ahead. Northstar’s revenue is visible in a way almost no private company’s is.',
      'A 13% discount to the last round for the same shares, because the seller needed liquidity on a timetable and AltSpot could close in three weeks.',
      'Issuer-approved transfer, no forwards, no synthetic exposure. The SPV holds the shares.',
    ],
    indicators: {
      revenue: { value: '$1.9B', note: 'Contracted annual revenue.' },
      growth: { value: '2.2x', note: 'Contracted revenue, year over year.' },
      grossMargin: { value: '41%', note: 'After power and depreciation.' },
      burn: { value: 'n/a', note: 'Cash-flow positive before capex; capex is debt-funded.' },
      entryMultiple: { value: '~6.4x', note: '$12.2B implied on $1.9B contracted revenue.' },
    },
    rounds: [
      { round: 'Series D', date: '2025', preMoney: '$14,000,000,000', note: 'Last primary round.' },
      { round: 'Secondary', date: 'Sep 2026', preMoney: '$12,200,000,000', note: 'AltSpot entry, 13% below the Series D.', current: true },
    ],
    metrics: [
      { k: 'Implied valuation', v: '$12.2B' },
      { k: 'Discount to last round', v: '13%' },
      { k: 'Contracted revenue', v: '$1.9B' },
      { k: 'Weighted contract length', v: '2.8 yrs' },
    ],
    terms: [
      { k: 'Security', v: 'Common stock (secondary)' },
      { k: 'Implied valuation', v: '$12,200,000,000' },
      { k: 'Transfer', v: 'Issuer-approved under ROFR' },
    ],
    whatWeLike: [
      'Contracted revenue that is already signed, for the next several years.',
      'The discount is real and the reason for it is the seller’s timetable, not the company.',
      'Clean title through an approved transfer.',
    ],
    outcomes: {},
    risks:
      'Late-stage does not mean low-risk. GPU pricing can fall as supply catches up; the company carries substantial debt against its hardware; a small number of lab customers drive most contracted revenue; private marks can fall; and the interest is illiquid until a realization event, with no IPO scheduled or promised. Total loss of capital is possible.',
    minInvestment: 25000,
    allocationTotal: 5000000,
    /* 102 members at the seeded average ticket: a secondary SPV is held
       to 100, so this is the full SPV the waitlist is shown on. */
    allocationRemaining: 2450000,
    closesInDays: 22,
    launchedDaysAgo: 36,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 6,
    media: { type: 'metric', label: 'Entry vs. last round', series: [87, 100], caption: 'AltSpot entry indexed against the Series D (100).' },
    backing: [{ firm: 'sableridge', role: 'prior' }],
    docs: ['Investment Memo: Northstar Secondary (AltSpot)', 'Subscription Agreement: ASC Northstar SPV', 'Transfer & Issuer Approval Summary', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'Why is there a discount?', a: 'The seller, an early investor, needed to close on a timetable and AltSpot could. Discounts on approved secondaries reflect liquidity and transfer friction, not a view on the company. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  {
    id: 'halyard',
    name: 'Halyard Freight',
    entity: 'ASC Halyard I, LLC',
    tag: 'AltSpot-led · Growth',
    kind: 'led',
    sector: 'Cross-border Freight · Logistics',
    stage: 'Growth Preferred',
    assetClass: 'growth',
    industry: 'logistics-supply-chain',
    art: 'linear-gradient(135deg,#0E1512 0%,#22412F 55%,#4E8A5C 115%)',
    headline: 'The freight broker that already turns a profit.',
    blurb:
      'A digital freight platform for cross-border trucking between the US and Mexico, profitable, growing 60% a year, raising to buy a customs brokerage.',
    summary:
      'Halyard runs a freight platform for the US–Mexico border, matching shippers to carriers and handling the crossing. It is profitable, revenue was $84M last year and it is growing about 60% a year. The round funds the acquisition of a customs brokerage so the crossing itself becomes Halyard’s product. This is growth equity: a mature business, a minority stake and a use of proceeds you can point at.',
    thesis: [
      'Nearshoring moved production to Mexico. The border did not get any easier, and the crossing is where the margin is.',
      'Profitable at $84M of revenue with 60% growth. There are not many of those.',
      'The acquisition turns Halyard from a broker into the operator of the crossing, which is a defensible position on a route that only gets busier.',
    ],
    indicators: {
      revenue: { value: '$84M', note: 'Fiscal 2025, audited.' },
      growth: { value: '1.6x', note: 'Year over year.' },
      grossMargin: { value: '19%', note: 'Net revenue margin on gross freight.' },
      burn: { value: 'Profitable', note: '$3.1M EBITDA, fiscal 2025.' },
      entryMultiple: { value: '~3.2x', note: '$270M pre-money on $84M revenue.' },
    },
    rounds: [
      { round: 'Series A', date: '2021', preMoney: '$30,000,000' },
      { round: 'Series B', date: '2023', preMoney: '$110,000,000' },
      { round: 'Growth', date: 'Sep 2026', preMoney: '$270,000,000', note: 'AltSpot leading. Proceeds fund an acquisition.', current: true },
    ],
    metrics: [
      { k: 'Revenue, FY25', v: '$84M', note: 'audited' },
      { k: 'EBITDA, FY25', v: '$3.1M' },
      { k: 'Loads per month', v: '11,200' },
      { k: 'Shipper retention', v: '94%', note: 'annual, by revenue' },
    ],
    terms: [
      { k: 'Security', v: 'Growth Preferred Stock' },
      { k: 'Pre-money valuation', v: '$270,000,000' },
      { k: 'Round size', v: '$45,000,000' },
      { k: 'Use of proceeds', v: 'Customs brokerage acquisition' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Board rights', v: 'One seat held by AltSpot' },
      { k: 'Reporting', v: 'Quarterly audited financials' },
    ],
    whatWeLike: [
      'Already profitable, so the round is for a purchase, not for survival.',
      'A structural tailwind, nearshoring, on a route with a physical chokepoint.',
      'A board seat and audited quarterly reporting: the terms of a growth deal, not a venture one.',
    ],
    outcomes: {},
    risks:
      'Growth-stage investment in a minority position. Loss of capital is possible. Freight is cyclical and margins are thin; the acquisition can fail to close or to integrate; trade policy between the US and Mexico can change quickly; and the position is illiquid with no promised exit.',
    minInvestment: 25000,
    allocationTotal: 3500000,
    allocationRemaining: 900000,
    closesInDays: 9,
    launchedDaysAgo: 48,
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 7,
    media: { type: 'metric', label: 'Revenue', series: [21, 29, 38, 52, 64, 74, 84, 96], caption: 'Trailing twelve-month revenue by quarter, $M.' },
    backing: [{ firm: 'halcyon', role: 'co-invest' }],
    docs: ['Investment Memo: Halyard Freight Growth Round', 'Subscription Agreement: ASC Halyard I', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'How is growth equity different from venture?', a: 'The company is already working: real revenue, a profit, an audited history. The round buys a minority stake to fund something specific, here an acquisition, rather than to find out whether the business exists. Lower risk of total loss than venture, and a lower ceiling. Not legal, tax, or investment advice.' },
    ],
    deck: [],
  },
  {
    id: 'harborline',
    name: 'Harborline Storage',
    entity: 'ASC Harborline I, LLC',
    tag: 'AltSpot-led · Real assets',
    kind: 'led',
    sector: 'Cold Storage · Logistics Real Assets',
    stage: 'Operating asset',
    assetClass: 'real-asset',
    industry: 'logistics-supply-chain',
    art: 'linear-gradient(135deg,#0B1A17 0%,#12403A 55%,#1F7A6B 115%)',
    headline: 'Cold storage on the routes that cannot go warm.',
    blurb:
      'Four temperature-controlled facilities on interstate produce routes, leased to national distributors on long-dated contracts.',
    thesis: [],
    indicators: {},
    rounds: [],
    metrics: [],
    terms: [
      { k: 'Structure', v: 'Single-asset LLC' },
      { k: 'Hold', v: 'Seven to ten years' },
    ],
    preferredTerms: [],
    whatWeLike: [],
    outcomes: {},
    risks:
      'Real assets carry operating risk, tenant concentration and financing risk. Distributions are not guaranteed and capital can be lost.',
    minInvestment: 25000,
    allocationTotal: 4000000,
    allocationRemaining: 0,
    targetClose: 'Jun 12, 2025',
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 90,
    status: 'closed',
    media: { type: 'metric', label: '', series: [], caption: '' },
    docs: [],
    spotbot: [],
    deck: [],
  },
  {
    id: 'vantage',
    name: 'Vantage Payments',
    entity: 'ASC Vantage I, LLC',
    tag: 'AltSpot-led · Series B',
    kind: 'led',
    sector: 'Payments · Financial Technology',
    stage: 'Series B Preferred',
    assetClass: 'growth',
    industry: 'fintech',
    art: 'linear-gradient(135deg,#160E22 0%,#3A2360 55%,#6B45B8 115%)',
    headline: 'Settlement rails for platforms that outgrew their processor.',
    blurb:
      'Embedded payouts for marketplaces, priced per transaction rather than per seat.',
    thesis: [],
    indicators: {},
    rounds: [],
    metrics: [],
    terms: [
      { k: 'Security', v: 'Series B Preferred Stock' },
      { k: 'Liquidation preference', v: '1x non-participating' },
    ],
    preferredTerms: [],
    whatWeLike: [],
    outcomes: {},
    risks:
      'Growth-stage venture. Total loss of capital is possible, and a later round can reprice this one downward.',
    minInvestment: 25000,
    allocationTotal: 3000000,
    allocationRemaining: 0,
    targetClose: 'Nov 20, 2025',
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 91,
    status: 'closed',
    media: { type: 'metric', label: '', series: [], caption: '' },
    docs: [],
    spotbot: [],
    deck: [],
  },
  {
    id: 'northwind',
    name: 'Northwind Grid',
    entity: 'ASC Northwind I, LLC',
    tag: 'AltSpot-led · Exited',
    kind: 'led',
    sector: 'Grid Analytics · Energy Infrastructure',
    stage: 'Exited via strategic sale',
    assetClass: 'venture',
    industry: 'energy-climate',
    art: 'linear-gradient(135deg,#1A1206 0%,#5A3C14 55%,#C79A4B 115%)',
    headline: 'Grid analytics, acquired by a listed industrial buyer.',
    blurb:
      'Load-forecasting software for transmission operators. Acquired in 2026; proceeds distributed in full.',
    thesis: [],
    indicators: {},
    rounds: [],
    metrics: [],
    terms: [
      { k: 'Security', v: 'Series A Preferred Stock' },
      { k: 'Outcome', v: 'Strategic sale, all cash' },
    ],
    preferredTerms: [],
    whatWeLike: [],
    outcomes: {},
    risks:
      'This position has exited. Past outcomes on any one deal say nothing about any other.',
    minInvestment: 10000,
    allocationTotal: 1500000,
    allocationRemaining: 0,
    targetClose: 'Feb 28, 2025',
    altspotCommitted: 0,
    committedNote: '',
    sortOrder: 92,
    status: 'closed',
    media: { type: 'metric', label: '', series: [], caption: '' },
    docs: [],
    spotbot: [],
    deck: [],
  },
];

/**
 * A close date, relative to when the database was seeded. Formatted the
 * way the rest of the product formats dates, because this string is
 * displayed as well as parsed.
 */
/** Closed deals opened about fifty days before they closed. */
const CLOSED_OFFERING_DAYS = 50;

function launchedAt(deal: SeedDeal): Date {
  if (deal.launchedDaysAgo !== undefined) {
    return new Date(Date.now() - deal.launchedDaysAgo * 86_400_000);
  }
  const closed = Date.parse(deal.targetClose ?? '');
  if (!Number.isFinite(closed)) {
    throw new Error(`${deal.id} has neither launchedDaysAgo nor a readable targetClose`);
  }
  return new Date(closed - CLOSED_OFFERING_DAYS * 86_400_000);
}

function closesIn(days: number): string {
  const when = new Date(Date.now() + days * 86_400_000);
  return when.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * What each SPV must raise into escrow to close, and who leads it
 * (work order screens 5 and 18). Kestrel is the partner-led deal: its
 * lead is the invented firm on its backing line. Every other deal is
 * AltSpot-led. Closed deals met their minimum, which is why they closed.
 */
/* Minimums follow the rule in lib/funding.ts (defaultMinimumToClose)
   unless a deal sets its own; caps follow lib/spv-rules.ts. */
const FUNDING: Record<
  string,
  { minimum?: number; lead?: 'altspot' | 'partner'; cap?: number; minInvestment?: number }
> = {
  kestrel: { lead: 'partner' },
  /* Set per offering (the deck): the lead took Meridel to the standard
     minimum so a newer member can start there, and left the rest to the
     rule in lib/minimums.ts. */
  meridel: { minInvestment: 10_000 },
};

/**
 * DEMO SEAM. Each invented company's mark and card art come from its hue
 * (lib/brand.ts), so a shelf of ten reads as ten companies rather than
 * ten navy gradients. The mark is private/marks/<id>.svg, served behind
 * login by /api/marks.
 */
function brand(id: string): { art: string; logoUrl: string } | null {
  const art = brandArt(id);
  return art ? { art, logoUrl: `/api/marks/${id}.svg` } : null;
}

const PARTNER_CODES = [
  { code: 'northlight', label: 'Northlight Partners' },
  { code: 'ashgrove', label: 'Ashgrove Capital' },
];

async function main() {
  for (const deal of DEALS) {
    const payload = {
      name: deal.name,
      entity: deal.entity,
      tag: deal.tag,
      kind: deal.kind,
      sector: deal.sector,
      stage: deal.stage,
      assetClass: deal.assetClass,
      industry: deal.industry,
      art: brand(deal.id)?.art ?? deal.art,
      logoUrl: brand(deal.id)?.logoUrl ?? deal.logoUrl ?? null,
      headline: deal.headline,
      summary: deal.summary ?? null,
      pricePerShare: deal.pricePerShare ?? null,
      blurb: deal.blurb,
      risks: deal.risks,
      /* The minimum is the rule unless the lead set one by hand: $10K
         standard, $5K under $250K, $25K over $1M (lib/minimums.ts). The
         per-deal figure in the seed data above is retired. */
      minInvestment:
        FUNDING[deal.id]?.minInvestment ?? defaultMinInvestment(deal.allocationTotal),
      allocationTotal: deal.allocationTotal,
      allocationRemaining: deal.allocationRemaining,
      minimumToClose: FUNDING[deal.id]?.minimum ?? defaultMinimumToClose(deal.allocationTotal),
      leadType: FUNDING[deal.id]?.lead ?? 'altspot',
      investorCap: FUNDING[deal.id]?.cap ?? investorCapFor(deal),
      targetClose:
        deal.closesInDays !== undefined
          ? closesIn(deal.closesInDays)
          : (deal.targetClose ?? ''),
      launchedAt: launchedAt(deal),
      altspotCommitted: deal.altspotCommitted,
      committedNote: deal.committedNote,
      sortOrder: deal.sortOrder,
      status: deal.status ?? 'open',
      thesisJson: JSON.stringify(deal.thesis),
      /* Retired: fee terms live in lib/config.ts. */
      feesJson: '{}',
      mediaJson: JSON.stringify(deal.media),
      chartsJson: JSON.stringify(deal.charts ?? []),
      docsJson: JSON.stringify(deal.docs),
      spotbotJson: JSON.stringify(deal.spotbot),
      deckJson: JSON.stringify(deal.deck),
      metricsJson: JSON.stringify(deal.metrics),
      termsJson: JSON.stringify(deal.terms),
      preferredTermsJson: JSON.stringify(deal.preferredTerms ?? []),
      whatWeLikeJson: JSON.stringify(deal.whatWeLike ?? []),
      outcomesJson: JSON.stringify(deal.outcomes ?? {}),
      scenariosJson: JSON.stringify(deal.scenarios ?? {}),
      indicatorsJson: JSON.stringify(deal.indicators ?? {}),
      roundsJson: JSON.stringify(deal.rounds ?? []),
      backingJson: JSON.stringify(deal.backing ?? []),
    };

    await prisma.deal.upsert({
      where: { id: deal.id },
      create: { id: deal.id, ...payload },
      update: payload,
    });
  }

  console.log(`Seeded ${DEALS.length} deals (Calder Grid leading).`);

  /* Partner referral links for the demo. Both firms are invented (see
     lib/backers.ts). A link is /r/<code>; following one lands on sign-up,
     never on a deal, and the code is kept on the new member for reporting
     only. */
  for (const partner of PARTNER_CODES) {
    await prisma.referralCode.upsert({
      where: { code: partner.code },
      create: { ...partner, kind: 'partner' },
      update: { label: partner.label, kind: 'partner', active: true },
    });
  }
  console.log(`Seeded ${PARTNER_CODES.length} partner referral codes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
