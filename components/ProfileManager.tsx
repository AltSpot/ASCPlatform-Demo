'use client';

/**
 * Investment profiles and the Vault. Exactly one profile is the checkout
 * default; selecting another moves it.
 */
import Link from 'next/link';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import type { BankView, ProfileView, VaultView } from '@/lib/domain';
import { EMPTY, maskTin } from '@/lib/format';

export default function ProfileManager({
  userName,
  initialProfiles,
  vault,
  bank,
}: {
  userName: string;
  initialProfiles: ProfileView[];
  vault: VaultView;
  bank: BankView | null;
}) {
  const toast = useToast();

  const [profiles, setProfiles] = useState(initialProfiles);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ type: 'Personal', name: '' });
  const [busy, setBusy] = useState(false);

  async function create() {
    if (busy) return;
    setBusy(true);
    try {
      const created = await api.createProfile({
        type: draft.type,
        name: draft.name.trim() || `${userName} · ${draft.type}`,
      });
      setProfiles((list) => [...list, created]);
      setAdding(false);
      setDraft({ type: 'Personal', name: '' });
      toast('Profile created.');
    } catch {
      toast('Could not create that profile.');
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(id: string) {
    if (busy) return;
    setBusy(true);

    const previous = profiles;
    setProfiles((list) => list.map((p) => ({ ...p, isDefault: p.id === id })));

    try {
      await api.setDefaultProfile(id);
      toast('Default profile updated.');
    } catch {
      setProfiles(previous);
      toast('Could not update the default profile.');
    } finally {
      setBusy(false);
    }
  }

  const vaultName = [vault.first, vault.last].filter(Boolean).join(' ');
  const address = [vault.street, vault.city, vault.state, vault.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <div className="card" style={{ marginBottom: 22 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <h3>Investment profiles</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding((v) => !v)}>
            + Add profile
          </button>
        </div>

        {adding && (
          <div style={{ marginBottom: 16 }}>
            <div className="form-row">
              <label className="field">
                <span>Type</span>
                <select
                  className="input"
                  value={draft.type}
                  onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                >
                  <option>Personal</option>
                  <option>Entity</option>
                  <option>IRA / 401(k)</option>
                </select>
              </label>
              <label className="field">
                <span>Name</span>
                <input
                  className="input"
                  placeholder="e.g. Hale Family Trust"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </label>
            </div>
            <button className="btn btn-gold btn-sm" onClick={create} disabled={busy}>
              Create profile
            </button>
          </div>
        )}

        <div className="choice-grid">
          {profiles.length === 0 ? (
            <div className="dz" style={{ cursor: 'default', gridColumn: '1/-1' }}>
              <b style={{ color: 'var(--paper)' }}>No investment profiles yet</b>
              <br />
              <span className="tiny">
                Create one here or during your first investment.
              </span>
            </div>
          ) : (
            profiles.map((p) => (
              <div
                key={p.id}
                className={p.isDefault ? 'choice sel' : 'choice'}
                onClick={() => !p.isDefault && makeDefault(p.id)}
              >
                <b>{p.name}</b>
                <span>
                  {p.type}
                  {p.isDefault
                    ? ' · default, used at checkout unless you choose another'
                    : ' · tap to make default'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <h3>The Vault: saved information</h3>
          <Link className="btn btn-quiet btn-sm" href="/wizard?step=2">
            Edit
          </Link>
        </div>
        <p className="small" style={{ marginBottom: 14 }}>
          This is what fills your subscription documents automatically.
        </p>

        <VaultRow label="Legal name" value={vaultName} />
        <VaultRow label="Tax classification" value={vault.taxClass} />
        <VaultRow label="Address" value={address} />
        <VaultRow
          label="Taxpayer ID"
          value={vault.tinLast4 ? maskTin(vault.tinLast4) : null}
        />
        <div className="fee-row">
          <span className="l">Linked bank</span>
          <span className="r">
            {bank ? (
              `${bank.institution} ····${bank.mask}`
            ) : (
              <Link href="/wizard?step=5">Link →</Link>
            )}
          </span>
        </div>
      </div>
    </>
  );
}

function VaultRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="fee-row">
      <span className="l">{label}</span>
      <span className="r">
        {value ? value : <span style={{ color: 'var(--dim)' }}>{EMPTY}</span>}
      </span>
    </div>
  );
}
