/**
 * Subscription repository — the heart of the product.
 *
 * Every state change funnels through `assertTransition`, so the machine
 * in lib/domain.ts is enforced at the only layer that can write to the
 * database. Allocation is decremented when a commitment is signed (the
 * point the spot is actually reserved) and returned if it lapses.
 */
import 'server-only';

import { prisma } from '../db';
import { audit } from '../audit';
import {
  assertTransition,
  DAY_MS,
  FUNDING_WINDOW_DAYS,
  RESUMABLE_STATES,
  SUBSCRIPTION_STATES,
  type SubscriptionState,
  type SubscriptionView,
} from '../domain';
import type { Subscription } from '../generated/prisma/client';
import {
  choiceKey,
  decodeConfirmationCode,
  sectionKey,
} from '../subscription-sections';

export function toSubscriptionView(row: Subscription): SubscriptionView {
  let answers: Record<string, boolean> = {};
  try {
    answers = JSON.parse(row.answersJson) as Record<string, boolean>;
  } catch {
    console.error(`[subscriptions] malformed answers on ${row.id}`);
  }

  return {
    id: row.id,
    dealId: row.dealId,
    profileId: row.profileId,
    amount: row.amount,
    state: row.state as SubscriptionState,
    answers,
    signature: row.signature,
    signedAt: row.signedAt?.toISOString() ?? null,
    fundingDeadline: row.fundingDeadline?.toISOString() ?? null,
    fundedAt: row.fundedAt?.toISOString() ?? null,
    fundingMethod: row.fundingMethod,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    currentValue: row.currentValue,
    seeded: row.seeded,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Lapse any signed commitment whose 10-day funding window has passed and
 * hand its allocation back to the deal. Called on every authenticated
 * read, which keeps the demo honest without needing a scheduler.
 */
export async function expireSweep(userId: string): Promise<void> {
  const stale = await prisma.subscription.findMany({
    where: {
      userId,
      state: SUBSCRIPTION_STATES.SIGNED,
      fundingDeadline: { lt: new Date() },
    },
  });
  if (stale.length === 0) return;

  for (const row of stale) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: row.id },
        data: { state: SUBSCRIPTION_STATES.EXPIRED },
      }),
      prisma.deal.update({
        where: { id: row.dealId },
        data: { allocationRemaining: { increment: row.amount } },
      }),
    ]);

    await audit({
      userId,
      action: 'subscription.expired',
      entity: 'subscription',
      entityId: row.id,
      actor: 'system',
      metadata: { dealId: row.dealId, amount: row.amount },
    });
  }
}

export async function listSubscriptions(
  userId: string,
): Promise<SubscriptionView[]> {
  await expireSweep(userId);

  const rows = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toSubscriptionView);
}

export async function getSubscription(
  userId: string,
  id: string,
): Promise<SubscriptionView | null> {
  const row = await prisma.subscription.findFirst({ where: { id, userId } });
  return row ? toSubscriptionView(row) : null;
}

/** An in-progress commitment for a deal, if the investor has one. */
export async function getResumable(
  userId: string,
  dealId: string,
): Promise<SubscriptionView | null> {
  const row = await prisma.subscription.findFirst({
    where: { userId, dealId, state: { in: [...RESUMABLE_STATES] } },
    orderBy: { createdAt: 'desc' },
  });
  return row ? toSubscriptionView(row) : null;
}

export async function startSubscription(
  userId: string,
  input: { dealId: string; profileId: string | null; amount: number },
): Promise<SubscriptionView> {
  const row = await prisma.subscription.create({
    data: {
      userId,
      dealId: input.dealId,
      profileId: input.profileId,
      amount: input.amount,
      state: SUBSCRIPTION_STATES.STARTED,
    },
  });

  await audit({
    userId,
    action: 'subscription.started',
    entity: 'subscription',
    entityId: row.id,
    metadata: { dealId: input.dealId, amount: input.amount },
  });

  return toSubscriptionView(row);
}

export async function updateDraft(
  userId: string,
  id: string,
  input: { profileId?: string | null; amount?: number },
): Promise<SubscriptionView> {
  const current = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!current) throw new Error('Subscription not found');

  if (current.state !== SUBSCRIPTION_STATES.STARTED) {
    throw new Error('Only an unsigned subscription can be edited');
  }

  const row = await prisma.subscription.update({
    where: { id },
    data: {
      profileId: input.profileId ?? current.profileId,
      amount: input.amount ?? current.amount,
    },
  });

  if (input.amount !== undefined && input.amount !== current.amount) {
    await audit({
      userId,
      action: 'subscription.amount_changed',
      entity: 'subscription',
      entityId: id,
      metadata: { from: current.amount, to: input.amount },
    });
  }

  return toSubscriptionView(row);
}

