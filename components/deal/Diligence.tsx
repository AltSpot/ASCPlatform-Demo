/**
 * Read it yourself: the data room beside SpotBot.
 *
 * A deal with neither one drops the whole section rather than leaving a
 * heading over an empty column.
 */
import DataRoom from '@/components/DataRoom';
import SpotBot from '@/components/SpotBot';
import type { SpotbotEntry } from '@/lib/domain';

import Section from './Section';
import s from './Deal.module.css';

export default function Diligence({
  docs,
  spotbot,
}: {
  docs: string[];
  spotbot: SpotbotEntry[];
}) {
  const hasDocs = docs.length > 0;
  const hasBot = spotbot.length > 0;
  if (!hasDocs && !hasBot) return null;

  return (
    <Section
      eyebrow="Diligence"
      title="Read it yourself."
      lede="The materials behind everything above, plus plain-language answers scoped to them."
    >
      <div className={hasDocs && hasBot ? s.diligence : undefined}>
        {hasDocs && <DataRoom documents={docs} />}
        {hasBot && <SpotBot entries={spotbot} />}
      </div>
    </Section>
  );
}
