/**
 * Deal announcements through Postmark.
 *
 * DEMO SEAM — nothing is sent.
 *   Simulated: in demo mode this returns how many members the email
 *     would reach and writes nothing to any mail provider.
 *   Production contract: send one message per recipient through
 *     Postmark's batch endpoint, from a members-only stream, with the
 *     deal named only inside the message. The recipients are always
 *     listDealEmailAudience(dealId) and never a list built anywhere
 *     else, because that function is where the Rule 506(b) audience
 *     rule is applied.
 *   Replacement: implement sendBatch with the Postmark client and a
 *     server token from the environment; callers do not change.
 *
 * There is no trigger yet. A deal launch is a back-office action and the
 * back office does not exist; when it does, it calls this.
 */
import 'server-only';

import { DEMO_MODE } from '../config';
import { listDealEmailAudience } from '../repositories/notifications';

export interface AnnouncementResult {
  recipients: number;
  sent: number;
  simulated: boolean;
}

export async function announceDeal(dealId: string): Promise<AnnouncementResult> {
  const audience = await listDealEmailAudience(dealId);

  if (DEMO_MODE) {
    return { recipients: audience.length, sent: 0, simulated: true };
  }

  throw new Error('Postmark is not configured. See lib/integrations/postmark.ts.');
}
