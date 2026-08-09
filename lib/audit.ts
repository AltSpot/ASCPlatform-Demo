/**
 * Append-only audit trail.
 *
 * Every transition that would need books-and-records treatment in a real
 * offering is written here: verification outcomes, document execution,
 * funding, cancellations. Writes are best-effort and never block or fail
 * the operation being audited — a dropped log line must not cost an
 * investor their allocation.
 */
import 'server-only';

import { prisma } from './db';

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.user_created'
  | 'accreditation.letter_downloaded'
  | 'accreditation.verified'
  | 'vault.saved'
  | 'kyc.submitted'
  | 'kyc.cleared'
  | 'profile.created'
  | 'profile.default_changed'
  | 'bank.linked'
  | 'subscription.started'
  | 'subscription.amount_changed'
  | 'subscription.section_confirmed'
  | 'subscription.signed'
  | 'subscription.funded'
  | 'subscription.cancelled'
  | 'subscription.expired'
  | 'document.saved'
  | 'radar.interest_indicated'
  | 'watchlist.added'
  | 'watchlist.removed'
  | 'demo.reset';

interface AuditInput {
  userId?: string | null;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  actor?: string;
}

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        actor: input.actor ?? 'investor',
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    // Never let the audit trail take down the operation it describes.
    console.error('[audit] failed to record', input.action, error);
  }
}
