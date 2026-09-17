/**
 * Deal terms, in two tables.
 *
 * The first is the economics of the round: what the security is, what it
 * is priced at, how big the round is, and the price per share. The second
 * is the preferred terms that attach to it.
 *
 * The third is what it costs (work order screens 6 and 7), from
 * lib/fees.ts: with SHOW_FEE_TERMS off, one row that names the management
 * fee and points at the memorandum, and no figure; with SHOW_CARRY_TERMS
 * off, no carry row at all. Under it, always, no capital calls.
 *
 * Deliberately absent: minimum to close, closing date and escrow status,
 * which are the hero's funding picture.
 */
import type { DealView } from '@/lib/domain';
import { NO_CAPITAL_CALLS, dealFeeRows } from '@/lib/fees';

import Section from './Section';
import s from './Deal.module.css';

export default function TermsTable({ deal }: { deal: DealView }) {
  const economics = [
    ...deal.terms,
    ...(deal.pricePerShare ? [{ k: 'Price per share', v: deal.pricePerShare }] : []),
  ];

  const costs = dealFeeRows().map((row) => ({ k: row.label, v: row.detail }));

  return (
    <Section eyebrow="Terms" title="What you are agreeing to." id="terms">
      {economics.length > 0 && <Table rows={economics} caption="Round" />}

      {deal.preferredTerms.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <Table rows={deal.preferredTerms} caption="Preferred terms" />
        </div>
      )}

      <div style={{ marginTop: 26 }}>
        <Table rows={costs} caption="What it costs" />
        <p className={s.costNote}>{NO_CAPITAL_CALLS}</p>
      </div>
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
