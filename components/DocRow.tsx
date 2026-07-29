'use client';

/**
 * Open a filed document.
 *
 * Serves the frozen record captured at signature, not a fresh render, so
 * what opens is what was actually executed. Documents with no stored copy
 * (seeded history, tax forms not yet issued) say so rather than opening a
 * broken page.
 */
import { useToast } from '@/components/Toast';

export default function DocRow({ documentId }: { documentId?: string }) {
  const toast = useToast();

  if (!documentId) {
    return (
      <button
        className="skip"
        style={{ textDecoration: 'none', fontSize: 13 }}
        onClick={() => toast('No stored copy for this document.')}
      >
        View →
      </button>
    );
  }

  return (
    <a
      className="skip"
      style={{ textDecoration: 'none', fontSize: 13 }}
      href={`/api/documents/${documentId}/download`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open →
    </a>
  );
}
