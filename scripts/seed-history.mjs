#!/usr/bin/env node
/**
 * One-off: add the closed deals a portfolio needs behind it.
 *
 * A portfolio page has nothing to say about a book of one position, and
 * the shelf only ever carries what is open right now. So the seed gains
 * three deals that are already closed: two still held and marked, one
 * fully exited. They never appear on the marketplace, because every
 * browse read filters on `status: 'open'`. They exist so that Portfolio
 * has a real book to describe: several vintages, several asset classes,
 * a position marked below cost, and one that has actually returned
 * money.
 *
 * Committed rather than deleted, for the same reason the other scripts
 * here are: the edit spans two files and a reviewer should be able to
 * read what it did.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SEED = 'prisma/seed.ts';
let s = readFileSync(SEED, 'utf8');

/* The seed type has no status field: every deal in it is open. These
   three are not, so the type gains one and the writer stops hardcoding
   it. */
s = s.replace(
  '  sortOrder: number;',
  `  sortOrder: number;
  /** 'open' is the shelf. 'closed' exists only for portfolio history. */
  status?: 'open' | 'closed';`,
);
s = s.replace("      status: 'open',", "      status: deal.status ?? 'open',");

/* A closed deal carries the same shape as an open one, minus the
   editorial nobody will read: no thesis, no deck, no research. What it
   needs is an identity, a taxonomy and terms, because Portfolio groups
   on the first two and the holdings table prints the third. */
const historical = `
  /* ----------------------------------------------------------------
     CLOSED DEALS. Not on the shelf, ever: every browse read filters on
     status 'open'. They are here so a demo account has a portfolio with
     more than one line in it, across more than one vintage, including
     one position marked below cost and one that has exited and returned
     cash. A portfolio page that only ever shows winners is a brochure.
     ---------------------------------------------------------------- */
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
    altspotCommitted: 800000,
    committedNote: 'Acquired as principal; AltSpot retains its position permanently.',
    fees: FEES,
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
    altspotCommitted: 400000,
    committedNote: 'Acquired as principal; AltSpot retains its position permanently.',
    fees: FEES,
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
    altspotCommitted: 300000,
    committedNote: 'Acquired as principal; AltSpot held to exit alongside investors.',
    fees: FEES,
    sortOrder: 92,
    status: 'closed',
    media: { type: 'metric', label: '', series: [], caption: '' },
    docs: [],
    spotbot: [],
    deck: [],
  },
];`;

s = s.replace(/\n\];\n\nasync function main/, `\n${historical}\n\nasync function main`);

writeFileSync(SEED, s);
console.log('seed extended with three closed deals');
