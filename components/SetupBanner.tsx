/**
 * Outstanding account-setup work, surfaced at the top of the dashboard.
 *
 * Deliberately a prompt, not a gate: an investor can browse the whole
 * platform — dashboard, marketplace, deals, decks — with setup
 * incomplete. Verification is only required to *invest*, and that rule is
 * enforced at the API. This banner explains what is outstanding and links
 * straight to the step, rather than trapping anyone in a wizard.
 *
 * Server component: it renders links, so it needs no client JavaScript.
 */
import Link from 'next/link';

import type { InvestGate, WizardView } from '@/lib/domain';

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
                Explore everything below. The marketplace and every deal page, in full,
                are open to you now.{' '}
                <b style={{ color: 'var(--gold-bright)' }}>
                  Investing unlocks once these are complete.
                </b>
              </>
            ) : (
              <>
                You&rsquo;re cleared to invest. These make checkout and funding faster,
                and you can finish them at any time.
              </>
            )}
          </p>
        </div>

        <Link className="btn btn-gold" href={`/wizard?step=${items[0].step}`}>
          {blocking ? 'Continue setup' : 'Finish setup'}
        </Link>
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
