/**
 * POST /api/radar/interest — indicate interest in a Radar company.
 *
 * Demand signal only. No allocation is reserved, no document is created
 * and no money is ever collected against this. The client enforces the
 * minimum too, but the minimum that counts is the one checked here.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import {
  ok,
  readJson,
  requireInt,
  requireString,
  route,
  ValidationError,
} from '@/lib/http';
import { indicateInterest } from '@/lib/repositories/radar';
import { findRadarCompany, MAX_INDICATION } from '@/lib/terminal/radar';

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ companySlug?: unknown; amount?: unknown }>(request);

  const companySlug = requireString(body.companySlug, 'companySlug', {
    maxLength: 64,
  });

  // The watchlist is the allowlist. An unknown slug is a bad request,
  // not a new row.
  const company = findRadarCompany(companySlug);
  if (!company) throw new ValidationError('That company is not on the Radar');

  const amount = requireInt(body.amount, 'amount', {
    min: company.minIndication,
    max: MAX_INDICATION,
  });

  const view = await indicateInterest(user.id, companySlug, amount);

  await audit({
    userId: user.id,
    action: 'radar.interest_indicated',
    entity: 'radar_interest',
    entityId: companySlug,
    metadata: { companySlug, amount },
  });

  return ok(view, 201);
});
