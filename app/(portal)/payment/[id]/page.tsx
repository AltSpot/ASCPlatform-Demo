/** Funding — the last step: ACH now, or hold the spot for 10 days. */
import { notFound } from 'next/navigation';

import PaymentFlow from '@/components/PaymentFlow';
import { requireUser } from '@/lib/auth';
import { daysLeft } from '@/lib/format';
import { getDealRecord } from '@/lib/repositories/deals';
import { getBank } from '@/lib/repositories/investor';
import { getSubscription } from '@/lib/repositories/subscriptions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Funding · AltSpot Capital' };

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const subscription = await getSubscription(user.id, id);
  if (!subscription) notFound();

  const [deal, bank] = await Promise.all([
    getDealRecord(subscription.dealId, user.id),
    getBank(user.id),
  ]);
  if (!deal) notFound();

  return (
    <PaymentFlow
      subscription={subscription}
      deal={deal}
      bank={bank}
      daysRemaining={daysLeft(subscription.fundingDeadline)}
    />
  );
}
