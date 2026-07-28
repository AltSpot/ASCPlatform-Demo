/** POST /api/profiles/:id/default — make this the checkout default. */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, route } from '@/lib/http';
import { listProfiles, setDefaultProfile } from '@/lib/repositories/investor';

export const POST = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const profiles = await listProfiles(user.id);
    if (!profiles.some((p) => p.id === id)) throw new NotFoundError('Profile not found');

    await setDefaultProfile(user.id, id);
    await audit({
      userId: user.id,
      action: 'profile.default_changed',
      entity: 'investment_profile',
      entityId: id,
    });

    return ok(await listProfiles(user.id));
  },
);
