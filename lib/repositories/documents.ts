/**
 * Document repository. Signed agreements land here automatically the
 * moment they are executed; the rendered body is stored alongside so the
 * Docs page can re-open exactly what was signed rather than a rebuild.
 */
import 'server-only';

import { prisma } from '../db';
import { audit } from '../audit';
import type { DocumentView } from '../domain';

export async function listDocuments(userId: string): Promise<DocumentView[]> {
  const rows = await prisma.document.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    dealId: row.dealId,
    subscriptionId: row.subscriptionId,
    name: row.name,
    type: row.type,
    note: row.note,
    savedAt: row.savedAt.toISOString(),
  }));
}

export async function getDocument(
  userId: string,
  id: string,
): Promise<{ name: string; bodyHtml: string | null } | null> {
  const row = await prisma.document.findFirst({
    where: { id, userId },
    select: { name: true, bodyHtml: true },
  });
  return row;
}

export async function saveDocument(
  userId: string,
  input: {
    name: string;
    dealId?: string | null;
    subscriptionId?: string | null;
    type?: string;
    note?: string | null;
    bodyHtml?: string | null;
    binderVersion?: string | null;
  },
): Promise<DocumentView> {
  const row = await prisma.document.create({
    data: {
      userId,
      name: input.name,
      dealId: input.dealId ?? null,
      subscriptionId: input.subscriptionId ?? null,
      type: input.type ?? 'agreement',
      note: input.note ?? null,
      bodyHtml: input.bodyHtml ?? null,
      binderVersion: input.binderVersion ?? null,
    },
  });

  await audit({
    userId,
    action: 'document.saved',
    entity: 'document',
    entityId: row.id,
    metadata: { name: input.name, dealId: input.dealId ?? null },
  });

  return {
    id: row.id,
    dealId: row.dealId,
    subscriptionId: row.subscriptionId,
    name: row.name,
    type: row.type,
    note: row.note,
    savedAt: row.savedAt.toISOString(),
  };
}
