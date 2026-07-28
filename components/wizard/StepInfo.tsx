'use client';

/**
 * Step 2 — the Vault. Standard W-9 details captured once; every
 * subscription document pre-fills from here afterwards.
 *
 * The taxpayer ID never leaves this form intact: the server keeps the
 * last four digits and a surrogate token, nothing more.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import type { VaultView, WizardView } from '@/lib/domain';

const TAX_CLASSES = [
  'Individual / sole proprietor',
  'Trust / estate',
  'LLC (single member)',
  'LLC (partnership)',
  'C corporation',
  'S corporation',
];

export default function StepInfo({
  vault,
  onComplete,
}: {
  vault: VaultView;
  onComplete: (next: WizardView) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    first: vault.first ?? '',
    last: vault.last ?? '',
    taxClass: vault.taxClass ?? TAX_CLASSES[0],
    street: vault.street ?? '',
    city: vault.city ?? '',
    state: vault.state ?? '',
    zip: vault.zip ?? '',
    tin: '',
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      await api.saveVault(form);
      const next = await api.wizard();
      toast('Saved. Your documents will now pre-fill themselves.');
      onComplete(next);
    } catch {
      toast('Could not save your information. Check the fields and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="eyebrow">Step 2 of 5</div>
      <h2 className="display" style={{ margin: '10px 0 12px' }}>
        Your information
      </h2>
      <p className="sub" style={{ marginBottom: 24 }}>
        Standard W-9 details, captured once. This becomes your saved profile. It
        pre-fills every subscription document, so you never re-type it.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Identity
          </div>
          <div className="form-row">
            <label className="field">
              <span>Legal first name</span>
              <input
                className="input"
                value={form.first}
                onChange={(e) => set('first')(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Legal last name</span>
              <input
                className="input"
                value={form.last}
                onChange={(e) => set('last')(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>Federal tax classification</span>
            <select
              className="input"
              value={form.taxClass}
              onChange={(e) => set('taxClass')(e.target.value)}
            >
              {TAX_CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Address
          </div>
          <label className="field">
            <span>Street address</span>
            <input
              className="input"
              value={form.street}
              onChange={(e) => set('street')(e.target.value)}
              required
            />
          </label>
          <div className="form-row">
            <label className="field">
              <span>City</span>
              <input
                className="input"
                value={form.city}
                onChange={(e) => set('city')(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>State &nbsp;/&nbsp; ZIP</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  className="input"
                  placeholder="CA"
                  value={form.state}
                  onChange={(e) => set('state')(e.target.value)}
                  required
                />
                <input
                  className="input"
                  placeholder="91506"
                  value={form.zip}
                  onChange={(e) => set('zip')(e.target.value)}
                  required
                />
              </div>
            </label>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Taxpayer identification
          </div>
          <label className="field">
            <span>SSN or EIN</span>
            <input
              className="input"
              placeholder="Demo mode, enter anything, e.g. 000-00-0000"
              value={form.tin}
              onChange={(e) => set('tin')(e.target.value)}
              required
            />
          </label>
          <div className="demo-note">
            Demo environment. Never enter a real SSN or EIN here. Only the last four
            digits are stored; production uses tokenized, encrypted capture.
          </div>
        </div>

        <div className="wiz-actions">
          <button className="btn btn-gold" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </form>
    </>
  );
}
