'use client';

/**
 * The five-step setup flow.
 *
 * Owns step navigation and the shared wizard state; each step is its own
 * component and reports completion upward. Every step persists through
 * the API as it completes, so a refresh mid-flow never loses progress.
 *
 * If the investor arrived here from an Invest gate (`thenDealId`), they
 * are returned to that deal the moment the gating requirements are met
 * rather than being marched through the optional steps.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { useToast } from '@/components/Toast';
import { evaluateInvestGate, firstIncompleteStep } from '@/lib/domain';
import type { VaultView, WizardView } from '@/lib/domain';

import StepAccreditation from './StepAccreditation';
import StepBank from './StepBank';
import StepInfo from './StepInfo';
import StepKyc from './StepKyc';
import StepProfile from './StepProfile';

const STEPS = [
  { n: 1, title: 'Accreditation', hint: 'Certify once · valid 5 years' },
  { n: 2, title: 'Your information', hint: 'W-9 details, captured once' },
  { n: 3, title: 'Identity', hint: 'ID photo + live capture' },
  { n: 4, title: 'Investment profile', hint: 'Personal · entity · IRA' },
  { n: 5, title: 'Link bank', hint: 'One-click funding later' },
] as const;

const DONE_STEP = 6;

interface WizardFlowProps {
  userName: string;
  initialWizard: WizardView;
  initialVault: VaultView;
  initialStep: number | null;
  thenDealId: string | null;
}

export default function WizardFlow({
  userName,
  initialWizard,
  initialVault,
  initialStep,
  thenDealId,
}: WizardFlowProps) {
  const router = useRouter();
  const toast = useToast();

  const [wizard, setWizard] = useState<WizardView>(initialWizard);
  const [step, setStep] = useState<number>(
    initialStep ?? firstIncompleteStep(initialWizard),
  );

  const stepDone = useCallback(
    (n: number) => {
      switch (n) {
        case 1:
          return wizard.accreditation.status === 'verified';
        case 2:
          return wizard.info.complete;
        case 3:
          return wizard.kyc.complete;
        case 4:
          return wizard.profileDone;
        case 5:
          return wizard.bankDone;
        default:
          return false;
      }
    },
    [wizard],
  );

  /**
   * Advance. When the investor came from an Invest gate, bail out to the
   * deal as soon as the blocking requirements clear.
   */
  const advance = useCallback(
    (next: WizardView) => {
      setWizard(next);

      if (thenDealId && evaluateInvestGate(next).ok) {
        router.push(`/invest/${thenDealId}`);
        return;
      }
      setStep((current) => Math.min(current + 1, DONE_STEP));
      window.scrollTo(0, 0);
    },
    [router, thenDealId],
  );

  const finish = useCallback(
    (next: WizardView) => {
      setWizard(next);

      if (thenDealId && evaluateInvestGate(next).ok) {
        router.push(`/invest/${thenDealId}`);
        return;
      }
      setStep(DONE_STEP);
      window.scrollTo(0, 0);
    },
    [router, thenDealId],
  );

  const rail = useMemo(
    () =>
      STEPS.map((s) => {
        const done = stepDone(s.n);
        const now = s.n === step;
        return (
          <div
            className={`wiz-step${done ? ' done' : ''}${now ? ' now' : ''}`}
            key={s.n}
          >
            <div className="mark">
              {done ? '✓' : now ? <div className="orb orb-dot" /> : s.n}
            </div>
            <div className="st">
              <b>{s.title}</b>
              <span>{s.hint}</span>
            </div>
          </div>
        );
      }),
    [step, stepDone],
  );

  return (
    <div className="wiz-shell">
      <aside className="wiz-rail">
        <div className="brand">
          <div className="orb" />
          <div className="brand-name">
            Alt<span>Spot</span>
          </div>
        </div>

        <div>
          <div className="eyebrow">Account setup</div>
          <h1 className="display" style={{ fontSize: 26, marginTop: 8 }}>
            Welcome to the community.
          </h1>
          <p className="small" style={{ marginTop: 8 }}>
            A few steps before your first investment. Your answers save automatically
            and pre-fill every document you&rsquo;ll ever sign here.
          </p>
        </div>

        <div className="wiz-steps">{rail}</div>

        <div style={{ marginTop: 'auto' }}>
          {/* Setup is never a trap — the platform stays open while it is
              outstanding, so there is always a way back out. */}
          <Link
            href="/dashboard"
            className="small"
            style={{ display: 'inline-block', marginBottom: 14 }}
          >
            ← Back to dashboard
          </Link>
          <div className="tiny">Rising tides raise all ships.</div>
        </div>
      </aside>

      <main className="wiz-main">
        <section className={step === 1 ? 'wiz-panel on' : 'wiz-panel'}>
          <StepAccreditation
            userName={userName}
            vault={initialVault}
            wizard={wizard}
            onComplete={advance}
          />
        </section>

        <section className={step === 2 ? 'wiz-panel on' : 'wiz-panel'}>
          <StepInfo vault={initialVault} onComplete={advance} />
        </section>

        <section className={step === 3 ? 'wiz-panel on' : 'wiz-panel'}>
          <StepKyc onComplete={advance} />
        </section>

        <section className={step === 4 ? 'wiz-panel on' : 'wiz-panel'}>
          <StepProfile
            userName={userName}
            vault={initialVault}
            onComplete={advance}
            onSkip={() => {
              setStep(5);
              window.scrollTo(0, 0);
            }}
          />
        </section>

        <section className={step === 5 ? 'wiz-panel on' : 'wiz-panel'}>
          <StepBank onComplete={finish} onSkip={() => finish(wizard)} />
        </section>

        <section
          className={step === DONE_STEP ? 'wiz-panel on' : 'wiz-panel'}
          style={{ textAlign: 'center', paddingTop: 40 }}
        >
          <div
            className="orb"
            style={{ width: 74, height: 74, margin: '0 auto 26px' }}
          />
          <h2 className="display" style={{ fontSize: 34, marginBottom: 12 }}>
            You&rsquo;re set.
          </h2>
          <p className="sub" style={{ margin: '0 auto 30px' }}>
            Your profile is saved, your documents will pre-fill themselves, and the
            marketplace is open. Welcome in.
          </p>
          <button
            className="btn btn-gold"
            onClick={async () => {
              try {
                const { api } = await import('@/lib/client/api');
                await api.completeWizard();
              } catch {
                toast('Could not save setup completion — continuing anyway.');
              }
              router.push('/dashboard');
              router.refresh();
            }}
          >
            Enter your dashboard
          </button>
        </section>
      </main>
    </div>
  );
}
