/**
 * Position marks repository — the only place that touches marks.
 *
 * Reads only. Turning marks into a quarterly series is pure arithmetic
 * that needs no database, so it lives in lib/portfolio-series.ts where
 * the tests can reach it.
 */
import 'server-only';

import { prisma } from '../db';

export interface MarkView {
  subscriptionId: string;
  asOf: string;
  value: number;
  basis: string;
}

export async function getMarks(userId: string): Promise<MarkView[]> {
  const rows = await prisma.positionMark.findMany({
    where: { subscription: { userId } },
    orderBy: { asOf: 'asc' },
    select: { subscriptionId: true, asOf: true, value: true, basis: true },
  });

  return rows.map((row) => ({
    subscriptionId: row.subscriptionId,
    asOf: row.asOf.toISOString(),
    value: row.value,
    basis: row.basis,
  }));
}
