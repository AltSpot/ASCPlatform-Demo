/**
 * /api/external-positions/[id] — edit or remove one external holding.
 *
 * Ownership is enforced in the repository's where clause rather than by
 * a read-then-write, so there is no window between the check and the
 * change and no way to reach another member's row by guessing an id. A
 * row that does not belong to this member is a 404, which is also the
 * right answer to "does this id exist": it does not, for them.
 */
import { audit } from '@/lib/audit';
import { requireUser } from '@/lib/auth';
import { NotFoundError, ok, readJson, route } from '@/lib/http';
import { removeExternal, updateExternal } from '@/lib/repositories/external';

import { parseBody } from '../route';

export const PATCH = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const input = parseBody(await readJson<Record<string, unknown>>(request));
    const position = await updateExternal(user.id, id, input);
    if (!position) throw new NotFoundError('Holding not found');

    await audit({
      userId: user.id,
      action: 'external_position.updated',
      entity: 'external_position',
      entityId: id,
      metadata: { name: position.name, fairValue: position.fairValue },
    });

    return ok(position);
  },
);

export const DELETE = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    if (!(await removeExternal(user.id, id))) {
      throw new NotFoundError('Holding not found');
    }

    await audit({
      userId: user.id,
      action: 'external_position.removed',
      entity: 'external_position',
      entityId: id,
    });

    return ok({ id });
  },
);
