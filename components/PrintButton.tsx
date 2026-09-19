'use client';

/** Opens the browser's print dialog, which is also how a page becomes a PDF. */
import { Download } from 'lucide-react';

export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-gold" onClick={() => window.print()}>
      <Download size={16} strokeWidth={1.6} aria-hidden="true" />
      {label}
    </button>
  );
}
