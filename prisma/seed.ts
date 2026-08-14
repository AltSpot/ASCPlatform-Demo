/**
 * Marketplace seed.
 *
 * Fee model, every deal: 5% management fee charged once at closing,
 * 10% carried interest on profits at exit. Nothing else: no annual
 * fees, no capital calls.
 *
 * Calder Grid, the lead deal, is FICTIONAL: it mirrors the shape of a real
 * AltSpot deal package (structure, terms, checkout flow), but the company,
 * its numbers and its story are invented and mirror no real transaction. The AltSpot Growth Fund is our own vehicle. OpenAI and Databricks
 * are real companies, and every deal term shown for them here (price,
 * discount, allocation, AltSpot's position) is ILLUSTRATIVE demo data, not an
 * actual offering or an actual position.
 *
 * Idempotent: re-running upserts deals and leaves investor data alone.
 * Use `npm run db:reset` to wipe everything and start clean.
 */
import 'dotenv/config';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../lib/generated/prisma/client';

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
  targetClose: string;
  altspotCommitted: number;
  committedNote: string;
  sortOrder: number;
  thesis: string[];
  metrics: Metric[];
  terms: Term[];
  preferredTerms?: Term[];
  whatWeLike?: string[];
  indicators?: Record<string,{value:string;note?:string}>;
  rounds?: Record<string,unknown>[];
  outcomes?: Record<string, unknown>;
  fees: { management: number; carry: number };
  media: { type: string; label: string; series: number[]; caption: string };
  docs: string[];
  spotbot: { q: string; a: string }[];
  deck: {
    kicker: string;
    title: string;
    body: string[];
    stats?: { k: string; v: string }[];
  }[];
}

