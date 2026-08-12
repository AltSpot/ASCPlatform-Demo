/**
 * Marketplace seed.
 *
 * Fee model, every deal: 5% management fee charged once at closing,
 * 10% carried interest on profits at exit. Nothing else: no annual
 * fees, no capital calls.
 *
 * Synthera AI, the lead deal, is FICTIONAL: it mirrors the shape of a real
 * AltSpot deal package (structure, terms, checkout flow), but the company is
 * invented. The AltSpot Growth Fund is our own vehicle. OpenAI and Databricks
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
  //  SYNTHERA AI — fictional lead deal, modeled on a real deal package.
  // ------------------------------------------------------------------
  {
    id: 'synthera',
    name: 'Synthera AI',
    entity: 'ASC Synthera II, LLC',
    tag: 'AltSpot-led · Series Seed',
    kind: 'led',
    sector: 'Vertical AI · Senior Care',
    stage: 'Series Seed Preferred',
    art: 'linear-gradient(135deg,#0E1A24 0%,#1C3A4E 55%,#3E7A96 115%)',
    logoUrl: '/synthera-logo.svg',
    headline:
      'The AI operating system replacing legacy software across 60,000+ senior care facilities.',
    blurb:
      'AI-native platform replacing three to five disconnected systems per facility. $840K contracted ARR, up ~68% in a month, with a large regional operator that dropped the category’s dominant legacy platform to adopt it.',
    thesis: [
      'A large regional senior care operator dropped the industry’s dominant legacy platform and chose Synthera across 50+ facilities and 1,000+ licenses. When a major operator replaces the market leader with an AI-native platform, that is the clearest adoption signal the category produces.',
      'The market is 60,000+ U.S. facilities, 90%+ of them small operators running on paper and disconnected point solutions. Synthera replaces eMAR, scheduling, billing, care tracking and assessments with one system, at net-neutral or lower cost. It is a budget-neutral swap that removes vendors rather than adding a line item.',
      'Distribution compounds through pharmacies. Incumbents charge pharmacies to integrate; Synthera integrates free, turning every pharmacy into a warm channel into the dozens of facilities it already serves. Every integration also feeds a proprietary medication and care dataset that grows with scale.',
      'AltSpot led the pre-seed at $5.5M pre-money and is doubling down at $11M. We hold a board observer seat, receive monthly financials, and have direct CEO access. Our investors see what we see.',
    ],
    // The standard set. Gaps are left genuinely empty rather than guessed:
    // they render as "Not disclosed" and are the diligence list to close.
    indicators: {
      revenue: { value: '$840K', note: 'Contracted ARR. 12 companies, ~70 facilities.' },
      growth: { value: '~68%', note: 'Contracted ARR growth in the last month.' },
      grossMargin: { value: '70%+', note: 'At scale. Software gross margin above 80%.' },
      burn: { value: '~$65K', note: 'Per month. Lean and pre-scale.' },
      entryMultiple: { value: '~13x', note: '$11M pre-money on $840K contracted ARR.' },
    },
    rounds: [
      {
        round: 'Pre-seed',
        date: '2025',
        preMoney: '$5,500,000',
        note: 'AltSpot led. First money in.',
      },
      {
        round: 'Series Seed',
        date: 'Jun 2026',
        preMoney: '$11,000,000',
        note: 'AltSpot leading again with $500,000 of its own capital.',
        current: true,
      },
    ],
    metrics: [
      { k: 'Contracted ARR', v: '$840K', note: '12 companies · ~70 facilities' },
      { k: 'ARR growth', v: '~68%', note: 'in the last month' },
      { k: 'In final negotiations', v: '~$4.9M', note: '~234 facilities' },
      { k: 'Qualified pipeline', v: '$25M+', note: '1,500+ facilities' },
      { k: 'Monthly burn', v: '~$65K', note: 'lean, pre-scale' },
      { k: 'Gross margin at scale', v: '70%+' },
      { k: 'Total addressable market', v: '$26.5B' },
      { k: 'Close rate', v: '~70%', note: 'from decision stage forward' },
    ],
    summary:
      'Synthera replaces the three to five disconnected systems a senior care facility runs today with one AI-native platform. Contracted ARR is $840K across 12 companies and roughly 70 facilities, up about 68% in a month. AltSpot led the pre-seed and is leading this round with $500,000 of its own capital.',
    // TODO: confirm with Ryan. Placeholder until the real figure is supplied.
    pricePerShare: 'Confirm before send',
    whatWeLike: [
      'A large regional operator dropped the category’s dominant platform and chose Synthera across 50+ facilities and 1,000+ licenses.',
      'It is a budget-neutral swap. Synthera replaces three to five systems at net-neutral or lower cost, so it removes vendors instead of adding a line item.',
      'Pharmacies are the distribution wedge. Incumbents charge them to integrate; Synthera integrates free, turning each one into a warm channel into dozens of facilities.',
      'One operator lands many facilities. The average pipeline company brings roughly 28.5 facilities at about 50 licenses each.',
      'We have been inside this deal since the pre-seed at $5.5M pre-money, with a board observer seat, monthly financials and direct CEO access.',
    ],
    terms: [
      { k: 'Security', v: 'Series Seed Preferred Stock' },
      { k: 'Pre-money valuation', v: '$11,000,000' },
      { k: 'Round size', v: '$2,000,000' },
    ],
    preferredTerms: [
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Pro-rata rights', v: 'Yes' },
      { k: 'Revenue share', v: '5% of top line to a 1.5x cap' },
      { k: 'Warrant coverage', v: '30% at seed price' },
      { k: 'Board rights', v: 'Observer seat held by AltSpot' },
      { k: 'Reporting', v: 'Monthly financials to investors' },
    ],
    outcomes: {
      intro:
        'Vertical AI SaaS trades at a premium and the buyer universe is deep. The category’s dominant incumbent has made 10+ acquisitions, and a large regional operator just left it for Synthera.',
      scenarios: [
        { k: '$5M ARR', v: '3 to 7x', note: 'at 6 to 8x revenue' },
        { k: '$10M ARR', v: '5 to 14x', note: 'at 8 to 15x revenue' },
        { k: '$20M ARR', v: '11 to 27x', note: 'at 6 to 15x revenue' },
      ],
      comparables: [
        { company: 'Category incumbent', context: 'Senior care EHR, 10+ acquisitions', valuation: '$5B+', multiple: '~7 to 8x rev' },
        { company: 'MatrixCare', context: 'Acquired by ResMed', valuation: '$750M', multiple: '~6x rev' },
        { company: 'Veeva Systems', context: 'Vertical SaaS, life sciences', valuation: '$35B+', multiple: '~12x rev' },
        { company: 'ServiceTitan', context: 'Vertical SaaS, trades', valuation: '$9B+', multiple: '~13x rev' },
        { company: 'Toast', context: 'Vertical SaaS, restaurants', valuation: '$18B+', multiple: '~8x rev' },
        { company: 'Procore', context: 'Vertical SaaS, construction', valuation: '$12B+', multiple: '~11x rev' },
      ],
      note:
        'Illustrative only, based on an $11M entry. Outcomes depend on exit timing, dilution and valuation, and no return is promised. The 5% revenue share pays before any exit.',
    },
    risks:
      'This is an early-stage venture investment and total loss of capital is possible. The vehicle is a single-purpose entity holding one position, so there is no diversification within it. Specific risks: revenue is concentrated in a small number of operators, and losing one materially changes the picture; the "in final negotiations" and pipeline figures are modeled from operator averages and are not signed contracts; senior care is regulated and reimbursement-sensitive, and rule changes can slow adoption; the category’s incumbents are well capitalized and acquisitive; and the position is illiquid with no public market and no promised exit timeline. AltSpot’s own $500,000 carries these same risks.',
    minInvestment: 10000,
    allocationTotal: 2000000,
    allocationRemaining: 640000,
    targetClose: 'Aug 29, 2026',
    altspotCommitted: 500000,
    committedNote:
      'AltSpot led the pre-seed and is leading this round with $500,000 of its own capital.',
    sortOrder: 0,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Contracted ARR',
      series: [40, 78, 145, 210, 305, 420, 500, 840],
      caption:
        'Contracted ARR in $K, monthly. Contracted figures verified with the company; pipeline figures are modeled and excluded here.',
    },
    docs: [
      'Private Placement Memorandum: ASC Synthera II, LLC',
      'Subscription Agreement: ASC Synthera II, LLC',
      'Operating Agreement: ASC Synthera II, LLC',
      'Accredited Investor Questionnaire (Exhibit A)',
      'Funding Instructions',
    ],
    spotbot: [
      {
        q: 'What exactly am I buying?',
        a: 'Class B Common Units in ASC Synthera II, LLC, a Delaware special-purpose vehicle formed by AltSpot to hold Series Seed Preferred Stock in Synthera AI, Inc. along with associated warrants. You own units in the SPV, not shares of Synthera directly, and AltSpot Capital, LLC is the Manager. Subject to Manager acceptance and required documentation. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: 'A 5% management fee, charged once at closing, not annually. Then 10% carried interest on profits at exit. That is the entire fee model: no annual fees, no capital calls, no hidden charges. Separately, the SPV holds a 5% revenue share in Synthera to a 1.5x cap, which is a term of the investment rather than a fee paid to AltSpot. Not legal, tax, or investment advice.',
      },
      {
        q: 'What are the biggest risks?',
        a: 'Early-stage loss risk is real and total loss is possible. The vehicle holds one position, so there is no diversification. Revenue is concentrated in a small number of operators. The pipeline and "in final negotiations" figures are modeled from operator averages, not signed contracts. The position is illiquid with no promised exit. AltSpot’s own $500,000 carries these same risks. Please read the risk factors in the Memorandum before subscribing.',
      },
      {
        q: 'What is the revenue share?',
        a: 'Once Synthera exceeds $1M in ARR, the SPV receives 5% of top-line revenue until it has returned 1.5x the investment. That produces cashflow before any exit event. If Synthera raises a qualified VC up round, AltSpot steps out of the revenue share and takes 30% warrant coverage at this round’s price instead. Details are in the Memorandum. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'The problem',
        title: 'Six systems, none of which talk to each other.',
        body: [
          'A typical facility runs medication administration in one system, scheduling in another, billing in a third, and tracks care on paper. 90%+ of the 60,000+ U.S. senior care facilities are small operators with no modern technology at all.',
          'Every facility has a physical address and a known decision-maker, which makes this a high-volume, short-cycle sale rather than a multi-year enterprise cycle.',
        ],
        stats: [
          { k: 'U.S. facilities', v: '60,000+' },
          { k: 'Small operators, no modern tech', v: '90%+' },
          { k: 'TAM', v: '$26.5B' },
        ],
      },
      {
        kicker: 'The product',
        title: 'One AI-native platform. Six systems replaced.',
        body: [
          'Care tracking, eMAR, billing, scheduling, assessments and an embedded AI assistant in a single system, built caregiver-first so frontline staff actually adopt it.',
          'Synthera replaces three to five systems at net-neutral or lower cost with 80%+ software gross margin. It removes vendors rather than adding a line item.',
        ],
      },
      {
        kicker: 'Distribution',
        title: 'Pharmacies are the wedge, and they are free.',
        body: [
          'In senior care, pharmacies and facilities are tightly coupled through medication administration. Incumbents charge pharmacies to integrate. Synthera integrates free.',
          'Each pharmacy serves dozens of facilities and becomes a warm introduction to every one of them. The integration is free, the facilities pay, and the data compounds.',
        ],
      },
      {
        kicker: 'Unit economics',
        title: 'One operator lands many facilities.',
        body: [
          'The average pipeline company brings ~28.5 facilities. The average facility carries ~50 licenses at $30–40 per user per month, roughly $18–24K ARR per facility.',
          'Landing a single multi-facility operator compounds into dozens of facilities and thousands of licenses: enterprise leverage on a facility-level sales cadence.',
        ],
        stats: [
          { k: 'Facilities per company', v: '~28.5' },
          { k: 'Licenses per facility', v: '~50' },
          { k: 'ARR per facility', v: '$18–24K' },
        ],
      },
      {
        kicker: 'Why now',
        title: 'The market leader is already losing accounts.',
        body: [
          'Legacy incumbents bolt AI onto an existing EHR. Synthera was AI-native from day one, with a caregiver-first workflow that drives organic frontline adoption instead of staff resistance.',
          'A large regional operator dropped the dominant legacy platform and chose Synthera. Close rate from decision stage forward is ~70%.',
        ],
      },
      {
        kicker: 'Exit',
        title: 'Vertical AI SaaS trades at a premium.',
        body: [
          'The category’s dominant incumbent is valued above $5B at roughly 7–8x revenue and has made 10+ acquisitions. Comparable vertical SaaS trades between 6x and 13x revenue: Veeva, ServiceTitan, Toast, Procore.',
          'At an $11M entry, $5M ARR implies a 3–7x return and $10M ARR implies 5–14x, before the revenue share. Illustrative only; returns depend on exit timing, dilution and valuation.',
        ],
        stats: [
          { k: '$5M ARR', v: '3–7x' },
          { k: '$10M ARR', v: '5–14x' },
          { k: '$20M ARR', v: '11–27x' },
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

  console.log(`Seeded ${DEALS.length} deals (Synthera AI leading).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
