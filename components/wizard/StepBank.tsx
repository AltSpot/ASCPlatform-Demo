'use client';

/**
 * Step 5 — link a funding source. Optional; it can also be linked at the
 * first funding. Production runs this through Plaid, so credentials never
 * touch AltSpot. The modal here is the demo stand-in for Plaid Link.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';
import type { BankView, WizardView } from '@/lib/domain';

import PlaidDemoModal from './PlaidDemoModal';
import type { PlaidDemoAccount } from './PlaidDemoModal';

const BANKS = [
  { name: 'Chase', blurb: 'Checking · savings' },
  { name: 'Bank of America', blurb: 'Checking · savings' },
  { name: 'Wells Fargo', blurb: 'Checking · savings' },
  { name: 'Charles Schwab', blurb: 'Brokerage-linked' },
  { name: 'Mercury', blurb: 'Business checking' },
  { name: 'Other bank', blurb: '11,000+ institutions' },
];

export default function StepBank({
  onComplete,
  onSkip,
}: {
  onComplete: (next: WizardView) => void;
  onSkip: () => void;
}) {
  const toast = useToast();

  const [selected, setSelected] = useState<string>(BANKS[0].name);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linked, setLinked] = useState<BankView[]>([]);
  const [busy, setBusy] = useState(false);

  /**
   * The modal hands back exactly what Plaid Link would: the institution
   * and the accounts the investor picked. The first one becomes the
   * default funding source.
   */
  async function connect(accounts: PlaidDemoAccount[]) {
    let rows: BankView[];
    try {
      rows = await api.linkBank(
        selected,
        accounts.map((account) => ({ mask: account.mask, type: account.type })),
      );
    } catch (error) {
      toast('Could not link those accounts. Try again.');
      // Rethrow so the modal returns to the selection step rather than
      // closing on a failure.
      throw error;
    }

    setLinked(rows);
    setLinkOpen(false);
    toast(
      <>
        <b>{selected} connected.</b> {rows.length} account
        {rows.length === 1 ? '' : 's'} linked.
      </>,
    );
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      onComplete(await api.wizard());
    } catch {
      toast('Could not save. Continuing.');
      onSkip();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="eyebrow">Step 5 of 5 · Optional for now</div>
      <h2 className="display" style={{ margin: '10px 0 12px' }}>
        Link your bank
      </h2>
      <p className="sub" style={{ marginBottom: 24 }}>
        Connect the account you&rsquo;ll fund investments from. Saved once, reused on
        every deal, so funding a commitment later takes one click. This runs through{' '}
        <b style={{ color: 'var(--orange-b)' }}>{PARTNERS.banking}</b>; credentials never
        touch AltSpot.
      </p>

      <div className="kicker" style={{ marginBottom: 10 }}>
        Choose your institution
      </div>
      <div className="choice-grid" style={{ marginBottom: 18 }}>
        {BANKS.map((bank) => (
          <div
            key={bank.name}
            className={selected === bank.name ? 'choice sel' : 'choice'}
            role="button"
            tabIndex={0}
            aria-pressed={selected === bank.name}
            onClick={() => setSelected(bank.name)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelected(bank.name);
              }
            }}
          >
            <b>{bank.name}</b>
            <span>{bank.blurb}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <button className="btn btn-gold" onClick={() => setLinkOpen(true)}>
          Link with {PARTNERS.banking}
        </button>
        <span className="demo-tag">
          <span className="dot" /> Demo · simulated Plaid
        </span>
      </div>

      {linked.length > 0 && (
        <div
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}
        >
          {linked.map((account, index) => (
            <span className="chip good" key={account.id}>
              <span className="dot" /> {account.institution} · {account.type} ····
              {account.mask}
              {index === 0 ? ' · default' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="wiz-actions">
        <button
          className="btn btn-gold"
          disabled={linked.length === 0 || busy}
          onClick={finish}
        >
          Finish setup
        </button>
        <button className="skip" onClick={onSkip}>
          Link at first funding instead
        </button>
      </div>

      {linkOpen && (
        <PlaidDemoModal
          institution={selected}
          onClose={() => setLinkOpen(false)}
          onConnect={connect}
        />
      )}
    </>
  );
}
