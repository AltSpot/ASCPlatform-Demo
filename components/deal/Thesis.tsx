/**
 * Why we underwrote it. Numbered because these are the reasons in
 * order of weight, not a bulleted list of features.
 */
import Section from './Section';
import s from './Deal.module.css';

export default function Thesis({ points }: { points: string[] }) {
  if (points.length === 0) return null;

  return (
    <Section eyebrow="Our underwriting" title="Why we underwrote it.">
      <div className={s.thesis}>
        {points.map((point, i) => (
          <div className={s.thesisItem} key={i}>
            <div className={s.thesisNum}>{String(i + 1).padStart(2, '0')}</div>
            <p className={s.thesisText}>{point}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
