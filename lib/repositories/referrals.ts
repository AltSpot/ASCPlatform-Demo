/**
 * Referral repository — the only place that touches referral_codes and
 * the referral columns on users.
 *
 * Reporting only. See lib/referral.ts: nothing that decides a fee, a
 * carry split or whether a member may see or join a deal reads anything
 * here, and tests/referral.test.ts holds that line.
 */
import 'server-only';

import { randomBytes } from 'node:crypto';

import { prisma } from '../db';
import type { ReferralKind } from '../referral';

export interface ReferralCodeView {
  code: string;
  kind: ReferralKind;
  label: string;
}

/** An active code, or null. */
export async function findActiveReferralCode(code: string): Promise<ReferralCodeView | null> {
  const row = await prisma.referralCode.findUnique({ where: { code } });
  if (!row || !row.active) return null;
  return { code: row.code, kind: row.kind as ReferralKind, label: row.label };
}

/**
 * Record which link a member signed up through. Once only, and never a
 * member's own code. Returns what was recorded, or null if nothing was.
 */
export async function attributeReferral(
  userId: string,
  code: string,
): Promise<ReferralCodeView | null> {
  const referral = await findActiveReferralCode(code);
  if (!referral) return null;

  const owner = await prisma.referralCode.findUnique({
    where: { code },
    select: { ownerUserId: true },
  });
  if (owner?.ownerUserId === userId) return null;

  const updated = await prisma.user.updateMany({
    where: { id: userId, referralCode: null },
    data: { referralCode: referral.code, referralKind: referral.kind },
  });

  return updated.count > 0 ? referral : null;
}

/** This member's own invite code, created the first time it is asked for. */
export async function getOrCreateMemberCode(
  userId: string,
): Promise<{ view: ReferralCodeView; created: boolean }> {
  const existing = await prisma.referralCode.findUnique({ where: { ownerUserId: userId } });
  if (existing) {
    return {
      view: { code: existing.code, kind: 'member', label: existing.label },
      created: false,
    };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true },
  });

  /* Random rather than derived from the name or id: a code in a URL
     should not say who sent it or be guessable from who they are. */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `m-${randomBytes(5).toString('hex')}`;
    try {
      const row = await prisma.referralCode.create({
        data: { code, kind: 'member', label: user.name, ownerUserId: userId },
      });
      return { view: { code: row.code, kind: 'member', label: row.label }, created: true };
    } catch {
      /* A collision on the code or a concurrent create for this member:
         read back what won, or try another code. */
      const raced = await prisma.referralCode.findUnique({ where: { ownerUserId: userId } });
      if (raced) {
        return { view: { code: raced.code, kind: 'member', label: raced.label }, created: false };
      }
    }
  }

  throw new Error('Could not create an invite code');
}
