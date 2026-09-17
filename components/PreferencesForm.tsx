'use client';

/**
 * Deal preferences: as quick as it can be. Rules in lib/preferences.ts.
 *
 * DESIGN (2026-09-17: "less text, icons, extremely easy"; then "make the
 * umbrella obvious, less orange, show me it saved"). Step one is one
 * card that asks the question and holds the two ways to answer it:
 * Everything saves in one press; Tune it opens step two, five numbered
 * questions as panes, each a title, one short line and a set of icon
 * chips. Nothing to type, nothing required, a question left alone means
 * any. Gold is a line and a glyph here, not a fill: the chosen choice and
 * the chosen chips wear a gold ring, and the one gradient on the page is
 * the progress bar. Saving does not send the member away: the form is
 * replaced by a confirmation that says what was saved and offers the two
 * places to go next.
 */
import {
  Bell,
  Check,
  CircleCheck,
  CircleDollarSign,
  Factory,
  Layers,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type ReactNode } from 'react';

import AssetClassIcon from '@/components/AssetClassIcon';
import SliceIcon from '@/components/SliceIcon';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { LEAD_FILTER_LABEL, STAGE_KEYS, STAGE_LABEL } from '@/lib/explore';
import type { LeadType } from '@/lib/funding';
import {
  CHECK_SIZES,
  EVERYTHING,
  isOpenToEverything,
  summarize,
  type CheckSize,
  type Preferences,
} from '@/lib/preferences';
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
  const titleId = useId();
  return (
    <section
      role="group"
      aria-labelledby={titleId}
      className={s.question}
      data-wide={wide}
      data-answered={answered}
    >
      <div className={s.qHead}>
        <span className={s.qNum} aria-hidden="true">
          {answered ? <Check size={13} strokeWidth={2.4} /> : n}
        </span>
        <Icon className={s.qIcon} size={17} strokeWidth={1.6} aria-hidden="true" />
        <span className={s.qTitle} id={titleId}>
          {title}
        </span>
        {answered ? (
          <button type="button" className={s.any} onClick={onClear}>
            Any
          </button>
        ) : (
          <span className={s.anyNote}>Any</span>
        )}
      </div>
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
    </section>
  );
}

/** The words for a saved set, from the same labels the chips use. */
function words(p: Preferences): string {
  return summarize(p, {
    assetClass: (k) => ASSET_CLASSES[k].label,
    industry: (k) => INDUSTRIES[k],
    stage: (k) => STAGE_LABEL[k],
    lead: (k) => LEAD_FILTER_LABEL[k],
  });
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
  const [mode, setMode] = useState<'choose' | 'tune' | 'saved'>(
    initial && !initial.showEverything ? 'tune' : 'choose',
  );
  const [saved, setSaved] = useState<Preferences | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(next: Preferences) {
    if (busy) return;
    setBusy(true);
    try {
      await api.savePreferences(next);
      setSaved(next);
      setPrefs(next);
      setMode('saved');
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
      /* The dashboard card and the Settings summary read the new answer
         on their next render; refresh so going back shows it. */
      router.refresh();
    } catch {
      toast('Those did not save. Try again.');
    } finally {
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

  if (mode === 'saved' && saved) {
    const everything = isOpenToEverything(saved);
    return (
      <section className={s.saved} aria-live="polite" aria-label="Preferences saved">
        <span className={s.savedMark} aria-hidden="true">
          <CircleCheck size={24} strokeWidth={1.7} />
        </span>
        <h2 className={s.savedTitle}>
          {everything ? 'Saved. You will see everything.' : 'Saved. Deals that fit are marked For you.'}
        </h2>
        <p className={s.savedLine}>
          {everything
            ? 'Every deal you are eligible for stays on the marketplace, with nothing marked ahead of the rest. Narrow it any time from Settings.'
            : `You asked for: ${words(saved)} Every deal you are eligible for stays on the marketplace; the ones that fit carry a For you mark, and ${saved.notifyMatches ? 'you will hear when one opens' : 'you chose not to be told when one opens'}.`}
        </p>
        <div className={s.savedActions}>
          <Link className="btn btn-gold" href="/marketplace">
            See the marketplace →
          </Link>
          <Link className="btn btn-ghost" href={returnTo}>
            {returnTo === '/settings' ? 'Back to Settings' : 'Back to your dashboard'}
          </Link>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setMode(everything ? 'choose' : 'tune')}
          >
            Change it
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={s.form}>
      <div className={s.umbrella}>
        <span className={s.stepLabel}>
          <span className={s.stepNum} aria-hidden="true">
            1
          </span>
          Pick one
        </span>
        <h2 className={s.umbrellaTitle}>How do you want to see deals?</h2>
        <div className={s.choices} role="radiogroup" aria-label="How do you want to see deals">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'choose' && initial?.showEverything === true}
            className={s.choice}
            data-on={mode === 'choose' && initial?.showEverything === true}
            onClick={() => save({ ...EVERYTHING, notifyMatches: prefs.notifyMatches })}
            disabled={busy}
          >
            <span className={s.choiceIcon}>
              <Sparkles size={20} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className={s.choiceText}>
              <b>Show me everything</b>
              <span>One press, done. Narrow it any time.</span>
            </span>
            <span className={s.choiceCheck} aria-hidden="true">
              <Check size={12} strokeWidth={2.6} />
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'tune'}
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
              <span>Five quick questions. Skip any of them.</span>
            </span>
            <span className={s.choiceCheck} aria-hidden="true">
              <Check size={12} strokeWidth={2.6} />
            </span>
          </button>
        </div>
      </div>

      {mode === 'tune' ? (
        <div className={s.tune}>
          <span className={s.stepLabel}>
            <span className={s.stepNum} aria-hidden="true">
              2
            </span>
            Tune it. Everything is optional.
          </span>
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
