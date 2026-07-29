/**
 * Deal terms, in two tables.
 *
 * The first is the economics of the round: what the security is, what it
 * is priced at, how big the round is, and the price per share. The second
 * is the preferred terms that attach to it.
 *
 * Deliberately absent: vehicle, minimum investment, allocation remaining
 * and target close. The first three already appear in the hero and were
 * repeating themselves here, and there is no target close on a back-raise
 * where the SPV already holds the shares.
 */
import type { DealView } from '@/lib/domain';

import Section from './Section';
import s from './Deal.module.css';

export default function TermsTable({ deal }: { deal: DealView }) {
  const economics = [
    ...deal.terms,
    ...(deal.pricePerShare ? [{ k: 'Price per share', v: deal.pricePerShare }] : []),
  ];

  if (economics.length === 0 && deal.preferredTerms.length === 0) return null;

  return (
    <Section eyebrow="Terms" title="What you are agreeing to." id="terms">
      {economics.length > 0 && <Table rows={economics} caption="Round" />}

      {deal.preferredTerms.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <Table rows={deal.preferredTerms} caption="Preferred terms" />
        </div>
      )}
    </Section>
  );
}

function Table({
  rows,
  caption,
}: {
  rows: { k: string; v: string }[];
  caption: string;
}) {
  return (
    <div className={s.tableWrap}>
      <table className="tbl">
        <thead>
          <tr>
            <th>{caption}</th>
            <th className="num">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.k}>
              <td>{row.k}</td>
              <td className="num">{row.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
