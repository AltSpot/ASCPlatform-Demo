/**
 * The deck is no longer a separate destination. The deal page is the
 * pitch, top to bottom, so this route only exists to keep old links,
 * bookmarks and emailed URLs landing somewhere sensible.
 */
import { permanentRedirect } from 'next/navigation';

export default async function DeckRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/deals/${id}`);
}
