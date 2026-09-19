/**
 * Radar repository — the only place that touches radar_interests.
 *
 * Radar interest is demand signal, not a commitment. Nothing here moves
 * allocation, generates a document or touches money. The one rule worth
 * stating: a member gets one indication per company, so re-indicating
 * replaces the amount rather than stacking a second row on top. That is
 * what makes the tally an honest count of people rather than a count of
 * button presses.
 *
 * The tally an investor sees is the seeded demo baseline plus every real
 * indication. The baseline lives in lib/terminal/radar.ts and goes to
 * zero in production, at which point this returns purely real numbers
 * with no change here.
 */
import 'server-only';

import { prisma } from '../db';
import { RECENT_DAYS } from '../radar-rank';
import { canSeeOfferings } from '../relationship';
import {
  listRadarCompanies,
  type RadarCompany,
  type RadarCompanyView,
} from '../terminal/radar';
import { getRelationshipView } from './investor';

export type { RadarCompanyView };

interface Tally {
  investors: number;
  dollars: number;
}

/**
 * DEMO SEAM — momentum and listing age for the seeded board.
 *
 * The board's Featured order (lib/radar-rank.ts) needs two facts the demo
 * has no history for: how much of a name's demand is recent, and how long
 * it has been listed. Both are drawn deterministically from the slug, so
 * the same name always reads the same. Production: recent dollars are the
 * real sum below, and the listing date is a column on the company.
 */
function slugHash(slug: string): number {
  let h = 7;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}
function seededRecentShare(slug: string): number {
  return (slugHash(slug) % 34) / 100;
}
function seededListedDaysAgo(slug: string): number {
  return 6 + (slugHash(slug + ':listed') % 170);
}

/** What one member has said about one company: their number and their order. */
interface Mine {
  amount: number;
  rank: number;
}

async function tallies(): Promise<Map<string, Tally>> {
  const rows = await prisma.radarInterest.groupBy({
    by: ['companySlug'],
    _count: { _all: true },
    _sum: { amount: true },
  });

  return new Map(
    rows.map((row) => [
      row.companySlug,
      { investors: row._count._all, dollars: row._sum.amount ?? 0 },
    ]),
  );
}

/** Dollars voted per company inside the momentum window. */
async function recentTallies(): Promise<Map<string, number>> {
  const since = new Date(Date.now() - RECENT_DAYS * 86_400_000);
  const rows = await prisma.radarInterest.groupBy({
    by: ['companySlug'],
    where: { updatedAt: { gte: since } },
    _sum: { amount: true },
  });
  return new Map(rows.map((row) => [row.companySlug, row._sum.amount ?? 0]));
}

function merge(
  company: RadarCompany,
  tally: Tally | undefined,
  mine: Mine | undefined,
  recent: number = 0,
): RadarCompanyView {
  return {
    ...company,
    recentDollars: recent + Math.round(company.baselineDollars * seededRecentShare(company.slug)),
    listedDaysAgo: seededListedDaysAgo(company.slug),
    interestInvestors: company.baselineInvestors + (tally?.investors ?? 0),
    interestDollars: company.baselineDollars + (tally?.dollars ?? 0),
    yourAmount: mine?.amount ?? null,
    // Zero is the stored "never reordered" value. It reaches the view as
    // null so the UI has one thing to test rather than two.
    yourRank: mine && mine.rank > 0 ? mine.rank : null,
  };
}

/**
 * The Radar board as one investor sees it.
 *
 * The Radar is sourcing intelligence, not an offering, so it is open to
 * every signed-in member. The one thing on it that is about an offering
 * is `dealId`: which Radar name became an open deal. That is withheld
 * until the member clears the 506(b) relationship gate, for the same
 * reason the deal itself is.
 */
export async function getRadarBoard(userId: string): Promise<RadarCompanyView[]> {
  const [companies, counts, recent, mine, relationship] = await Promise.all([
    listRadarCompanies(),
    tallies(),
    recentTallies(),
    prisma.radarInterest.findMany({
      where: { userId },
      select: { companySlug: true, amount: true, rank: true },
    }),
    getRelationshipView(userId),
  ]);
  const offeringsVisible = canSeeOfferings(relationship);

  const yours = new Map(
    mine.map((row) => [row.companySlug, { amount: row.amount, rank: row.rank }]),
  );

  return companies.map((company) => {
    const view = merge(
      company,
      counts.get(company.slug),
      yours.get(company.slug),
      recent.get(company.slug) ?? 0,
    );
    return offeringsVisible ? view : { ...view, dealId: undefined };
  });
}

/**
 * Store the member's own ordering for Your Radar.
 *
 * Ranks are rewritten from the submitted order rather than patched, so
 * the stored sequence is always 1..n with no gaps and no way for two
 * names to tie. Slugs the member has not indicated on are ignored: a
 * rank is a property of their indication, so there is nothing to rank
 * without one.
 *
 * Returns the refreshed board so the client can settle on server truth
 * without a second round trip.
 */
export async function reorderRadar(
  userId: string,
  order: string[],
): Promise<RadarCompanyView[]> {
  const held = await prisma.radarInterest.findMany({
    where: { userId },
    select: { companySlug: true },
  });
  const ranked = new Set(held.map((row) => row.companySlug));

  const updates = order
    .filter((slug) => ranked.has(slug))
    .map((slug, index) =>
      prisma.radarInterest.update({
        where: { userId_companySlug: { userId, companySlug: slug } },
        data: { rank: index + 1 },
      }),
    );

  if (updates.length > 0) await prisma.$transaction(updates);

  return getRadarBoard(userId);
}

/**
 * Record or replace one member's indication, then return that company's
 * refreshed row so the client can render the new tally without a second
 * round trip.
 */
export async function indicateInterest(
  userId: string,
  companySlug: string,
  amount: number,
): Promise<RadarCompanyView> {
  await prisma.radarInterest.upsert({
    where: { userId_companySlug: { userId, companySlug } },
    update: { amount },
    create: { userId, companySlug, amount },
  });

  const board = await getRadarBoard(userId);
  const view = board.find((company) => company.slug === companySlug);

  // The route validates the slug against the tracked companies before calling,
  // so this only fires if the two lists drift apart.
  if (!view) throw new Error(`Radar company "${companySlug}" is not on the board`);
  return view;
}