const FEES = { management: 5, carry: 10 };

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
    art: 'linear-gradient(135deg,#0A1322 0%,#14325A 55%,#2E6FD1 115%)',
    logoUrl: '/calder-logo.svg',
    headline:
      'The intelligence layer for the electric grid.',
    blurb:
      'Physics-informed AI that compresses utility interconnection studies from 14 months to days. $2.4M contracted ARR, up 3.1x year over year, with 11 investor-owned utilities under multi-year contract.',
    thesis: [
      'The grid is the bottleneck for everything: AI datacenters, electrification, and 2,900 gigawatts of generation and storage waiting in interconnection queues. Every project in that queue needs studies before it connects, and the studies are the chokepoint.',
      'Calder replaces spreadsheet-era power-flow tooling with physics-informed models that produce regulator-ready studies in days instead of months, validated against the same reliability standards utilities are audited on.',
      'The data moat compounds. Every study Calder runs enriches a living model of the transmission system that no point-in-time consultant and no legacy vendor holds. Utility number twelve gets a better product because of the first eleven.',
      'AltSpot participated in the seed at $12M pre-money and is leading the Series A at $30M. We hold a board observer seat, receive monthly financials, and have direct CEO access. Our investors see what we see.',
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
        note: 'AltSpot participated alongside a deep-tech seed fund.',
      },
      {
        round: 'Series A',
        date: 'Aug 2026',
        preMoney: '$30,000,000',
        note: 'AltSpot leading with $600,000 of its own capital.',
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
      'Calder Grid sells physics-informed AI that runs the interconnection and planning studies the electric grid depends on, compressing a 14-month process into days. Contracted ARR is $2.4M across 11 investor-owned utilities and 4 of the ten largest renewable developers, up 3.1x in twelve months. AltSpot participated in the seed and is leading the Series A with $600,000 of its own capital.',
    whatWeLike: [
      'The buyer has no alternative that is both fast and audit-grade. Consultants are slow, legacy tools predate the engineers using them, and the queue roughly doubles every three years.',
      'Multi-year contracts with 100% logo retention. A utility that files Calder studies with its regulator has made a switching decision measured in decades.',
      'Every study compounds the dataset. Calder holds a living model of the transmission system that gets harder to replicate with each engagement.',
      'Demand is structural. AI datacenter load growth alone underwrites the queue for a decade, and every megawatt needs a study before it connects.',
      'We have been inside the company since the seed, with a board observer seat, monthly financials and direct CEO access.',
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
    outcomes: {
      intro:
        'Critical-infrastructure software trades at a premium and consolidates aggressively. The grid software incumbents have made dozens of acquisitions between them, and none of them owns an AI-native study engine.',
      scenarios: [
        { k: '$10M ARR', v: '3 to 4x', note: 'at 10 to 14x revenue' },
        { k: '$25M ARR', v: '7 to 10x', note: 'at 10 to 14x revenue' },
        { k: '$50M ARR', v: '14 to 19x', note: 'at 10 to 14x revenue' },
      ],
      comparables: [
        { company: 'Aspen Technology', context: 'Industrial process software, acquired by Emerson', valuation: '$16B', multiple: '~13x rev' },
        { company: 'Bentley Systems', context: 'Infrastructure engineering software', valuation: '$16B+', multiple: '~11x rev' },
        { company: 'Grid software incumbent', context: 'Decades of acquisitions in T&D tooling', valuation: '$10B+', multiple: '~9x rev' },
        { company: 'Vertical SaaS median', context: 'Public vertical software basket', valuation: 'n/a', multiple: '8 to 13x rev' },
      ],
      note:
        'Illustrative only, based on a $30M entry. Outcomes depend on exit timing, dilution and valuation, and no return is promised.',
    },
    risks:
      'This is an early-stage venture investment and total loss of capital is possible. The vehicle is a single-purpose entity holding one position, so there is no diversification within it. Specific risks: utility sales cycles are long and budget-driven, and slippage of a few procurements materially changes the growth picture; regulators must continue accepting model-based studies, and a policy reversal would slow adoption; incumbent vendors and large consultancies are well capitalized and could bundle competing tools; and the position is illiquid with no public market and no promised exit timeline. AltSpot’s own $600,000 carries these same risks.',
    minInvestment: 10000,
    allocationTotal: 2000000,
    allocationRemaining: 640000,
    targetClose: 'Sep 18, 2026',
    altspotCommitted: 600000,
    committedNote:
      'AltSpot participated in the seed and is leading this round with $600,000 of its own capital.',
    sortOrder: 0,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Contracted ARR',
      series: [150, 290, 480, 760, 1150, 1600, 2000, 2400],
      caption:
        'Contracted ARR in $K by quarter. Contracted figures verified with the company; pipeline is excluded here.',
    },
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
        a: 'A 5% management fee, charged once at closing, not annually. Then 10% carried interest on profits at exit. That is the entire fee model: no annual fees, no capital calls, no hidden charges. Not legal, tax, or investment advice.',
      },
      {
        q: 'What are the biggest risks?',
        a: 'Early-stage loss risk is real and total loss is possible. The vehicle holds one position, so there is no diversification. Utility procurement is slow, and a few slipped contracts change the growth picture. Regulatory acceptance of model-based studies must continue. The position is illiquid with no promised exit. AltSpot’s own $600,000 carries these same risks. Please read the risk factors in the Memorandum before subscribing.',
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
          'Aspen Technology went to Emerson at roughly 13x revenue. Bentley trades near 11x. The grid software incumbents have made dozens of acquisitions and none owns an AI-native study engine.',
          'At a $30M entry, $10M ARR implies 3 to 4x and $25M ARR implies 7 to 10x. Illustrative only; returns depend on exit timing, dilution and valuation.',
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
  //  The shelf behind the lead: AltSpot's own multi-deal fund, then two
  //  late-stage secondaries in real companies. The OpenAI and Databricks
  //  terms, prices, discounts and allocations are ILLUSTRATIVE.
  // ------------------------------------------------------------------
  {
    id: 'growth-fund',
    name: 'AltSpot Growth Fund',
    entity: 'AltSpot Growth Fund I, LLC',
    tag: 'AltSpot fund · Fund I',
    kind: 'fund',
    sector: 'Multi-Deal Fund · Venture',
    stage: 'Fund I · $10M target',
    art: 'linear-gradient(135deg,#3B2E12 0%,#8F6B25 55%,#C9A14A 100%)',
    logoUrl: '/brand/altspot-logo-black.png',
    headline: 'Every AltSpot-led deal in one commitment.',
    blurb:
      'A $10M vehicle that invests in the next 10 to 15 AltSpot-led deals automatically, on the same terms the marketplace sees. One subscription, one K-1, the whole vintage.',
    thesis: [
      'One subscription covers the vintage. The fund invests in every deal AltSpot leads over the deployment period, on the same terms offered deal by deal on the marketplace, without the investor having to pick.',
      'Diversification is the point. A single early-stage position can go to zero. Ten to fifteen positions across the vintage means no single outcome decides the fund.',
      'AltSpot is the general partner and has committed $1,000,000 of the $10M target. The fee model is the same as every single deal: 5% once at closing, 10% carry at exit. No annual fees. Commitments are funded in full at closing, so there are no capital calls.',
    ],
    metrics: [
      { k: 'Fund target', v: '$10M' },
      { k: 'Planned positions', v: '10–15' },
      { k: 'GP commitment', v: '$1M' },
      { k: 'Deployment period', v: '18 mo' },
    ],
    terms: [
      { k: 'Vehicle', v: 'AltSpot Growth Fund I, LLC' },
      { k: 'Fund target', v: '$10,000,000' },
      { k: 'GP commitment', v: '$1,000,000 (AltSpot)' },
      { k: 'Deployment', v: '10 to 15 AltSpot-led deals' },
    ],
    risks:
      'The fund invests in early-stage and growth-stage private companies and total loss of capital is possible. Positions are selected by AltSpot during the vintage and are not known in advance, so you are underwriting the process, not a named company. Deployment pace depends on deal flow and may be slower than planned. Fund interests are illiquid with no secondary market and no promised exit timeline. AltSpot’s own $1,000,000 carries these same risks.',
    minInvestment: 25000,
    allocationTotal: 10000000,
    allocationRemaining: 6900000,
    targetClose: 'Oct 16, 2026',
    altspotCommitted: 1000000,
    committedNote:
      'AltSpot is the general partner and has committed $1,000,000 of the $10M target.',
    sortOrder: 3,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Capital committed',
      series: [1.0, 1.4, 1.9, 2.4, 3.1],
      caption:
        'Committed capital in $M since the fund opened, including the GP commitment. Source: fund records.',
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
        a: 'Membership interests in AltSpot Growth Fund I, LLC, a $10M vehicle managed by AltSpot Capital, LLC. The fund invests in each AltSpot-led deal during the deployment period, on the same terms those deals are offered on the marketplace. You own interests in the fund, not shares of the underlying companies. Subject to Manager acceptance and required documentation. Not legal, tax, or investment advice.',
      },
      {
        q: 'Are there capital calls?',
        a: 'No. Your commitment is funded in full at closing and deployed by the fund from there. There are no capital calls on this fund or anywhere on AltSpot, and no annual fees. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: 'A 5% management fee charged once at closing, and 10% carried interest on profits at exit. The same model as every single deal, applied once at the fund level rather than per position. No annual fees and no capital calls. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'The structure',
        title: 'One commitment. The whole vintage.',
        body: [
          'The fund subscribes to every AltSpot-led deal during the deployment period, on the terms each deal is offered at. Investors get the vintage without picking, and without watching the marketplace for each close.',
          'Commitments are funded in full at closing. No capital calls, no annual fees, one K-1.',
        ],
        stats: [
          { k: 'Fund target', v: '$10M' },
          { k: 'Planned positions', v: '10–15' },
          { k: 'GP commitment', v: '$1M' },
        ],
      },
      {
        kicker: 'Why a fund',
        title: 'The portfolio does the work one deal cannot.',
        body: [
          'Early-stage outcomes are skewed: a small number of positions drive the result, and any single one can go to zero. Spreading a commitment across the vintage is the structural answer.',
          'AltSpot commits its own capital at the fund level, the same way it commits on every single deal.',
        ],
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    entity: 'ASC OpenAI SPV, LLC',
    tag: 'Late-stage secondary',
    kind: 'secondary',
    sector: 'Foundation Models · Consumer AI',
    stage: 'Late stage · issuer-approved',
    art: 'radial-gradient(120% 170% at 50% 40%,rgba(0,0,0,.05) 0%,rgba(0,0,0,0) 58%),linear-gradient(135deg,#FFFFFF 0%,#F6F4EF 55%,#E9E4DA 115%)',
    logoUrl: '/openai-logo.svg',
    headline: 'The most used AI product in the world, below its last tender price.',
    blurb:
      'Secondary interest in OpenAI at an implied $690B valuation, an 8% discount to the March 2026 employee tender. 900M+ weekly ChatGPT users and roughly $30B in annualized revenue.',
    thesis: [
      'ChatGPT reaches 900M+ weekly users and the OpenAI platform sits behind a large share of production AI workloads. Distribution at this scale is the hardest thing in software to replicate.',
      'AltSpot acquired this position as principal from an early employee block, with issuer approval and full transfer documentation. No forward contracts, no synthetic exposure.',
      'Entry is at an implied $690B, an 8% discount to the March 2026 employee tender at $750B. Reported annualized revenue is roughly $30B, growing faster than any software company at comparable scale.',
    ],
    metrics: [
      { k: 'Implied valuation', v: '$690B' },
      { k: 'Discount to last tender', v: '8%' },
      { k: 'Weekly ChatGPT users', v: '900M+', note: 'reported, mid-2026' },
      { k: 'Annualized revenue', v: '~$30B', note: 'reported, mid-2026' },
    ],
    terms: [
      { k: 'Security', v: 'Common stock (secondary)' },
      { k: 'Implied valuation', v: '$690B' },
      { k: 'Transfer', v: 'Issuer-approved under ROFR' },
      { k: 'AltSpot role', v: 'Principal acquirer' },
    ],
    risks:
      'Late-stage does not mean low-risk: the entry price is set by private-market marks that can fall, OpenAI does not disclose audited financials to secondary holders, compute spending is enormous and ongoing, and the corporate structure is unusual. The interest is illiquid until a realization event, and no IPO is scheduled or promised. Total loss of capital is possible. See the memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 3000000,
    allocationRemaining: 480000,
    targetClose: 'Aug 28, 2026',
    altspotCommitted: 300000,
    committedNote: 'Acquired as principal; AltSpot retains its position permanently.',
    sortOrder: 1,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Entry vs. last tender',
      series: [92, 100],
      caption:
        'AltSpot entry price indexed against the March 2026 employee tender (100). Source: transfer documentation.',
    },
    docs: [
      'Investment Memo: OpenAI Secondary (AltSpot)',
      'Subscription Agreement: ASC OpenAI SPV',
      'Transfer & Issuer Approval Summary',
      'Risk Factors & Disclosures',
    ],
    spotbot: [
      {
        q: 'What exactly am I buying?',
        a: 'Membership interests in ASC OpenAI SPV, LLC, a special purpose vehicle holding OpenAI shares acquired in an issuer-approved secondary transfer. You own interests in the SPV, not OpenAI stock directly, and AltSpot Capital, LLC is the Manager. Subject to Manager acceptance and required documentation. Not legal, tax, or investment advice.',
      },
      {
        q: 'How was the price set?',
        a: 'AltSpot negotiated the block at an implied $690B valuation, an 8% discount to the March 2026 employee tender at $750B. Discounts on approved secondaries reflect illiquidity and transfer friction, not a view on the company. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: 'A 5% management fee charged once at closing, and 10% carried interest on profits at exit. No annual fees and no capital calls. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'The company',
        title: 'Distribution no one else has.',
        body: [
          'ChatGPT is the consumer default for AI, with 900M+ weekly users reported in mid-2026, and the API platform sits behind a large share of production AI workloads.',
          'Reported annualized revenue is roughly $30B. No software company has grown to this scale this quickly.',
        ],
        stats: [
          { k: 'Weekly users', v: '900M+' },
          { k: 'Annualized revenue', v: '~$30B' },
          { k: 'Last tender', v: '$750B' },
        ],
      },
      {
        kicker: 'The structure',
        title: 'Real shares. Clean title. One vehicle.',
        body: [
          'The company approved the transfer under its ROFR process. AltSpot holds the shares inside ASC OpenAI SPV with full transfer documentation. No forwards, no synthetics.',
        ],
      },
    ],
  },
  {
    id: 'databricks',
    name: 'Databricks',
    entity: 'ASC Databricks SPV, LLC',
    tag: 'Late-stage secondary',
    kind: 'secondary',
    sector: 'Data · Enterprise AI',
    stage: 'Late stage · issuer-approved',
    art: 'radial-gradient(120% 170% at 50% 40%,rgba(255,120,90,.22) 0%,rgba(255,120,90,0) 58%),linear-gradient(135deg,#1A0B08 0%,#4A150D 55%,#B33A24 115%)',
    logoUrl: '/databricks-logo.svg',
    headline: 'The data platform underneath the enterprise AI build-out.',
    blurb:
      'Secondary interest in Databricks at an implied $110B valuation, an 8% discount to the June 2026 tender. $4.5B revenue run rate growing above 50%, with roughly 140% net revenue retention.',
    thesis: [
      'Databricks is where enterprise data and AI meet: 15,000+ customers run the lakehouse, and the enterprise AI build-out runs through the data layer it owns.',
      'The revenue run rate crossed $4.5B growing above 50% a year, with net revenue retention around 140%. Very few private companies compound at that rate at this scale.',
      'AltSpot acquired the block as principal, issuer-approved, at an implied $110B: an 8% discount to the June 2026 employee tender at $120B.',
    ],
    metrics: [
      { k: 'Implied valuation', v: '$110B' },
      { k: 'Discount to last tender', v: '8%' },
      { k: 'Revenue run rate', v: '$4.5B', note: 'reported, mid-2026' },
      { k: 'Net revenue retention', v: '~140%' },
    ],
    terms: [
      { k: 'Security', v: 'Common stock (secondary)' },
      { k: 'Implied valuation', v: '$110B' },
      { k: 'Transfer', v: 'Issuer-approved under ROFR' },
      { k: 'AltSpot role', v: 'Principal acquirer' },
    ],
    risks:
      'Late-stage venture risk applies: the entry mark is set by private rounds and can fall, competition from hyperscalers and open-source engines is real, and growth at this scale is expensive to sustain. The interest is illiquid until a realization event, and no IPO is scheduled or promised. Total loss of capital is possible. See the memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 2500000,
    allocationRemaining: 950000,
    targetClose: 'Sep 11, 2026',
    altspotCommitted: 250000,
    committedNote: 'Acquired as principal; AltSpot retains its position permanently.',
    sortOrder: 2,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Revenue run rate',
      series: [1.0, 1.4, 1.6, 2.4, 3.0, 3.7, 4.5],
      caption:
        'Reported revenue run rate in $B, 2023 through mid-2026. Source: company announcements.',
    },
    docs: [
      'Investment Memo: Databricks Secondary (AltSpot)',
      'Subscription Agreement: ASC Databricks SPV',
      'Transfer & Issuer Approval Summary',
      'Risk Factors & Disclosures',
    ],
    spotbot: [
      {
        q: 'What exactly am I buying?',
        a: 'Membership interests in ASC Databricks SPV, LLC, a special purpose vehicle holding Databricks shares acquired in an issuer-approved secondary transfer. You own interests in the SPV, not Databricks stock directly, and AltSpot Capital, LLC is the Manager. Subject to Manager acceptance and required documentation. Not legal, tax, or investment advice.',
      },
      {
        q: 'How was the price set?',
        a: 'AltSpot negotiated the block at an implied $110B valuation, an 8% discount to the June 2026 employee tender at $120B. Discounts on approved secondaries reflect illiquidity and transfer friction, not a view on the company. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: 'A 5% management fee charged once at closing, and 10% carried interest on profits at exit. No annual fees and no capital calls. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'The company',
        title: 'The lakehouse won the data layer.',
        body: [
          'More than 15,000 customers run Databricks, and the revenue run rate crossed $4.5B in mid-2026 growing above 50% a year with roughly 140% net revenue retention.',
          'Enterprise AI is built on enterprise data, and Databricks owns the layer where that data lives.',
        ],
        stats: [
          { k: 'Revenue run rate', v: '$4.5B' },
          { k: 'Growth', v: '50%+' },
          { k: 'Customers', v: '15,000+' },
        ],
      },
      {
        kicker: 'The structure',
        title: 'Real shares. Clean title. One vehicle.',
        body: [
          'The company approved the transfer under its ROFR process. AltSpot holds the shares inside ASC Databricks SPV with full transfer documentation. No forwards, no synthetics.',
        ],
      },
    ],
  },
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
      art: deal.art,
      logoUrl: deal.logoUrl ?? null,
      headline: deal.headline,
      summary: deal.summary ?? null,
      pricePerShare: deal.pricePerShare ?? null,
      blurb: deal.blurb,
      risks: deal.risks,
      minInvestment: deal.minInvestment,
      allocationTotal: deal.allocationTotal,
      allocationRemaining: deal.allocationRemaining,
      targetClose: deal.targetClose,
      altspotCommitted: deal.altspotCommitted,
      committedNote: deal.committedNote,
      sortOrder: deal.sortOrder,
      status: 'open',
      thesisJson: JSON.stringify(deal.thesis),
      feesJson: JSON.stringify(deal.fees),
      mediaJson: JSON.stringify(deal.media),
      docsJson: JSON.stringify(deal.docs),
      spotbotJson: JSON.stringify(deal.spotbot),
      deckJson: JSON.stringify(deal.deck),
      metricsJson: JSON.stringify(deal.metrics),
      termsJson: JSON.stringify(deal.terms),
      preferredTermsJson: JSON.stringify(deal.preferredTerms ?? []),
      whatWeLikeJson: JSON.stringify(deal.whatWeLike ?? []),
      outcomesJson: JSON.stringify(deal.outcomes ?? {}),
      indicatorsJson: JSON.stringify(deal.indicators ?? {}),
      roundsJson: JSON.stringify(deal.rounds ?? []),
    };

    await prisma.deal.upsert({
      where: { id: deal.id },
      create: { id: deal.id, ...payload },
      update: payload,
    });
  }

  console.log(`Seeded ${DEALS.length} deals (Calder Grid leading).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
