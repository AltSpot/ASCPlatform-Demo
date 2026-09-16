'use client';

/**
 * One collapsible section of a long page.
 *
 * Used by the dashboard and by Portfolio, which is why the storage key
 * is scoped: both pages have a section about positions and folding one
 * must not fold the other.
 *
 * The dashboard is a long page by nature: positions, votes, watchlist,
 * the wire. Portfolio is longer. Not every member wants all of it every day, and the ones
 * who do not were scrolling past the same three blocks to reach the
 * one they came for. Each section now folds, and what a member folds
 * stays folded.
 *
 * The state lives in localStorage rather than on the account. It is a
 * per-device convenience, not a fact about the investor, and it is not
 * worth a column, a migration or a round trip. A browser with storage
 * blocked simply gets every section open, which is the right default
 * anyway, so every read and write is wrapped.
 *
 * Children are rendered by the server and passed in, so folding costs
 * no data and reveals instantly.
 */
import { ChevronDown } from 'lucide-react';
import { useId, useSyncExternalStore } from 'react';

import s from './CollapsibleSection.module.css';

const STORE = 'asc.collapsed';

/** Where a page's folded set lives. One key per page. */
function storeKey(scope: string): string {
  return `${STORE}.${scope}`;
}

/** The set of folded section ids, or an empty set if we cannot read it. */
function readFolded(scope: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storeKey(scope));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((v) => typeof v === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

/* Storage is the external store, read through useSyncExternalStore
   rather than copied into state in an effect. That is what makes the
   server render (everything open) and the client render agree without
   a second pass, and it keeps two sections that are both mounted from
   disagreeing about what is folded. */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab folding a section counts as a change here too.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function fold(scope: string, id: string, folded: boolean): void {
  try {
    const set = readFolded(scope);
    if (folded) set.add(id);
    else set.delete(id);
    window.localStorage.setItem(storeKey(scope), JSON.stringify([...set]));
  } catch {
    /* Storage refused. Nothing else to do: the section stays as it is. */
  }
  for (const listener of listeners) listener();
}

export default function CollapsibleSection({
  id,
  scope = 'dashboard',
  title,
  note,
  action,
  handle,
  children,
}: {
  /** Stable key for the remembered state. Not the DOM id. */
  id: string;
  /** Which page's folded set this belongs to. */
  scope?: string;
  title: string;
  /** The quiet line on the right of the rule. */
  note?: string;
  /** A link on the right of the rule, where the section's rest lives. */
  action?: React.ReactNode;
  /** Something rendered before the title. */
  handle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const domId = useId();

  /* Open on the server and on a browser with no stored preference,
     which is the right default and the safe one. */
  const open = useSyncExternalStore(
    subscribe,
    () => !readFolded(scope).has(id),
    () => true,
  );

  return (
    <section className={s.section}>
      <h2 className={s.head}>
        {handle}
        <button
          type="button"
          className={s.toggle}
          aria-expanded={open}
          aria-controls={domId}
          onClick={() => fold(scope, id, open)}
        >
          {/* Global class so a page that lays a drag handle over this
              spot can hide it without reaching into these styles. */}
          <span className={`${s.rule} section-rule`} aria-hidden="true" />
          <span className={s.title}>{title}</span>
          <ChevronDown className={s.chev} size={16} strokeWidth={1.6} aria-hidden="true" />
        </button>
        {note ? <span className={s.note}>{note}</span> : null}
        {action}
      </h2>

      {/* 0fr to 1fr animates a height nobody had to measure. */}
      <div className={s.panel} data-open={open} id={domId}>
        <div className={s.panelInner}>{children}</div>
      </div>
    </section>
  );
}