/**
 * Record one grouped document confirmation.
 *
 * `code` is a confirmation code from lib/subscription-sections.ts, which
 * carries the section and, where the section is a selection of fact, which
 * option the investor picked. The choice is written as its own key so the
 * answers map stays a flat set of checked boxes — the same shape as the
 * paper questionnaire it stands in for.
 *
 * Selections are single-valued: re-picking a category clears the previous
 * one, so an investor can never be recorded as claiming two accreditation
 * standards or both ERISA answers at once.
 */
export async function confirmSection(
  userId: string,
  id: string,
  code: number,
): Promise<SubscriptionView> {
  const decoded = decodeConfirmationCode(code);
  if (!decoded) throw new Error('Unknown confirmation code');
  const { section, choice } = decoded;

  const current = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!current) throw new Error('Subscription not found');

  let answers: Record<string, boolean> = {};
  try {
    answers = JSON.parse(current.answersJson) as Record<string, boolean>;
  } catch {
    answers = {};
  }

  answers[sectionKey(section.id)] = true;
  if (section.choices) {
    for (const option of section.choices) {
      delete answers[choiceKey(section.id, option.key)];
    }
  }
  if (choice) answers[choiceKey(section.id, choice.key)] = true;

  const row = await prisma.subscription.update({
    where: { id },
    data: { answersJson: JSON.stringify(answers) },
  });

  await audit({
    userId,
    action: 'subscription.section_confirmed',
    entity: 'subscription',
    entityId: id,
    metadata: {
      section: section.id,
      title: section.documentTitle,
      covers: section.covers,
      choice: choice?.key ?? null,
    },
  });

  return toSubscriptionView(row);
}

/**
 * Execute the agreement. This is the moment the allocation is actually
 * reserved, so the deal's remaining allocation drops here — not at
 * funding — and the 10-day clock starts.
 */
export async function signSubscription(
  userId: string,
  id: string,
  signature: string,
): Promise<SubscriptionView> {
  const current = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!current) throw new Error('Subscription not found');

  assertTransition(current.state, SUBSCRIPTION_STATES.SIGNED);

  const now = new Date();
  const [row] = await prisma.$transaction([
    prisma.subscription.update({
      where: { id },
      data: {
        state: SUBSCRIPTION_STATES.SIGNED,
        signature,
        signedAt: now,
        fundingDeadline: new Date(now.getTime() + FUNDING_WINDOW_DAYS * DAY_MS),
      },
    }),
    prisma.deal.update({
      where: { id: current.dealId },
      data: { allocationRemaining: { decrement: current.amount } },
    }),
  ]);

  await audit({
    userId,
    action: 'subscription.signed',
    entity: 'subscription',
    entityId: id,
    metadata: { dealId: current.dealId, amount: current.amount },
  });

  return toSubscriptionView(row);
}

export async function fundSubscription(
  userId: string,
  id: string,
  method: string,
): Promise<SubscriptionView> {
  const current = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!current) throw new Error('Subscription not found');

  assertTransition(current.state, SUBSCRIPTION_STATES.FUNDED);

  const row = await prisma.subscription.update({
    where: { id },
    data: {
      state: SUBSCRIPTION_STATES.FUNDED,
      fundedAt: new Date(),
      fundingMethod: method,
    },
  });

  await audit({
    userId,
    action: 'subscription.funded',
    entity: 'subscription',
    entityId: id,
    metadata: { dealId: current.dealId, amount: current.amount, method },
  });

  return toSubscriptionView(row);
}

/**
 * Cancel a commitment. Allocation is returned only if it was reserved,
 * i.e. only if the agreement had been signed.
 */
export async function cancelSubscription(
  userId: string,
  id: string,
): Promise<void> {
  const current = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!current) throw new Error('Subscription not found');

  if (current.state === SUBSCRIPTION_STATES.SIGNED) {
    await prisma.deal.update({
      where: { id: current.dealId },
      data: { allocationRemaining: { increment: current.amount } },
    });
  }

  await prisma.subscription.delete({ where: { id } });

  await audit({
    userId,
    action: 'subscription.cancelled',
    entity: 'subscription',
    entityId: id,
    metadata: { dealId: current.dealId, amount: current.amount, from: current.state },
  });
}
