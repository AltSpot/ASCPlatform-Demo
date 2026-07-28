/**
 * Marketplace seed.
 *
 * Fee model, every deal: 5% management fee charged once at closing,
 * 10% carried interest on profits at exit. No admin reserve, no annual
 * fees, no capital calls.
 *
 * Simphonic is the real lead deal, ported from the AltSpot deal package.
 * The remaining three are fictional and exist only to make the shelf look
 * inhabited — they are clearly marked in `isFictional`.
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
  //  SIMPHONIC — the real deal. Content from the AltSpot deal package.
  // ------------------------------------------------------------------
  {
    id: 'simphonic',
    name: 'Simphonic',
    entity: 'ASC Simphonic II, LLC',
    tag: 'AltSpot-led · Series Seed',
    kind: 'led',
    sector: 'Vertical AI · Senior Care',
    stage: 'Series Seed Preferred',
    art: 'linear-gradient(135deg,#0E1A24 0%,#1C3A4E 55%,#3E7A96 115%)',
    logoUrl: '/simphonic-logo.svg',
    headline:
      'The AI operating system replacing legacy software across 60,000+ senior care facilities.',
    blurb:
      'AI-native platform replacing three to five disconnected systems per facility. $840K contracted ARR, up ~68% in a month, with a large regional operator that dropped PointClickCare to adopt it.',
    thesis: [
      'A large regional senior care operator dropped PointClickCare — the industry’s dominant legacy platform — and chose Simphonic across 50+ facilities and 1,000+ licenses. When a major operator replaces the market leader with an AI-native platform, that is the clearest adoption signal the category produces.',
      'The market is 60,000+ U.S. facilities, 90%+ of them small operators running on paper and disconnected point solutions. Simphonic replaces eMAR, scheduling, billing, care tracking and assessments with one system, at net-neutral or lower cost — a budget-neutral swap that removes vendors rather than adding a line item.',
      'Distribution compounds through pharmacies. Incumbents charge pharmacies to integrate; Simphonic integrates free, turning every pharmacy into a warm channel into the dozens of facilities it already serves. Every integration also feeds a proprietary medication and care dataset that grows with scale.',
      'AltSpot led the pre-seed at $5.5M pre-money and is doubling down at $11M. We hold a board observer seat, receive monthly financials, and have direct CEO access — our investors see what we see.',
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
    terms: [
      { k: 'Security', v: 'Series Seed Preferred' },
      { k: 'Pre-money valuation', v: '$11,000,000' },
      { k: 'Round size', v: '$2,000,000' },
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'Pro-rata rights', v: 'Yes' },
      { k: 'Revenue share', v: '5% of top line to a 1.5x cap' },
      { k: 'Warrant coverage', v: '30% at seed price' },
      { k: 'AltSpot role', v: 'Lead investor · board observer' },
    ],
    risks:
      'This is an early-stage venture investment and total loss of capital is possible. The vehicle is a single-purpose entity holding one position, so there is no diversification within it. Specific risks: revenue is concentrated in a small number of operators, and losing one materially changes the picture; the "in final negotiations" and pipeline figures are modeled from operator averages and are not signed contracts; senior care is regulated and reimbursement-sensitive, and rule changes can slow adoption; incumbents including PointClickCare are well capitalized and acquisitive; and the position is illiquid with no public market and no promised exit timeline. AltSpot’s own $500,000 carries these same risks.',
    minInvestment: 25000,
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
      'Private Placement Memorandum — ASC Simphonic II, LLC',
      'Subscription Agreement — ASC Simphonic II, LLC',
      'Operating Agreement — ASC Simphonic II, LLC',
      'Accredited Investor Questionnaire (Exhibit A)',
      'Funding Instructions',
    ],
    spotbot: [
      {
        q: 'What exactly am I buying?',
        a: 'Class B Common Units in ASC Simphonic II, LLC — a Delaware special-purpose vehicle formed by AltSpot to hold Series Seed Preferred stock in Simphonic, Inc. along with associated warrants. You own units in the SPV, not shares of Simphonic directly, and AltSpot Capital, LLC is the Manager. Subject to Manager acceptance and required documentation. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: 'A 5% management fee, charged once at closing — not annually. Then 10% carried interest on profits at exit. That is the entire fee model: no admin reserve, no annual fees, no hidden charges. Separately, the SPV holds a 5% revenue share in Simphonic to a 1.5x cap, which is a term of the investment rather than a fee paid to AltSpot. Not legal, tax, or investment advice.',
      },
      {
        q: 'What are the biggest risks?',
        a: 'Early-stage loss risk is real and total loss is possible. The vehicle holds one position, so there is no diversification. Revenue is concentrated in a small number of operators. The pipeline and "in final negotiations" figures are modeled from operator averages, not signed contracts. The position is illiquid with no promised exit. AltSpot’s own $500,000 carries these same risks. Please read the risk factors in the Memorandum before subscribing.',
      },
      {
        q: 'What is the revenue share?',
        a: 'Once Simphonic exceeds $1M in ARR, the SPV receives 5% of top-line revenue until it has returned 1.5x the investment. That produces cashflow before any exit event. If Simphonic raises a qualified VC up round, AltSpot steps out of the revenue share and takes 30% warrant coverage at this round’s price instead. Details are in the Memorandum. Not legal, tax, or investment advice.',
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
          'Simphonic replaces three to five systems at net-neutral or lower cost with 80%+ software gross margin. It removes vendors rather than adding a line item.',
        ],
      },
      {
        kicker: 'Distribution',
        title: 'Pharmacies are the wedge, and they are free.',
        body: [
          'In senior care, pharmacies and facilities are tightly coupled through medication administration. Incumbents charge pharmacies to integrate. Simphonic integrates free.',
          'Each pharmacy serves dozens of facilities and becomes a warm introduction to every one of them. The integration is free, the facilities pay, and the data compounds.',
        ],
      },
      {
        kicker: 'Unit economics',
        title: 'One operator lands many facilities.',
        body: [
          'The average pipeline company brings ~28.5 facilities. The average facility carries ~50 licenses at $30–40 per user per month — roughly $18–24K ARR per facility.',
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
          'Legacy incumbents bolt AI onto an existing EHR. Simphonic was AI-native from day one, with a caregiver-first workflow that drives organic frontline adoption instead of staff resistance.',
          'A large regional operator dropped PointClickCare and chose Simphonic. Close rate from decision stage forward is ~70%.',
        ],
      },
      {
        kicker: 'Exit',
        title: 'Vertical AI SaaS trades at a premium.',
        body: [
          'PointClickCare is valued above $5B at roughly 7–8x revenue and has made 10+ acquisitions. Comparable vertical SaaS — Veeva, ServiceTitan, Toast, Procore — trades between 6x and 13x revenue.',
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
  //  Fictional deals — shelf dressing so the marketplace isn't a
  //  single card. Clearly not real companies.
  // ------------------------------------------------------------------
  {
    id: 'aurora',
    name: 'Aurora Robotics',
    entity: 'ASC Aurora SPV, LLC',
    tag: 'AltSpot-led · Series A',
    kind: 'led',
    sector: 'Industrial AI · Robotics',
    stage: 'Series A',
    art: 'linear-gradient(135deg,#3B2E12 0%,#8F6B25 55%,#C9A14A 100%)',
    headline: 'Warehouse automation the mid-market can actually buy.',
    blurb:
      'Autonomous picking systems for mid-market warehouses — 14 paid deployments, 3.1x net revenue retention, and a lead order book into 2027.',
    thesis: [
      'Mid-market logistics operators are priced out of enterprise robotics. Aurora sells a contained, per-lane system that pays back in under 14 months, with deployments live across 14 facilities.',
      'Revenue has compounded 3.1x year over year on retention-led expansion; existing customers account for 68% of new lane orders.',
      'AltSpot led this round after a full diligence cycle: customer reference calls across 9 accounts, a unit-economics rebuild from invoice data, and independent technical review of the perception stack.',
    ],
    metrics: [
      { k: 'Paid deployments', v: '14' },
      { k: 'Payback period', v: '<14 mo' },
      { k: 'Net revenue retention', v: '3.1x' },
      { k: 'Expansion share of orders', v: '68%' },
    ],
    terms: [
      { k: 'Security', v: 'Series A Preferred' },
      { k: 'Round size', v: '$1,500,000' },
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'AltSpot role', v: 'Lead investor' },
    ],
    risks:
      'Early-stage venture risk applies: customer concentration in 3PL operators, hardware supply-chain exposure, and competition from enterprise incumbents moving down-market. Total loss of capital is possible. See the investment memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 1500000,
    allocationRemaining: 570000,
    targetClose: 'Aug 21, 2026',
    altspotCommitted: 400000,
    committedNote: 'AltSpot led this round and holds its position permanently.',
    sortOrder: 1,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Net revenue retention',
      series: [100, 122, 149, 171, 204, 231, 262, 310],
      caption: 'Indexed NRR by quarter, Q3 2024 – Q2 2026 (company data, AltSpot memo)',
    },
    docs: [
      'Investment Memo — Aurora Robotics (AltSpot)',
      'Subscription Agreement — ASC Aurora SPV',
      'Series A Term Summary',
      'Risk Factors & Disclosures',
    ],
    spotbot: [
      {
        q: 'What exactly am I buying?',
        a: 'Membership interests in ASC Aurora SPV, LLC — a special purpose vehicle formed by AltSpot to invest in Aurora Robotics’ Series A preferred stock. You own interests in the SPV, not shares of Aurora directly. Subject to AltSpot review, required documents, and final acceptance. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: 'A 5% management fee charged once at closing, and 10% carried interest on profits at exit. No annual fees and no capital calls. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'The problem',
        title: 'Labor is the largest line item nobody can staff.',
        body: [
          'Mid-market warehouses run 30–80 pick lanes with turnover above 60% a year. They cannot underwrite enterprise automation, and they cannot hire their way out.',
          'The segment is 41,000 facilities in North America alone — effectively unserved.',
        ],
      },
      {
        kicker: 'The product',
        title: 'One lane. One weekend. One invoice.',
        body: [
          'A self-contained cell — arm, perception stack, and conveyor interface — priced per lane per month. No systems integrator, no facility redesign.',
          'Customers start with two lanes and expand: 68% of new lane orders come from existing accounts.',
        ],
      },
    ],
  },
  {
    id: 'meridian',
    name: 'Meridian Health AI',
    entity: 'ASC Meridian SPV, LLC',
    tag: 'Co-investment · Series B',
    kind: 'coinvest',
    sector: 'Healthcare · Clinical AI',
    stage: 'Series B',
    art: 'linear-gradient(135deg,#101B18 0%,#1E4A3C 55%,#6FA97C 115%)',
    headline: 'The scribe every physician gets to keep.',
    blurb:
      'Clinical documentation AI deployed across 90+ hospital systems. AltSpot co-invests alongside the round’s tier-1 lead on identical terms.',
    thesis: [
      'Meridian’s ambient documentation platform is live in more than 90 hospital systems, cutting physician documentation time by an average of 54% in published deployments.',
      'The Series B is led by a tier-1 healthcare investor; AltSpot secured a co-investment allocation on identical terms and underwrote the company independently.',
      'Contracted ARR has doubled in the trailing twelve months with net revenue churn below 2%.',
    ],
    metrics: [
      { k: 'Hospital systems', v: '90+' },
      { k: 'Documentation time saved', v: '54%' },
      { k: 'Net revenue churn', v: '<2%' },
      { k: 'TTM ARR growth', v: '2.1x' },
    ],
    terms: [
      { k: 'Security', v: 'Series B Preferred' },
      { k: 'Round size', v: '$2,000,000' },
      { k: 'Liquidation preference', v: '1x non-participating' },
      { k: 'AltSpot role', v: 'Co-investor' },
    ],
    risks:
      'Growth-stage venture risk applies: reimbursement and regulatory shifts in clinical AI, competition from EHR incumbents, and long illiquidity. Total loss of capital is possible. See the investment memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 2000000,
    allocationRemaining: 240000,
    targetClose: 'Aug 8, 2026',
    altspotCommitted: 250000,
    committedNote: 'AltSpot invests alongside the community on identical terms.',
    sortOrder: 2,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Contracted ARR',
      series: [100, 118, 131, 152, 168, 187, 199, 212],
      caption:
        'Indexed contracted ARR by quarter, Q3 2024 – Q2 2026 (company data, AltSpot memo)',
    },
    docs: [
      'Investment Memo — Meridian Health AI (AltSpot)',
      'Subscription Agreement — ASC Meridian SPV',
      'Series B Term Summary',
      'Risk Factors & Disclosures',
    ],
    spotbot: [
      {
        q: 'Who leads this round?',
        a: 'A tier-1 healthcare investor leads the Series B; AltSpot holds an approved co-investment allocation on identical terms and conducted its own independent diligence. The lead’s identity is disclosed in the deal data room. Not legal, tax, or investment advice.',
      },
      {
        q: 'How is AltSpot paid on this deal?',
        a: 'A 5% management fee charged once at closing, and 10% carried interest on profits at exit. No annual fees and no capital calls. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'Traction',
        title: 'ARR doubled in twelve months.',
        body: [
          'Contracted ARR is up 2.1x trailing-twelve-months, driven by system-wide expansions in existing accounts.',
        ],
      },
    ],
  },
  {
    id: 'summit',
    name: 'Summit Aerospace — Secondary',
    entity: 'ASC Summit SPV, LLC',
    tag: 'Late-stage secondary',
    kind: 'secondary',
    sector: 'Aerospace · Defense',
    stage: 'Late stage · issuer-approved',
    art: 'linear-gradient(135deg,#12141E 0%,#2A3352 60%,#7C8BC0 120%)',
    headline: 'Institutional access, issuer-approved.',
    blurb:
      'Issuer-approved secondary interest in a late-stage launch-services company, acquired as principal at a 22% discount to the last primary round.',
    thesis: [
      'AltSpot acquired this position as principal directly from an early employee block, with issuer approval and full transfer documentation — no forward contracts, no synthetic exposure.',
      'The block was purchased at a 22% discount to the company’s most recent primary round price.',
      'Late-stage secondaries give investors exposure to established, revenue-scaled private companies at a $10,000 minimum.',
    ],
    metrics: [
      { k: 'Entry discount', v: '22%' },
      { k: 'AltSpot committed', v: '$150K' },
      { k: 'Structure', v: 'Direct, issuer-approved' },
    ],
    terms: [
      { k: 'Security', v: 'Common stock (secondary)' },
      { k: 'Transfer', v: 'Issuer-approved under ROFR' },
      { k: 'AltSpot role', v: 'Principal acquirer' },
    ],
    risks:
      'Late-stage does not mean low-risk: valuation marks can fall, IPO windows can stay shut, and secondary interests remain illiquid until a realization event. Total loss of capital is possible. See the memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 1000000,
    allocationRemaining: 815000,
    targetClose: 'Sep 4, 2026',
    altspotCommitted: 150000,
    committedNote: 'Acquired as principal; AltSpot retains its position permanently.',
    sortOrder: 3,
    fees: FEES,
    media: {
      type: 'metric',
      label: 'Entry vs. last round',
      series: [78, 100],
      caption:
        'AltSpot entry price indexed against last primary round (100). Source: transfer documentation.',
    },
    docs: [
      'Investment Memo — Summit Secondary (AltSpot)',
      'Subscription Agreement — ASC Summit SPV',
      'Transfer & Issuer Approval Summary',
      'Risk Factors & Disclosures',
    ],
    spotbot: [
      {
        q: 'What makes this "issuer-approved"?',
        a: 'The company approved this transfer under its right-of-first-refusal process, and AltSpot holds clean, documented title to the shares inside the SPV. Issuer approval matters because unapproved secondaries can be voided or blocked. Not legal, tax, or investment advice.',
      },
    ],
    deck: [
      {
        kicker: 'The structure',
        title: 'Real shares. Clean title. One vehicle.',
        body: [
          'The company approved the transfer under its ROFR process. AltSpot holds the shares inside ASC Summit SPV with full transfer documentation — no forwards, no synthetics.',
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
    };

    await prisma.deal.upsert({
      where: { id: deal.id },
      create: { id: deal.id, ...payload },
      update: payload,
    });
  }

  console.log(`Seeded ${DEALS.length} deals (Simphonic leading).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
