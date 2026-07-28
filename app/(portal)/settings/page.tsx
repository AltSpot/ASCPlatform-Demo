/** Settings — account, notifications, session, and demo controls. */
import SettingsPanel from '@/components/SettingsPanel';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings · AltSpot Capital' };

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsPanel email={user.email} />;
}
