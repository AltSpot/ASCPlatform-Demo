/**
 * Deal terms.
 *
 * Two tables for the economics of the round (what the security is, what
 * it is priced at, how big the round is, the price per share) and the
 * preferred terms that attach to it.
 *
 * Then WHAT IT COSTS, which is not a table (Tyler, 2026-09-19: a member
 * should never scroll sideways to read a fee). Each cost is a card: a
 * glyph, the name, the figure a member reads first, and one or two plain
 * sentences under it, the name pressable to ask Spot. The words and the
 * figures are lib/fees.ts's: with SHOW_FEE_TERMS off, one card that names
 * the fee and points at the memorandum; with SHOW_CARRY_TERMS off, no
 * carry card at all. Under them, always, no capital calls.
 *
 * Deliberately absent: minimum to close, closing date and escrow status,
 * which are the hero's funding picture.
 */
import { Building2, CalendarClock, Landmark, Percent, Receipt, type LucideIcon } from 'lucide-react';

import Term from '@/components/Term';
import type { DealView } from '@/lib/domain';
import { SHOW_FEE_TERMS } from '@/lib/config';
import { NO_CAPITAL_CALLS, dealFeeRows, feeExampleLines } from '@/lib/fees';
import { money } from '@/lib/format';

import Section from './Section';
import s from './Deal.module.css';
import c from './CostCards.module.css';

/** The cost cards: a glyph each, and the question Spot is asked. */
const COST_META: Record<string, { icon: LucideIcon; q: string }> = {
  'Management fee': { icon: CalendarClock, q: 'What are the fees?' },
  'Admin fee': { icon: Building2, q: 'What are the fees?' },
  'SPV expenses': { icon: Receipt, q: 'What are the fees?' },
  'Escrow interest': { icon: Landmark, q: 'What happens after I send to escrow?' },
  'Carried interest': { icon: Percent, q: 'How does carried interest actually work?' },
};

export default function TermsTable({ deal }: { deal: DealView }) {
  const economics = [
    ...deal.terms,
    ...(deal.pricePerShare ? [{ k: 'Price per share', v: deal.pricePerShare }] : []),
  ];

  const costs = dealFeeRows();
  /* What the fees come to at this deal's minimum investment (Tyler,
     2026-09-21), so the figure is in dollars before checkout. */
  const examples = SHOW_FEE_TERMS
    ? feeExampleLines(
        deal.minInvestment,
        deal.allocationTotal - deal.allocationRemaining,
        deal.minimumToClose,
        deal.allocationTotal,
      )
    : {};

  return (
    <Section eyebrow="Terms" title="What you are agreeing to." id="terms">
      {economics.length > 0 && <Table rows={economics} caption="Round" />}

      {deal.preferredTerms.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <Table rows={deal.preferredTerms} caption="Preferred terms" />
        </div>
      )}

      <div className={c.wrap}>
        <h3 className={c.heading}>What it costs</h3>
        <ul className={c.cards}>
          {costs.map((row) => {
            const meta = COST_META[row.label];
            const Icon = meta?.icon ?? Receipt;
            return (
              <li className={c.card} key={row.label}>
                <span className={c.glyph} aria-hidden="true">
                  <Icon size={17} strokeWidth={1.6} />
                </span>
                <span className={c.label}>
                  {meta ? <Term q={meta.q} quiet>{row.label}</Term> : row.label}
                </span>
                <span className={c.short}>{row.short}</span>
                {examples[row.label] ? (
                  <span className={c.example}>{examples[row.label]}</span>
                ) : null}
                <p className={c.detail}>{row.detail}</p>
              </li>
            );
          })}
        </ul>
        <p className={s.costNote}>
          {SHOW_FEE_TERMS ? (
            <>
              Both fees come out of your investment, not on top of it. Figures shown at the{' '}
              {money(deal.minInvestment)} minimum.{' '}
            </>
          ) : null}
          <Term q="Will I be asked for more money later?" quiet>
            {NO_CAPITAL_CALLS}
          </Term>
        </p>
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
