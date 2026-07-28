/**
 * POST /api/subscriptions/:id/sign
 *
 * Executes the subscription agreement. All three sections must already be
 * confirmed — checked here, not just in the UI. Signing reserves the
 * allocation, starts the 10-day funding clock, and files the executed
 * agreement into Docs in one transaction-shaped sequence.
 */
import { requireUser } from '@/lib/auth';
import {
  NotFoundError,
  ok,
  optionalString,
  readJson,
  requireString,
  route,
  ValidationError,
} from '@/lib/http';
import { getDeal } from '@/lib/repositories/deals';
import { saveDocument } from '@/lib/repositories/documents';
import { getSubscription, signSubscription } from '@/lib/repositories/subscriptions';

export const POST = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const current = await getSubscription(user.id, id);
    if (!current) throw new NotFoundError('Subscription not found');

    const confirmed = [1, 2, 3].every((n) => current.answers[`q${n}`]);
    if (!confirmed) {
      throw new ValidationError('All three sections must be confirmed before signing');
    }

    const body = await readJson<{ signature?: unknown; bodyHtml?: unknown }>(request);
    const signature = requireString(body.signature, 'signature', { maxLength: 160 });

    const signed = await signSubscription(user.id, id, signature);

    const deal = await getDeal(current.dealId);
    if (deal) {
      await saveDocument(user.id, {
        name: `Subscription Agreement — ${deal.entity}`,
        dealId: deal.id,
        subscriptionId: id,
        type: 'agreement',
        note: 'Signed · awaiting funding',
        // Store what was actually on screen, so Docs re-opens the real thing.
        bodyHtml: optionalString(body.bodyHtml, 200_000),
      });
    }

    return ok(signed);
  },
);
