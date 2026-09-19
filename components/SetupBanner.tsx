/**
 * Outstanding account-setup work, surfaced at the top of the dashboard.
 *
 * A prompt, not a trap: the dashboard, the Terminal and the Radar stay
 * open while setup is incomplete. Offerings do not. Under Rule 506(b) no
 * offering is shown until the questionnaire is approved and the
 * cooling-off period has passed, and investing needs the W-9 and the
 * identity check as well. Both rules are enforced server-side; this
 * banner explains what is outstanding and links straight to the step.
 *
 * Server component: it renders links, so it needs no client JavaScript.
 */
import Link from 'next/link';

import type { InvestGate, WizardView } from '@/lib/domain';
import { dateStr } from '@/lib/format';

export default function SetupBanner({
  gate,
  wizard,
}: {
  gate: InvestGate;
  wizard: WizardView;
}) {
  // Optional steps: worth prompting once setup is otherwise done, but
  // never blocking, and never shown while required items are outstanding.
  const optional: { step: number; label: string }[] = [];
  if (gate.ok && !wizard.profileDone) {
    optional.push({ step: 4, label: 'Investment profile' });
  }
  if (gate.ok && !wizard.bankDone) {
    optional.push({ step: 5, label: 'Link your bank' });
  }

  if (gate.ok && optional.length === 0) return null;

  const required = gate.missing;
  const blocking = required.length > 0;
  const items = blocking ? required : optional;
  const { stage, unlocksAt } = wizard.relationship;

  /* Review and cooling off are waits, not steps: nothing links to them.
     Everything else outstanding still does. */
  const actionable = items.filter(
    (item) =>
      !(item.step === 1 && (stage === 'cooling_off' || stage === 'under_review')),
  );

  return (
    <div
      className={blocking ? 'card gold' : 'card'}
      style={{ marginBottom: 22 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <h3>
            {blocking ? 'Finish your account setup' : 'A couple of optional steps'}
          </h3>
          <p className="small" style={{ marginTop: 4 }}>
            {blocking ? (
              <>
                {stage === 'cooling_off'
                  ? `Offerings open to you on ${dateStr(unlocksAt)}. `
                  : stage === 'under_review'
                    ? 'Your questionnaire is under review. '
                    : 'Offerings open the moment your investor questionnaire is approved. '}
                <b style={{ color: 'var(--gold-bright)' }}>
                  Investing unlocks once these are complete.
                </b>
              </>
            ) : (
              <>
                You&rsquo;re cleared to invest. These make checkout faster, and you
                can finish them at any time.
              </>
            )}
          </p>
        </div>

        {actionable.length > 0 && (
          <Link className="btn btn-primary" href={`/wizard?step=${actionable[0].step}`}>
            {blocking ? 'Continue setup' : 'Finish setup'}
          </Link>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginTop: 16,
        }}
      >
        {items.map((item) => (
          <Link
            key={item.step}
            href={`/wizard?step=${item.step}`}
            className={blocking ? 'chip warn' : 'chip neutral'}
            style={{ textDecoration: 'none' }}
          >
            <span className="dot" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
