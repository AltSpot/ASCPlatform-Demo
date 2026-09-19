'use client';

/**
 * Lands "Your position" on its row.
 *
 * A link to /portfolio#position-<deal> arrives by client navigation, and a
 * browser only applies :target to a fragment it navigated to itself, so the
 * row would neither scroll into view reliably nor light. This finds the row
 * named by the hash, brings it to the middle of the screen and marks it, on
 * arrival and whenever the hash changes. It renders nothing.
 */
import { useEffect } from 'react';

const PREFIX = '#position-';

export default function PositionTarget() {
  useEffect(() => {
    let lit: HTMLElement | null = null;

    function arrive() {
      lit?.removeAttribute('data-arrived');
      lit = null;
      const { hash } = window.location;
      if (!hash.startsWith(PREFIX)) return;
      const row = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!row) return;
      row.setAttribute('data-arrived', 'true');
      row.scrollIntoView({ block: 'center' });
      lit = row;
    }

    /* After first paint, so the sections above have their height. */
    const soon = window.setTimeout(arrive, 80);
    window.addEventListener('hashchange', arrive);
    return () => {
      window.clearTimeout(soon);
      window.removeEventListener('hashchange', arrive);
      lit?.removeAttribute('data-arrived');
    };
  }, []);

  return null;
}
