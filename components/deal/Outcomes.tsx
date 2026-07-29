/**
 * Potential outcomes and comparables.
 *
 * These are illustrative, and the note saying so is not optional. The
 * scenarios are entry-multiple arithmetic, not a projection, and the
 * comparables are public market data used to frame the buyer universe.
 * Nothing here promises a return.
 */
import type { DealOutcomes } from '@/lib/domain';

import Section from './Section';
import s from './Deal.module.css';

export default function Outcomes({ outcomes }: { outcomes: DealOutcomes }) {
  const { intro, scenarios = [], comparables = [], note } = outcomes;
  if (scenarios.length === 0 && comparables.length === 0) return null;

  return (
    <Section
      eyebrow="Potential outcomes"
      title="What the range looks like."
      id="outcomes"
    >
      {intro && <p className={s.sectionLede}>{intro}</p>}

      {scenarios.length > 0 && (
        <div className={s.scenarioRow}>
          {scenarios.map((scenario) => (
            <div key={scenario.k} className={s.scenario}>
              <div className={s.scenarioK}>{scenario.k}</div>
              <div className={s.scenarioV}>{scenario.v}</div>
              {scenario.note && <div className={s.scenarioNote}>{scenario.note}</div>}
            </div>
          ))}
        </div>
      )}

      {comparables.length > 0 && (
        <div className={s.tableWrap} style={{ marginTop: 28 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Company</th>
                <th>Context</th>
                <th className="num">Valuation</th>
                <th className="num">Multiple</th>
              </tr>
            </thead>
            <tbody>
              {comparables.map((c) => (
                <tr key={c.company}>
                  <td>
                    <b>{c.company}</b>
                  </td>
                  <td className="small">{c.context}</td>
                  <td className="num">{c.valuation}</td>
                  <td className="num">{c.multiple}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {note && <p className={s.sourceNote}>{note}</p>}
    </Section>
  );
}
