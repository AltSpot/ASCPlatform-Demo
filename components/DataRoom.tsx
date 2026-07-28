'use client';

/**
 * Data room listing. Access is logged in production; the viewer itself is
 * simulated here, so the click is acknowledged rather than silently dead.
 */
import { useToast } from '@/components/Toast';

export default function DataRoom({ documents }: { documents: string[] }) {
  const toast = useToast();

  return (
    <div className="card">
      <h3 style={{ marginBottom: 12 }}>Data room</h3>

      {documents.map((doc) => (
        <div className="fee-row" key={doc}>
          <span className="l" style={{ color: 'var(--paper)' }}>
            {doc}
          </span>
          <button
            className="skip"
            style={{ whiteSpace: 'nowrap', textDecoration: 'none', fontSize: 13 }}
            onClick={() => toast('Document viewer is simulated in this demo.')}
          >
            View →
          </button>
        </div>
      ))}

      <p className="tiny" style={{ marginTop: 10 }}>
        Access is logged. Materials shown are the admin-approved mirror of
        AltSpot&rsquo;s internal diligence.
      </p>
    </div>
  );
}
