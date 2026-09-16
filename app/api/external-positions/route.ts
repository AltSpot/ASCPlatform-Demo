/**
 * /api/external-positions — the holdings a member has somewhere else.
 *
 * GET lists them. POST adds one.
 *
 * Validated here and not only in the form, like every other write on
 * the platform: the UI rules are a courtesy and this is the control.
 * The asset class has to be one the taxonomy knows, or an external row
 * would fall out of every allocation breakdown it is supposed to join.
 *
 * Audited. A member's own record of what they hold elsewhere is not a
 * securities transaction, but it does change what their statements
 * total, and anything that changes a reported figure leaves a trail.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import {
  ok,
  optionalString,
  readJson,
  requireInt,
  requireString,
  route,
  ValidationError,
} from '@/lib/http';
import { addExternal, listExternal } from '@/lib/repositories/external';
import { isAssetClass, isIndustry } from '@/lib/taxonomy';

/** A ten-figure position is a typo, not a holding. */
const MAX_AMOUNT = 5_000_000_000;

export function parseBody(body: Record<string, unknown>) {
  const assetClass = requireString(body.assetClass, 'assetClass', { maxLength: 40 });
  if (!isAssetClass(assetClass)) {
    throw new ValidationError('"assetClass" is not one AltSpot tracks');
  }

  const industry = optionalString(body.industry, 40);
  if (industry && !isIndustry(industry)) {
    throw new ValidationError('"industry" is not one AltSpot tracks');
  }

  const investedAt = requireString(body.investedAt, 'investedAt', { maxLength: 40 });
  if (Number.isNaN(new Date(investedAt).getTime())) {
    throw new ValidationError('"investedAt" is not a date');
  }

  const markedAt = optionalString(body.markedAt, 40);
  if (markedAt && Number.isNaN(new Date(markedAt).getTime())) {
    throw new ValidationError('"markedAt" is not a date');
  }

  return {
    name: requireString(body.name, 'name', { maxLength: 120 }),
    custodian: optionalString(body.custodian, 80),
    assetClass,
    industry,
    invested: requireInt(body.invested, 'invested', { min: 1, max: MAX_AMOUNT }),
    fairValue: requireInt(body.fairValue ?? 0, 'fairValue', { min: 0, max: MAX_AMOUNT }),
    realized: requireInt(body.realized ?? 0, 'realized', { min: 0, max: MAX_AMOUNT }),
    investedAt,
    markedAt,
    note: optionalString(body.note, 300),
  };
}

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listExternal(user.id));
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const input = parseBody(await readJson<Record<string, unknown>>(request));

  const position = await addExternal(user.id, input);

  await audit({
    userId: user.id,
    action: 'external_position.added',
    entity: 'external_position',
    entityId: position.id,
    metadata: { name: position.name, invested: position.invested },
  });

  return ok(position, 201);
});
