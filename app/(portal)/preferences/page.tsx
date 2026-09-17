/**
 * Deal preferences, their own page: reached from the dashboard card a new
 * member sees once accepted, and from Settings afterwards. Rules in
 * lib/preferences.ts.
 */
import Link from 'next/link';

import PreferencesForm from '@/components/PreferencesForm';
import { requireUser } from '@/lib/auth';
import { getPreferences } from '@/lib/repositories/preferences';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Deal preferences · AltSpot' };

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireUser();
  const [{ from }, prefs] = await Promise.all([searchParams, getPreferences(user.id)]);
  const returnTo = from === 'settings' ? '/settings' : '/dashboard';

  return (
    <>
      <div className="crumbs">
        <Link href={returnTo}>{from === 'settings' ? 'Settings' : 'Dashboard'}</Link>
        <span className="sep">/</span>
        <span className="here">Deal preferences</span>
      </div>

      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Deal preferences</div>
          <h1 className="display">What do you want to see?</h1>
          <p className="sub">
            About a minute. We use it to mark the deals that fit you and to tell you when one
            opens. Change it any time in Settings.
          </p>
        </div>
      </div>

      <PreferencesForm initial={prefs} returnTo={returnTo} />
    </>
  );
}
