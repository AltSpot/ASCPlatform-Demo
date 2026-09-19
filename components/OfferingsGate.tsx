/**
 * Where a member stands, in place of offerings they cannot see yet.
 *
 * Used wherever the shelf would be: the marketplace's Invest lane today.
 * A deal link that meets the gate uses components/deal/DealGate.tsx,
 * which sets the same copy (gateCopy in lib/relationship.ts) at hero
 * scale. Carries nothing about any offering.
 */
import Link from 'next/link';

import { ACCREDITATION_STEP } from '@/lib/domain';
import { dateStr } from '@/lib/format';
import { gateCopy, STAGE_LABEL, type RelationshipView } from '@/lib/relationship';

export default function OfferingsGate({ relationship }: { relationship: RelationshipView }) {
  const copy = gateCopy(relationship, dateStr, `/wizard?step=${ACCREDITATION_STEP}`);

  return (
    <div className="card gold">
      <span className={relationship.stage === 'under_review' ? 'chip neutral' : 'chip'}>
        <span className="dot" />
        {STAGE_LABEL[relationship.stage]}
      </span>
      <h3 style={{ marginTop: 14 }}>{copy.title}</h3>
      <p className="small" style={{ marginTop: 6, maxWidth: '64ch' }}>
        {copy.body}
      </p>
      {copy.action && (
        <Link className="btn btn-primary" style={{ marginTop: 18 }} href={copy.action.href}>
          {copy.action.label}
        </Link>
      )}
    </div>
  );
}
