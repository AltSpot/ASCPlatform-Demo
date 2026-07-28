/** Profiles & the Vault — the entities you invest through, and the
 *  information that pre-fills every document. */
import ProfileManager from '@/components/ProfileManager';
import { requireUser } from '@/lib/auth';
import { getBank, getVault, listProfiles } from '@/lib/repositories/investor';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Profiles · AltSpot Capital' };

export default async function ProfilesPage() {
  const user = await requireUser();

  const [profiles, vault, bank] = await Promise.all([
    listProfiles(user.id),
    getVault(user.id),
    getBank(user.id),
  ]);

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Profiles</div>
          <h1 className="display">Profiles &amp; saved information.</h1>
          <p className="sub">
            Investment profiles are the entities your deals are held under. The Vault is
            the information that pre-fills your documents. Captured once, reused
            everywhere.
          </p>
        </div>
      </div>

      <ProfileManager
        userName={user.name}
        initialProfiles={profiles}
        vault={vault}
        bank={bank}
      />
    </>
  );
}
