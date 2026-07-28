'use client';

/**
 * SpotBot — plain-language answers scoped to approved deal materials.
 *
 * Demo preview: the answers are the canned set attached to each deal.
 * Production answers live from the deal's approved data room, which is
 * why every response carries its provenance line.
 */
import { useState } from 'react';

import type { SpotbotEntry } from '@/lib/domain';

export default function SpotBot({ entries }: { entries: SpotbotEntry[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (entries.length === 0) return null;

  return (
    <div className="card spotbot">
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Ask SpotBot
      </div>
      <p className="small" style={{ marginBottom: 14 }}>
        Plain-language answers about this deal, drawn only from approved materials.
        SpotBot explains. It never advises.
      </p>

      {entries.map((entry, i) => (
        <div key={entry.q}>
          <button
            className="spot-q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {entry.q}
          </button>
          {open === i && (
            <div className="spot-a">
              {entry.a}
              <span className="src">
                SpotBot · scoped to the approved AltSpot memo · logged for books &amp;
                records
              </span>
            </div>
          )}
        </div>
      ))}

      <p className="tiny" style={{ marginTop: 6 }}>
        Demo preview with canned responses. The production SpotBot answers live from the
        deal&rsquo;s approved data room.
      </p>
    </div>
  );
}
