/**
 * The opening beat: a short summary beside the deal's media.
 *
 * This slot replaces the old committed-capital band. Media is the point
 * here, so the summary stays to a few sentences and gets out of the way.
 * When a real video or image is attached it renders in place of the
 * placeholder.
 */
import Section from './Section';
import s from './Deal.module.css';

export default function SummaryMedia({
  summary,
  dealName,
}: {
  summary: string | null;
  dealName: string;
}) {
  if (!summary) return null;

  return (
    <Section eyebrow="Overview" title="The short version." id="overview">
      <div className={s.summaryGrid}>
        <div className={s.mediaSlot}>
          {/* Placeholder until a walkthrough is attached to the deal. */}
          <div className={s.mediaInner}>
            <span className={s.mediaPlay} aria-hidden="true">
              ▶
            </span>
            <span className={s.mediaLabel}>{dealName} walkthrough</span>
            <span className="demo-tag">Media placeholder</span>
          </div>
        </div>

        <p className={s.summaryText}>{summary}</p>
      </div>
    </Section>
  );
}
