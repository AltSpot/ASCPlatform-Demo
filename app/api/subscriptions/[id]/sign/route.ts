/**
 * POST /api/subscriptions/:id/sign
 *
 * Executes the subscription agreement. Every section defined in
 * lib/subscription-sections.ts must already be confirmed — checked here, not
 * just in the UI. Signing reserves the allocation, starts the 10-day funding
 * clock, and files the executed agreement into Docs in one
 * transaction-shaped sequence.
 */
import { requireUser } from '@/lib/auth';
import {
  NotFoundError,
  ok,
  readJson,
  requireString,
  route,
  ValidationError,
} from '@/lib/http';
import { renderBinder } from '@/lib/documents/render';
import { getDeal } from '@/lib/repositories/deals';
import { getVault, listProfiles } from '@/lib/repositories/investor';
import { dateStr, maskTin, money } from '@/lib/format';
import { saveDocument } from '@/lib/repositories/documents';
import { getSubscription, signSubscription } from '@/lib/repositories/subscriptions';
import { unconfirmedSections } from '@/lib/subscription-sections';

export const POST = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const current = await getSubscription(user.id, id);
    if (!current) throw new NotFoundError('Subscription not found');

    const outstanding = unconfirmedSections(current.answers);
    if (outstanding.length > 0) {
      throw new ValidationError(
        `Confirm every section before signing. Still open: ${outstanding
          .map((s) => s.documentTitle)
          .join(', ')}`,
      );
    }

    const body = await readJson<{ signature?: unknown }>(request);
    const signature = requireString(body.signature, 'signature', { maxLength: 160 });

    const signed = await signSubscription(user.id, id, signature);

    const deal = await getDeal(current.dealId);
    if (deal) {
      const [vault, profiles] = await Promise.all([
        getVault(user.id),
        listProfiles(user.id),
      ]);
      const profile = profiles.find((p) => p.id === current.profileId) ?? null;

      /**
       * The signed record is rendered HERE, not captured from the browser.
       * An electronic record has to be accurately reproducible by whoever
       * relies on it later, and "whatever the client posted back" is not
       * that. Rendering server-side means we can always reproduce the exact
       * text this investor executed, from the version pinned beside it.
       */
      const rendered = renderBinder(
        {
          legalName: [vault.first, vault.last].filter(Boolean).join(' ') || user.name,
          amount: money(current.amount),
          units: current.amount.toLocaleString('en-US'),
          date: dateStr(signed.signedAt ?? Date.now()),
          signature,
          entityName: deal.entity,
          address: [vault.street, vault.city, vault.state, vault.zip]
            .filter(Boolean)
            .join(', '),
          taxId: maskTin(vault.tinLast4),
          profile: profile ? `${profile.name} (${profile.type})` : '',
        },
        { investorName: user.name, dealName: deal.name },
      );

      await saveDocument(user.id, {
        name: `Subscription Agreement · ${deal.entity}`,
        dealId: deal.id,
        subscriptionId: id,
        type: 'agreement',
        note: 'Signed · awaiting funding',
        bodyHtml: rendered.html,
        // Pinned server-side. The browser must not get to assert which
        // version of the documents an investor signed against.
        binderVersion: `${rendered.version}#sha256:${rendered.sha256.slice(0, 16)}`,
      });
    }

    return ok(signed);
  },
);
