'use client';

/**
 * The industry filter, as a listbox rather than a native select.
 *
 * Shared by the Radar board and the deal shelf.
 *
 * A native select is one control that cannot be made to look like the
 * rest of the product: the closed state can be styled, the open list is
 * drawn by the operating system in its own type at its own size, and on
 * a desktop it lands as a grey rectangle in the middle of a dark
 * institutional page. This draws both halves.
 *
 * What that buys, beyond looking like it belongs: a count against every
 * industry, so a member can see where the board is thin before they
 * filter it down to nothing, and a check against the current choice
 * rather than a highlight the reader has to interpret.
 *
 * Keyboard support is the part a custom control usually loses, so it is
 * the part written first. The button opens on Enter, Space, or either
 * arrow. Inside, the arrows move, Home and End jump, Escape closes
 * without changing anything, Tab closes and moves on, and focus returns
 * to the button when the list closes. The roles are the ARIA listbox
 * pattern, so a screen reader is told what this is.
 */
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { INDUSTRIES, type Industry } from '@/lib/terminal/radar';

import s from './TaxonomyFilters.module.css';

const ALL = 'all' as const;

export default function IndustryMenu({
  industries,
  counts,
  value,
  onChange,
}: {
  /** Industries present on the board, in taxonomy order. */
  industries: Industry[];
  /** How many names sit in each industry. */
  counts: Record<string, number>;
  value: Industry | null;
  onChange: (next: Industry | null) => void;
}) {
  const [open, setOpen] = useState(false);
  /** Which row the keyboard is on. Not the choice: the choice is `value`. */
  const [active, setActive] = useState(0);

  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rowsRef = useRef<(HTMLLIElement | null)[]>([]);

  const options: (Industry | typeof ALL)[] = [ALL, ...industries];
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const label = value === null ? 'All industries' : INDUSTRIES[value];

  /* Close on anything that means "I am done here": a click elsewhere,
     or the window going away underneath an open menu. */
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('blur', () => setOpen(false));
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  /* Focus follows the active row while the list is open, which is what
     makes the arrow keys feel like a menu rather than a scroll. */
  useEffect(() => {
    if (open) rowsRef.current[active]?.focus();
  }, [open, active]);

  function openAt(index: number) {
    setActive(index);
    setOpen(true);
  }

  function choose(option: Industry | typeof ALL) {
    onChange(option === ALL ? null : option);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onListKey(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive(Math.min(options.length - 1, index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive(Math.max(0, index - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        break;
      case 'End':
        event.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(options[index]);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div className={s.menu} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={s.menuButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        data-chosen={value !== null}
        onClick={() => (open ? setOpen(false) : openAt(Math.max(0, options.indexOf(value ?? ALL))))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openAt(Math.max(0, options.indexOf(value ?? ALL)));
          }
        }}
      >
        <span className={s.menuValue}>{label}</span>
        <ChevronDown className={s.menuChev} size={13} strokeWidth={1.6} aria-hidden="true" />
      </button>

      {open ? (
        <ul className={s.menuList} id={listId} role="listbox" aria-label="Industry">
          {options.map((option, index) => {
            const chosen = option === ALL ? value === null : value === option;
            const name = option === ALL ? 'All industries' : INDUSTRIES[option];
            const count = option === ALL ? total : (counts[option] ?? 0);

            return (
              <li
                key={option}
                ref={(node) => {
                  rowsRef.current[index] = node;
                }}
                role="option"
                aria-selected={chosen}
                tabIndex={-1}
                className={s.menuRow}
                data-chosen={chosen}
                onClick={() => choose(option)}
                onKeyDown={(event) => onListKey(event, index)}
              >
                <span className={s.menuCheck} aria-hidden="true">
                  {chosen ? <Check size={12} strokeWidth={2.2} /> : null}
                </span>
                <span className={s.menuName}>{name}</span>
                <span className={s.menuCount}>{count}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
