'use client';

/**
 * The first-run walkthrough (Tyler, 2026-09-17): what each part of the
 * platform is, for a member arriving at an empty dashboard.
 *
 * Eight short cards, one idea each, in the order a member meets things:
 * what this is, the dashboard, the marketplace's two lanes, the
 * watchlist, the bell, Spot, docs and profiles, and finally what they
 * want to see. Each card points at the thing it describes when that
 * thing is on screen (a ring around the rail item, the bell or Spot's
 * launcher, found by data-tour) and sits in the middle otherwise.
 *
 * WHEN. The shell offers it (prop) to a member whose questionnaire is
 * approved and who holds no position yet; the browser remembers a
 * finished or skipped tour per device, like the folded sections. `?tour=1`
 * on any portal page replays it, which is what the Settings link does.
 * Nothing here is a control: it explains, and every button in it is a
 * link the rail already has.
 */
import {
  ArrowRight,
  Bell,
  FileText,
  LayoutDashboard,
  Radar,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { openSpot } from '@/lib/spotbot/open';

import s from './FirstRunTour.module.css';

const DONE_KEY = 'asc.tour.v1';

interface Step {
  id: string;
  anchor?: string;
  icon: LucideIcon;
  title: string;
  body: string;
  go?: { href: string; label: string };
  spot?: string;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Two minutes on how AltSpot works.',
    body: 'You are approved. Here is what each part of the platform is, so an empty dashboard is not a mystery. Deals you can join, a Radar you vote on, and a guide named Spot for every term you have not met.',
  },
  {
    id: 'dashboard',
    anchor: 'rail-dashboard',
    icon: LayoutDashboard,
    title: 'Your dashboard.',
    body: 'Anything that needs you sits at the top with its deadline. Under it: what members are paying attention to, what you saved and voted for, and your investments. It fills in as you act.',
  },
  {
    id: 'marketplace',
    anchor: 'rail-marketplace',
    icon: Store,
    title: 'The marketplace has two lanes.',
    body: 'Open now is deals you can join today. Each is its own SPV, your money waits in escrow, and the deal closes when its minimum is met, or your money comes back. Below it is the Radar.',
    go: { href: '/marketplace', label: 'Open the marketplace' },
  },
  {
    id: 'radar',
    anchor: 'rail-marketplace',
    icon: Radar,
    title: 'The Radar is how you steer sourcing.',
    body: 'Vote for a private company you would back and the amount you would consider. A vote moves no money and reserves nothing. The names with the most demand are the ones AltSpot goes after.',
    go: { href: '/marketplace?view=radar', label: 'See the Radar' },
  },
  {
    id: 'watchlist',
    anchor: 'rail-watchlist',
    icon: Star,
    title: 'Watchlist keeps your short list.',
    body: 'Star a deal you are weighing, or vote on a name, and it lands here. One search box adds either. Private to you.',
  },
  {
    id: 'bell',
    anchor: 'bell',
    icon: Bell,
    title: 'The bell follows you.',
    body: 'A commitment with a deadline, a document waiting for your signature, a company you voted for going live: the bell carries them to every page, and the count says how many.',
  },
  {
    id: 'spot',
    anchor: 'spot',
    icon: Sparkles,
    title: 'Spot explains. It never advises.',
    body: 'Press any underlined term, or open Spot from here, and it explains how the thing works, often with a picture. Ask it what escrow is, what an SPV is, or what happens after you sign.',
    spot: 'What is an SPV?',
  },
  {
    id: 'docs',
    anchor: 'rail-docs',
    icon: FileText,
    title: 'Docs and Profiles.',
    body: 'Everything you sign files itself into Docs, and tax forms arrive there each season. Profiles is who you invest as, you, an entity or an IRA, and the Vault that fills every document after you enter it once.',
  },
  {
    id: 'preferences',
    anchor: 'rail-settings',
    icon: SlidersHorizontal,
    title: 'Last thing: what do you want to see?',
    body: 'A minute of optional questions, or one press for everything. It marks the deals that fit you and decides what you hear about. Change it any time in Settings.',
    go: { href: '/preferences', label: 'Set preferences' },
  },
];

interface Ring {
  top: number;
  left: number;
  width: number;
  height: number;
}

function readDone(): boolean {
  try {
    return window.localStorage.getItem(DONE_KEY) === 'done';
  } catch {
    return false;
  }
}

function writeDone(): void {
  try {
    window.localStorage.setItem(DONE_KEY, 'done');
  } catch {
    /* Storage refused. The tour is closed for this visit regardless. */
  }
}

