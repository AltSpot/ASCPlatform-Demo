'use client';

/**
 * The gate in front of every "Begin investment" affordance.
 *
 * If setup is incomplete it explains which step is missing and routes
 * there, carrying the deal so the investor is returned to it once the
 * requirement is met. The server enforces the same rule independently.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import type { InvestGate } from '@/lib/domain';

export default function InvestButton({
  dealId,
  gate,
  label = 'Begin investment',
  className = 'btn btn-gold',
}: {
  dealId: string;
  gate: InvestGate;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  function handleClick() {
    if (busy) return;
    setBusy(true);

    if (gate.ok) {
      router.push(`/invest/${dealId}`);
      return;
    }

    const first = gate.missing[0];
    toast(
      <>
        Before investing, complete <b>{first.label}</b>. Taking you there.
      </>,
    );
    setTimeout(() => {
      router.push(`/wizard?step=${first.step}&then=${dealId}`);
    }, 1400);
  }

  return (
    <button className={className} onClick={handleClick} disabled={busy}>
      {label}
    </button>
  );
}
