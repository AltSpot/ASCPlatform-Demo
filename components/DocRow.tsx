'use client';

/** "View" affordance for a filed document. The viewer itself is simulated. */
import { useToast } from '@/components/Toast';

export default function DocRow() {
  const toast = useToast();

  return (
    <button
      className="skip"
      style={{ textDecoration: 'none', fontSize: 13 }}
      onClick={() => toast('Document viewer is simulated in this demo.')}
    >
      View →
    </button>
  );
}
