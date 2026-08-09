/**
 * GET  /api/bank — the default funding source, if any.
 * POST /api/bank — link the accounts chosen in the Plaid flow.
 *
 * DEMO SEAM (POST) — the account list is taken on trust from the browser.
 * Note there is no DEMO_MODE guard here: this path is unconditional today,
 * which is exactly why it is called out.
 *   Simulated: components/wizard/PlaidDemoModal.tsx picks from fixtures
 *     and posts an institution name plus masks. This route validates the
 *     shape, and only the shape. Anyone with a session can post any
 *     four-digit mask and any institution string and have it filed as a
 *     funding source. Nothing was ever verified against a real bank.
 *   Production contract: the browser completes Plaid Link and posts a
 *     single `public_token`. This route exchanges it server-side for an
 *     access token, pulls the accounts from Plaid, and persists what
 *     Plaid reports. The client never gets to assert a mask. Bank
 *     credentials still never touch this server either way, which is the
 *     whole point of Link.
 *   Replacement: implement the Plaid adapter in lib/integrations/, change
 *     the request body to `{ public_token }`, and derive the
 *     `LinkedAccountInput[]` from the exchange response. `linkBank` in
 *     lib/repositories/investor.ts already takes that exact shape and
 *     does not change.
 *
 * Masks always come from the link flow; nothing is fabricated server-side.
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
