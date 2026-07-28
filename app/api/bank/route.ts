/**
 * GET  /api/bank — the default funding source, if any.
 * POST /api/bank — link the accounts chosen in the Plaid flow.
 *
 * The client posts the accounts it selected; production posts the same
 * shape after exchanging a Plaid public token, so credentials never
 * touch this server either way. Masks always come from the selection.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { ValidationError, ok, readJson, requireString, route } from '@/lib/http';
import { getBank, linkBank } from '@/lib/repositories/investor';
import type { LinkedAccountInput } from '@/lib/repositories/investor';

/** No institution hands back an unbounded account list. */
const MAX_ACCOUNTS = 8;

function parseAccounts(value: unknown): LinkedAccountInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError('"accounts" must list at least one account');
  }
  if (value.length > MAX_ACCOUNTS) {
    throw new ValidationError('"accounts" has too many entries');
  }

  return value.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new ValidationError('"accounts" entries must be objects');
    }
    const account = entry as { mask?: unknown; type?: unknown };

    const mask = requireString(account.mask, 'accounts.mask', { maxLength: 4 });
    if (!/^\d{4}$/.test(mask)) {
      throw new ValidationError('"accounts.mask" must be four digits');
    }

    return {
      mask,
      type: requireString(account.type, 'accounts.type', { maxLength: 40 }),
    };
  });
}

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getBank(user.id));
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<{ institution?: unknown; accounts?: unknown }>(
    request,
  );

  const institution = requireString(body.institution, 'institution', {
    maxLength: 120,
  });
  const accounts = parseAccounts(body.accounts);

  const linked = await linkBank(user.id, institution, accounts);

  // One line per account: each is its own funding source on the books.
  for (const bank of linked) {
    await audit({
      userId: user.id,
      action: 'bank.linked',
      entity: 'bank_account',
      entityId: bank.id,
      metadata: {
        institution,
        type: bank.type,
        mask: bank.mask,
        isDefault: bank.id === linked[0].id,
        simulated: true,
      },
    });
  }

  return ok(linked, 201);
});
