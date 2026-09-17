'use client';

/**
 * Deal preferences: as quick as it can be. Rules in lib/preferences.ts.
 *
 * It opens on one choice, Everything or Tune it. Everything saves in one
 * press. Tune it opens six short rows of chips, every one optional, with
 * nothing typed anywhere. A row left alone means any.
 */
import { Check, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { LEAD_FILTER_LABEL, STAGE_KEYS, STAGE_LABEL } from '@/lib/explore';
import type { LeadType } from '@/lib/funding';
import {
  CHECK_SIZES,
  EVERYTHING,
  type CheckSize,
  type Preferences,
} from '@/lib/preferences';
import { ASSET_CLASSES, INDUSTRIES, type AssetClass, type Industry } from '@/lib/taxonomy';

import s from './PreferencesForm.module.css';

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function Row<T extends string>({
  title,
  hint,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  options: { key: T; label: string }[];
  selected: T[];
  onToggle: (key: T) => void;
}) {
  return (
    <fieldset className={s.row}>
      <legend className={s.rowHead}>
        <span className={s.rowTitle}>{title}</span>
        <span className={s.rowHint}>{selected.length === 0 ? 'Any' : hint}</span>
      </legend>
      <div className={s.chips}>
        {options.map((o) => {
          const on = selected.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              className={s.chip}
              aria-pressed={on}
              onClick={() => onToggle(o.key)}
            >
              {on ? <Check size={12} strokeWidth={2.2} aria-hidden="true" /> : null}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function PreferencesForm({
  initial,
  returnTo = '/dashboard',
}: {
  initial: Preferences | null;
  returnTo?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [prefs, setPrefs] = useState<Preferences>(
    initial ?? { ...EVERYTHING, showEverything: false },
  );
  const [mode, setMode] = useState<'choose' | 'tune'>(
    initial && !initial.showEverything ? 'tune' : 'choose',
  );
  const [busy, setBusy] = useState(false);

  async function save(next: Preferences) {
    if (busy) return;
    setBusy(true);
    try {
      await api.savePreferences(next);
      toast(
        next.showEverything ? (
          <>
            <b>Saved.</b> You will see everything.
          </>
        ) : (
          <>
            <b>Preferences saved.</b> Matching deals are marked for you.
          </>
        ),
      );
      router.push(returnTo);
      router.refresh();
    } catch {
      toast('Those did not save. Try again.');
      setBusy(false);
    }
  }

  const set = (patch: Partial<Preferences>) => setPrefs((p) => ({ ...p, ...patch }));

  return (
    <div className={s.form}>
      <div className={s.choices}>
        <button
          type="button"
          className={s.choice}
          data-on={initial?.showEverything === true}
          onClick={() => save({ ...EVERYTHING, notifyMatches: prefs.notifyMatches })}
          disabled={busy}
        >
          <Sparkles size={18} strokeWidth={1.6} aria-hidden="true" />
          <b>Show me everything</b>
          <span>Every deal, every class. You can narrow it later.</span>
        </button>
        <button
          type="button"
          className={s.choice}
          data-on={mode === 'tune'}
          onClick={() => setMode('tune')}
          disabled={busy}
        >
          <SlidersHorizontal size={18} strokeWidth={1.6} aria-hidden="true" />
          <b>Tune what I see</b>
          <span>Six quick taps. Skip any you do not care about.</span>
        </button>
      </div>

      {mode === 'tune' ? (
        <>
          <Row<AssetClass>
            title="Asset class"
            hint={`${prefs.assetClasses.length} chosen`}
            options={(Object.keys(ASSET_CLASSES) as AssetClass[]).map((key) => ({ key, label: ASSET_CLASSES[key].label }))}
            selected={prefs.assetClasses}
            onToggle={(k) => set({ assetClasses: toggle(prefs.assetClasses, k) })}
          />
          <Row<Industry>
            title="Industry"
            hint={`${prefs.industries.length} chosen`}
            options={(Object.keys(INDUSTRIES) as Industry[]).map((key) => ({ key, label: INDUSTRIES[key] }))}
            selected={prefs.industries}
            onToggle={(k) => set({ industries: toggle(prefs.industries, k) })}
          />
          <Row
            title="Stage"
            hint={`${prefs.stages.length} chosen`}
            options={STAGE_KEYS.map((key) => ({ key, label: STAGE_LABEL[key] }))}
            selected={prefs.stages}
            onToggle={(k) => set({ stages: toggle(prefs.stages, k) })}
          />
          <Row<LeadType>
            title="Who leads"
            hint={`${prefs.leads.length} chosen`}
            options={(Object.keys(LEAD_FILTER_LABEL) as LeadType[]).map((key) => ({ key, label: LEAD_FILTER_LABEL[key] }))}
            selected={prefs.leads}
            onToggle={(k) => set({ leads: toggle(prefs.leads, k) })}
          />
          <Row<CheckSize>
            title="Typical check"
            hint="One choice"
            options={(Object.keys(CHECK_SIZES) as CheckSize[]).map((key) => ({ key, label: CHECK_SIZES[key].label }))}
            selected={prefs.checkSize ? [prefs.checkSize] : []}
            onToggle={(k) => set({ checkSize: prefs.checkSize === k ? null : k })}
          />

          <label className={s.notify}>
            <input
              type="checkbox"
              checked={prefs.notifyMatches}
              onChange={(e) => set({ notifyMatches: e.target.checked })}
            />
            <span>Tell me when a deal that matches opens</span>
          </label>

          <div className={s.actions}>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => save({ ...prefs, showEverything: false })}
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Save preferences'}
            </button>
            <p className={s.note}>
              Preferences decide what is marked for you and what you hear about. Every deal you
              are eligible for stays on the marketplace.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
