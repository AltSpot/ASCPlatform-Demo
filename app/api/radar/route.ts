/** GET /api/radar — the AltSpot Radar board, with this member's own indications. */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { getRadarBoard } from '@/lib/repositories/radar';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getRadarBoard(user.id));
});
