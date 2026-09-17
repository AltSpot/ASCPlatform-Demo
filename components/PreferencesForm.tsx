'use client';

/**
 * Deal preferences: as quick as it can be. Rules in lib/preferences.ts.
 *
 * DESIGN (2026-09-17: "less text, icons, extremely easy"). It opens on one
 * choice, Everything or Tune it; Everything saves in one press. Tune it
 * shows six numbered questions as panes, each a title, one short line and
 * a set of icon chips: nothing to type, nothing required, a question left
 * alone means any. Asset class, stage, who leads and check size sit two by
 * two; industry, the longest, gets the full width. A bar pinned to the
 * bottom counts what is answered and holds the one button.
 */
import {
  Bell,
  Check,
  CircleDollarSign,
  Factory,
  Layers,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import AssetClassIcon from '@/components/AssetClassIcon';
import SliceIcon from '@/components/SliceIcon';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { LEAD_FILTER_LABEL, STAGE_KEYS, STAGE_LABEL } from '@/lib/explore';
import type { LeadType } from '@/lib/funding';
import { CHECK_SIZES, EVERYTHING, type CheckSize, type Preferences } from '@/lib/preferences';
import { ASSET_CLASSES, INDUSTRIES, type AssetClass, type Industry } from '@/lib/taxonomy';

import s from './PreferencesForm.module.css';

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

interface Option<T extends string> {
  key: T;
  label: string;
  icon: ReactNode;
}

function Question<T extends string>({
  n,
  icon: Icon,
  title,
  hint,
  options,
  selected,
  onToggle,
  onClear,
  wide = false,
}: {
  n: number;
  icon: LucideIcon;
  title: string;
  hint: string;
  options: Option<T>[];
  selected: T[];
  onToggle: (key: T) => void;
  onClear: () => void;
  wide?: boolean;
}) {
  const answered = selected.length > 0;
  return (
    <fieldset className={s.question} data-wide={wide} data-answered={answered}>
      <legend className={s.qHead}>
        <span className={s.qNum} aria-hidden="true">
          {answered ? <Check size={13} strokeWidth={2.4} /> : n}
        </span>
        <Icon className={s.qIcon} size={17} strokeWidth={1.6} aria-hidden="true" />
        <span className={s.qTitle}>{title}</span>
        {answered ? (
          <button type="button" className={s.any} onClick={onClear}>
            Any
          </button>
        ) : (
          <span className={s.anyNote}>Any</span>
        )}
      </legend>
      <p className={s.qHint}>{hint}</p>
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
              <span className={s.chipIcon}>{o.icon}</span>
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
            <b>Preferences saved.</b> Deals that fit are marked For you.
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

  const answered = [
    prefs.assetClasses.length,
    prefs.industries.length,
    prefs.stages.length,
    prefs.leads.length,
    prefs.checkSize ? 1 : 0,
  ].filter(Boolean).length;

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
          <span className={s.choiceIcon}>
            <Sparkles size={20} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className={s.choiceText}>
            <b>Show me everything</b>
            <span>One tap. Narrow it any time.</span>
          </span>
        </button>
        <button
          type="button"
          className={s.choice}
          data-on={mode === 'tune'}
          onClick={() => setMode('tune')}
          disabled={busy}
        >
          <span className={s.choiceIcon}>
            <SlidersHorizontal size={20} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className={s.choiceText}>
            <b>Tune what I see</b>
            <span>Tap what you like. Skip the rest.</span>
          </span>
        </button>
      </div>

      {mode === 'tune' ? (
        <div className={s.tune}>
          <div className={s.grid}>
            <Question<AssetClass>
              n={1}
              icon={Layers}
              title="Asset class"
              hint="What kind of deal."
              options={(Object.keys(ASSET_CLASSES) as AssetClass[]).map((key) => ({
                key,
                label: ASSET_CLASSES[key].label,
                icon: <AssetClassIcon assetClass={key} size={12} />,
              }))}
              selected={prefs.assetClasses}
              onToggle={(k) => set({ assetClasses: toggle(prefs.assetClasses, k) })}
              onClear={() => set({ assetClasses: [] })}
            />
            <Question
              n={2}
              icon={TrendingUp}
              title="Stage"
              hint="How far along the company is."
              options={STAGE_KEYS.map((key) => ({
                key,
                label: STAGE_LABEL[key],
                icon: <SliceIcon slice={key} size={14} />,
              }))}
              selected={prefs.stages}
              onToggle={(k) => set({ stages: toggle(prefs.stages, k) })}
              onClear={() => set({ stages: [] })}
            />
            <Question<Industry>
              n={3}
              icon={Factory}
              title="Industry"
              hint="Sectors you know or want to back."
              wide
              options={(Object.keys(INDUSTRIES) as Industry[]).map((key) => ({
                key,
                label: INDUSTRIES[key],
                icon: <SliceIcon slice={key} size={14} />,
              }))}
              selected={prefs.industries}
              onToggle={(k) => set({ industries: toggle(prefs.industries, k) })}
              onClear={() => set({ industries: [] })}
            />
            <Question<LeadType>
              n={4}
              icon={Users}
              title="Who leads"
              hint="AltSpot, or a vetted partner."
              options={(Object.keys(LEAD_FILTER_LABEL) as LeadType[]).map((key) => ({
                key,
                label: LEAD_FILTER_LABEL[key],
                icon: <SliceIcon slice={key} size={14} />,
              }))}
              selected={prefs.leads}
              onToggle={(k) => set({ leads: toggle(prefs.leads, k) })}
              onClear={() => set({ leads: [] })}
            />
            <Question<CheckSize>
              n={5}
              icon={CircleDollarSign}
              title="Typical check"
              hint="Pick one."
              options={(Object.keys(CHECK_SIZES) as CheckSize[]).map((key) => ({
                key,
                label: CHECK_SIZES[key].label,
                icon: <SliceIcon slice={key} size={14} />,
              }))}
              selected={prefs.checkSize ? [prefs.checkSize] : []}
              onToggle={(k) => set({ checkSize: prefs.checkSize === k ? null : k })}
              onClear={() => set({ checkSize: null })}
            />
          </div>

          <label className={s.notify}>
            <span className={s.switch} data-on={prefs.notifyMatches}>
              <input
                type="checkbox"
                checked={prefs.notifyMatches}
                onChange={(e) => set({ notifyMatches: e.target.checked })}
              />
              <span className={s.knob} aria-hidden="true" />
            </span>
            <Bell size={16} strokeWidth={1.6} aria-hidden="true" />
            <span>Tell me when a deal that fits opens</span>
          </label>

          <div className={s.bar}>
            <span className={s.progress}>
              <span className={s.progressTrack} aria-hidden="true">
                <span style={{ width: `${(answered / 5) * 100}%` }} />
              </span>
              {answered === 0 ? 'Nothing narrowed yet' : `${answered} of 5 narrowed`}
            </span>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => save({ ...prefs, showEverything: false })}
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Save preferences'}
            </button>
          </div>
          <p className={s.note}>Every deal you are eligible for stays on the marketplace.</p>
        </div>
      ) : null}
    </div>
  );
}
