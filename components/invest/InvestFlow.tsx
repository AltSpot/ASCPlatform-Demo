'use client';

/**
 * The subscription flow.
 *
 * Phase A picks the profile and amount. Phase B is the split screen: the
 * actual subscription agreement on the left, the grouped confirmations on
 * the right. Each confirmation lights up the clauses it discharges and
 * autosaves, so the investor can leave and resume. One typed signature
 * executes it all.
 *
 * The document is counsel's, imported from the .docx by
 * scripts/import-legal-doc.mjs. The panels are a plain-language
 * restatement of it, never a substitute, and lib/subscription-sections.ts
 * is where the clause mapping lives.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import ConfirmPanel from '@/components/invest/ConfirmPanel';
import FeeTable from '@/components/invest/FeeTable';
import LegalDocument from '@/components/invest/LegalDocument';

import styles from './InvestFlow.module.css';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';
import type {
  DealView,
  ProfileView,
  SubscriptionView,
  VaultView,
} from '@/lib/domain';
import { dateStr, maskTin, money } from '@/lib/format';
import {
  choiceKey,
  decodeConfirmationCode,
  isSectionConfirmed,
  sectionKey,
  selectedChoice,
  SUBSCRIPTION_SECTION_COUNT,
  SUBSCRIPTION_SECTIONS,
} from '@/lib/subscription-sections';

interface InvestFlowProps {
  deal: DealView;
  userName: string;
  vault: VaultView;
  initialProfiles: ProfileView[];
  existing: SubscriptionView | null;
}

export default function InvestFlow({
  deal,
  userName,
  vault,
  initialProfiles,
  existing,
}: InvestFlowProps) {
  const router = useRouter();
  const toast = useToast();

  const [profiles, setProfiles] = useState(initialProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    existing?.profileId ??
      initialProfiles.find((p) => p.isDefault)?.id ??
      initialProfiles[0]?.id ??
      null,
  );
  /**
   * The amount is held as the raw string the investor typed, not as a
   * number. With `type="number"` and numeric state, React compares the
   * previous value to the next one, sees no change, and leaves the DOM
   * alone, so a stray leading zero can never be deleted. Owning the
   * string means what is on screen is always exactly what is in state.
   */
  const [amountInput, setAmountInput] = useState<string>(
    String(existing?.amount ?? deal.minInvestment),
  );
  const amount = Number(amountInput) || 0;

  function handleAmountChange(raw: string) {
    const digits = raw.replace(/[^\d]/g, '');
    // Trim leading zeros but keep a lone "0" so the field can be cleared.
    setAmountInput(digits.replace(/^0+(?=\d)/, ''));
  }
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({ type: 'Personal', name: '' });

  const [subscription, setSubscription] = useState<SubscriptionView | null>(existing);
  /**
   * The answers map straight off the server, not a parallel set of
   * booleans. Confirmations and the selections inside them live in the same
   * structure the document is generated from, so the pane can never claim a
   * section the server did not record.
   */
  const [answers, setAnswers] = useState<Record<string, boolean>>(
    existing?.answers ?? {},
  );

  // Resume straight into the document if sections were already confirmed.
  const [phase, setPhase] = useState<'amount' | 'docs'>(
    existing && Object.keys(existing.answers).length > 0 ? 'docs' : 'amount',
  );

  const [signature, setSignature] = useState(
    [vault.first, vault.last].filter(Boolean).join(' ') || userName,
  );
  const [signed, setSigned] = useState(false);
  const [signedDate, setSignedDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const docRef = useRef<HTMLDivElement | null>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;

  const done = (id: number) => isSectionConfirmed(answers, id);
  const confirmedCount = SUBSCRIPTION_SECTIONS.filter((s) => done(s.id)).length;
  const allConfirmed = confirmedCount === SUBSCRIPTION_SECTION_COUNT;


  /** What gets merged into the agreement's {{tokens}}. */
  const mergeValues = {
    legalName: [vault.first, vault.last].filter(Boolean).join(' ') || userName,
    amount: money(amount),
    // Class B Units are priced at $1.00 each under section 1.1.
    units: amount ? amount.toLocaleString('en-US') : '',
    date: signedDate ?? '',
    signature: signed ? signature : '',
    entityName: deal.entity,
    address:
      [vault.street, vault.city, vault.state, vault.zip].filter(Boolean).join(', '),
    taxId: maskTin(vault.tinLast4),
    profile: selectedProfile
      ? `${selectedProfile.name} (${selectedProfile.type})`
      : '',
  };

  /** The clause group to scroll to when a panel is confirmed. */
  const [focusPanel, setFocusPanel] = useState<number | null>(null);

  /**
   * Which confirmation is on screen. One at a time, resuming at the first
   * outstanding one, so an investor coming back lands where they stopped.
   */
  const [stepIndex, setStepIndex] = useState(() => {
    const first = SUBSCRIPTION_SECTIONS.findIndex(
      (section) => !isSectionConfirmed(existing?.answers ?? {}, section.id),
    );
    return first === -1 ? SUBSCRIPTION_SECTION_COUNT - 1 : first;
  });
  const currentSection = SUBSCRIPTION_SECTIONS[stepIndex];

  const progressWidth = signed
    ? '100%'
    : allConfirmed
      ? '92%'
      : `${12 + confirmedCount * 12}%`;

  // ---------------- phase A ----------------

  async function createProfile() {
    const name = newProfile.name.trim() || `${userName} · ${newProfile.type}`;
    try {
      const created = await api.createProfile({ type: newProfile.type, name });
      setProfiles((list) => [...list, created]);
      setSelectedProfileId(created.id);
      setShowNewProfile(false);
      setNewProfile({ type: 'Personal', name: '' });
      toast('Profile created.');
    } catch {
      toast('Could not create that profile.');
    }
  }

  async function beginDocs() {
    if (busy) return;

    if (!selectedProfileId) {
      toast('Choose or create an investment profile first.');
      return;
    }
    if (amount < deal.minInvestment) {
      toast(
        <>
          Minimum for this deal is <b>{money(deal.minInvestment)}</b>.
        </>,
      );
      return;
    }

    setBusy(true);
    try {
      const next = subscription
        ? await api.updateSubscription(subscription.id, {
            amount,
            profileId: selectedProfileId,
          })
        : await api.startSubscription({
            dealId: deal.id,
            profileId: selectedProfileId,
            amount,
          });

      setSubscription(next);
      setPhase('docs');
      window.scrollTo(0, 0);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not start that investment.');
    } finally {
      setBusy(false);
    }
  }

  // ---------------- phase B ----------------

  /**
   * Record a confirmation. The code carries the section and, for the two
   * selection sections, which option was picked. Applied optimistically so
   * the document fills the instant the investor acts, then replaced with
   * the server's copy and rolled back if the write failed.
   */
  async function confirm(code: number) {
    if (!subscription) return;

    const decoded = decodeConfirmationCode(code);
    if (!decoded) return;
    const { section, choice } = decoded;

    // Re-picking the same option is a no-op, not a second write.
    if (choice && answers[choiceKey(section.id, choice.key)]) return;
    if (!choice && done(section.id)) return;

    const previous = answers;
    const optimistic = { ...answers, [sectionKey(section.id)]: true };
    for (const option of section.choices ?? []) {
      delete optimistic[choiceKey(section.id, option.key)];
    }
    if (choice) optimistic[choiceKey(section.id, choice.key)] = true;
    setAnswers(optimistic);

    // Move the document to the clauses this panel just discharged, so the
    // investor sees which operative text their answer applies to.
    setFocusPanel(section.id);

    try {
      const next = await api.confirmSection(subscription.id, code);
      setSubscription(next);
      setAnswers(next.answers);

      // Move to the next outstanding confirmation. Held briefly so the
      // investor sees the clause light up before the panel changes.
      const following = SUBSCRIPTION_SECTIONS.findIndex(
        (s, i) => i > stepIndex && !isSectionConfirmed(next.answers, s.id),
      );
      if (following !== -1) {
        setTimeout(() => setStepIndex(following), 650);
      }

      toast('Progress saved. You can leave and resume anytime.');
    } catch {
      setAnswers(previous);
      toast('Could not save that confirmation. Try again.');
    }
  }

  async function signAll() {
    if (!subscription || busy) return;

    const trimmed = signature.trim();
    if (!trimmed) {
      toast('Type your full legal name to sign.');
      return;
    }

    setBusy(true);
    try {
      const next = await api.signSubscription(
        subscription.id,
        trimmed,
        docRef.current?.innerHTML,
      );
      setSubscription(next);
      setSigned(true);
      setSignedDate(dateStr(next.signedAt ?? Date.now()));

      toast(
        <>
          <b>Signed.</b> A copy is in your Docs. Continuing to funding…
        </>,
      );
      setTimeout(() => router.push(`/payment/${next.id}`), 1500);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not sign. Try again.');
      setBusy(false);
    }
  }

  function downloadDocument() {
    const body = docRef.current?.innerHTML ?? '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Subscription Agreement · ${deal.entity}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:50px auto;line-height:1.7;color:#241E12;font-size:14px;padding:0 24px}
h4{text-align:center;text-transform:uppercase;letter-spacing:.06em}.docsub{text-align:center;color:#7A6E55;font-size:12px}
.sec{margin:22px 0}.tick{display:none}h5{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5A4E36}
.f{border-bottom:1px solid #999;padding:0 2px}.f.set{font-weight:bold;border-bottom-color:#333}
.sig-line{border-bottom:1.5px solid #000;min-width:220px;display:inline-block;font-size:18px}</style>
</head><body>${body}
<p style="margin-top:40px;font-size:11px;color:#888">Generated by the AltSpot Capital investor portal (demo). Auto-saved to your Docs.</p></body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `AltSpot_Subscription_${deal.id}.html`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast('Document downloaded.');
  }

  // ---------------- render ----------------


  return (
    <>
      <div className="crumbs">
        <Link href="/marketplace">Marketplace</Link>
        <span className="sep">/</span>
        <Link href={`/deals/${deal.id}`}>{deal.name}</Link>
        <span className="sep">/</span>
        <span className="here">Invest</span>
      </div>

      {phase === 'amount' ? (
        <section>
          <div className="page-head">
            <div className="titles">
              <div className="eyebrow">Begin investment</div>
              <h1 className="display">{deal.name}</h1>
              <p className="sub">
                Choose the profile this investment is held under and the amount
                you&rsquo;re committing. Everything else is already filled in.
              </p>
            </div>
          </div>

          <div className="grid c2" style={{ alignItems: 'start' }}>
            <div className="card">
              <h3 style={{ marginBottom: 4 }}>Investment profile</h3>
              <p className="small" style={{ marginBottom: 14 }}>
                Documents are titled in this profile&rsquo;s name.
              </p>

              <div className="choice-grid" style={{ gridTemplateColumns: '1fr' }}>
                {profiles.length === 0 ? (
                  <p className="small">No profiles yet. Create your first below.</p>
                ) : (
                  profiles.map((p) => (
                    <div
                      key={p.id}
                      className={selectedProfileId === p.id ? 'choice sel' : 'choice'}
                      onClick={() => setSelectedProfileId(p.id)}
                    >
                      <b>{p.name}</b>
                      <span>
                        {p.type}
                        {p.isDefault ? ' · default' : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                className="btn btn-quiet btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => setShowNewProfile((v) => !v)}
              >
                + New profile
              </button>

              {showNewProfile && (
                <div style={{ marginTop: 14 }}>
                  <div className="form-row">
                    <label className="field">
                      <span>Type</span>
                      <select
                        className="input"
                        value={newProfile.type}
                        onChange={(e) =>
                          setNewProfile((p) => ({ ...p, type: e.target.value }))
                        }
                      >
                        <option>Personal</option>
                        <option>Entity</option>
                        <option>IRA / 401(k)</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>Name</span>
                      <input
                        className="input"
                        placeholder="e.g. Hale Family Trust"
                        value={newProfile.name}
                        onChange={(e) =>
                          setNewProfile((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={createProfile}>
                    Create profile
                  </button>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 4 }}>Amount</h3>
              <p className="small" style={{ marginBottom: 14 }}>
                Minimum {money(deal.minInvestment)} ·{' '}
                {money(deal.allocationRemaining)} of allocation remaining.
              </p>

              <label className="field">
                <span>Investment amount (USD)</span>
                <input
                  className="input num"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  style={{ fontSize: 22, fontFamily: 'var(--fm)' }}
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={() => {
                    if (amountInput === '' || amount === 0) {
                      setAmountInput(String(deal.minInvestment));
                    }
                  }}
                />
              </label>

              {amount > 0 && amount < deal.minInvestment && (
                <div className="demo-note">
                  Minimum for this deal is {money(deal.minInvestment)}.
                </div>
              )}
              {amount > deal.allocationRemaining && (
                <div className="demo-note">
                  Only {money(deal.allocationRemaining)} of allocation remains.
                  Amounts above this join the waitlist at close.
                </div>
              )}

              <div className="hr" />

              <div className="small">
                <FeeTable fees={deal.fees} amount={amount} />
              </div>

              <button
                className="btn btn-gold btn-block"
                style={{ marginTop: 18 }}
                onClick={beginDocs}
                disabled={busy}
              >
                Continue to documents
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section>
          <div className="page-head" style={{ marginBottom: 14 }}>
            <div className="titles">
              <div className="eyebrow">Subscription documents</div>
              <h1 className="display" style={{ fontSize: 30 }}>
                {deal.name}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="tiny">Saved just now</span>
              <button className="btn btn-quiet btn-sm" onClick={downloadDocument}>
                Download document
              </button>
            </div>
          </div>

          <div className="progress">
            <div className="p" style={{ width: progressWidth }} />
          </div>

          <div className="split">
            {/* ---- the agreement itself, imported from counsel's .docx ---- */}
            <div ref={docRef}>
              <LegalDocument
                values={mergeValues}
                confirmedPanels={SUBSCRIPTION_SECTIONS.filter((x) => done(x.id)).map((x) => x.id)}
                focusPanel={focusPanel}
              />
            </div>

            {/* ---- the guided track ---- */}
            <div>
              {/* One panel at a time. Six stacked down the page buried the
                  signature block and made the flow feel endless. */}
              <ConfirmPanel
                key={currentSection.id}
                section={currentSection}
                index={stepIndex + 1}
                total={SUBSCRIPTION_SECTION_COUNT}
                confirmed={done(currentSection.id)}
                chosenKey={selectedChoice(answers, currentSection)?.key ?? null}
                onConfirm={confirm}
              >
                {/* The all-in cost belongs beside the risk it buys. */}
                {currentSection.id === 3 && (
                  <FeeTable fees={deal.fees} amount={amount} />
                )}
              </ConfirmPanel>

              <div className="wiz-actions" style={{ marginTop: 4, marginBottom: 22 }}>
                <button
                  className="btn btn-quiet btn-sm"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  disabled={stepIndex === 0}
                >
                  ← Back
                </button>

                <div className={styles.dots} role="tablist" aria-label="Confirmations">
                  {SUBSCRIPTION_SECTIONS.map((section, i) => (
                    <button
                      key={section.id}
                      role="tab"
                      aria-selected={i === stepIndex}
                      aria-label={section.panelTitle}
                      title={section.panelTitle}
                      onClick={() => setStepIndex(i)}
                      className={[
                        styles.dot,
                        done(section.id) ? styles.dotDone : '',
                        i === stepIndex ? styles.dotNow : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  ))}
                </div>

                <button
                  className="btn btn-quiet btn-sm"
                  onClick={() =>
                    setStepIndex((i) =>
                      Math.min(SUBSCRIPTION_SECTION_COUNT - 1, i + 1),
                    )
                  }
                  disabled={stepIndex >= SUBSCRIPTION_SECTION_COUNT - 1}
                >
                  Next →
                </button>
              </div>

              <div
                className="card gold"
                style={{
                  opacity: allConfirmed ? 1 : 0.45,
                  pointerEvents: allConfirmed ? 'auto' : 'none',
                }}
              >
                <div className="qhead">
                  <h3>Sign all</h3>
                  <span className="n">Final step</span>
                </div>
                <p className="small" style={{ marginBottom: 14 }}>
                  Type your full legal name. One signature executes the subscription
                  agreement, the accredited investor questionnaire and the operating
                  agreement counterpart. Your offer becomes irrevocable when you do.
                </p>
                <label className="field">
                  <span>Signature</span>
                  <input
                    className="input"
                    placeholder="Your full legal name"
                    style={{ fontFamily: 'var(--fd)', fontSize: 19 }}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </label>
                <button
                  className="btn btn-gold btn-block"
                  onClick={signAll}
                  disabled={busy || signed}
                >
                  {signed ? 'Signed' : 'Sign all & continue to funding'}
                </button>
                <p className="tiny" style={{ marginTop: 12 }}>
                  A copy saves to your Docs automatically. Production signing runs
                  through {PARTNERS.esign} e-sign; this demo simulates it.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
