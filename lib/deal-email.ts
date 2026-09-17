/**
 * Who may be emailed about a deal.
 *
 * Rule 506(b): deal emails go through Postmark to members only, and only
 * to members who may actually join the deal: eligible now, with a
 * relationship established before the deal launched. That is exactly
 * canSubscribeToDeal, so the audience for an announcement and the set of
 * members who can act on it are the same set by construction. An email
 * to anyone else would put a specific offering in front of someone the
 * rule says must not see it yet.
 *
 * Pure and isomorphic. The database read that feeds it is
 * listDealEmailAudience in lib/repositories/notifications.ts, and the
 * send is the Postmark seam in lib/integrations/postmark.ts.
 */
import { canSubscribeToDeal, type RelationshipView } from './relationship';

export interface EmailCandidate {
  userId: string;
  email: string;
  relationship: RelationshipView;
}

export function dealEmailAudience(
  candidates: readonly EmailCandidate[],
  launchedAt: string,
): EmailCandidate[] {
  return candidates.filter((c) => canSubscribeToDeal(c.relationship, launchedAt));
}
