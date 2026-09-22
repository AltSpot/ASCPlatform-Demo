'use client';

/**
 * Holdings the member has somewhere else.
 *
 * AltSpot wants to be where a member reads their whole private book. A
 * portfolio page that shows only the deals they happened to buy here is
 * one they check once and then go back to a spreadsheet, and a member
 * who keeps their real allocation picture somewhere else never treats
 * this as their portfolio.
 *
 * SELF-REPORTED, AND SAID SO EVERYWHERE. Every figure on these rows is
 * whatever was typed into this form. There is no administrator behind
 * them, no mark AltSpot can stand behind, and no verification of any
 * kind. So they carry a tag, the section says it in words, and the
 * combined totals above are only shown when the reader has asked for
 * them. Quietly folding unverified numbers into a platform's own
 * performance figures is the single most dishonest thing a portfolio
 * page can do.
 *
 * Vintage is derived from the date the money went in rather than asked
 * for separately, because the two can disagree and the date is the one
 * an IRR needs anyway.
 */
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import Select from '@/components/ui/Select';
import { api } from '@/lib/client/api';
import { dateStr, money } from '@/lib/format';
import { moic } from '@/lib/portfolio-metrics';
import type { ExternalPositionView } from '@/lib/repositories/external';
import { ASSET_CLASS_KEYS, ASSET_CLASSES, INDUSTRIES, INDUSTRY_KEYS } from '@/lib/taxonomy';

import s from './ExternalHoldings.module.css';

/** What the form holds. Strings, because that is what inputs give. */
interface Draft {
  name: string;
  custodian: string;
  assetClass: string;
  industry: string;
  invested: string;
  fairValue: string;
  realized: string;
  investedAt: string;
  note: string;
}

const EMPTY_DRAFT: Draft = {
  name: '',
  custodian: '',
  assetClass: 'venture',
  industry: '',
  invested: '',
  fairValue: '',
  realized: '',
  investedAt: '',
  note: '',
};

function toDraft(position: ExternalPositionView): Draft {
  return {
    name: position.name,
    custodian: position.custodian ?? '',
    assetClass: position.assetClass,
    industry: position.industry ?? '',
    invested: String(position.invested),
    fairValue: String(position.fairValue),
    realized: String(position.realized),
    investedAt: position.investedAt.slice(0, 10),
    note: position.note ?? '',
  };
}

/** Digits only, so the field can be grouped without fighting the caret. */
function digits(value: string): string {
  return value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
}

function grouped(value: string): string {
  return value === '' ? '' : Number(value).toLocaleString('en-US');
}

