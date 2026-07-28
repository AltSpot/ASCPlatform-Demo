'use client';

/**
 * DEMO ITEM — a stand-in for Plaid Link.
 *
 * The real flow hands the investor to Plaid's hosted SDK, which returns a
 * public token the server exchanges for accounts. Nothing here touches a
 * network: the sign-in is prefilled, Submit does not authenticate, and
 * the accounts are fixtures. The contract it hands back (institution plus
 * the selected accounts) is the same one the real Link callback provides,
 * so replacing this component does not move anything downstream.
 *
 * Delete this file, its stylesheet and the branch that opens it when
 * Plaid Link goes in.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { money } from '@/lib/format';

import styles from './PlaidDemoModal.module.css';

export interface PlaidDemoAccount {
  id: string;
  name: string;
  /** Persisted as the account type on the linked funding source. */
  type: string;
  mask: string;
  /** Whole dollars, matching the rest of the platform. */
  balance: number;
}

/** Plaid's own sandbox fixtures, which is where these names come from. */
const DEMO_ACCOUNTS: PlaidDemoAccount[] = [
  {
    id: 'plaid_checking',
    name: 'Plaid Checking',
    type: 'Checking',
    mask: '0000',
    balance: 12_480,
  },
  {
    id: 'plaid_saving',
    name: 'Plaid Saving',
    type: 'Savings',
    mask: '1111',
    balance: 43_115,
  },
];

/** Long enough to read as a handoff, short enough not to feel broken. */
const CONNECT_MS = 1100;

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

type Stage = 'signin' | 'connecting' | 'accounts' | 'linking';

export default function PlaidDemoModal({
  institution,
  onClose,
  onConnect,
}: {
  institution: string;
  onClose: () => void;
  /** Resolves once the accounts are linked; the parent then closes. */
  onConnect: (accounts: PlaidDemoAccount[]) => Promise<void>;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [stage, setStage] = useState<Stage>('signin');
  const [selected, setSelected] = useState<string[]>([DEMO_ACCOUNTS[0].id]);

  const dismiss = useCallback(() => {
    // Never abandon the investor mid-write.
    if (stage !== 'linking') onClose();
  }, [onClose, stage]);

  // Escape closes; Tab cycles inside the panel. Capture phase so the
  // wizard underneath never sees these keys while the dialog is open.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [dismiss]);

  // Hold focus, and hand it back to whatever opened the dialog on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const body = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = body;
      opener?.focus?.();
    };
  }, []);

  // Each stage puts focus on its own first control, so the keyboard path
  // follows the visible one.
  useEffect(() => {
    if (stage === 'linking') return;
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();
  }, [stage]);

  useEffect(() => {
    if (stage !== 'connecting') return;
    const timer = window.setTimeout(() => setStage('accounts'), CONNECT_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  async function connect() {
    if (selected.length === 0 || stage === 'linking') return;

    setStage('linking');
    try {
      // Preserve the on-screen order so the first row is the default source.
      await onConnect(DEMO_ACCOUNTS.filter((a) => selected.includes(a.id)));
    } catch {
      setStage('accounts');
    }
  }

  // Rendered in a portal so the wizard's panel animation can never
  // reposition a fixed overlay. Only ever mounted from a click, so the
  // server never reaches this.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plaid-demo-title"
      >
        <div className={styles.head}>
          <span className="demo-tag">
            <span className="dot" /> Demo · simulated Plaid
          </span>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={dismiss}
          >
            ✕
          </button>
        </div>

        {stage === 'signin' && (
          <>
            <h3 className={styles.title} id="plaid-demo-title">
              Sign in to {institution}
            </h3>
            <p className="small">
              Plaid connects your account to AltSpot. Your credentials are never shared
              with us. Nothing to type here: the fields are filled in for you.
            </p>

            <div className={styles.field}>
              <span className={styles.label}>Username</span>
              <div className={styles.value}>user_good</div>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Password</span>
              <div className={styles.value}>••••••••••</div>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-gold btn-block"
                data-autofocus
                onClick={() => setStage('connecting')}
              >
                Submit
              </button>
            </div>

            <div className={styles.foot}>
              <p className="tiny">
                Demo item, removed for production. The real flow opens Plaid Link and
                returns a public token the server exchanges for accounts.
              </p>
            </div>
          </>
        )}

        {stage === 'connecting' && (
          <>
            <h3 className={styles.title} id="plaid-demo-title">
              Connecting to {institution}
            </h3>
            <div className={styles.spinner} aria-hidden="true" />
            <p className="small" style={{ textAlign: 'center' }} role="status">
              Verifying credentials and reading your accounts.
            </p>
          </>
        )}

        {(stage === 'accounts' || stage === 'linking') && (
          <>
            <h3 className={styles.title} id="plaid-demo-title">
              Select accounts
            </h3>
            <p className="small">
              Choose the {institution} accounts you want to fund investments from. You
              can link more than one.
            </p>

            <div className={styles.accounts}>
              {DEMO_ACCOUNTS.map((account) => {
                const on = selected.includes(account.id);
                return (
                  <button
                    key={account.id}
                    type="button"
                    className={styles.account}
                    aria-pressed={on}
                    disabled={stage === 'linking'}
                    onClick={() => toggle(account.id)}
                  >
                    <span className={styles.box} aria-hidden="true">
                      {on ? '✓' : ''}
                    </span>
                    <span>
                      <span className={styles.acctName}>{account.name}</span>
                      <span className={styles.acctMeta}>
                        {account.type} ····{account.mask}
                      </span>
                    </span>
                    <span className={styles.balance}>{money(account.balance)}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-gold btn-block"
                data-autofocus
                disabled={selected.length === 0 || stage === 'linking'}
                onClick={connect}
              >
                {stage === 'linking'
                  ? 'Connecting…'
                  : `Continue with ${selected.length} account${
                      selected.length === 1 ? '' : 's'
                    }`}
              </button>
            </div>

            <div className={styles.foot}>
              <p className="tiny">
                Demo item, removed for production. Balances and account numbers are
                fixtures.
              </p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
