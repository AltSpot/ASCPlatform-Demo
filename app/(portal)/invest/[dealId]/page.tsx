/**
 * Invest — profile and amount, then the split-screen subscription
 * agreement that fills itself in as the investor confirms each section.
 *
 * The gates are checked here as well as on the API. A member who cannot
 * see offerings, or who is looking at a deal that opened before their
 * relationship date (view-only under Rule 506(b)), is sent back to the
 * deal page rather than shown a document they may not sign. A member
 * with setup outstanding is routed into it.
 */
import { notFound, redirect } from 'next/navigation';

import InvestFlow from '@/components/invest/InvestFlow';
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { getDealAccess } from '@/lib/repositories/deals';
import {
  getVault,
  getWizardView,
  listProfiles,
} from '@/lib/repositories/investor';
import { getResumable } from '@/lib/repositories/subscriptions';

export const dynamic = 'force-dynamic';

export default async function InvestPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const user = await requireUser();
  const { dealId } = await params;

  const access = await getDealAccess(dealId, user.id);
  if (!access) notFound();
  if (access.access === 'locked' || !access.deal.subscribable) {
    redirect(`/deals/${dealId}`);
  }
  const { deal } = access;

  const wizard = await getWizardView(user.id);
  const gate = evaluateInvestGate(wizard);
  if (!gate.ok) {
    redirect(`/wizard?step=${gate.missing[0].step}&then=${deal.id}`);
  }

  const [vault, profiles, resume] = await Promise.all([
    getVault(user.id),
    listProfiles(user.id),
    getResumable(user.id, deal.id),
  ]);

  // Already signed — funding is the only thing left to do.
  if (resume?.state === 'docs_signed') {
    redirect(`/payment/${resume.id}`);
  }

  return (
    <InvestFlow
      deal={deal}
      userName={user.name}
      vault={vault}
      initialProfiles={profiles}
      existing={resume}
    />
  );
}
