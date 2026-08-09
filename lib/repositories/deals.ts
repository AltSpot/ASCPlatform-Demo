/**
 * Deal repository — the only place that knows deals keep editorial
 * content in JSON-encoded columns. Everything above this layer works
 * with the fully-typed `DealView`.
 *
 * It is also where the accreditation gate is applied. Rule 506(c) says
 * the offering may only be shown to verified accredited investors, so
 * for anyone else the substantive package is not hidden further up: it
 * is never read out of this module. `getDealForViewer` and
 * `listDealsForViewer` are the reads every browse surface uses, and they
 * return a `DealTeaser` when the viewer is not accredited. A blur in the
 * UI over real values would not be a control; this is.
 *
 * The unredacted reads are named `…Record` and are for the paths that
 * have already cleared the invest gate, which subsumes accreditation:
 * checkout, funding, and document generation.
 */
import 'server-only';

import { prisma } from '../db';
import { ISOLATED_ALLOCATION } from '../config';
import { canViewDealDetail, redactDeal } from '../domain';
import type {
  DealFees,
  DealMedia,
  DealMetric,
  DealOutcomes,
  DealShelfItem,
  DealTerm,
  DealView,
  FundingRound,
  IndicatorValue,
  DeckSlide,
  SpotbotEntry,
} from '../domain';
import type { Deal } from '../generated/prisma/client';
import { getAccreditationView } from './investor';

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
    redacted: false,
  };
}

/**
 * DEMO SEAM — how much allocation this investor has personally taken off
 * the table, shown to them as if it were the global figure.
 *
 * Under isolated allocation the deal row is never decremented, so what a
 * visitor sees as "remaining" is the seeded figure minus their own live
 * commitments. Everyone else's view stays pristine, which is what makes
 * the demo safe to send to a room full of people at once. It also means
 * the allocation bar on screen is not a real number.
 *
 * Guarded by ISOLATED_ALLOCATION in lib/config.ts, which follows
 * ASC_EPHEMERAL. Production wants the true global remaining, so this
 * returns an empty map and the deal row's own figure is used unchanged.
 */
async function reservedByUser(
  userId: string,
  dealIds: string[],
): Promise<Map<string, number>> {
  if (!ISOLATED_ALLOCATION || dealIds.length === 0) return new Map();

  const rows = await prisma.subscription.groupBy({
    by: ['dealId'],
    where: {
      userId,
      dealId: { in: dealIds },
      state: { in: ['docs_signed', 'funded', 'accepted', 'closed'] },
    },
    _sum: { amount: true },
  });

  return new Map(rows.map((r) => [r.dealId, r._sum.amount ?? 0]));
}

function applyReserved(deal: DealView, reserved: number): DealView {
  if (reserved <= 0) return deal;
  return {
    ...deal,
    allocationRemaining: Math.max(0, deal.allocationRemaining - reserved),
  };
}

/**
 * Every open deal, unredacted.
 *
 * Callers must already know the reader is entitled to the whole package.
 * Browse surfaces want `listDealsForViewer`.
 */
export async function listDealRecords(userId?: string): Promise<DealView[]> {
  const rows = await prisma.deal.findMany({
    where: { status: 'open' },
    orderBy: { sortOrder: 'asc' },
  });
  const deals = rows.map(toDealView);

  if (!userId) return deals;

  const reserved = await reservedByUser(
    userId,
    deals.map((d) => d.id),
  );
  return deals.map((d) => applyReserved(d, reserved.get(d.id) ?? 0));
}

/**
 * One deal, unredacted. Same warning as `listDealRecords`: this is for
 * checkout, funding and document generation, all of which sit behind the
 * invest gate. Browse surfaces want `getDealForViewer`.
 */
export async function getDealRecord(
  id: string,
  userId?: string,
): Promise<DealView | null> {
  const row = await prisma.deal.findUnique({ where: { id } });
  if (!row) return null;

  const deal = toDealView(row);
  if (!userId) return deal;

  const reserved = await reservedByUser(userId, [id]);
  return applyReserved(deal, reserved.get(id) ?? 0);
}

/** Does this deal exist at all? Public knowledge, so it is not gated. */
export async function dealExists(id: string): Promise<boolean> {
  const row = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
  return row !== null;
}

/**
 * DEMO SEAM — the gate below is real, and trivially satisfied.
 *
 * Accreditation self-approves the moment a letter is uploaded (see
 * app/api/accreditation/upload/route.ts), so any visitor can clear this
 * in about ten seconds. What is simulated is the reviewer, not the
 * restriction: the redaction runs off the same `verified` + unexpired
 * record production will use, and nothing here changes when a human
 * starts approving letters.
 */
function forViewer(deal: DealView, accredited: boolean): DealShelfItem {
  return accredited ? deal : redactDeal(deal);
}

/** The shelf as this member is entitled to see it. */
export async function listDealsForViewer(
  userId: string,
): Promise<DealShelfItem[]> {
  const [deals, accreditation] = await Promise.all([
    listDealRecords(userId),
    getAccreditationView(userId),
  ]);

  const accredited = canViewDealDetail(accreditation);
  return deals.map((deal) => forViewer(deal, accredited));
}

/** One deal as this member is entitled to see it. */
export async function getDealForViewer(
  id: string,
  userId: string,
): Promise<DealShelfItem | null> {
  const [deal, accreditation] = await Promise.all([
    getDealRecord(id, userId),
    getAccreditationView(userId),
  ]);
  if (!deal) return null;

  return forViewer(deal, canViewDealDetail(accreditation));
}

/**
 * A named set of deals as this member is entitled to see them, in the
 * order the ids were given. Unknown ids are dropped rather than faked.
 */
export async function getDealsForViewer(
  ids: string[],
  userId: string,
): Promise<DealShelfItem[]> {
  if (ids.length === 0) return [];

  const [rows, accreditation] = await Promise.all([
    prisma.deal.findMany({ where: { id: { in: ids } } }),
    getAccreditationView(userId),
  ]);

  const accredited = canViewDealDetail(accreditation);
  const byId = new Map(rows.map((row) => [row.id, toDealView(row)]));

  return ids
    .map((id) => byId.get(id))
    .filter((deal): deal is DealView => deal !== undefined)
    .map((deal) => forViewer(deal, accredited));
}

/**
 * Deals referenced by a set of subscriptions, keyed by id.
 *
 * Not gated: an investor who holds a position, or is mid-commitment, has
 * already been shown the deal. Callers use this for the name and tag on
 * a positions row, never to render the package.
 */
export async function getDealsByIds(ids: string[]): Promise<Map<string, DealView>> {
  if (ids.length === 0) return new Map();

  const rows = await prisma.deal.findMany({ where: { id: { in: ids } } });
  return new Map(rows.map((row) => [row.id, toDealView(row)]));
}
