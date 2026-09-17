/**
 * Deal repository — the only place that knows deals keep editorial
 * content in JSON-encoded columns. Everything above this layer works
 * with the fully-typed `DealView`.
 *
 * It is also where the 506(b) relationship gate is applied. Offerings are
 * shown only to members whose questionnaire is approved and whose
 * cooling-off period is over, so for anyone else no offering is hidden
 * further up: none is read out of this module. The `…ForViewer` reads
 * and `getDealAccess` are what every browse surface uses. Before the gate
 * opens they return no deals at all, not a teaser: under 506(b) a deal's
 * name is as much the offering as its terms. A blur in the UI over real
 * values would not be a control; this is.
 *
 * The ungated reads are named `…Record` and are for the paths that have
 * already cleared the invest gate: checkout, funding, and document
 * generation.
 */
import 'server-only';

import { prisma } from '../db';
import { ISOLATED_ALLOCATION } from '../config';
import { parseBacking } from '../backers';
import { canViewDealDetail } from '../domain';
import { canSubscribeToDeal, type RelationshipView } from '../relationship';
import type {
  DealFees,
  DealChart,
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
import { getRelationshipView } from './investor';

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
    assetClass: row.assetClass,
    industry: row.industry,
    stage: row.stage,
    art: row.art,
    logoUrl: row.logoUrl,
    videoUrl: row.videoUrl,
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
    minimumToClose: row.minimumToClose,
    leadType: row.leadType,
    investorCap: row.investorCap,
    launchedAt: row.launchedAt.toISOString(),
    // Fails closed. Only a viewer-aware read (withViewer below) opens it.
    subscribable: false,
    altspotCommitted: row.altspotCommitted,
    committedNote: row.committedNote,
    status: row.status,
    thesis: parseJson<string[]>(row.thesisJson, [], `${row.id}.thesis`),
    fees: parseJson<DealFees>(row.feesJson, FALLBACK_FEES, `${row.id}.fees`),
    media: parseJson<DealMedia>(row.mediaJson, FALLBACK_MEDIA, `${row.id}.media`),
    charts: parseJson<DealChart[]>(row.chartsJson ?? '[]', [], `${row.id}.charts`),
    backing: parseBacking(parseJson<unknown>(row.backingJson, [], `${row.id}.backing`)),
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
 * invest gate. Browse surfaces want `getDealAccess`.
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

/**
 * What a member may see of one deal.
 *
 * `open` carries the full package. `locked` carries nothing about the
 * deal, only where the member stands, so a page that followed a link can
 * say what stands between them and offerings without naming the one
 * they followed.
 */
export type DealAccess =
  | { access: 'open'; deal: DealView }
  | { access: 'locked'; relationship: RelationshipView };

/**
 * DEMO SEAM — the gate below is real, and the seeded accounts clear it.
 *
 * Every seeded member is written an approved questionnaire back-dated
 * past its cooling-off period (see completeOnboarding in
 * lib/repositories/investor.ts). A `+new` account walks the questionnaire
 * and then waits out the cooling-off period like anyone would. What is
 * simulated is the seeded history, not the restriction.
 */

/** Stamp whether this viewer may subscribe, from the one rule that decides it. */
function withViewer(deal: DealView, relationship: RelationshipView): DealView {
  return { ...deal, subscribable: canSubscribeToDeal(relationship, deal.launchedAt) };
}

/** The shelf as this member is entitled to see it: all of it, or none. */
export async function listDealsForViewer(
  userId: string,
): Promise<DealShelfItem[]> {
  const relationship = await getRelationshipView(userId);
  if (!canViewDealDetail(relationship)) return [];

  const deals = await listDealRecords(userId);
  return deals.map((deal) => withViewer(deal, relationship));
}

/**
 * One deal as this member is entitled to see it.
 *
 * The gate is checked before the deal is looked up. A locked member gets
 * the same answer for a real id and a made-up one, so probing ids cannot
 * reveal which offerings exist. Null means an eligible member asked for a
 * deal that does not exist.
 */
export async function getDealAccess(
  id: string,
  userId: string,
): Promise<DealAccess | null> {
  const relationship = await getRelationshipView(userId);
  if (!canViewDealDetail(relationship)) return { access: 'locked', relationship };

  const deal = await getDealRecord(id, userId);
  return deal ? { access: 'open', deal: withViewer(deal, relationship) } : null;
}

/**
 * A named set of deals as this member is entitled to see them, in the
 * order the ids were given. Unknown ids are dropped rather than faked,
 * and before the gate opens every id is.
 */
export async function getDealsForViewer(
  ids: string[],
  userId: string,
): Promise<DealShelfItem[]> {
  if (ids.length === 0) return [];

  const relationship = await getRelationshipView(userId);
  if (!canViewDealDetail(relationship)) return [];

  const rows = await prisma.deal.findMany({ where: { id: { in: ids } } });
  const byId = new Map(rows.map((row) => [row.id, toDealView(row)]));

  return ids
    .map((id) => byId.get(id))
    .filter((deal): deal is DealView => deal !== undefined)
    .map((deal) => withViewer(deal, relationship));
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

/**
 * Is this the id of a deal, open or closed? For deciding which gate a
 * request falls under, never for answering a member: a caller must not
 * reveal the result to someone who has not cleared the relationship gate.
 */
export async function isDealId(id: string): Promise<boolean> {
  const row = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
  return row !== null;
}
