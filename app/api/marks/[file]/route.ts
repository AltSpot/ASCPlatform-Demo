/**
 * GET /api/marks/:file — a company mark (logo), behind login.
 *
 * Marks used to sit in public/, where a file name like /calder-logo.svg
 * named a live offering to anyone, signed in or not. Rule 506(b) allows
 * no deal or Radar name on a logged-out surface, so they live in
 * private/marks/ and come through here:
 *
 *   - a signed-out request gets a 404;
 *   - a mark named after a deal is served only to a member who has
 *     cleared the relationship gate, the same rule as the deal itself;
 *   - anything the viewer may not see answers exactly like a file that
 *     does not exist, so the route cannot be used to learn names.
 *
 * SVG only, and the name is matched strictly before it touches the disk,
 * so no path can be smuggled in.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { getSessionUser } from '@/lib/auth';
import { canSeeOfferings } from '@/lib/relationship';
import { isDealId } from '@/lib/repositories/deals';
import { getRelationshipView } from '@/lib/repositories/investor';

const NAME = /^[a-z0-9-]{1,48}\.svg$/;
const MARKS_DIR = path.join(process.cwd(), 'private', 'marks');

function notFound(): Response {
  return new Response('Not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const user = await getSessionUser();
  if (!user) return notFound();

  const { file } = await context.params;
  if (!NAME.test(file)) return notFound();

  const id = file.slice(0, -'.svg'.length);
  if (await isDealId(id)) {
    const relationship = await getRelationshipView(user.id);
    if (!canSeeOfferings(relationship)) return notFound();
  }

  try {
    const body = await readFile(path.join(MARKS_DIR, file));
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        // Per viewer: never shared by a proxy between two members.
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return notFound();
  }
}
