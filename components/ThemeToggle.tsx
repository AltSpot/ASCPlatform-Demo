'use client';

/**
 * Ember, Ice or Daylight, as a segmented pill on the rail.
 *
 * Ice (2026-09-17) is the ember canvas with clear, icy glass panes on it.
 * Three segments share the rail's width, so only the lit one carries its
 * word; the other two are their glyph, with the name on hover and for
 * screen readers.
 *
 * TWO BUTTONS RATHER THAN ONE. A single toggle has to choose between
 * showing the theme you are in and showing the theme you would get,
 * and whichever it picks half the people read it the other way. Two
 * segments with one lit says both at once, and on a call nobody has to
 * explain which way it goes.
 *
 * THE ATTRIBUTE IS THE TRUTH, not storage and not React state. This is
 * the same arrangement the rail's collapse uses and for the same
 * reason: the blocking script in app/layout.tsx sets data-theme before
 * hydration, so by the time this mounts the page may already be light
 * while React's first render believed otherwise. Reading storage in the
 * snapshot does not fix it, because the value is right and React never
 * re-reads it, so the first press after a reload appears to do nothing.
 * Reading the attribute and watching it with a MutationObserver makes
 * this component follow the document rather than race it.
 *
 * DARK IS THE DEFAULT AND LIGHT IS OPT IN. The ember canvas is what
 * AltSpot Capital looks like; Daylight is a preference a member
 * expresses, not a guess made from their operating system. Following
 * prefers-color-scheme would mean the product opened in a different
 * skin depending on whose laptop it was on, which is exactly the thing
 * the fixed dashboard order exists to prevent.
 *
 * The choice is per device, in localStorage, for the same reason the
 * folded sections and the rail width are: it is a fact about a screen,
 * not about an investor, and it is not worth a column or a round trip.
 */
import { Moon, Snowflake, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import s from './ThemeToggle.module.css';

export type Theme = 'dark' | 'ice' | 'light';

const STORE = 'asc.theme';

/** What the document is actually painting, right now. */
function readTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  return attr === 'light' || attr === 'ice' ? attr : 'dark';
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  // Another tab changing the preference counts as a change here too.
  window.addEventListener('storage', onChange);

  /* One nudge after mount, so React re-reads a snapshot that was
     already true before it hydrated. */
  const nudge = requestAnimationFrame(onChange);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(nudge);
    window.removeEventListener('storage', onChange);
  };
}

export function setTheme(next: Theme): void {
  const apply = () => {
    if (next === 'light' || next === 'ice') document.documentElement.dataset.theme = next;
    else delete document.documentElement.dataset.theme;
  };
  /* A crossfade where the browser has view transitions, a plain switch
     where it does not. */
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (doc.startViewTransition && !reduce) doc.startViewTransition(apply);
  else apply();

  try {
    window.localStorage.setItem(STORE, next);
  } catch {
    /* Storage refused. The page still changes for this visit. */
  }
}

const OPTIONS: { id: Theme; label: string; glyph: typeof Moon }[] = [
  { id: 'dark', label: 'Ember', glyph: Moon },
  { id: 'ice', label: 'Ice', glyph: Snowflake },
  { id: 'light', label: 'Daylight', glyph: Sun },
];

/**
 * The theme the page is wearing, for anything else that offers the choice
 * (the Appearance card in Settings). The attribute is the truth; this reads it.
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => 'dark' as Theme);
}

export default function ThemeToggle() {
  /* Dark on the server and on a browser with no stored preference,
     which is the product's own canvas and the safe default. */
  const theme = useTheme();

  return (
    <div className={s.wrap} role="group" aria-label="Appearance">
      {OPTIONS.map(({ id, label, glyph: Glyph }) => {
        const on = theme === id;
        return (
          <button
            key={id}
            type="button"
            className={s.seg}
            data-on={on}
            /* Read the document rather than the render: whatever React
               believes, the attribute is what the page is doing. */
            onClick={() => setTheme(id)}
            aria-pressed={on}
            aria-label={label}
            title={label}
          >
            <Glyph size={14} strokeWidth={1.6} aria-hidden="true" />
            {on ? <span className={s.label}>{label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
