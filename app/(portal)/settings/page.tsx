/** Settings — account, invite link, notifications, and demo controls. */
import SettingsPanel from '@/components/SettingsPanel';
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { referralPath } from '@/lib/referral';
import { getOrCreateMemberCode } from '@/lib/repositories/referrals';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Settings · AltSpot Capital' };

export default async function SettingsPage() {
  const user = await requireUser();

  const { view, created } = await getOrCreateMemberCode(user.id);
  if (created) {
    await audit({
      userId: user.id,
      action: 'referral.link_created',
      entity: 'referral_code',
      entityId: view.code,
    });
  }

  return <SettingsPanel email={user.email} invitePath={referralPath(view.code)} />;
}
