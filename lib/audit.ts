/**
 * Append-only audit trail.
 *
 * Every transition that would need books-and-records treatment in a real
 * offering is written here: questionnaire outcomes, document execution,
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
  /* Retired with the 506(c) letter flow. Kept so historical rows still
     type-check when read back; nothing writes them now. */
  | 'accreditation.letter_downloaded'
  | 'accreditation.verified'
  /* The 506(b) questionnaire: the submission, then the platform's
     evaluation of it as a separate line with actor 'platform'. */
  | 'accreditation.questionnaire_submitted'
  | 'accreditation.approved'
  | 'accreditation.referred_for_review'
  | 'accreditation.declined'
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
  | 'radar.interest_withdrawn'
  | 'watchlist.added'
  | 'watchlist.removed'
  /* Self-reported holdings. Not a securities transaction, but they
     change what a member's own statements total, and anything that
     moves a reported figure leaves a trail. */
  | 'external_position.added'
  | 'external_position.updated'
  | 'external_position.removed'
  /* Which link a new member arrived through. Reporting only. */
  | 'referral.attributed'
  | 'referral.link_created'
  /* A member's deal preferences, for matchmaking. */
  | 'preferences.saved'
  | 'scenarios.shown'
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
