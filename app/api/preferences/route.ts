/**
 * GET /api/preferences — this member's deal preferences, or null.
 * PUT /api/preferences — save them. Every field optional; anything
 * unknown is dropped (lib/preferences.ts). { showEverything: true } is the
 * one-press answer.
 */
import { requireUser } from '@/lib/auth';
import { ok, readJson, route } from '@/lib/http';
import { parsePreferences } from '@/lib/preferences';
import { getPreferences, savePreferences } from '@/lib/repositories/preferences';

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getPreferences(user.id));
});

export const PUT = route(async (request: Request) => {
  const user = await requireUser();
  const body = await readJson<Record<string, unknown>>(request);
  return ok(await savePreferences(user.id, parsePreferences(body)));
});
