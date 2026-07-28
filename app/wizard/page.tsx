/**
 * Account setup. Lives outside the portal shell because it has its own
 * rail-and-panel layout.
 */
import { redirect } from 'next/navigation';

import WizardFlow from '@/components/wizard/WizardFlow';
import { getSessionUser } from '@/lib/auth';
import { getVault, getWizardView } from '@/lib/repositories/investor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Account Setup — AltSpot Capital' };

export default async function WizardPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; then?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/');

  const [wizard, vault, params] = await Promise.all([
    getWizardView(user.id),
    getVault(user.id),
    searchParams,
  ]);

  const requestedStep = Number(params.step);
  const initialStep =
    Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 5
      ? requestedStep
      : null;

  return (
    <WizardFlow
      userName={user.name}
      initialWizard={wizard}
      initialVault={vault}
      initialStep={initialStep}
      thenDealId={params.then ?? null}
    />
  );
}
