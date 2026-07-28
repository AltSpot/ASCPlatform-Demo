'use client';

/**
 * The subscription flow.
 *
 * Phase A picks the profile and amount. Phase B is the split screen: the
 * live agreement on the left, the grouped confirmations on the right. Each
 * confirmation fills its article of the document and autosaves, so the
 * investor can leave and resume. One typed signature executes it all.
 *
 * The document text is the source of truth for what is being agreed to —
 * the panels on the right are a plain-language restatement of it, not a
 * substitute. Both are generated from lib/subscription-sections.ts, which
 * is where the clause mapping lives.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type ReactNode } from 'react';

import ConfirmPanel from '@/components/invest/ConfirmPanel';
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
import {
  choiceKey,
  decodeConfirmationCode,
  getSection,
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
  accreditationVerifiedAt: string | null;
}

/** The security the Company holds. Named, not implied, in the document. */
const PORTFOLIO_SECURITY = 'Series Seed Preferred Stock of Simphonic, Inc.';

/**
 * How Rule 506(c) verification is satisfied under §3.9. AltSpot reviews the
 * certification letter itself, so no verification vendor is named here.
 */
const VERIFICATION_METHOD = 'AltSpot review of a signed certification letter';

/**
 * One article of the live document. Kept at module scope so confirming a
 * section transitions the existing element rather than remounting the pane.
 */
