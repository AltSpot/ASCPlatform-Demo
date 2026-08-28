'use client';

/**
 * The compact watchlist toggle that sits on a shelf card's artwork.
 *
 * Same contract as the deal page's WatchToggle, and deliberately the
 * same optimistic behaviour: flip on click, revert if the write fails.
 * Both directions are idempotent server side, so a fast double click
 * settles rather than errors.
 *
 * Icon only, because on a card the artwork is doing the talking and a
 * labelled button would compete with the primary action. The accessible
 * name carries what the icon cannot.
 *
 * Saving is inert: it reserves no allocation and signals nothing to the
 * issuer. That is what separates it from Radar. It is offered on
 * redacted cards too, so a member can keep a deal while they finish
 * accreditation.
 */
import { Star } from 'lucide-react';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';

import s from './Marketplace.module.css';

export default function WatchStar({
  dealId,
  dealName,
  initialWatched,
}: {
  dealId: string;
  dealName: string;
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useState(initialWatched);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function toggle(event: React.MouseEvent) {
    // The card behind this is a link target in places. Never let a save
    // navigate.
    event.preventDefault();
    event.stopPropagation();

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

  const label = watched
    ? `Remove ${dealName} from your watchlist`
    : `Save ${dealName} to your watchlist`;

  return (
    <button
      type="button"
      className={watched ? `${s.star} ${s.starOn}` : s.star}
      onClick={toggle}
      aria-pressed={watched}
      aria-label={label}
      title={watched ? 'On your watchlist' : 'Save to your watchlist'}
    >
      <Star size={16} strokeWidth={1.5} fill={watched ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}
