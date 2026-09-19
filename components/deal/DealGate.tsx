/**
 * What a deal link shows a member who has not cleared the relationship
 * gate.
 *
 * Offerings are made under Rule 506(b), so before a member's
 * questionnaire is approved and the cooling-off period has passed they
 * are shown no offering at all: not its terms, and not its name, sector
 * or artwork either. Someone who followed a link lands here, and the page
 * says where they stand and what happens next, without confirming which
 * deal the link pointed at. The server sent nothing about the deal, so
 * there is nothing on this page to leak.
 *
 * The copy is gateCopy in lib/relationship.ts, shared with the
 * marketplace's components/OfferingsGate.tsx.
 */
import Link from 'next/link';

import { ACCREDITATION_STEP } from '@/lib/domain';
import { dateStr } from '@/lib/format';
import { gateCopy, STAGE_LABEL, type RelationshipView } from '@/lib/relationship';

import s from './Deal.module.css';

export default function DealGate({ relationship }: { relationship: RelationshipView }) {
  const copy = gateCopy(relationship, dateStr, `/wizard?step=${ACCREDITATION_STEP}`);

  return (
    <>
      {/* One warm pane, not the hero card with the gate inside it: with
          no deal to frame there is nothing for an outer pane to hold, and
          glass on glass reads as fog. */}
      <section className={s.gate} style={{ marginTop: 0 }} aria-label="Offerings">
        <div className={s.gateBody}>
          <div className={`eyebrow signal ${s.gateEyebrow}`}>
            {STAGE_LABEL[relationship.stage]}
          </div>
          <p className={s.heroLede}>{copy.title}</p>
          <p className={s.gateText}>{copy.body}</p>
        </div>
        {copy.action ? (
          <Link className="btn btn-primary" href={copy.action.href}>
            {copy.action.label}
          </Link>
        ) : (
          <Link className="btn btn-ghost" href="/dashboard">
            Back to dashboard
          </Link>
        )}
      </section>

      <p className={s.disclosure}>
        Not an offer to sell securities. Any offer is made only through definitive
        documents, to eligible members. Demo environment.
      </p>
    </>
  );
}
