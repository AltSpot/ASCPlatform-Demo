/**
 * The opening beat: the short version, in prose, beside the walkthrough.
 *
 * The film leads the hero at size; the thumbnail here is the second
 * door to it, next to the paragraph a member reads first. Every deal
 * carries the thumbnail, including the thinner ones with no summary
 * yet, so the overview has the same shape on every deal page. The prose
 * stays at a readable measure: this is the one part of the page meant
 * to be read rather than scanned.
 */
import BackerMark from '@/components/BackerMark';
import { backingSentence, type Backing } from '@/lib/backers';

import DealVideo from './DealVideo';
import Section from './Section';
import s from './Deal.module.css';

export default function SummaryMedia({
  summary,
  name,
  art,
  logoUrl,
  videoUrl,
  backing,
}: {
  summary: string | null;
  name: string;
  art: string;
  logoUrl: string | null;
  videoUrl: string | null;
  /** The other firms on the round, when there are any. */
  backing: Backing[];
}) {
  return (
    <Section eyebrow="Overview" title="The short version." id="overview">
      <div className={summary ? s.overview : s.overviewSolo}>
        <div className={s.overviewCopy}>
          {summary && <p className={s.summaryText}>{summary}</p>}
          {backing.length > 0 ? (
            <ul className={s.backingList}>
              {backing.map((b) => (
                <li key={b.firm} className={s.backingRow}>
                  <BackerMark backing={b} />
                  <span className={s.backingNote}>{backingSentence(b)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <DealVideo name={name} art={art} logoUrl={logoUrl} videoUrl={videoUrl} />
      </div>
    </Section>
  );
}
