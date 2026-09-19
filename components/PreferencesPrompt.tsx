'use client';

/**
 * The card at the top of the dashboard until a newly accepted member says
 * what they want to see. Two ways out, both one press: set preferences,
 * or show me everything. Either one makes it go away for good.
 */
import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import { EVERYTHING } from '@/lib/preferences';

import s from './PreferencesPrompt.module.css';

export default function PreferencesPrompt() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function everything() {
    if (busy) return;
    setBusy(true);
    try {
      await api.savePreferences(EVERYTHING);
      toast(
        <>
          <b>Saved.</b> You will see everything. Narrow it any time in Settings.
        </>,
      );
      router.refresh();
    } catch {
      toast('That did not save. Try again.');
      setBusy(false);
    }
  }

  return (
    <section className={`card gold ${s.prompt}`} aria-label="Deal preferences">
      <span className={s.icon} aria-hidden="true">
        <SlidersHorizontal size={20} strokeWidth={1.6} />
      </span>
      <div className={s.copy}>
        <h2 className={s.title}>What do you want to see?</h2>
        <p className={s.sub}>
          Tell us the kinds of deals you are after and we will mark the ones that fit. About a
          minute, every question optional.
        </p>
      </div>
      <div className={s.actions}>
        <Link className="btn btn-primary btn-sm" href="/preferences">
          Set preferences
        </Link>
        <button type="button" className="btn btn-ghost btn-sm" onClick={everything} disabled={busy}>
          Show me everything
        </button>
      </div>
    </section>
  );
}
