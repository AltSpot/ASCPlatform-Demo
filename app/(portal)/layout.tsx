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

import { Suspense } from 'react';

import FirstRunTour from '@/components/FirstRunTour';
import Sidebar from '@/components/Sidebar';
import SpotBotDock from '@/components/spotbot/SpotBotDock';
import { getSessionUser } from '@/lib/auth';
import { evaluateInvestGate, HELD_STATES } from '@/lib/domain';
import { getWizardView } from '@/lib/repositories/investor';
import { listNeedsYou } from '@/lib/repositories/needs-you';
import { listSubscriptions } from '@/lib/repositories/subscriptions';

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
  /* The bell on the rail reads the same list as the dashboard strip. */
  const [wizard, needs, subscriptions] = await Promise.all([
    getWizardView(user.id),
    listNeedsYou(user.id),
    listSubscriptions(user.id),
  ]);
  const gate = evaluateInvestGate(wizard);
  const { stage } = wizard.relationship;
  /* The walkthrough is offered once the questionnaire is approved and
     before the first held position (a signed, unfunded commitment does not
     count: the dashboard is still empty). The browser remembers a finished
     tour; ?tour=1 replays it. */
  const offerTour =
    !subscriptions.some((s) => HELD_STATES.includes(s.state)) &&
    (stage === 'eligible' || stage === 'cooling_off');
  const status = gate.ok
    ? 'approved'
    : stage === 'eligible'
      ? 'eligible'
      : stage === 'cooling_off'
        ? 'cooling_off'
        : 'setup';

  return (
    <div className="layout">
      <Sidebar user={user} status={status} needs={needs} />
      <main className="main">{children}</main>
      {/* The guide follows the investor: mounted once, so it persists
          across navigation and is present on every signed-in page. */}
      <SpotBotDock />
      <Suspense fallback={null}>
        <FirstRunTour offered={offerTour} />
      </Suspense>
    </div>
  );
}
