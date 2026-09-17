/** Settings — account, invite link, notifications, and demo controls. */
import SettingsPanel from '@/components/SettingsPanel';
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { referralPath } from '@/lib/referral';
import { getOrCreateMemberCode } from '@/lib/repositories/referrals';
import { getPreferences } from '@/lib/repositories/preferences';
import { LEAD_FILTER_LABEL, STAGE_LABEL } from '@/lib/explore';
import { summarize } from '@/lib/preferences';
import { ASSET_CLASSES, INDUSTRIES } from '@/lib/taxonomy';

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

  const prefs = await getPreferences(user.id);
  const preferencesSummary = prefs
    ? summarize(prefs, {
        assetClass: (k) => ASSET_CLASSES[k].label,
        industry: (k) => INDUSTRIES[k],
        stage: (k) => STAGE_LABEL[k],
        lead: (k) => LEAD_FILTER_LABEL[k],
      })
    : null;

  return (
    <SettingsPanel
      email={user.email}
      invitePath={referralPath(view.code)}
      preferencesSummary={preferencesSummary}
    />
  );
}
