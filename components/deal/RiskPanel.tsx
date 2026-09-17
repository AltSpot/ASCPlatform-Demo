/**
 * Risk, plainly. Same page, same weight, same voice as the case for
 * the deal. Anchored so the hero can link straight down to it.
 *
 * Work order screen 11. The deal's own risks, then one closing line on
 * every deal: nothing here is a recommendation, and the risks fall on
 * every member of the SPV. "Sponsors included" appears only while the
 * alignment chip is on (SHOW_SPONSOR_ALIGNMENT), because it is the same
 * claim. No figure for any AltSpot or sponsor position, ever.
 */
import { SHOW_SPONSOR_ALIGNMENT } from '@/lib/config';

import Section from './Section';
import s from './Deal.module.css';

export default function RiskPanel({ risks }: { risks: string }) {
  if (!risks.trim()) return null;

  return (
    <Section
      eyebrow="Risk"
      title="Risk, plainly."
      lede="What could go wrong, in the same place and the same type size as what could go right."
      id="risk"
    >
      <div className={s.risk}>
        <p className={s.riskBody}>{risks}</p>
        <p className={s.riskClose}>
          Nothing on this page is a recommendation. The risks above apply to every member
          of the SPV{SHOW_SPONSOR_ALIGNMENT ? ', sponsors included' : ''}.
        </p>
      </div>
    </Section>
  );
}
