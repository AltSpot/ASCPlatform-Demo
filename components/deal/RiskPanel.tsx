/**
 * Risk, plainly. Same page, same weight, same voice as the case for
 * the deal. Anchored so the hero can link straight down to it.
 */
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
      </div>
    </Section>
  );
}
