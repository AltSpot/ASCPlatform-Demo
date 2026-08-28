'use client';

/**
 * Jump nav for the deal page.
 *
 * The page is one long narrative by design, which is right for reading
 * and wrong for returning: an investor who wants the terms again should
 * not have to scroll past the thesis to find them.
 *
 * The entries are discovered from the DOM rather than declared here.
 * Every deal section returns null when its content is missing, and the
 * deals behind the lead carry far thinner editorial than Calder, so a
 * hard-coded list would promise sections that are not on the page. The
 * sections announce themselves with data-nav-label; this reads whatever
 * actually rendered, which cannot drift out of step with them.
 *
 * The read is deferred to the frame after mount. It is a layout read of
 * siblings this component does not own, so it belongs after paint
 * rather than synchronously inside the commit.
 */
import { useEffect, useState } from 'react';

import s from './Deal.module.css';

interface Entry {
  id: string;
  label: string;
}

/** Below this, a nav is more chrome than help. */
const MIN_ENTRIES = 3;

export default function DealNav() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;

    const frame = requestAnimationFrame(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('section[id][data-nav-label]'),
      );

      setEntries(
        nodes.map((node) => ({
          id: node.id,
          label: node.dataset.navLabel ?? node.id,
        })),
      );

      if (nodes.length < MIN_ENTRIES) return;

      // Highlight the section nearest the top of the reading area rather
      // than whichever happens to intersect first, so a short section
      // sandwiched between two long ones still takes the highlight.
      observer = new IntersectionObserver(
        (records) => {
          const visible = records
            .filter((r) => r.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActive(visible[0].target.id);
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
      );

      nodes.forEach((node) => observer?.observe(node));
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  if (entries.length < MIN_ENTRIES) return null;

  return (
    <nav className={s.dealNav} aria-label="Sections of this deal">
      {entries.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={
            active === entry.id ? `${s.dealNavLink} ${s.dealNavOn}` : s.dealNavLink
          }
          aria-current={active === entry.id ? 'true' : undefined}
        >
          {entry.label}
        </a>
      ))}
    </nav>
  );
}
