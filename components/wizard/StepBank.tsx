'use client';

/**
 * Step 5 — link a funding source. Optional; it can also be linked at the
 * first funding. Production runs this through Plaid, so credentials never
 * touch AltSpot.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { PARTNERS } from '@/lib/config';
import type { WizardView } from '@/lib/domain';

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

  const [selected, setSelected] = useState<string | null>(null);
  const [linkedLabel, setLinkedLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function link(institution: string) {
    if (busy) return;
    setBusy(true);
    setSelected(institution);

    try {
      const bank = await api.linkBank(institution);
      setLinkedLabel(`${bank.institution} — checking ····${bank.mask} linked`);
    } catch {
      toast('Could not link that account — try again.');
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    try {
      const next = await api.wizard();
      onComplete(next);
    } catch {
      toast('Could not save — continuing.');
      onSkip();
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
        every deal — funding a commitment later takes one click. In production this runs
        through <b style={{ color: 'var(--gold-bright)' }}>{PARTNERS.banking}</b>;
        credentials never touch AltSpot.
      </p>

      <div className="choice-grid" style={{ marginBottom: 18 }}>
        {BANKS.map((bank) => (
          <div
            key={bank.name}
            className={selected === bank.name ? 'choice sel' : 'choice'}
            onClick={() => link(bank.name)}
          >
            <b>{bank.name}</b>
            <span>{bank.blurb}</span>
          </div>
        ))}
      </div>

      {linkedLabel && (
        <div className="chip good" style={{ marginBottom: 16 }}>
          <span className="dot" /> {linkedLabel}
        </div>
      )}

      <div className="wiz-actions">
        <button className="btn btn-gold" disabled={!linkedLabel} onClick={finish}>
          Finish setup
        </button>
        <button className="skip" onClick={onSkip}>
          Link at first funding instead
        </button>
      </div>
    </>
  );
}
