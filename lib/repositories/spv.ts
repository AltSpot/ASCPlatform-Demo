/**
 * SPV admissions repository: how full an SPV is, who is on its member
 * register, and who is waiting for a spot. The rules themselves are pure,
 * in lib/spv-rules.ts; this file only reads what they need.
 *
 * Nothing here may depend on how a member arrived on the platform.
 */
import 'server-only';

import { prisma } from '../db';
import { ISOLATED_ALLOCATION } from '../config';
import {
  buildRegister,
  effectiveCap,
  isRetirementProfile,
  type MemberRegister,
  type RegisterRow,
  type SpvStanding,
} from '../spv-rules';

/** States that hold a spot in an SPV: signed, in escrow, admitted. */
const SPOT_STATES = ['docs_signed', 'funded', 'accepted', 'closed'];

/** States that count as admitted to the register: money in escrow or beyond. */
const ADMITTED_STATES = ['funded', 'accepted', 'closed'];

/**
 * DEMO SEAM — the members behind a seeded raise.
 *
 * A seeded deal shows money raised (allocationTotal less
 * allocationRemaining) that no subscription row stands behind, because
 * the demo has no other members. Counting only real rows would show an
 * SPV with $2.5M raised and one member. So the seeded raise is read as
 * members at an average ticket, with a tenth of it through retirement
 * accounts, which is what lets the cap and the retirement limit be seen
 * working. Production reads subscriptions only: delete this and the two
 * `seeded*` terms below.
 */
const SEEDED_AVERAGE_TICKET = 25_000;
const SEEDED_RETIREMENT_SHARE = 0.1;

function seededRaise(deal: { allocationTotal: number; allocationRemaining: number }): number {
  return Math.max(0, deal.allocationTotal - deal.allocationRemaining);
}

/**
 * Standing for many deals at once, keyed by deal id. `userId`, when given,
 * also says which of them that member already holds a spot in.
 */
export async function getStandings(
  dealIds: string[],
  userId?: string,
): Promise<Map<string, { standing: SpvStanding; alreadyMember: boolean }>> {
  const out = new Map<string, { standing: SpvStanding; alreadyMember: boolean }>();
  if (dealIds.length === 0) return out;

  const [deals, subs] = await Promise.all([
    prisma.deal.findMany({
      where: { id: { in: dealIds } },
      select: { id: true, allocationTotal: true, allocationRemaining: true, investorCap: true },
    }),
    prisma.subscription.findMany({
      where: { dealId: { in: dealIds }, state: { in: SPOT_STATES } },
      select: { dealId: true, userId: true, amount: true, profile: { select: { type: true } } },
    }),
  ]);

  for (const deal of deals) {
    const mine = subs.filter((s) => s.dealId === deal.id);
    const members = new Set(mine.map((s) => s.userId));
    const committed = mine.reduce((sum, s) => sum + s.amount, 0);
    const retirement = mine
      .filter((s) => isRetirementProfile(s.profile?.type))
      .reduce((sum, s) => sum + s.amount, 0);

    const raise = seededRaise(deal);
    const seededMembers = Math.floor(raise / SEEDED_AVERAGE_TICKET);
    /* Under isolated allocation a member's own commitment never reduced
       the seeded raise, so it adds to it; otherwise it is already inside. */
    const extra = ISOLATED_ALLOCATION ? committed : 0;

    out.set(deal.id, {
      standing: {
        members: seededMembers + members.size,
        cap: effectiveCap(deal.investorCap),
        committed: raise + extra,
        retirement: Math.round(raise * SEEDED_RETIREMENT_SHARE) + retirement,
      },
      alreadyMember: userId ? members.has(userId) : false,
    });
  }

  return out;
}

export async function getStanding(
  dealId: string,
  userId?: string,
): Promise<{ standing: SpvStanding; alreadyMember: boolean } | null> {
  return (await getStandings([dealId], userId)).get(dealId) ?? null;
}

/**
 * The member register for one SPV (work order screen 12). Internal: it
 * names members. Everyone admitted by the cut-off, their amount, their
 * share, and when they were admitted; locked once the cut-off passes.
 */
export async function getMemberRegister(dealId: string): Promise<MemberRegister | null> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return null;

  const subs = await prisma.subscription.findMany({
    where: { dealId, state: { in: ADMITTED_STATES }, fundedAt: { not: null } },
    select: {
      id: true,
      amount: true,
      fundedAt: true,
      user: { select: { name: true } },
      profile: { select: { type: true } },
    },
  });

  const rows: RegisterRow[] = subs.map((s) => ({
    subscriptionId: s.id,
    member: s.user.name,
    amount: s.amount,
    admittedAt: (s.fundedAt as Date).toISOString(),
    retirement: isRetirementProfile(s.profile?.type),
  }));

  return buildRegister([...seededRegister(deal), ...rows], deal.targetClose);
}

/**
 * DEMO SEAM — register rows for the seeded raise, so the register reads
 * like an SPV rather than a list of one. Deterministic: the same deal
 * always draws the same members, tickets and dates.
 */
function seededRegister(deal: {
  id: string;
  allocationTotal: number;
  allocationRemaining: number;
  launchedAt: Date;
}): RegisterRow[] {
  const TICKETS = [25_000, 50_000, 10_000, 25_000, 100_000, 15_000, 25_000, 35_000];
  const raise = seededRaise(deal);
  const start = deal.launchedAt.getTime();
  const span = Math.max(86_400_000, Date.now() - start - 86_400_000);
  const amounts: number[] = [];
  let sum = 0;
  while (sum < raise) {
    const amount = Math.min(TICKETS[amounts.length % TICKETS.length], raise - sum);
    sum += amount;
    amounts.push(amount);
  }
  /* Numbered in the order they were admitted, spread across the offering. */
  return amounts.map((amount, i) => ({
    subscriptionId: `seed-${deal.id}-${i}`,
    member: `Member ${String(i + 1).padStart(3, '0')}`,
    amount,
    admittedAt: new Date(start + Math.round((span * (i + 1)) / (amounts.length + 1))).toISOString(),
    retirement: i % 10 === 3,
  }));
}

// ---------------- the waitlist ----------------

export async function joinWaitlist(
  userId: string,
  dealId: string,
  amount: number | null,
): Promise<{ joinedAt: string; position: number }> {
  const row = await prisma.spvWaitlistEntry.upsert({
    where: { userId_dealId: { userId, dealId } },
    update: { amount },
    create: { userId, dealId, amount },
  });
  const ahead = await prisma.spvWaitlistEntry.count({
    where: { dealId, createdAt: { lt: row.createdAt } },
  });
  return { joinedAt: row.createdAt.toISOString(), position: ahead + 1 };
}

export async function waitlistedDeals(userId: string): Promise<string[]> {
  const rows = await prisma.spvWaitlistEntry.findMany({
    where: { userId },
    select: { dealId: true },
  });
  return rows.map((r) => r.dealId);
}
