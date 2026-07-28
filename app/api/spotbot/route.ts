/**
 * POST /api/spotbot — one question, one gated answer.
 *
 * The answer is produced server-side even though today's engine is pure
 * local retrieval, for two reasons. The gate has to be enforced somewhere
 * the browser cannot skip, and when the Claude call lands it will need a
 * credential that never goes near the client. Neither of those changes
 * this handler.
 */
import { requireUser } from '@/lib/auth';
import { ok, optionalString, readJson, requireString, route } from '@/lib/http';
import { askSpotBot } from '@/lib/spotbot/engine';

export const POST = route(async (request: Request) => {
  // SpotBot is an investor-facing surface. Signed in only, like everything
  // else under the portal shell it renders in.
  await requireUser();

  const body = await readJson(request);
  const question = requireString(body.question, 'question', { maxLength: 400 });
  const pathname = optionalString(body.pathname, 200) ?? '/';

  return ok(await askSpotBot({ question, pathname }));
});
