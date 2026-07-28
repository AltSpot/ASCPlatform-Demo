'use client';

/**
 * The subscription flow.
 *
 * Phase A picks the profile and amount. Phase B is the split screen: the
 * live agreement on the left, three grouped confirmations on the right.
 * Each confirmation fills its section of the document and autosaves, so
 * the investor can leave and resume. One typed signature executes it all.
 *
 * The document text is the source of truth for what is being agreed to —
 * the questions on the right are a plain-language restatement of it, not
 * a substitute.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import FeeTable from '@/components/invest/FeeTable';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';
import type {
  DealView,
  ProfileView,
  SubscriptionView,
  VaultView,
} from '@/lib/domain';
import { feeBreakdown } from '@/lib/fees';
import { dateStr, maskTin, money } from '@/lib/format';

interface InvestFlowProps {
  deal: DealView;
  userName: string;
  vault: VaultView;
  initialProfiles: ProfileView[];
  existing: SubscriptionView | null;
  accreditationVerifiedAt: string | null;
}

export default function InvestFlow({
  deal,
  userName,
  vault,
  initialProfiles,
  existing,
  accreditationVerifiedAt,
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
  const [confirms, setConfirms] = useState<Record<number, boolean>>({
    1: Boolean(existing?.answers.q1),
    2: Boolean(existing?.answers.q2),
    3: Boolean(existing?.answers.q3),
  });

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
  const fees = feeBreakdown(deal.fees, amount);
  const confirmedCount = [1, 2, 3].filter((n) => confirms[n]).length;
  const allConfirmed = confirmedCount === 3;

  const progressWidth = signed
    ? '100%'
    : allConfirmed
      ? '88%'
      : `${20 + confirmedCount * 22}%`;

  // ---------------- phase A ----------------

  async function createProfile() {
    const name =
      newProfile.name.trim() || `${userName} — ${newProfile.type}`;
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

  async function confirmSection(section: number) {
    if (!subscription || confirms[section]) return;

    setConfirms((c) => ({ ...c, [section]: true }));
    try {
      const next = await api.confirmSection(subscription.id, section);
      setSubscription(next);
      toast('Progress saved — you can leave and resume anytime.');
    } catch {
      // Roll back so the document never claims a confirmation the
      // server did not record.
      setConfirms((c) => ({ ...c, [section]: false }));
      toast('Could not save that confirmation — try again.');
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
      toast(error instanceof Error ? error.message : 'Could not sign — try again.');
      setBusy(false);
    }
  }

  function downloadDocument() {
    const body = docRef.current?.innerHTML ?? '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Subscription Agreement — ${deal.entity}</title>
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

  const investorName =
    [vault.first, vault.last].filter(Boolean).join(' ') || userName;
  const address =
    [vault.street, vault.city, vault.state, vault.zip].filter(Boolean).join(', ') ||
    'on file';

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
                  <p className="small">No profiles yet — create your first below.</p>
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
                  Only {money(deal.allocationRemaining)} of allocation remains — amounts
                  above this join the waitlist at close.
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
            {/* ---- the live document ---- */}
            <div className="docpane" ref={docRef}>
              <h4>Subscription Agreement</h4>
              <div className="docsub">
                {deal.entity} · Managed by AltSpot Capital LLC
              </div>

              <div className="sec filled">
                <span className="tick">✓ Complete</span>
                <h5>I. Subscriber</h5>
                <p>
                  The undersigned, <span className="f set">{investorName}</span>, a{' '}
                  <span className="f set">
                    {(vault.taxClass ?? 'Individual / sole proprietor').toLowerCase()}
                  </span>{' '}
                  with principal address at <span className="f set">{address}</span>{' '}
                  (Taxpayer ID <span className="f set">{maskTin(vault.tinLast4)}</span>),
                  acting through the investment profile{' '}
                  <span className="f set">
                    {selectedProfile
                      ? `${selectedProfile.name} (${selectedProfile.type})`
                      : 'on file'}
                  </span>
                  , hereby subscribes for membership interests in{' '}
                  <span className="f set">{deal.entity}</span> in the amount of{' '}
                  <span className="f set">{money(amount)}</span>.
                </p>
              </div>

              <div className={confirms[1] ? 'sec filled' : 'sec'}>
                <span className="tick">✓ Confirmed</span>
                <h5>II. Investor representations</h5>
                <p>
                  The Subscriber represents that they are an{' '}
                  <span className={confirms[1] ? 'f set' : 'f'}>
                    {confirms[1] ? 'accredited investor (verified)' : 'accredited investor'}
                  </span>{' '}
                  as defined in Rule 501(a) of Regulation D, verified by{' '}
                  <span className={confirms[1] ? 'f set' : 'f'}>
                    {confirms[1]
                      ? `professional certification via ${PARTNERS.accreditation}`
                      : 'third-party certification'}
                  </span>{' '}
                  dated{' '}
                  <span className={confirms[1] ? 'f set' : 'f'}>
                    {confirms[1] && accreditationVerifiedAt
                      ? dateStr(accreditationVerifiedAt)
                      : '____'}
                  </span>
                  ; that all information provided through the AltSpot portal is true and
                  complete; that they are acquiring the interests for their own account
                  for investment purposes and not with a view to distribution; and that
                  they have had the opportunity to review the offering materials and ask
                  questions of the Manager.{' '}
                  <span className={confirms[1] ? 'f set' : 'f'}>
                    {confirms[1] ? 'Confirmed by Subscriber.' : 'Pending confirmation.'}
                  </span>
                </p>
              </div>

              <div className={confirms[2] ? 'sec filled' : 'sec'}>
                <span className="tick">✓ Confirmed</span>
                <h5>III. Anti-money-laundering &amp; source of funds</h5>
                <p>
                  The Subscriber certifies that the funds used for this investment are
                  derived from lawful sources; that the Subscriber is not, and is not
                  acting on behalf of, any person or entity named on any list maintained
                  by the U.S. Office of Foreign Assets Control (OFAC); that the
                  Subscriber is not a foreign shell bank and is not acting for one; that
                  the Subscriber is not a senior foreign political figure or an immediate
                  family member or close associate of one; and that the Subscriber will
                  provide any further documentation reasonably requested to satisfy
                  anti-money-laundering obligations.{' '}
                  <span className={confirms[2] ? 'f set' : 'f'}>
                    {confirms[2] ? 'Certified by Subscriber.' : 'Pending confirmation.'}
                  </span>
                </p>
              </div>

              <div className={confirms[3] ? 'sec filled' : 'sec'}>
                <span className="tick">✓ Confirmed</span>
                <h5>IV. Risk acknowledgment &amp; fee schedule</h5>
                <p>
                  The Subscriber acknowledges that this investment is speculative and
                  illiquid, that no public market exists or is promised for the
                  interests, and that the entire investment may be lost. The Subscriber
                  acknowledges the following compensation to the Manager: a management
                  fee of{' '}
                  <span className="f set">
                    {deal.fees.management}% ({money(fees.management)})
                  </span>
                  , charged once at closing and not annually; and carried interest of{' '}
                  <span className="f set">{deal.fees.carry}%</span> of profits upon
                  realization. No further management fees accrue.{' '}
                  <span className={confirms[3] ? 'f set' : 'f'}>
                    {confirms[3] ? 'Acknowledged by Subscriber.' : 'Pending confirmation.'}
                  </span>
                </p>
              </div>

              <div className={signed ? 'sec filled' : 'sec'}>
                <span className="tick">✓ Signed</span>
                <h5>V. Execution</h5>
                <p>
                  In witness whereof, the Subscriber has executed this Subscription
                  Agreement electronically as of{' '}
                  <span className={signed ? 'f set' : 'f'}>{signedDate ?? '____'}</span>.
                </p>
                <p style={{ marginTop: 16 }}>
                  Signature: <span className="sig-line">{signed ? signature : ' '}</span>
                </p>
                <p style={{ marginTop: 10 }}>
                  ALTSPOT CAPITAL LLC, Manager — countersignature upon acceptance.
                </p>
              </div>
            </div>

            {/* ---- the guided track ---- */}
            <div>
              <div className={confirms[1] ? 'card qcard confirmed' : 'card qcard'}>
                <div className="qhead">
                  <h3>Who you are</h3>
                  <span className="n">1 / 3</span>
                </div>
                <p>
                  Confirm your investor representations in one step: you&rsquo;re a
                  verified accredited investor, the information in your saved profile is
                  true and current, and you&rsquo;re investing for your own account after
                  reviewing the offering materials. One click answers every
                  representation in Section II.
                </p>
                <button
                  className="btn btn-ghost btn-block"
                  onClick={() => confirmSection(1)}
                  disabled={confirms[1]}
                >
                  {confirms[1] ? '✓ Confirmed' : 'I confirm — complete Section II'}
                </button>
              </div>

              <div className={confirms[2] ? 'card qcard confirmed' : 'card qcard'}>
                <div className="qhead">
                  <h3>Where the money comes from</h3>
                  <span className="n">2 / 3</span>
                </div>
                <p>
                  The anti-money-laundering certifications, grouped into one plain
                  statement: your funds come from lawful sources, you&rsquo;re not on any
                  OFAC list or acting for anyone who is, and you&rsquo;ll provide
                  follow-up documentation if ever asked. One click completes every AML
                  item in Section III.
                </p>
                <button
                  className="btn btn-ghost btn-block"
                  onClick={() => confirmSection(2)}
                  disabled={confirms[2]}
                >
                  {confirms[2] ? '✓ Confirmed' : 'I confirm — complete Section III'}
                </button>
              </div>

              <div className={confirms[3] ? 'card qcard confirmed' : 'card qcard'}>
                <div className="qhead">
                  <h3>Risk &amp; your all-in cost</h3>
                  <span className="n">3 / 3</span>
                </div>
                <p>
                  This is a speculative, illiquid investment that can go to zero. Here is
                  every dollar you&rsquo;ll ever pay — known on day one, no capital
                  calls, ever:
                </p>
                <FeeTable fees={deal.fees} amount={amount} />
                <button
                  className="btn btn-ghost btn-block"
                  style={{ marginTop: 14 }}
                  onClick={() => confirmSection(3)}
                  disabled={confirms[3]}
                >
                  {confirms[3] ? '✓ Confirmed' : 'I understand — complete Section IV'}
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
                  Type your full legal name. One signature executes the complete
                  agreement.
                </p>
                <label className="field">
                  <span>Signature</span>
                  <input
                    className="input"
                    placeholder="Your full legal name"
                    style={{ fontFamily: 'var(--serif)', fontSize: 19 }}
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
