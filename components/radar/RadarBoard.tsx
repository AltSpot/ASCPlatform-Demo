/**
 * The Radar board.
 *
 * Ranked by how much money the membership has put behind each name, so
 * the answer to "what should we buy next" is the first thing read. The
 * demand bar is relative to the loudest name on the board, which is the
 * only comparison that means anything here.
 */
import type { RadarCompanyView } from '@/lib/terminal/radar';

import RadarCard from './RadarCard';
import s from './Radar.module.css';

export default function RadarBoard({
  companies,
}: {
  companies: RadarCompanyView[];
}) {
  if (companies.length === 0) return null;

  const ranked = [...companies].sort(
    (a, b) => b.interestDollars - a.interestDollars,
  );
  const loudest = ranked[0].interestDollars || 1;

  return (
    <>
      <div className={s.board}>
        {ranked.map((company) => (
          <RadarCard
            key={company.slug}
            company={company}
            demandShare={company.interestDollars / loudest}
          />
        ))}
      </div>

      <div className={s.disclosure}>
        <b>What Radar is, and what it is not</b>
        <p>
          Radar is a demand signal. AltSpot does not hold a position in any
          company listed here, is not raising for any of them, and is not
          offering any security on this page. Indicating interest is not a
          commitment, reserves nothing, and never moves money. Company names and
          descriptions are public information. Every figure shown, including the
          market average, the last-round reference and the AltSpot target range,
          is illustrative demo data rather than market data, and no figure here
          is a forecast or a claim about any outcome.
        </p>
      </div>
    </>
  );
}
