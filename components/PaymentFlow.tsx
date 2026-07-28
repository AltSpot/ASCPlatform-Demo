'use client';

/**
 * Funding. Either transfer now from the linked account, or let the
 * 10-day hold run — unfunded commitments release automatically, with no
 * penalty and no obligation.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import FeeTable from '@/components/invest/FeeTable';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';
import type { BankView, DealView, SubscriptionView } from '@/lib/domain';
import { feeBreakdown } from '@/lib/fees';
import { dateStr, money } from '@/lib/format';

export default function PaymentFlow({
  subscription,
  deal,
  bank,
  daysRemaining,
}: {
  subscription: SubscriptionView;
  deal: DealView;
  bank: BankView | null;
  /** Computed on the server so this component stays pure. */
  daysRemaining: number;
}) {
  const router = useRouter();
  const toast = useToast();

  const [state, setState] = useState(subscription.state);
  const [busy, setBusy] = useState(false);

  const fees = feeBreakdown(deal.fees, subscription.amount);

  async function fund() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await api.fundSubscription(
        subscription.id,
        bank ? 'ACH · linked account' : 'ACH · manual',
      );
      setState(next.state);
      toast(
        <>
          <b>Funding confirmed.</b> Status: funded · awaiting countersign.
        </>,
      );
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not initiate the transfer.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'funded') {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
        <div className="orb" style={{ width: 84, height: 84, margin: '0 auto 30px' }} />
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Transfer initiated
        </div>
        <h1 className="display" style={{ fontSize: 36, marginBottom: 14 }}>
          You&rsquo;re in, pending countersign.
        </h1>
        <p className="sub" style={{ margin: '0 auto 10px' }}>
          {money(fees.allIn)} is on its way to the {deal.name} account. AltSpot
          countersigns at close. You&rsquo;ll get confirmation, and the position will
          appear in your portfolio.
        </p>
        <p className="small" style={{ marginBottom: 34 }}>
          Signed documents live in your <Link href="/docs">Docs</Link>. Deal updates
          begin after close. Reporting after the wire is the whole point.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn btn-gold" href="/dashboard">
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
        <span className="here">Fund your investment</span>
      </div>

      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Final step</div>
          <h1 className="display">Your allocation is reserved.</h1>
          <p className="sub">
            Documents are signed and a copy is in your Docs. Fund by{' '}
            <b style={{ color: 'var(--gold-bright)' }}>
              {dateStr(subscription.fundingDeadline)}
            </b>{' '}
            to secure your spot in {deal.name}.
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
              <h3>Fund now with Same-Day ACH</h3>
              <span className="chip">Recommended</span>
            </div>

            {bank ? (
              <>
                <p className="small" style={{ marginBottom: 16 }}>
                  Transfer from your linked account. In production this settles through{' '}
                  {PARTNERS.payments} to a per-deal virtual account at {PARTNERS.custody}.
                </p>
                <div className="choice sel" style={{ marginBottom: 16 }}>
                  <b>
                    {bank.institution} · {bank.type} ····{bank.mask}
                  </b>
                  <span>
                    Linked {dateStr(bank.linkedAt)} · verified via {PARTNERS.banking}
                  </span>
                </div>
                <button
                  className="btn btn-gold btn-block"
                  onClick={fund}
                  disabled={busy}
                >
                  {busy ? 'Transferring…' : `Transfer ${money(fees.allIn)} now`}
                </button>
              </>
            ) : (
              <>
                <p className="small" style={{ marginBottom: 16 }}>
                  Link your bank once and fund in one click, now and on every future
                  deal.
                </p>
                <Link
                  className="btn btn-gold btn-block"
                  href={`/wizard?step=5&then=${deal.id}`}
                >
                  Link bank &amp; fund
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
                <button
                  className="btn btn-ghost btn-block"
                  onClick={fund}
                  disabled={busy}
                >
                  Transfer {money(fees.allIn)}
                </button>
              </>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="count">
                <span className="n num">{daysRemaining}</span>
                <span className="small">
                  {daysRemaining === 1 ? 'day' : 'days'}
                  <br />
                  remaining
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3>Or fund within 10 days</h3>
                <p className="small" style={{ marginTop: 4 }}>
                  Your spot stays reserved until {dateStr(subscription.fundingDeadline)}.
                  We&rsquo;ll remind you every other day. Unfunded commitments release
                  automatically. No penalty, no obligation.
                </p>
              </div>
              <Link className="btn btn-quiet" href="/dashboard">
                I&rsquo;ll fund later
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Transfer summary</h3>
          <div className="fee-row">
            <span className="l">{deal.name} subscription</span>
            <span className="r">{money(subscription.amount)}</span>
          </div>
          <FeeTable fees={deal.fees} amount={subscription.amount} />
          <div className="hr" />
          <p className="tiny">
            Funds are held in the deal&rsquo;s segregated account through the hold period
            and returned in full if the deal does not close.
          </p>
        </div>
      </div>
    </>
  );
}
