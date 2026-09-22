'use client';

/**
 * The platform's one dropdown (Tyler, 2026-09-21: "some more polish on
 * this and apply to all possible drop down menus that are outdated").
 *
 * A native <select> styles its closed state and hands the open list to
 * the operating system, which on a dark glass page is a grey system menu.
 * This draws both halves: a trigger that is either a form field (`field`)
 * or a bar pill (`pill`), and an opaque panel under it with hairline rows,
 * an optional note and count on each, a check on the choice, and the row
 * under the pointer or the keyboard lit. It opens downward and flips up
 * when there is no room below.
 *
 * A listbox to assistive technology: arrows, Home, End, Enter, Space,
 * Escape and Tab behave as they do in a native select, and typing a letter
 * jumps to the next option that starts with it.
 *
 * Wrap it in a <div className="field">, never a <label>: a label forwards
 * every press inside it (the open list included) back to the trigger.
 */
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

import s from './Select.module.css';

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  /** A quiet second line under the label. */
  note?: string;
  /** A count on the right, in figures. */
  count?: number;
}

export default function Select<V extends string>({
  value,
  options,
  onChange,
  label,
  variant = 'field',
  icon: Icon,
  display,
  chosen,
  id,
}: {
  value: V;
  options: SelectOption<V>[];
  onChange: (next: V) => void;
  /** Read to assistive technology, and the heading shown in the panel. */
  label: string;
  /** A form field, or a pill on a bar of controls. */
  variant?: 'field' | 'pill';
  icon?: LucideIcon;
  /** What the trigger says, when it should differ from the option label. */
  display?: string;
  /** Mark the trigger as doing work (a filter narrowing something). */
  chosen?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);

  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const rowsRef = useRef<(HTMLLIElement | null)[]>([]);
  const typed = useRef({ text: '', at: 0 });

  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[index];

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onBlur = () => setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('blur', onBlur);
    };
  }, [open]);

  /* Open upward when the panel would run off the bottom of the window. */
  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const list = listRef.current;
    if (!button || !list) return;
    const below = window.innerHeight - button.getBoundingClientRect().bottom;
    setUp(below < Math.min(list.scrollHeight, 340) + 16 && button.getBoundingClientRect().top > below);
  }, [open]);

  useEffect(() => {
    if (open) rowsRef.current[active]?.focus({ preventScroll: false });
  }, [open, active]);

  function openAt(at: number) {
    setActive(at);
    setOpen(true);
  }

  function choose(at: number) {
    const option = options[at];
    if (option) onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function typeahead(key: string, from: number, now: number) {
    typed.current = {
      text: now - typed.current.at > 700 ? key.toLowerCase() : typed.current.text + key.toLowerCase(),
      at: now,
    };
    const q = typed.current.text;
    for (let step = 1; step <= options.length; step++) {
      const at = (from + step) % options.length;
      if (options[at].label.toLowerCase().startsWith(q)) return at;
    }
    return -1;
  }

  function onListKey(event: KeyboardEvent, at: number) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive(Math.min(options.length - 1, at + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActive(Math.max(0, at - 1));
        return;
      case 'Home':
        event.preventDefault();
        setActive(0);
        return;
      case 'End':
        event.preventDefault();
        setActive(options.length - 1);
        return;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(at);
        return;
      case 'Tab':
        setOpen(false);
        return;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const hit = typeahead(event.key, at, event.timeStamp);
          if (hit >= 0) setActive(hit);
        }
    }
  }

  return (
    <div className={s.root} data-variant={variant} ref={rootRef}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className={s.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${display ?? current?.label ?? ''}`}
        data-chosen={chosen || undefined}
        onClick={() => (open ? setOpen(false) : openAt(index))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openAt(index);
          } else if (event.key.length === 1 && /\S/.test(event.key)) {
            const hit = typeahead(event.key, index, event.timeStamp);
            if (hit >= 0) onChange(options[hit].value);
          }
        }}
      >
        {Icon ? <Icon className={s.icon} size={13} strokeWidth={1.75} aria-hidden="true" /> : null}
        <span className={s.value}>{display ?? current?.label}</span>
        <ChevronDown className={s.chev} size={14} strokeWidth={1.7} aria-hidden="true" />
      </button>

      {open ? (
        <div className={s.panel} data-up={up || undefined}>
          <div className={s.panelHead} aria-hidden="true">
            {label}
          </div>
          <ul ref={listRef} className={s.list} id={listId} role="listbox" aria-label={label}>
            {options.map((option, at) => {
              const selected = option.value === value;
              return (
                <li
                  key={option.value}
                  ref={(node) => {
                    rowsRef.current[at] = node;
                  }}
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  className={s.row}
                  data-active={at === active || undefined}
                  onPointerMove={() => at !== active && setActive(at)}
                  onClick={() => choose(at)}
                  onKeyDown={(event) => onListKey(event, at)}
                >
                  <span className={s.text}>
                    <span className={s.name}>{option.label}</span>
                    {option.note ? <span className={s.note}>{option.note}</span> : null}
                  </span>
                  {option.count !== undefined ? <span className={s.count}>{option.count}</span> : null}
                  <span className={s.check} aria-hidden="true">
                    {selected ? <Check size={13} strokeWidth={2.2} /> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
