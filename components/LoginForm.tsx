'use client';

/**
 * Login form. Demo mode accepts any email and password — the server mints
 * the investor on first sight — so a walkthrough is never blocked at the
 * door.
 *
 * Every login lands on the dashboard. Outstanding account setup is
 * surfaced there as a prompt rather than forced as a gate.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';

import styles from './LoginForm.module.css';


export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      await api.login(email.trim(), password);
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not sign in. Try again.';
      toast(message);
      setBusy(false);
    }
  }

  /** The pre-onboarded door. Lands ready to invest. */
  async function existingInvestor() {
    if (busy) return;

    setBusy(true);
    try {
      await api.demoLogin();
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not sign in. Try again.';
      toast(message);
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
        <button
          type="button"
          className="skip"
          style={{ textDecoration: 'none', fontSize: 13 }}
          onClick={() => toast('Password reset is simulated in this demo.')}
        >
          Forgot password
        </button>
      </div>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      {/* The second door. Signing in with an email creates a new investor
          with nothing on file; this one is already through setup. */}
      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={existingInvestor}
        disabled={busy}
      >
        {busy ? 'Signing in…' : 'Use existing investor'}
      </button>
      <p className="tiny" style={{ marginTop: 10, textAlign: 'center' }}>
        Signs in as Hannah Smith, already verified. Straight to the marketplace.
      </p>

      <hr className="hr" />
      <div className="demo-note">
        Functional demo. All money is simulated and any email and password signs you
        in as a <b>new</b> investor, who completes accreditation, the W-9 and identity
        verification. Do not enter real passwords, tax IDs, or bank details.
      </div>
    </>
  );
}
