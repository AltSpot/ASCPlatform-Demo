'use client';

/**
 * Signed-but-unfunded commitments and lapsed ones.
 *
 * `daysRemaining` is computed on the server and passed in, rather than
 * derived from the clock during render — that keeps this component pure
 * and guarantees the server and client agree on first paint.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { dateStr, money } from '@/lib/format';

interface Pending {
  id: string;
  amount: number;
  signedAt: string | null;
  fundingDeadline: string | null;
  daysRemaining: number;
  dealName: string;
}

interface Expired {
  id: string;
  amount: number;
  dealId: string;
  dealName: string;
}

export default function PendingCommitments({
  pending,
  expired,
}: {
  pending: Pending[];
  expired: Expired[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (pending.length === 0 && expired.length === 0) return null;

  async function cancel(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      await api.cancelSubscription(id);
      toast('Commitment cancelled — allocation released.');
      router.refresh();
    } catch {
      toast('Could not cancel that commitment.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {pending.map((p) => (
        <div className="card gold pending" style={{ marginBottom: 22 }} key={p.id}>
          <div className="count">
            <span className="n num">{p.daysRemaining}</span>
            <span className="small">
              {p.daysRemaining === 1 ? 'day' : 'days'} left
              <br />
              to fund
            </span>
          </div>

          <div className="info">
            <div className="chip warn" style={{ marginBottom: 8 }}>
              <span className="dot" />
              Pending investment
            </div>
            <h3>
              {p.dealName} — {money(p.amount)}
            </h3>
            <p className="small" style={{ marginTop: 4 }}>
              Documents signed {dateStr(p.signedAt)}. Fund by{' '}
              {dateStr(p.fundingDeadline)} to secure your allocation — after that, your
              spot is released. Reminders go out every other day.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-gold" href={`/payment/${p.id}`}>
              Fund now
            </Link>
            <button
              className="btn btn-quiet btn-sm"
              onClick={() => cancel(p.id)}
              disabled={busyId === p.id}
            >
              Cancel
            </button>
          </div>
        </div>
      ))}

      {expired.map((e) => (
        <div
          className="card"
          style={{
            marginBottom: 22,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
          key={e.id}
        >
          <div>
            <div className="chip neutral" style={{ marginBottom: 8 }}>
              Expired
            </div>
            <p className="small">
              Your commitment to{' '}
              <b style={{ color: 'var(--paper)' }}>{e.dealName}</b> ({money(e.amount)})
              lapsed unfunded and the allocation was released.
            </p>
          </div>
          <Link className="btn btn-ghost btn-sm" href={`/deals/${e.dealId}`}>
            Re-open deal
          </Link>
        </div>
      ))}
    </>
  );
}
