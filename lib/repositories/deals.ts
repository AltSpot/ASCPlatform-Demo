/**
 * Deal repository — the only place that knows deals keep editorial
 * content in JSON-encoded columns. Everything above this layer works
 * with the fully-typed `DealView`.
 */
import 'server-only';

import { prisma } from '../db';
import type {
  DealFees,
  DealMedia,
  DealMetric,
  DealOutcomes,
  DealTerm,
  DealView,
  FundingRound,
  IndicatorValue,
  DeckSlide,
  SpotbotEntry,
} from '../domain';
import type { Deal } from '../generated/prisma/client';

/**
 * Parse a JSON column with a typed fallback. A malformed blob degrades
 * that one section of the page instead of taking the whole deal down.
 */
function parseJson<T>(raw: string, fallback: T, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.error(`[deals] malformed JSON in ${context}`);
    return fallback;
  }
}

const FALLBACK_FEES: DealFees = { management: 5, carry: 10 };

const FALLBACK_MEDIA: DealMedia = {
  type: 'metric',
  label: '',
  series: [],
  caption: '',
};

export function toDealView(row: Deal): DealView {
  return {
    id: row.id,
    name: row.name,
    entity: row.entity,
    tag: row.tag,
    kind: row.kind,
    sector: row.sector,
    stage: row.stage,
    art: row.art,
    logoUrl: row.logoUrl,
    headline: row.headline,
    summary: row.summary,
    pricePerShare: row.pricePerShare,
    metrics: parseJson<DealMetric[]>(row.metricsJson, [], `${row.id}.metrics`),
    terms: parseJson<DealTerm[]>(row.termsJson, [], `${row.id}.terms`),
    preferredTerms: parseJson<DealTerm[]>(
      row.preferredTermsJson,
      [],
      `${row.id}.preferredTerms`,
    ),
    whatWeLike: parseJson<string[]>(row.whatWeLikeJson, [], `${row.id}.whatWeLike`),
    outcomes: parseJson<DealOutcomes>(row.outcomesJson, {}, `${row.id}.outcomes`),
    indicators: parseJson<Record<string, IndicatorValue>>(
      row.indicatorsJson,
      {},
      `${row.id}.indicators`,
    ),
    rounds: parseJson<FundingRound[]>(row.roundsJson, [], `${row.id}.rounds`),
    blurb: row.blurb,
    risks: row.risks,
    minInvestment: row.minInvestment,
    allocationTotal: row.allocationTotal,
    allocationRemaining: row.allocationRemaining,
    targetClose: row.targetClose,
    altspotCommitted: row.altspotCommitted,
    committedNote: row.committedNote,
    status: row.status,
    thesis: parseJson<string[]>(row.thesisJson, [], `${row.id}.thesis`),
    fees: parseJson<DealFees>(row.feesJson, FALLBACK_FEES, `${row.id}.fees`),
    media: parseJson<DealMedia>(row.mediaJson, FALLBACK_MEDIA, `${row.id}.media`),
    docs: parseJson<string[]>(row.docsJson, [], `${row.id}.docs`),
    spotbot: parseJson<SpotbotEntry[]>(row.spotbotJson, [], `${row.id}.spotbot`),
    deck: parseJson<DeckSlide[]>(row.deckJson, [], `${row.id}.deck`),
  };
}

export async function listDeals(): Promise<DealView[]> {
  const rows = await prisma.deal.findMany({
    where: { status: 'open' },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map(toDealView);
}

export async function getDeal(id: string): Promise<DealView | null> {
  const row = await prisma.deal.findUnique({ where: { id } });
  return row ? toDealView(row) : null;
}

/** Deals referenced by a set of subscriptions, keyed by id. */
export async function getDealsByIds(ids: string[]): Promise<Map<string, DealView>> {
  if (ids.length === 0) return new Map();

  const rows = await prisma.deal.findMany({ where: { id: { in: ids } } });
  return new Map(rows.map((row) => [row.id, toDealView(row)]));
}
