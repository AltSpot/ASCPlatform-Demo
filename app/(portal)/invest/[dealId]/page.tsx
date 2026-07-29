/**
 * Invest — profile and amount, then the split-screen subscription
 * agreement that fills itself in as the investor confirms each section.
 *
 * The gate is checked here as well as on the API: an investor who is not
 * verified is routed back into setup rather than shown a document they
 * cannot sign.
 */
import { notFound, redirect } from 'next/navigation';

import InvestFlow from '@/components/invest/InvestFlow';
import { requireUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { getDeal } from '@/lib/repositories/deals';
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

  const deal = await getDeal(dealId, user.id);
  if (!deal) notFound();

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
