/**
 * Notification audiences. Reads only; sending is lib/integrations/postmark.ts.
 */
import 'server-only';

import { COOLING_OFF_DAYS } from '../config';
import { prisma } from '../db';
import { dealEmailAudience, type EmailCandidate } from '../deal-email';
import { relationshipStage } from '../relationship';

/**
 * The members who may be emailed about a deal. The query narrows to
 * relationships established before launch; the pure rule then applies
 * the cooling-off period and the strict ordering, so the database and
 * the rule cannot disagree about who is in.
 */
export async function listDealEmailAudience(dealId: string): Promise<EmailCandidate[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { launchedAt: true },
  });
  if (!deal) return [];

  const users = await prisma.user.findMany({
    where: { relationshipEstablishedAt: { lt: deal.launchedAt } },
    select: {
      id: true,
      email: true,
      relationshipEstablishedAt: true,
      accreditation: { select: { status: true } },
    },
  });

  const candidates: EmailCandidate[] = users.map((user) => ({
    userId: user.id,
    email: user.email,
    relationship: relationshipStage(
      {
        status: user.accreditation?.status ?? 'not_started',
        establishedAt: user.relationshipEstablishedAt?.toISOString() ?? null,
      },
      COOLING_OFF_DAYS,
    ),
  }));

  return dealEmailAudience(candidates, deal.launchedAt.toISOString());
}
