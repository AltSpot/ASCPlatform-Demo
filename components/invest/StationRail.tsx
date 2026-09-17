/**
 * Where a member is in checkout: AMOUNT · READ · SIGN · ESCROW.
 *
 * Work order screen 10. The last station is ESCROW, not FUNDED: the money
 * goes to escrow and waits for the deal to close, and a rail that ended
 * on "funded" would say the investment had happened when it has not.
 *
 * One thin line across the top of the invest flow and the escrow page, so
 * the four steps read as one journey across two screens. No 'use client'.
 */
import { Check } from 'lucide-react';

import s from './StationRail.module.css';

export type Station = 'amount' | 'read' | 'sign' | 'escrow';

const STATIONS: { key: Station; label: string }[] = [
  { key: 'amount', label: 'Amount' },
  { key: 'read', label: 'Read' },
  { key: 'sign', label: 'Sign' },
  { key: 'escrow', label: 'Escrow' },
];

export default function StationRail({
  at,
  done = false,
}: {
  /** The station the member is on. */
  at: Station;
  /** True once the current station is complete too (in escrow). */
  done?: boolean;
}) {
  const index = STATIONS.findIndex((station) => station.key === at);

  return (
    <ol className={s.rail} aria-label="Checkout steps">
      {STATIONS.map((station, i) => {
        const state = i < index || (i === index && done) ? 'done' : i === index ? 'now' : 'next';
        return (
          <li
            key={station.key}
            className={s.station}
            data-state={state}
            aria-current={state === 'now' ? 'step' : undefined}
          >
            <span className={s.dot} aria-hidden="true">
              {state === 'done' ? <Check size={11} strokeWidth={2.4} /> : i + 1}
            </span>
            <span className={s.label}>{station.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
