'use client';

/**
 * Settings. The demo reset wipes this investor's account and returns any
 * allocation their signed commitments were holding, so a walkthrough can
 * be run again from a clean slate.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';

const NOTIFICATIONS = [
  'New deals matching my interests',
  'Funding reminders (every other day until funded)',
  'Deal updates & valuation marks',
  'Tax document delivery',
];

export default function SettingsPanel({ email }: { email: string }) {
  const router = useRouter();
  const toast = useToast();

  const [currentEmail, setCurrentEmail] = useState(email);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    await api.logout().catch(() => {});
    router.push('/');
    router.refresh();
  }

  async function resetDemo() {
    if (busy) return;
    setBusy(true);
    try {
      await api.resetDemo();
      toast('Demo data cleared.');
      router.push('/');
      router.refresh();
    } catch {
      toast('Could not reset the demo.');
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Settings</div>
          <h1 className="display">Account settings.</h1>
        </div>
      </div>

      <div className="grid c2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Account</h3>
            <label className="field">
              <span>Email</span>
              <input
                className="input"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input className="input" type="password" placeholder="••••••••••" />
            </label>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                toast('Account changes are simulated in this demo environment.')
              }
            >
              Save changes
            </button>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Notifications</h3>
            <p className="small" style={{ marginBottom: 14 }}>
              Delivered by email in production ({PARTNERS.email}).
            </p>
            {NOTIFICATIONS.map((label, i) => (
              <label
                className="check"
                style={{ marginBottom: i === NOTIFICATIONS.length - 1 ? 0 : 12 }}
                key={label}
              >
                <input type="checkbox" defaultChecked />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Session</h3>
            <button className="btn btn-quiet" onClick={signOut}>
              Sign out
            </button>
          </div>

          <div className="card" style={{ borderColor: 'rgba(184,92,92,.35)' }}>
            <h3 style={{ marginBottom: 4 }}>Demo controls</h3>
            <p className="small" style={{ marginBottom: 14 }}>
              Wipe this account entirely, including onboarding, profiles, commitments and
              documents, and start the demo fresh. Any allocation your signed
              commitments were holding is returned to the deal.
            </p>

            {confirmingReset ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-ghost"
                  style={{ borderColor: 'rgba(184,92,92,.5)', color: 'var(--bad)' }}
                  onClick={resetDemo}
                  disabled={busy}
                >
                  {busy ? 'Resetting…' : 'Yes, wipe everything'}
                </button>
                <button
                  className="btn btn-quiet"
                  onClick={() => setConfirmingReset(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-ghost"
                style={{ borderColor: 'rgba(184,92,92,.5)', color: 'var(--bad)' }}
                onClick={() => setConfirmingReset(true)}
              >
                Reset demo data
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