export default function FirstRunTour({ offered }: { offered: boolean }) {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const forced = search?.get('tour') === '1';

  /* Whether to offer it is decided in the browser, where the per-device
     memory is; the server render never opens it, so nothing flashes. */
  const wanted = useSyncExternalStore(
    () => () => {},
    () => forced || (offered && !readDone()),
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const open = wanted && !dismissed;
  const [at, setAt] = useState(0);
  const [ring, setRing] = useState<Ring | null>(null);

  const close = useCallback(() => {
    setDismissed(true);
    writeDone();
    if (forced) router.replace(pathname);
  }, [forced, pathname, router]);

  const step = STEPS[at];

  /* Find the thing this card is about, and ring it. Re-measured on
     resize and when the rail folds, because both move it. */
  useEffect(() => {
    if (!open) return;
    function measure() {
      const el = step.anchor ? document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`) : null;
      if (!el) {
        setRing(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRing({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    measure();
    window.addEventListener('resize', measure);
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-rail'] });
    return () => {
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') setAt((i) => Math.min(STEPS.length - 1, i + 1));
      if (event.key === 'ArrowLeft') setAt((i) => Math.max(0, i - 1));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  const last = at === STEPS.length - 1;
  const Icon = step.icon;

  /* The card sits beside what it rings: right of a rail item, above and
     left of Spot's launcher, in the middle when nothing is ringed. */
  const cardStyle: React.CSSProperties = ring
    ? step.anchor === 'spot'
      ? { right: 24, bottom: Math.max(96, window.innerHeight - ring.top + 16) }
      : { left: ring.left + ring.width + 22, top: Math.max(24, Math.min(ring.top - 18, window.innerHeight - 380)) }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  const advance = () => setAt((i) => Math.min(STEPS.length - 1, i + 1));

  return (
    <div className={s.layer} role="dialog" aria-modal="true" aria-label="Walkthrough">
      {/* The ring is the spotlight: its shadow is the scrim, so the thing
          described is the one lit part of the page. With nothing to ring,
          a plain scrim. */}
      {ring ? (
        <div
          className={s.ring}
          style={{ top: ring.top - 6, left: ring.left - 6, width: ring.width + 12, height: ring.height + 12 }}
          onClick={close}
          aria-hidden="true"
        />
      ) : (
        <div className={s.scrim} onClick={close} />
      )}

      <section className={s.card} style={cardStyle} key={step.id} data-centered={!ring}>
        <div className={s.progress} aria-hidden="true">
          <span style={{ width: `${((at + 1) / STEPS.length) * 100}%` }} />
        </div>
        <button type="button" className={s.close} onClick={close} aria-label="Skip the walkthrough">
          <X size={16} strokeWidth={1.6} aria-hidden="true" />
        </button>

        <span className={s.glyph} aria-hidden="true">
          <Icon size={20} strokeWidth={1.6} />
        </span>
        <p className={s.count}>
          {at + 1} of {STEPS.length}
        </p>
        <h2 className={s.title}>{step.title}</h2>
        <p className={s.body}>{step.body}</p>

        {at === 0 ? (
          <ul className={s.agenda} aria-label="What the walkthrough covers">
            {STEPS.slice(1).map((x) => (
              <li key={x.id}>
                <x.icon size={13} strokeWidth={1.7} aria-hidden="true" />
                {x.title.replace(/\.$/, '')}
              </li>
            ))}
          </ul>
        ) : null}

        <div className={s.actions}>
          {step.spot ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                close();
                openSpot(step.spot);
              }}
            >
              Try it
            </button>
          ) : null}
          {/* Going there keeps the tour running: the shell does not remount
              on a client navigation, so the next card is waiting on the
              next page. */}
          {step.go ? (
            <Link className="btn btn-ghost btn-sm" href={step.go.href} onClick={advance}>
              {step.go.label}
            </Link>
          ) : null}
          <span className={s.spacer} />
          {at > 0 ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setAt(at - 1)}>
              Back
            </button>
          ) : null}
          {last ? (
            <button type="button" className="btn btn-gold btn-sm" onClick={close}>
              Done
            </button>
          ) : (
            <button type="button" className="btn btn-gold btn-sm" onClick={advance}>
              {at === 0 ? 'Show me' : 'Next'}
              <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
        </div>

        <p className={s.hint}>
          <kbd>→</kbd> next <kbd>←</kbd> back <kbd>Esc</kbd> skip
        </p>
      </section>
    </div>
  );
}
