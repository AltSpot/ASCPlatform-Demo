'use client';

/**
 * The two ways in, on one card.
 *
 * Sign in and create account were the same door: any address signed you
 * in, and an unknown one quietly minted an account named after the local
 * part. That guess ends up on every subscription document the member
 * signs, so creating an account now asks for the name instead. The two
 * modes post to different endpoints and mean different things, which is
 * what the switch above them is claiming.
 *
 * Demo mode still accepts any password, so a walkthrough is never
 * blocked at the door. What it does not do is sign someone into an
 * existing account because they mistyped their own address: registering
 * against an address already in use is refused in both modes.
 *
 * THE CARD EXPLAINS NOTHING IT DOES NOT HAVE TO. It carried a line
 * under the switch, a line under the button and a line under the demo
 * door, and every one of them was answering a question nobody standing
 * at a login form is asking. The controls say what they do. The only
 * prose left is the demo caveat, which is the one thing this screen
 * knows that the visitor cannot work out.
 *
 * Every login lands on the dashboard. Outstanding account setup is
 * surfaced there as a prompt rather than forced as a gate.
 */
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';

import s from './LoginForm.module.css';

type Mode = 'signin' | 'create';

const MODES: { key: Mode; label: string }[] = [
  { key: 'signin', label: 'Sign in' },
  { key: 'create', label: 'Create account' },
];

export default function LoginForm({ initialMode = 'signin' }: { initialMode?: Mode }) {
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  /* Focus follows the switch. Changing mode and leaving the caret in a
     field that is no longer first is a small thing that makes a form
     feel like it was assembled rather than designed. */
  const firstField = useRef<HTMLInputElement>(null);

  function choose(next: Mode) {
    if (next === mode) return;
    setMode(next);
    requestAnimationFrame(() => firstField.current?.focus());
  }

  function fail(error: unknown, fallback: string) {
    toast(error instanceof ApiError ? error.message : fallback);
    setBusy(false);
  }

  function enter() {
    router.push('/dashboard');
    router.refresh();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      if (mode === 'create') {
        await api.register(name.trim(), email.trim(), password);
      } else {
        await api.login(email.trim(), password);
      }
      enter();
    } catch (error) {
      fail(
        error,
        mode === 'create'
          ? 'Could not create the account. Try again.'
          : 'Could not sign in. Try again.',
      );
    }
  }

  /** The pre-onboarded door. Lands verified and ready to invest. */
  async function existingInvestor() {
    if (busy) return;
    setBusy(true);
    try {
      await api.demoLogin();
      enter();
    } catch (error) {
      fail(error, 'Could not sign in. Try again.');
    }
  }

  const creating = mode === 'create';

  return (
    <>
      <div className={s.modes} role="group" aria-label="Sign in or create an account">
        {MODES.map((option) => (
          <button
            key={option.key}
            type="button"
            className={s.mode}
            aria-pressed={option.key === mode}
            onClick={() => choose(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        {/* The name is asked for because it goes on the documents, not
            because a form wanted a third field. */}
        {creating && (
          <label className={s.field}>
            <span>Full legal name</span>
            <input
              className="input"
              ref={firstField}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Hannah Smith"
              autoComplete="name"
              required
            />
          </label>
        )}

        <label className={s.field}>
          <span>Email</span>
          <input
            className="input"
            ref={creating ? undefined : firstField}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            required
          />
        </label>

        <label className={s.field}>
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••"
            autoComplete={creating ? 'new-password' : 'current-password'}
            required
          />
        </label>

        <button className={`btn btn-gold btn-block ${s.go}`} type="submit" disabled={busy}>
          {busy
            ? creating
              ? 'Creating account…'
              : 'Signing in…'
            : creating
              ? 'Create account'
              : 'Sign in'}
          {/* Text, not an icon. V18 is explicit about this arrow. */}
          {!busy && <span aria-hidden="true">&rarr;</span>}
        </button>
      </form>

      {!creating && (
        <button
          type="button"
          className={s.quiet}
          onClick={() => toast('Password reset is simulated in this demo.')}
        >
          Forgot password
        </button>
      )}

      <div className={s.divider}>
        <span>or</span>
      </div>

      {/* The demo's third door. Not a real product surface: it skips
          straight to an account that is already through setup. */}
      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={existingInvestor}
        disabled={busy}
      >
        Continue as a verified member
      </button>

      <p className={s.demo}>
        Demo. Any email and password works. An address containing <b>+new</b>{' '}
        starts an empty account.
      </p>
    </>
  );
}
