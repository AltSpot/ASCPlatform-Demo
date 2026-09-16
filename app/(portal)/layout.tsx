/**
 * Portal shell — every signed-in page renders inside this.
 *
 * Authentication is enforced here rather than in each page, so a new
 * route added under (portal) is protected by construction.
 *
 * THE RAIL PREFERENCE is applied before first paint by a blocking
 * script in the root layout, so a collapsed sidebar never paints wide
 * and snaps narrow a frame later. It lives there rather than here
 * because beforeInteractive scripts are only honored in the root.
 */
import { redirect } from 'next/navigation';

import Sidebar from '@/components/Sidebar';
import SpotBotDock from '@/components/spotbot/SpotBotDock';
import { getSessionUser } from '@/lib/auth';
import { evaluateInvestGate } from '@/lib/domain';
import { getWizardView } from '@/lib/repositories/investor';

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect('/');

  /* The account chip states a regulatory fact, so it is read from
     the same gates the invest flow and the deal repository are.
     Approved means every step is done; eligible means the 506(b)
     relationship gate is open, which is what shows offerings; cooling
     off means the questionnaire is approved and the wait is running;
     anything else is still in setup. */
  const wizard = await getWizardView(user.id);
  const gate = evaluateInvestGate(wizard);
  const { stage } = wizard.relationship;
  const status = gate.ok
    ? 'approved'
    : stage === 'eligible'
      ? 'eligible'
      : stage === 'cooling_off'
        ? 'cooling_off'
        : 'setup';

  return (
    <div className="layout">
      <Sidebar user={user} status={status} />
      <main className="main">{children}</main>
      {/* The guide follows the investor: mounted once, so it persists
          across navigation and is present on every signed-in page. */}
      <SpotBotDock />
    </div>
  );
}
