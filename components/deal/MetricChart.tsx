/**
 * The one chart. A single series with its provenance stated under it,
 * because a figure without a source is decoration.
 */
import LineChart from '@/components/LineChart';
import type { DealMedia } from '@/lib/domain';

import Section from './Section';
import s from './Deal.module.css';

export default function MetricChart({
  media,
  dealId,
}: {
  media: DealMedia;
  dealId: string;
}) {
  // LineChart needs two points to draw a line, and a chart with no
  // label has nothing to say about itself.
  if (media.series.length < 2 || !media.label) return null;

  return (
    <Section eyebrow="The trend" title={media.label}>
      <div className={s.chart}>
        <LineChart series={media.series} width={880} height={200} id={`deal-${dealId}`} />
        {media.caption && <p className={s.source}>{media.caption}</p>}
      </div>
    </Section>
  );
}
