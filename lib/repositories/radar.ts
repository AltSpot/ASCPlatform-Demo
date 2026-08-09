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
import {
  listRadarCompanies,
  type RadarCompany,
  type RadarCompanyView,
} from '../terminal/radar';

export type { RadarCompanyView };

interface Tally {
  investors: number;
  dollars: number;
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

function merge(
  company: RadarCompany,
  tally: Tally | undefined,
  yourAmount: number | null,
): RadarCompanyView {
  return {
    ...company,
    interestInvestors: company.baselineInvestors + (tally?.investors ?? 0),
    interestDollars: company.baselineDollars + (tally?.dollars ?? 0),
    yourAmount,
  };
}

/** The Radar board as one investor sees it. */
export async function getRadarBoard(userId: string): Promise<RadarCompanyView[]> {
  const [companies, counts, mine] = await Promise.all([
    listRadarCompanies(),
    tallies(),
    prisma.radarInterest.findMany({
      where: { userId },
      select: { companySlug: true, amount: true },
    }),
  ]);

  const yours = new Map(mine.map((row) => [row.companySlug, row.amount]));

  return companies.map((company) =>
    merge(company, counts.get(company.slug), yours.get(company.slug) ?? null),
  );
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

  // The route validates the slug against the watchlist before calling,
  // so this only fires if the two lists drift apart.
  if (!view) throw new Error(`Radar company "${companySlug}" is not on the board`);
  return view;
}
