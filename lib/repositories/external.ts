/**
 * External positions repository — the only place that touches
 * external_positions.
 *
 * Holdings a member has somewhere else: an AngelList syndicate, a fund
 * they are an LP in, shares held directly. AltSpot wants to be where
 * they read their whole private book, and a portfolio page that shows
 * only the part bought here is one they check once.
 *
 * EVERY FIGURE ON THESE ROWS IS SELF-REPORTED. There is no
 * administrator behind them and no mark AltSpot can stand behind, so
 * nothing here is ever silently added to an AltSpot total. Surfaces
 * that combine the two say which is which, and `isExternal` on the view
 * is what they read to do it.
 *
 * Scoped to the session user on every call, like every other repository
 * here: a member can neither read nor change another's book.
 */
import 'server-only';

import { prisma } from '../db';

export interface ExternalPositionView {
  id: string;
  name: string;
  custodian: string | null;
  assetClass: string;
  industry: string | null;
  invested: number;
  fairValue: number;
  realized: number;
  /** ISO. */
  investedAt: string;
  markedAt: string | null;
  note: string | null;
}

export interface ExternalPositionInput {
  name: string;
  custodian: string | null;
  assetClass: string;
  industry: string | null;
  invested: number;
  fairValue: number;
  realized: number;
  investedAt: string;
  markedAt: string | null;
  note: string | null;
}

function toView(row: {
  id: string;
  name: string;
  custodian: string | null;
  assetClass: string;
  industry: string | null;
  invested: number;
  fairValue: number;
  realized: number;
  investedAt: Date;
  markedAt: Date | null;
  note: string | null;
}): ExternalPositionView {
  return {
    id: row.id,
    name: row.name,
    custodian: row.custodian,
    assetClass: row.assetClass,
    industry: row.industry,
    invested: row.invested,
    fairValue: row.fairValue,
    realized: row.realized,
    investedAt: row.investedAt.toISOString(),
    markedAt: row.markedAt?.toISOString() ?? null,
    note: row.note,
  };
}

/** Newest money first, which is the order a member added them in. */
export async function listExternal(
  userId: string,
): Promise<ExternalPositionView[]> {
  const rows = await prisma.externalPosition.findMany({
    where: { userId },
    orderBy: [{ investedAt: 'desc' }],
  });
  return rows.map(toView);
}

export async function addExternal(
  userId: string,
  input: ExternalPositionInput,
): Promise<ExternalPositionView> {
  const row = await prisma.externalPosition.create({
    data: {
      userId,
      name: input.name,
      custodian: input.custodian,
      assetClass: input.assetClass,
      industry: input.industry,
      invested: input.invested,
      fairValue: input.fairValue,
      realized: input.realized,
      investedAt: new Date(input.investedAt),
      markedAt: input.markedAt ? new Date(input.markedAt) : null,
      note: input.note,
    },
  });
  return toView(row);
}

/**
 * Update in place. Ownership is part of the where clause rather than
 * checked first, so there is no window between the two and no way to
 * reach another member's row by guessing an id.
 */
export async function updateExternal(
  userId: string,
  id: string,
  input: ExternalPositionInput,
): Promise<ExternalPositionView | null> {
  const { count } = await prisma.externalPosition.updateMany({
    where: { id, userId },
    data: {
      name: input.name,
      custodian: input.custodian,
      assetClass: input.assetClass,
      industry: input.industry,
      invested: input.invested,
      fairValue: input.fairValue,
      realized: input.realized,
      investedAt: new Date(input.investedAt),
      markedAt: input.markedAt ? new Date(input.markedAt) : null,
      note: input.note,
    },
  });

  if (count === 0) return null;

  const row = await prisma.externalPosition.findUnique({ where: { id } });
  return row ? toView(row) : null;
}

export async function removeExternal(
  userId: string,
  id: string,
): Promise<boolean> {
  const { count } = await prisma.externalPosition.deleteMany({
    where: { id, userId },
  });
  return count > 0;
}
