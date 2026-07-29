/**
 * GET /api/documents/:id/download
 *
 * Serves the frozen record that was rendered at signature, not a fresh
 * render. That distinction is the whole point: counsel can reissue a
 * template tomorrow, and this still returns exactly the text the investor
 * executed.
 *
 * Delivered as a self-contained printable HTML document. The investor
 * prints to PDF from it, which avoids running Chromium on the server just
 * to produce a file the browser can already make.
 */
import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { NotFoundError, route } from '@/lib/http';
import { getDocument } from '@/lib/repositories/documents';

export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await context.params;

    const doc = await getDocument(user.id, id);
    if (!doc) throw new NotFoundError('Document not found');

    if (!doc.bodyHtml) {
      throw new NotFoundError('No stored copy for this document');
    }

    const filename = doc.name.replace(/[^\w.-]+/g, '_').slice(0, 80);

    return new NextResponse(doc.bodyHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}.html"`,
        // A signed record must not be served from a shared cache.
        'Cache-Control': 'private, no-store',
      },
    });
  },
);
