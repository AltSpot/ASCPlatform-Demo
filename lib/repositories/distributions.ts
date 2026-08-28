/**
 * Distributions repository — the only place that touches distributions.
 *
 * Cash returned to an investor from a position. Nothing on the platform
 * has exited, so every read here returns empty today. The shape is here
 * because the dashboard needs a slot that fills itself the moment a
 * deal distributes, rather than a slot that has to be built then.
 *
 * Return of capital and gain are separated because they are taxed
 * differently, and an investor statement has to be able to say which
 * was which. A single running total cannot.
 */
import 'server-only';

import { prisma } from '../db';

export interface DistributionView {
  id: string;
  subscriptionId: string;
  dealId: string;
  amount: number;
  paidAt: string;
  kind: 'return_of_capital' | 'gain';
  note: string | null;
}

export interface DistributionSummary {
  /** Every distribution this investor has received, newest first. */
  items: DistributionView[];
  /** Integer dollars returned in total. */
  total: number;
  /** Of that total, the part that is a return of the original capital. */
  returnOfCapital: number;
  /** Of that total, the part that is gain. */
  gain: number;
}

const EMPTY: DistributionSummary = {
  items: [],
  total: 0,
  returnOfCapital: 0,
  gain: 0,
};

/**
 * Everything returned to this investor, across every position they
 * hold. Scoped to the session user, like every other repository here.
 */
export async function getDistributions(userId: string): Promise<DistributionSummary> {
  const rows = await prisma.distribution.findMany({
    where: { subscription: { userId } },
    orderBy: { paidAt: 'desc' },
    select: {
      id: true,
      subscriptionId: true,
      amount: true,
      paidAt: true,
      kind: true,
      note: true,
      subscription: { select: { dealId: true } },
    },
  });

  if (rows.length === 0) return EMPTY;

  const items: DistributionView[] = rows.map((row) => ({
    id: row.id,
    subscriptionId: row.subscriptionId,
    dealId: row.subscription.dealId,
    amount: row.amount,
    paidAt: row.paidAt.toISOString(),
    kind: row.kind === 'gain' ? 'gain' : 'return_of_capital',
    note: row.note,
  }));

  return {
    items,
    total: items.reduce((sum, d) => sum + d.amount, 0),
    returnOfCapital: items
      .filter((d) => d.kind === 'return_of_capital')
      .reduce((sum, d) => sum + d.amount, 0),
    gain: items.filter((d) => d.kind === 'gain').reduce((sum, d) => sum + d.amount, 0),
  };
}
