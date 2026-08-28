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
        {ranked.map((company, index) => (
          <RadarCard
            key={company.slug}
            company={company}
            demandShare={company.interestDollars / loudest}
            rank={index + 1}
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
        <p>
          The research section on each card is written by AltSpot. What the
          company does, the bull case, the bear case and why we are tracking it
          are our plain-language reading of public information. They are not
          investment research, not a recommendation, not a forecast, and not
          advice about whether any company is worth owning. They are summaries,
          they are incomplete by design, and they can be wrong or go out of
          date. The news links go to the companies&rsquo; own newsrooms. Those
          publishers wrote that material, not us, and we do not endorse it. Read
          the primary source and reach your own view.
        </p>
      </div>
    </>
  );
}
