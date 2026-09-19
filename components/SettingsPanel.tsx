'use client';

/**
 * Settings. The demo reset wipes this investor's account and returns any
 * allocation their signed commitments were holding, so a walkthrough can
 * be run again from a clean slate.
 */
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';

import AppearanceCard from '@/components/settings/AppearanceCard';
import InviteCard from '@/components/settings/InviteCard';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';

/**
 * Tax document delivery is `required`: an investor cannot opt out of receiving
 * their own tax documents, so the control is shown, locked on, and labelled
 * rather than hidden. Everything else is a genuine preference.
 */
const NOTIFICATIONS: { label: string; required?: boolean }[] = [
  { label: 'New deals matching my interests' },
  { label: 'Escrow reminders ahead of the admission cut-off' },
  { label: 'Deal updates & valuation marks' },
  { label: 'Tax document delivery', required: true },
];

export default function SettingsPanel({
  email,
  invitePath,
  preferencesSummary,
}: {
  /** What the member asked to see, in words, or null if not answered. */
  preferencesSummary: string | null;
  email: string;
  /** This member's own referral link path, e.g. /r/m-1a2b3c4d5e. */
  invitePath: string;
}) {
  const router = useRouter();
  const toast = useToast();

  /* The origin is only known in the browser. The server render shows the
     path, and the client fills in the full link. */
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => '',
  );
  const inviteUrl = origin + invitePath;

  async function copyInvite(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast('Invite link copied.');
      return true;
    } catch {
      toast('Could not copy. Select the link and copy it instead.');
      return false;
    }
  }

  const [currentEmail, setCurrentEmail] = useState(email);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [busy, setBusy] = useState(false);


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

      {/* Appearance leads: it is the one setting that changes every page. */}
      <div style={{ marginBottom: 24 }}>
        <AppearanceCard />
      </div>

      {/* The invite, second only to Appearance (Tyler, 2026-09-19). What it may
          promise is narrow by law; components/settings/InviteCard says why. */}
      <div style={{ marginBottom: 24 }}>
        <InviteCard
          inviteUrl={inviteUrl}
          onCopy={copyInvite}
        />
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

          {/* Deal preferences: what is marked for this member and what they
              hear about. Asked on the dashboard once accepted; changed here. */}
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Deal preferences</h3>
            <p className="small" style={{ marginBottom: 14 }}>
              {preferencesSummary ?? 'Not set yet. Tell us what you want to see.'}
            </p>
            <Link className="btn btn-ghost btn-sm" href="/preferences?from=settings">
              {preferencesSummary ? 'Change preferences' : 'Set preferences'}
            </Link>
          </div>

          {/* The first-run walkthrough, replayable from here. */}
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>The walkthrough</h3>
            <p className="small" style={{ marginBottom: 14 }}>
              Two minutes on what each part of the platform is: the dashboard, the two lanes of
              the marketplace, the watchlist, the bell, Spot, and your documents.
            </p>
            <Link className="btn btn-ghost btn-sm" href="/dashboard?tour=1">
              Take the walkthrough again
            </Link>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Notifications</h3>
            <p className="small" style={{ marginBottom: 14 }}>
              Delivered by email in production ({PARTNERS.email}).
            </p>
            {NOTIFICATIONS.map(({ label, required }, i) => (
              <label
                className="check"
                style={{
                  marginBottom: i === NOTIFICATIONS.length - 1 ? 0 : 12,
                  cursor: required ? 'default' : undefined,
                }}
                key={label}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  disabled={required}
                  readOnly={required}
                />
                {label}
                {required ? (
                  <span className="brandmark" style={{ marginLeft: 8 }}>
                    Always on
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
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
