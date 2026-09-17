/**
 * Ephemeral demo housekeeping.
 *
 * The demo is meant to be handed out as a link. Nobody should find a
 * previous visitor's half-finished subscription, and nobody should see a
 * shelf that looks picked over because forty people clicked through it
 * before them.
 *
 * Two mechanisms, both behind flags in lib/config.ts:
 *
 *   1. Stale accounts are swept. A demo identity lives for a few hours
 *      after its last session, then the row and everything cascading from
 *      it is deleted.
 *   2. Allocation is isolated per visitor (see lib/repositories/deals.ts).
 *      Deal rows are never mutated, so the shelf cannot drain.
 *
 * The sweep runs opportunistically on login rather than on a schedule,
 * because a container host has no cron and a demo has no traffic to speak
 * of. It is cheap, it is bounded, and a failure is swallowed: never let
 * housekeeping break a walkthrough.
 */
import 'server-only';

import { prisma } from '../db';
import { DEMO_TTL_HOURS, EPHEMERAL_DEMO, ISOLATED_ALLOCATION } from '../config';

const HOUR_MS = 3_600_000;

/** Don't re-sweep on every request. */
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 5 * 60_000;

/**
 * Delete demo accounts whose newest session is older than the TTL.
 *
 * Cascades clear sessions, onboarding, profiles, subscriptions and
 * documents, so no orphan rows are left behind. Deal rows are untouched,
 * because isolated allocation means they were never decremented.
 */
export async function sweepStaleDemoAccounts(): Promise<number> {
  if (!EPHEMERAL_DEMO) return 0;

  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return 0;
  lastSweep = now;

  const cutoff = new Date(now - DEMO_TTL_HOURS * HOUR_MS);

  try {
    const stale = await prisma.user.findMany({
      where: {
        createdAt: { lt: cutoff },
        sessions: { none: { createdAt: { gte: cutoff } } },
      },
      select: { id: true },
    });
    if (stale.length === 0) return 0;

    /* Rows keyed by user with no relation to cascade from. */
    const ids = stale.map((u) => u.id);
    await prisma.investorPreference.deleteMany({ where: { userId: { in: ids } } });
    await prisma.spvWaitlistEntry.deleteMany({ where: { userId: { in: ids } } });

    const { count } = await prisma.user.deleteMany({
      where: { id: { in: stale.map((u) => u.id) } },
    });

    console.log(`[demo] swept ${count} stale demo account(s)`);
    return count;
  } catch (error) {
    // Housekeeping must never take down a walkthrough.
    console.error('[demo] sweep failed', error);
    return 0;
  }
}

// ---------------- per-investor reset ----------------

/**
 * Hand back the allocation this investor's signed-but-unfunded
 * commitments are holding.
 *
 * Allocation is decremented at signature, not at funding, so a wipe that
 * ignored it would leave the shelf permanently short. Only `docs_signed`
 * rows hold anything: an unsigned commitment never reserved, and a funded
 * one is real. Called before `deleteInvestor`, because the cascade takes
 * the subscription rows with it.
 *
 * FIXED 9 Sep 2026. This used to increment unconditionally while
 * `signSubscription` only decrements when ISOLATED_ALLOCATION is OFF.
 * With the flag on, which is the default, the deal row was never debited,
 * so every reset handed back allocation that had never been taken and
 * `allocationRemaining` climbed on each pass. A demo run of a dozen
 * resets had Calder Grid drifting off 68% subscribed, and only a reseed
 * put it back. It is now symmetric with the sign path: under isolated
 * allocation there is nothing to return, because nothing was reserved.
 */
export async function releaseHeldAllocation(userId: string): Promise<void> {
  // Nothing was ever taken off the deal row, so there is nothing to give
  // back. Mirrors the guard in `signSubscription` and `cancelSubscription`.
  if (ISOLATED_ALLOCATION) return;

  const reserved = await prisma.subscription.findMany({
    where: { userId, state: 'docs_signed' },
  });

  for (const row of reserved) {
    await prisma.deal.update({
      where: { id: row.dealId },
      data: { allocationRemaining: { increment: row.amount } },
    });
  }
}

/**
 * Delete the investor outright. Cascades clear sessions, onboarding,
 * profiles, commitments and documents, so no orphan rows are left behind.
 * Other investors and the deal rows are untouched.
 */
export async function deleteInvestor(userId: string): Promise<void> {
  await prisma.investorPreference.deleteMany({ where: { userId } });
  await prisma.spvWaitlistEntry.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}
