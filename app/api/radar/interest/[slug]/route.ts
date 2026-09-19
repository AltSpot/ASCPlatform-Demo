/**
 * DELETE /api/radar/interest/:slug
 *
 * Withdraw a vote entirely (Tyler, 2026-09-19). A vote could be raised and
 * lowered but never taken back, and the floor of the ladder is $10,000, so
 * a member who changed their mind was left saying something they no longer
 * meant. A vote reserves nothing and moves no money, so taking it back is
 * free, immediate and the member's alone to do.
 *
 * Idempotent: withdrawing a vote that is not there succeeds and changes
 * nothing, so a double press cannot error. The slug is checked against the
 * tracked companies like the POST beside it, and only a real withdrawal is
 * audited.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ok, route, ValidationError } from '@/lib/http';
import { withdrawInterest } from '@/lib/repositories/radar';
import { findRadarCompany } from '@/lib/terminal/radar';

type Context = { params: Promise<{ slug: string }> };

export const DELETE = route(async (_request: Request, context: Context) => {
  const user = await requireUser();
  const { slug } = await context.params;

  if (!findRadarCompany(slug)) throw new ValidationError('That company is not on the Radar');

  const { view, withdrawn } = await withdrawInterest(user.id, slug);

  if (withdrawn !== null) {
    await audit({
      userId: user.id,
      action: 'radar.interest_withdrawn',
      entity: 'radar_interest',
      entityId: slug,
      metadata: { companySlug: slug, amount: withdrawn },
    });
  }

  return ok(view);
});
