'use client';

/**
 * TYPE LAB. A temporary decision tool, not a feature.
 *
 * The data face (every eyebrow, label, table header, source line and
 * figure) is being chosen between JetBrains Mono, which ships today,
 * and three sans faces with tabular figures (Figtree, Manrope, Onest). A specimen sheet cannot answer that question, because the
 * face is never read alone: it is read at 10px, uppercase and
 * letter-spaced, beside Borna and Figtree, over glass. So the choice is
 * made here, on the running platform, on every page, in both themes.
 *
 * It works the way the theme does. The face is a redefinition of one
 * token, --font-mono, keyed off data-mono on <html>; the blocking
 * script in app/layout.tsx writes the attribute before first paint, and
 * the attribute is the truth. Nothing else in the product knows this
 * exists.
 *
 * DELETE WHEN DECIDED: this file, its stylesheet, the <TypeLab /> mount
 * and the candidate faces in app/layout.tsx, the html[data-mono]
 * rules in app/globals.css, and the losing font files in public/fonts.
 * Then point --font-mono at the winner.
 */
import { ChevronDown, Type } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';

import s from './TypeLab.module.css';

type Face = 'jetbrains' | 'figtree' | 'manrope' | 'onest';

const STORE = 'asc.mono';

const FACES: { id: Face; name: string; note: string }[] = [
  { id: 'jetbrains', name: 'JetBrains Mono', note: 'Current' },
  { id: 'figtree', name: 'Figtree Tabular', note: 'Tabular sans' },
  { id: 'manrope', name: 'Manrope Tabular', note: 'Tabular sans' },
  { id: 'onest', name: 'Onest Tabular', note: 'Tabular sans' },
];

function isFace(value: string | undefined): value is Face {
  return FACES.some((f) => f.id === value);
}

function readFace(): Face {
  const value = document.documentElement.dataset.mono;
  return isFace(value) ? value : 'jetbrains';
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-mono'],
  });
  const nudge = requestAnimationFrame(onChange);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(nudge);
  };
}

function setFace(next: Face): void {
  if (next === 'jetbrains') delete document.documentElement.dataset.mono;
  else document.documentElement.dataset.mono = next;
  try {
    window.localStorage.setItem(STORE, next);
  } catch {
    /* Storage refused. The page still changes for this visit. */
  }
}

export default function TypeLab() {
  const face = useSyncExternalStore(subscribe, readFace, () => 'jetbrains' as Face);
  const [open, setOpen] = useState(false);
  const current = FACES.find((f) => f.id === face) ?? FACES[0];

  if (!open) {
    return (
      <button
        type="button"
        className={s.pill}
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label={`Type lab. Data face: ${current.name}`}
      >
        <Type size={14} strokeWidth={1.5} aria-hidden="true" />
        <span className={s.pillLabel}>Type lab</span>
        <span className={s.pillFace}>{current.name}</span>
      </button>
    );
  }

  return (
    <section className={s.panel} aria-label="Type lab">
      <header className={s.head}>
        <span className={s.eyebrow}>Type lab · Data face</span>
        <button
          type="button"
          className={s.close}
          onClick={() => setOpen(false)}
          aria-label="Collapse type lab"
        >
          <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      {/* The sample is set in the live token, so it is exactly what the
          rest of the page is wearing. */}
      <div className={s.sample} aria-hidden="true">
        <span className={s.sampleLabel}>Worth in Q3 2026</span>
        <span className={s.sampleFigure}>$1,284,500.00</span>
        <span className={s.sampleRow}>
          <span>+17.9%</span>
          <span>10 days left</span>
          <span>0110</span>
        </span>
      </div>

      <div className={s.options} role="radiogroup" aria-label="Data face">
        {FACES.map((f) => {
          const on = f.id === face;
          return (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={s.option}
              data-on={on}
              onClick={() => setFace(f.id)}
            >
              <span className={s.optionName} data-face={f.id}>
                {f.name}
              </span>
              <span className={s.optionSpecimen} data-face={f.id}>
                $44,818 · 3Y
              </span>
              <span className={s.optionNote}>{f.note}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
