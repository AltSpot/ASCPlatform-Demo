/** GET /api/documents — everything filed for this investor. */
import { requireUser } from '@/lib/auth';
import { ok, route } from '@/lib/http';
import { listDocuments } from '@/lib/repositories/documents';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listDocuments(user.id));
});
