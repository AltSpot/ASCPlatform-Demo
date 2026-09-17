/**
 * The record of what each member was shown (counsel's spec, item 10):
 * the scenario set by version, with the assumptions as rendered, keyed
 * to the member and the deal. A changed set is a new version and a new
 * row; a repeat view bumps the count and the time. The first showing is
 * audited too, so the books-and-records trail carries it.
 */
import 'server-only';

import { audit } from '../audit';
import { prisma } from '../db';
import type { ScenarioSet } from '../scenarios';

export async function recordScenarioView(
  userId: string,
  dealId: string,
  set: ScenarioSet,
): Promise<void> {
  const assumptionsJson = JSON.stringify({
    asOf: set.asOf,
    preparedBy: set.preparedBy,
    numbersFrom: set.numbersFrom,
    inputs: set.inputs,
    cases: set.cases,
    comparables: set.comparables,
  });

  const existing = await prisma.scenarioView.findUnique({
    where: { userId_dealId_version: { userId, dealId, version: set.version } },
    select: { id: true },
  });

  if (existing) {
    await prisma.scenarioView.update({
      where: { id: existing.id },
      data: { lastShownAt: new Date(), timesShown: { increment: 1 } },
    });
    return;
  }

  await prisma.scenarioView.create({
    data: { userId, dealId, version: set.version, assumptionsJson },
  });
  await audit({
    userId,
    action: 'scenarios.shown',
    entity: 'deal',
    entityId: dealId,
    metadata: { version: set.version, asOf: set.asOf },
  });
}
