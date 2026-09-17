'use client';

/**
 * Where "Begin investment" would be, once an SPV is full.
 *
 * Work order screen 13. The SPV has reached its investor cap, so the ask
 * becomes a place in line. Joining reserves nothing and moves no money;
 * the server re-checks that the SPV is actually full.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';

export default function WaitlistButton({
  dealId,
  className = 'btn btn-gold',
  initiallyJoined = false,
}: {
  dealId: string;
  className?: string;
  initiallyJoined?: boolean;
}) {
  const toast = useToast();
  const [joined, setJoined] = useState(initiallyJoined);
  const [busy, setBusy] = useState(false);

  async function join() {
    if (busy || joined) return;
    setBusy(true);
    try {
      const result = await api.joinWaitlist(dealId);
      setJoined(true);
      toast(
        <>
          You are <b>number {result.position}</b> on the waitlist. We will tell you if a
          spot opens before admissions close.
        </>,
      );
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not join the waitlist.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className} onClick={join} disabled={busy || joined}>
      {joined ? 'On the waitlist' : busy ? 'Joining…' : 'SPV full · Join the waitlist'}
    </button>
  );
}
