'use client';

/**
 * Escrow: the last step. Work order screen 9.
 *
 * The member's money moves to ESCROW here, never to a deal and never to
 * AltSpot. The deal closes when its minimum is met by the closing date,
 * and if it is not, escrow returns the money. So nothing on this page
 * says "funded": the member sends to escrow, and the confirmation says
 * where the money is and what has to happen next.
 *
 * The clock is the admission cut-off (lib/funding.ts): admissions close
 * a set number of hours before the wire, and a signed subscription not
 * in escrow by then lapses with no penalty.
 *
 * The transfer is the investment and nothing more: the fees come out of
 * it at closing (Tyler, 2026-09-21). lib/fees.ts is the one source.
 */
import { Landmark, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import EscrowClock from '@/components/EscrowClock';
import FeeTable from '@/components/invest/FeeTable';
import StationRail from '@/components/invest/StationRail';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { announceNeedsYouChanged } from '@/lib/needs-you';
import type { BankView, DealView, SubscriptionView } from '@/lib/domain';
import { feeBreakdown } from '@/lib/fees';
import { dateStr, money } from '@/lib/format';
import { admissionCutoff } from '@/lib/funding';

export default function PaymentFlow({
  subscription,
  deal,
  bank,
  daysRemaining,
}: {
  subscription: SubscriptionView;
  deal: DealView;
  bank: BankView | null;
  /** Days left in the member's own escrow window. Computed on the server. */
  daysRemaining: number;
}) {
  const router = useRouter();
  const toast = useToast();

  const [state, setState] = useState(subscription.state);
  const [busy, setBusy] = useState(false);

  /* What the button says moves: the investment, and nothing added to it.
     The fees come out of it at closing (lib/fees.ts). */
  const transfer = feeBreakdown(subscription.amount).allIn;
  const cutoff = subscription.fundingDeadline ?? admissionCutoff(deal.targetClose);

  async function send() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await api.fundSubscription(
        subscription.id,
        bank ? 'ACH · linked account' : 'ACH · manual',
      );
      setState(next.state);
      announceNeedsYouChanged();
      toast(
        <>
          <b>Sent to escrow.</b> The deal closes when the minimum is met.
        </>,
      );
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not start the transfer.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'funded') {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
        <StationRail at="escrow" done />
        <div className="orb" style={{ width: 84, height: 84, margin: '34px auto 30px' }} />
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          In escrow
        </div>
        <h1 className="display" style={{ fontSize: 34, marginBottom: 14 }}>
          Your subscription is in escrow.
        </h1>
        <p className="sub" style={{ margin: '0 auto 10px' }}>
          The deal closes when the minimum is met. Your money waits in escrow for{' '}
          {deal.name} until then, and comes back to you if the minimum is not met by the
          closing date.
        </p>
        <p className="small" style={{ marginBottom: 34 }}>
          Signed documents are in your <Link href="/docs">Docs</Link>. Updates begin
          after close.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" href="/dashboard">
            Back to dashboard
          </Link>
          <Link className="btn btn-ghost" href="/marketplace">
            Browse more deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="crumbs">
        <Link href="/dashboard">Dashboard</Link>
        <span className="sep">/</span>
        <span className="here">Send to escrow</span>
      </div>

      <StationRail at="escrow" />

      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Final step</div>
          <h1 className="display">Your allocation is reserved.</h1>
          <p className="sub">
            Documents are signed and a copy is in your Docs. Send{' '}
            <b>{money(transfer)}</b> to escrow by <b>{dateStr(cutoff)}</b>
            {daysRemaining > 0
              ? `, ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} from now,`
              : ', today,'}{' '}
            to be admitted when {deal.name} closes.
          </p>
        </div>
      </div>

      <div className="grid c2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card gold">
            <div
              className="qhead"
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
            >
              <h3>Send to escrow with Same-Day ACH</h3>
              <span className="chip">Recommended</span>
            </div>

            {bank ? (
              <>
                <p className="small" style={{ marginBottom: 16 }}>
                  From your linked account to an escrow account in the SPV&rsquo;s own name
                  at a U.S. bank, never through an AltSpot account.
                </p>
                <div className="choice sel" style={{ marginBottom: 16 }}>
                  <b>
                    {bank.institution} · {bank.type} ····{bank.mask}
                  </b>
                  <span>
                    Linked {dateStr(bank.linkedAt)} · verified through a secure bank link
                  </span>
                </div>
                <button className="btn btn-gold btn-block" onClick={send} disabled={busy}>
                  {busy ? 'Sending…' : `Send ${money(transfer)} to escrow`}
                </button>
              </>
            ) : (
              <>
                <p className="small" style={{ marginBottom: 16 }}>
                  Link your bank once and send to escrow in one click, now and on every
                  future deal.
                </p>
                <Link
                  className="btn btn-gold btn-block"
                  href={`/wizard?step=5&then=${deal.id}`}
                >
                  Link bank &amp; send
                </Link>

                <div className="hr" />

                <p className="small" style={{ marginBottom: 12 }}>
                  Or enter ACH details manually:
                </p>
                <div className="form-row">
                  <label className="field">
                    <span>Routing number</span>
                    <input className="input num" placeholder="Demo mode, enter anything" />
                  </label>
                  <label className="field">
                    <span>Account number</span>
                    <input className="input num" placeholder="Demo mode, enter anything" />
                  </label>
                </div>
                <div className="demo-note" style={{ marginBottom: 14 }}>
                  Demo environment. Never enter real bank details here.
                </div>
                <button className="btn btn-ghost btn-block" onClick={send} disabled={busy}>
                  Send {money(transfer)} to escrow
                </button>
              </>
            )}
            <p className="tiny" style={{ marginTop: 10 }}>
              Fees come out of this amount at closing, as the memorandum sets out. Nothing is added.
            </p>
          </div>

          {/* The member's own ten days, not the deal's closing calendar. */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <div>
                <h3>Paying later? Your spot is held until {dateStr(cutoff)}</h3>
                <p className="small" style={{ marginTop: 4 }}>
                  We&rsquo;ll remind you before then. No penalty and no obligation if it lapses.
                </p>
              </div>
              <Link className="btn btn-quiet" href="/dashboard">
                I&rsquo;ll send later
              </Link>
            </div>
            <EscrowClock
              signedAt={subscription.signedAt}
              deadline={subscription.fundingDeadline}
              admissionsClose={admissionCutoff(deal.targetClose)}
              daysLeft={daysRemaining}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Landmark size={17} strokeWidth={1.6} aria-hidden="true" />
            Escrow summary
          </h3>
          <p className="small" style={{ marginBottom: 12 }}>
            {deal.name} · {deal.entity}
          </p>
          <FeeTable
            amount={subscription.amount}
            targetClose={deal.targetClose}
            minimumToClose={deal.minimumToClose}
            allocationTotal={deal.allocationTotal}
            allocationRemaining={deal.allocationRemaining}
            company={deal.name}
          />
          <div className="hr" />
          <p className="tiny" style={{ display: 'flex', gap: 6 }}>
            <Lock size={12} strokeWidth={1.8} aria-hidden="true" style={{ flex: 'none', marginTop: 3 }} />
            Held in escrow until close. Returned in full if the minimum is not met by the
            closing date.
          </p>
        </div>
      </div>
    </>
  );
}