export default function ExternalHoldings({
  initial,
}: {
  initial: ExternalPositionView[];
}) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function open(position?: ExternalPositionView) {
    setEditing(position?.id ?? null);
    setDraft(position ? toDraft(position) : EMPTY_DRAFT);
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save() {
    if (!draft) return;

    if (!draft.name.trim()) return toast('Give the holding a name');
    if (!draft.invested) return toast('Enter what you invested');
    if (!draft.investedAt) return toast('Enter the date the money went in');

    const input = {
      name: draft.name.trim(),
      custodian: draft.custodian.trim() || null,
      assetClass: draft.assetClass,
      industry: draft.industry || null,
      invested: Number(draft.invested),
      fairValue: Number(draft.fairValue || 0),
      realized: Number(draft.realized || 0),
      investedAt: new Date(`${draft.investedAt}T00:00:00.000Z`).toISOString(),
      /* Marked as of today, because that is when they told us. */
      markedAt: new Date().toISOString(),
      note: draft.note.trim() || null,
    };

    setBusy(true);
    try {
      if (editing) {
        const saved = await api.updateExternalPosition(editing, input);
        setRows((current) => current.map((r) => (r.id === editing ? saved : r)));
        toast('Holding updated');
      } else {
        const saved = await api.addExternalPosition(input);
        setRows((current) => [saved, ...current]);
        toast('Holding added');
      }
      setDraft(null);
      setEditing(null);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not save that');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    setBusy(true);
    try {
      await api.removeExternalPosition(id);
      setRows((current) => current.filter((r) => r.id !== id));
      toast(`${name} removed`);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not remove that');
    } finally {
      setBusy(false);
    }
  }

  const invested = rows.reduce((sum, r) => sum + r.invested, 0);
  const value = rows.reduce((sum, r) => sum + r.fairValue + r.realized, 0);

  return (
    <div className="card">
      <div className={s.head}>
        <div className={s.headText}>
          <span className={s.headNote}>
            Syndicates, funds and direct positions you hold away from AltSpot.
            Figures are yours, not ours: nothing here is verified or marked by
            an administrator, and it is kept out of your AltSpot totals.
          </span>
        </div>

        {draft === null ? (
          <button className="btn btn-ghost btn-sm" onClick={() => open()}>
            <Plus size={14} strokeWidth={1.6} aria-hidden="true" /> Add a holding
          </button>
        ) : null}
      </div>

      {draft !== null ? (
        <div className={s.form}>
          <div className={s.formHead}>
            <b>{editing ? 'Edit holding' : 'Add a holding'}</b>
            <button
              className={s.close}
              aria-label="Cancel"
              onClick={() => {
                setDraft(null);
                setEditing(null);
              }}
            >
              <X size={15} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>

          <div className={s.grid}>
            <label className={s.field}>
              <span>Company or fund</span>
              <input
                className="input"
                value={draft.name}
                placeholder="Northstar Fund III"
                onChange={(e) => set('name', e.target.value)}
              />
            </label>

            <label className={s.field}>
              <span>Where it is held</span>
              <input
                className="input"
                value={draft.custodian}
                placeholder="AngelList, Carta, direct…"
                onChange={(e) => set('custodian', e.target.value)}
              />
            </label>

            <div className={s.field}>
              <span>Asset class</span>
              <Select
                label="Asset class"
                value={draft.assetClass}
                options={ASSET_CLASS_KEYS.map((key) => ({ value: key as string, label: ASSET_CLASSES[key].label }))}
                onChange={(next) => set('assetClass', next)}
              />
            </div>

            <div className={s.field}>
              <span>Industry</span>
              <Select
                label="Industry"
                value={draft.industry || 'none'}
                options={[
                  { value: 'none', label: 'Not specified' },
                  ...INDUSTRY_KEYS.map((key) => ({ value: key as string, label: INDUSTRIES[key] })),
                ]}
                onChange={(next) => set('industry', next === 'none' ? '' : next)}
              />
            </div>

            <label className={s.field}>
              <span>Invested</span>
              <input
                className="input num"
                inputMode="numeric"
                value={grouped(draft.invested)}
                placeholder="50,000"
                onChange={(e) => set('invested', digits(e.target.value))}
              />
            </label>

            <label className={s.field}>
              <span>Date invested</span>
              <input
                className="input"
                type="date"
                value={draft.investedAt}
                onChange={(e) => set('investedAt', e.target.value)}
              />
            </label>

            <label className={s.field}>
              <span>Fair value today</span>
              <input
                className="input num"
                inputMode="numeric"
                value={grouped(draft.fairValue)}
                placeholder="Your latest mark"
                onChange={(e) => set('fairValue', digits(e.target.value))}
              />
            </label>

            <label className={s.field}>
              <span>Distributions received</span>
              <input
                className="input num"
                inputMode="numeric"
                value={grouped(draft.realized)}
                placeholder="0"
                onChange={(e) => set('realized', digits(e.target.value))}
              />
            </label>

            <label className={`${s.field} ${s.wide}`}>
              <span>Note</span>
              <input
                className="input"
                value={draft.note}
                placeholder="Anything you want to remember about it"
                onChange={(e) => set('note', e.target.value)}
              />
            </label>
          </div>

          <div className={s.actions}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add holding'}
            </button>
            <span className={s.actionNote}>
              Stored on your account only. AltSpot does not verify it and never
              shares it.
            </span>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        draft === null ? (
          <p className={s.empty}>
            Nothing added yet. Add what you hold on other platforms and this
            page becomes the whole picture rather than the AltSpot slice of it.
          </p>
        ) : null
      ) : (
        <>
          <ul className={s.rows}>
            {rows.map((row) => {
              const multiple = moic({
                invested: row.invested,
                fairValue: row.fairValue,
                realized: row.realized,
              });

              return (
                <li className={s.row} key={row.id}>
                  <span className={s.who}>
                    <b className={s.name}>{row.name}</b>
                    <span className={s.meta}>
                      {ASSET_CLASSES[row.assetClass as keyof typeof ASSET_CLASSES]
                        ?.label ?? row.assetClass}
                      {row.custodian ? ` · ${row.custodian}` : ''} ·{' '}
                      {new Date(row.investedAt).getUTCFullYear()} vintage
                    </span>
                  </span>

                  <span className={s.figures}>
                    <span className={s.figure}>
                      <span className={s.figureKey}>Invested</span>
                      {money(row.invested)}
                    </span>
                    <span className={s.figure}>
                      <span className={s.figureKey}>Fair value</span>
                      {money(row.fairValue)}
                    </span>
                    <span className={s.figure}>
                      <span className={s.figureKey}>MOIC</span>
                      <b className={multiple && multiple >= 1 ? s.up : s.down}>
                        {multiple === null ? '—' : `${multiple.toFixed(2)}×`}
                      </b>
                    </span>
                  </span>

                  <span className={s.rowActions}>
                    <span className={s.selfTag}>Self-reported</span>
                    <button
                      className={s.iconBtn}
                      aria-label={`Edit ${row.name}`}
                      onClick={() => open(row)}
                    >
                      <Pencil size={14} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                    <button
                      className={s.iconBtn}
                      aria-label={`Remove ${row.name}`}
                      disabled={busy}
                      onClick={() => remove(row.id, row.name)}
                    >
                      <Trash2 size={14} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className={s.total}>
            <span>
              {rows.length} holding{rows.length === 1 ? '' : 's'} elsewhere ·{' '}
              {money(invested)} invested · {money(value)} total value
            </span>
            <span className={s.totalNote}>
              Marked {dateStr(rows[0].markedAt ?? rows[0].investedAt)} or later,
              by you
            </span>
          </div>
        </>
      )}
    </div>
  );
}
