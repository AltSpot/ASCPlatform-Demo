'use client';

/**
 * Step 4 — the first investment profile: the entity investments are held
 * under. Optional here, because one can also be created at checkout.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import type { VaultView, WizardView } from '@/lib/domain';

const TYPES = [
  {
    type: 'Personal',
    blurb: 'Invest as an individual under your own name and SSN.',
  },
  { type: 'Entity', blurb: 'An LLC, trust, or corporation you control.' },
  {
    type: 'IRA / 401(k)',
    blurb: 'Eligible retirement capital via a self-directed custodian.',
  },
];

export default function StepProfile({
  userName,
  vault,
  onComplete,
  onSkip,
}: {
  userName: string;
  vault: VaultView;
  onComplete: (next: WizardView) => void;
  onSkip: () => void;
}) {
  const toast = useToast();

  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const baseName =
    vault.first && vault.last ? `${vault.first} ${vault.last}` : userName;

  function choose(type: string) {
    setSelected(type);
    setName(`${baseName} — ${type}`);
  }

  async function create() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await api.createProfile({
        type: selected,
        name: name.trim() || `${baseName} — ${selected}`,
      });
      const next = await api.wizard();
      toast('Investment profile created.');
      onComplete(next);
    } catch {
      toast('Could not create that profile — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="eyebrow">Step 4 of 5 · Optional for now</div>
      <h2 className="display" style={{ margin: '10px 0 12px' }}>
        Your first investment profile
      </h2>
      <p className="sub" style={{ marginBottom: 24 }}>
        An investment profile is the entity your investments are held under. You can
        create several over time — personal, an LLC or trust, a self-directed IRA — and
        choose between them at checkout.
      </p>

      <div className="choice-grid" style={{ marginBottom: 18 }}>
        {TYPES.map((t) => (
          <div
            key={t.type}
            className={selected === t.type ? 'choice sel' : 'choice'}
            onClick={() => choose(t.type)}
          >
            <b>{t.type}</b>
            <span>{t.blurb}</span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card" style={{ marginBottom: 16 }}>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Profile name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${baseName} — Personal`}
            />
          </label>
        </div>
      )}

      <div className="wiz-actions">
        <button className="btn btn-gold" disabled={!selected || busy} onClick={create}>
          Create profile &amp; continue
        </button>
        <button className="skip" onClick={onSkip}>
          Finish this later
        </button>
      </div>
    </>
  );
}
