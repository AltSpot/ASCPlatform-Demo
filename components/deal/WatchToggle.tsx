'use client';

/**
 * Save a deal to this investor's own watchlist. Top right of the deal
 * header.
 *
 * Optimistic: the state flips on click and reverts if the write fails,
 * because a save is small and instant feedback is the whole point. Both
 * directions are idempotent server side, so a fast double click settles
 * rather than errors.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';

import s from './Deal.module.css';

export default function WatchToggle({
  dealId,
  initialWatched,
}: {
  dealId: string;
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useState(initialWatched);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function toggle() {
    if (busy) return;
    const next = !watched;

    setBusy(true);
    setWatched(next);

    try {
      if (next) await api.watchDeal(dealId);
      else await api.unwatchDeal(dealId);
    } catch {
      setWatched(!next);
      toast('That did not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={s.watch}
      onClick={toggle}
      aria-pressed={watched}
      aria-label={watched ? 'Remove from your watchlist' : 'Add to your watchlist'}
    >
      <span className={s.watchMark} aria-hidden="true">
        {watched ? '★' : '☆'}
      </span>
      {watched ? 'On your watchlist' : 'Add to watchlist'}
    </button>
  );
}