function Article({
  id,
  filled,
  children,
}: {
  id: number;
  filled: boolean;
  children: ReactNode;
}) {
  const section = getSection(id)!;
  return (
    <div className={filled ? 'sec filled' : 'sec'}>
      <span className="tick">✓ Confirmed</span>
      <h5>
        {section.numeral}. {section.documentTitle}
      </h5>
      {children}
      <p style={{ marginTop: 10 }}>
        <span className={filled ? 'f set' : 'f'}>
          {filled ? 'Confirmed by Subscriber.' : 'Pending confirmation.'}
        </span>
      </p>
    </div>
  );
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
  const fees = feeBreakdown(deal.fees, amount);

  const done = (id: number) => isSectionConfirmed(answers, id);
  const confirmedCount = SUBSCRIPTION_SECTIONS.filter((s) => done(s.id)).length;
  const allConfirmed = confirmedCount === SUBSCRIPTION_SECTION_COUNT;

  const accreditation = selectedChoice(answers, getSection(2)!);
  const benefitPlan = selectedChoice(answers, getSection(4)!);

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

    try {
      const next = await api.confirmSection(subscription.id, code);
      setSubscription(next);
      setAnswers(next.answers);
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
            {/* ---- the live document ---- */}
            <div className="docpane" ref={docRef}>
              <h4>Subscription Agreement</h4>
              <div className="docsub">
                {deal.entity} · Class B Common Units · Managed by AltSpot Capital LLC
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
                  , irrevocably subscribes for Class B Common Units of{' '}
                  <span className="f set">{deal.entity}</span> in the amount of{' '}
                  <span className="f set">{money(amount)}</span>, a Delaware limited
                  liability company formed for the sole purpose of acquiring and
                  holding <span className="f set">{PORTFOLIO_SECURITY}</span> together
                  with associated warrants over its common stock.
                </p>
              </div>

              <Article id={1} filled={done(1)}>
                <p>
                  The Subscriber has received, read and understands this Subscription
                  Agreement, the Confidential Private Placement Memorandum and the
                  Operating Agreement, including the risk factors, conflicts of
                  interest and tax considerations described in them; has had the
                  opportunity to ask questions of the Manager and to receive answers;
                  and has relied solely on those documents and on the Subscriber&rsquo;s
                  own investigation and advisors, and not on any representation not
                  contained in them. The Memorandum is a summary qualified in its
                  entirety by the Operating Agreement, which controls in the event of
                  any inconsistency. Except as stated in the Offering Documents, the
                  Company makes no representation regarding Simphonic, and has not
                  independently verified the information regarding Simphonic contained
                  in them. This subscription does not bind the Company until accepted
                  by the Manager, who may accept it in whole or in part, hold one or
                  more closings, and modify, extend or withdraw the Offering. If the
                  acquisition of the Portfolio Securities does not occur, uninvested
                  funds are returned without interest.
                </p>
              </Article>

              <Article id={2} filled={done(2)}>
                <p>
                  The Subscriber is an{' '}
                  <span className={done(2) ? 'f set' : 'f'}>accredited investor</span>{' '}
                  as defined in Rule 501(a) of Regulation D, qualifying under{' '}
                  <span className={accreditation ? 'f set' : 'f'}>
                    {accreditation?.documentText ?? 'the category indicated on Exhibit A'}
                  </span>
                  . The Offering is conducted in reliance on Rule 506(c), and the
                  Subscriber will complete verification by{' '}
                  <span className="f set">{VERIFICATION_METHOD}</span>, or by
                  delivering a professional letter dated within the prior three
                  months, and authorizes the results to be shared with the Manager. Portal
                  verification of record dated{' '}
                  <span className={accreditationVerifiedAt ? 'f set' : 'f'}>
                    {accreditationVerifiedAt ? dateStr(accreditationVerifiedAt) : '____'}
                  </span>
                  . The Subscriber has the capacity and authority to execute this
                  Agreement, the Accredited Investor Questionnaire and the counterpart
                  signature page to the Operating Agreement, and those obligations are
                  binding and enforceable against the Subscriber. To the
                  Subscriber&rsquo;s knowledge, no disqualifying event under Rule 506(d)
                  applies to the Subscriber or its principals, the Subscriber is not an
                  affiliate of a FINRA member firm or a politically exposed person, and
                  the Subscriber acquires the Units for its own account and not as
                  nominee for any other person.
                </p>
              </Article>

              <Article id={3} filled={done(3)}>
                <p>
                  The Subscriber acquires the Class B Units for the Subscriber&rsquo;s
                  own account, for investment, and not with a view to distribution, and
                  understands that the Units are restricted securities within the
                  meaning of Rule 144, are not registered under the Securities Act or
                  any state law, and that no public market exists or is expected to
                  develop. Neither the Company nor the Manager is obliged to register
                  the Units or to assist with any exemption. The Subscriber understands
                  that the Company is newly organized, holds a single asset,{' '}
                  <span className="f set">{PORTFOLIO_SECURITY}</span>, that Class B
                  Units carry no voting rights and limited information rights, that the
                  Manager operates under narrowed duties and broad indemnification, and
                  that the entire investment may be lost. The Subscriber can bear that
                  loss and has no need for liquidity.
                </p>
                <p style={{ marginTop: 10 }}>
                  The Subscriber acknowledges the compensation payable to the Manager:
                  a management fee of{' '}
                  <span className="f set">
                    {deal.fees.management}% ({money(fees.management)})
                  </span>
                  , charged once at closing and not annually, and carried interest of{' '}
                  <span className="f set">{deal.fees.carry}%</span> of profits upon
                  realization. No further fees accrue, and the Subscriber will not be
                  required to make any additional capital contribution beyond the
                  Subscription Amount.
                </p>
              </Article>

              <Article id={4} filled={done(4)}>
                <p>
                  The Subscription Amount is derived from lawful sources. Neither the
                  Subscriber nor any beneficial owner, controlling person or affiliate
                  is named on any list maintained by the U.S. Office of Foreign Assets
                  Control or is organized or resident in a comprehensively sanctioned
                  jurisdiction, and the Subscriber will provide such further
                  anti-money-laundering documentation as the Manager reasonably
                  requests. The Subscriber understands that the Company is classified as
                  a partnership for U.S. federal income tax purposes, that the
                  Subscriber takes into account its allocable share of income, gain,
                  loss, deduction and credit whether or not the Company distributes
                  cash, that the Company intends to elect the application of{' '}
                  <span className="f set">Section 6226 of the Code</span>, and that the
                  Subscriber indemnifies the Company, the Manager and the Tax
                  Representative for tax liabilities arising from a failure to supply
                  requested tax information. The Subscriber will deliver{' '}
                  <span className="f set">Form W-9, or the applicable Form W-8</span>,
                  and relies solely on its own advisors as to tax consequences.
                </p>
                <p style={{ marginTop: 10 }}>
                  For purposes of Section 3(42) of ERISA and the plan asset regulations,
                  the Subscriber{' '}
                  <span className={benefitPlan ? 'f set' : 'f'}>
                    {benefitPlan?.documentText ??
                      'is or is not a Benefit Plan Investor, as indicated on Exhibit A'}
                  </span>
                  .
                </p>
              </Article>

              <Article id={5} filled={done(5)}>
                <p>
                  By executing the counterpart signature page to the Operating
                  Agreement, the Subscriber agrees to be admitted as a Class B Member of{' '}
                  <span className="f set">{deal.entity}</span>, to be bound by the
                  Operating Agreement in full, and to make the representations set out
                  in its Article 10. The Subscriber irrevocably constitutes and appoints{' '}
                  <span className={done(5) ? 'f set' : 'f'}>AltSpot Capital, LLC</span>{' '}
                  as the Subscriber&rsquo;s true and lawful attorney-in-fact, with full
                  power of substitution, to make, execute, deliver, file and record the
                  Operating Agreement and its amendments, any amendment to the schedules
                  recording the Subscriber&rsquo;s admission, capital contribution and
                  Percentage Interest, all certificates required to qualify or continue
                  the Company in any jurisdiction, and all instruments necessary to
                  dissolve and liquidate the Company. That power is coupled with an
                  interest, is irrevocable, and survives the Subscriber&rsquo;s death,
                  incapacity, dissolution or bankruptcy. The Manager holds full,
                  exclusive authority over the business and affairs of the Company,
                  including the Portfolio Securities, the Warrants and all tax
                  elections. This Agreement is governed by the laws of{' '}
                  <span className="f set">Delaware</span>.
                </p>
              </Article>

              <Article id={6} filled={done(6)}>
                <p>
                  The Subscriber&rsquo;s offer to purchase is{' '}
                  <span className={done(6) ? 'f set' : 'f'}>irrevocable</span>, and the
                  Subscriber may not withdraw, cancel or revoke this Agreement once
                  delivered, except as required by applicable law. The Subscriber
                  indemnifies and holds harmless the Company, the Manager and their
                  respective members, officers, employees, agents, affiliates and
                  representatives against all losses, claims, damages, liabilities,
                  costs and expenses, including reasonable attorneys&rsquo; fees,
                  arising out of any breach of the Subscriber&rsquo;s representations or
                  covenants, any inaccuracy or omission in information provided, any
                  disposition of Units in violation of this Agreement, and any tax
                  liability of the Company caused by the Subscriber&rsquo;s failure to
                  comply with Section 7.4 of the Operating Agreement. That obligation
                  survives dissolution of the Company and any transfer of the Units.
                </p>
                <p style={{ marginTop: 10 }}>
                  Any controversy or claim arising out of or relating to this Agreement
                  is resolved by{' '}
                  <span className={done(6) ? 'f set' : 'f'}>
                    binding, non-appealable arbitration before the American Arbitration
                    Association in Los Angeles, California
                  </span>
                  . THE SUBSCRIBER KNOWINGLY, VOLUNTARILY AND INTENTIONALLY WAIVES, TO
                  THE FULLEST EXTENT PERMITTED BY LAW, ANY RIGHT TO A TRIAL BY JURY IN
                  RESPECT OF ANY LITIGATION ARISING OUT OF OR IN CONNECTION WITH THIS
                  AGREEMENT. The Offering Documents remain confidential, the Subscriber
                  will notify the Manager in writing if any representation ceases to be
                  accurate, and all representations survive the Closing Date and the
                  dissolution of the Company.
                </p>
              </Article>

              <div className={signed ? 'sec filled' : 'sec'}>
                <span className="tick">✓ Signed</span>
                <h5>VIII. Execution</h5>
                <p>
                  In witness whereof, the Subscriber has executed this Subscription
                  Agreement, the Accredited Investor Questionnaire and the counterpart
                  signature page to the Operating Agreement electronically as of{' '}
                  <span className={signed ? 'f set' : 'f'}>{signedDate ?? '____'}</span>.
                </p>
                <p style={{ marginTop: 16 }}>
                  Signature: <span className="sig-line">{signed ? signature : ' '}</span>
                </p>
                <p style={{ marginTop: 10 }}>
                  ALTSPOT CAPITAL LLC, Manager. Countersignature upon acceptance.
                </p>
              </div>
            </div>

            {/* ---- the guided track ---- */}
            <div>
              {SUBSCRIPTION_SECTIONS.map((section, i) => (
                <ConfirmPanel
                  key={section.id}
                  section={section}
                  index={i + 1}
                  total={SUBSCRIPTION_SECTION_COUNT}
                  confirmed={done(section.id)}
                  chosenKey={selectedChoice(answers, section)?.key ?? null}
                  onConfirm={confirm}
                >
                  {/* The all-in cost belongs beside the risk it buys. */}
                  {section.id === 3 && (
                    <FeeTable fees={deal.fees} amount={amount} />
                  )}
                </ConfirmPanel>
              ))}

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
