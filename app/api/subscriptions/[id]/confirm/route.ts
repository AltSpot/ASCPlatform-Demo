/**
 * POST /api/subscriptions/:id/confirm — record one grouped document
 * confirmation. Autosaves, so an investor can leave mid-signing and resume.
 *
 * The body carries a confirmation code from lib/subscription-sections.ts,
 * which identifies the section and, for the two sections that are selections
 * of fact, the option chosen. The repository rejects any code not in that
 * table, so this handler only has to bound the integer.
 */
import { requireUser } from '@/lib/auth';
import {
  NotFoundError,
  ok,
  readJson,
  requireInt,
  route,
  ValidationError,
} from '@/lib/http';
import { confirmSection, getSubscription } from '@/lib/repositories/subscriptions';
import { SUBSCRIPTION_SECTION_COUNT } from '@/lib/subscription-sections';

/** Codes are `section * 100 + choice ordinal`, so this bounds the space. */
const MAX_CODE = (SUBSCRIPTION_SECTION_COUNT + 1) * 100;

export const POST = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const current = await getSubscription(user.id, id);
    if (!current) throw new NotFoundError('Subscription not found');

    const body = await readJson<{ section?: unknown }>(request);
    const code = requireInt(body.section, 'section', { min: 100, max: MAX_CODE });

    try {
      return ok(await confirmSection(user.id, id, code));
    } catch (error) {
      if (error instanceof Error && error.message === 'Unknown confirmation code') {
        throw new ValidationError('That confirmation does not exist');
      }
      throw error;
    }
  },
);
