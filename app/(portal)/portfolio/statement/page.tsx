/**
 * The capital account statement: one page, made to be saved as a PDF
 * (Tyler, 2026-09-19, institutional polish).
 *
 * An LP expects to be able to hand their accountant a dated page. This is
 * that page: who, as of when, the capital account, every position on one
 * line, what has been distributed, and how the figures are built. It is
 * set as a sheet of paper in both themes, because a document does not
 * invert, and the browser's own print dialog turns it into a PDF: no
 * renderer and no dependency (`@media print` in globals.css drops the
 * rail, Spot and the page ground).
 *
 * Every total is `ledgerBook`'s, the same call Portfolio and the dashboard
 * make, so the statement cannot disagree with the screen it was opened
 * from. Holdings held elsewhere are self-reported and are not on it.
 */
import Link from 'next/link';

import PrintButton from '@/components/PrintButton';
import { requireUser } from '@/lib/auth';
import { HELD_STATES } from '@/lib/domain';
import { EMPTY, dateStr, money, percent } from '@/lib/format';
import { irr, ledgerBook } from '@/lib/portfolio-metrics';
import { getDealsByIds } from '@/lib/repositories/deals';
import { getDistributions } from '@/lib/repositories/distributions';
import { listSubscriptions } from '@/lib/repositories/subscriptions';

import s from './Statement.module.css';

export const metadata = { title: 'Statement · AltSpot Capital' };

export default async function StatementPage() {
  const user = await requireUser();
  const [subscriptions, distributions] = await Promise.all([
    listSubscriptions(user.id),
    getDistributions(user.id),
  ]);

  const held = subscriptions.filter((sub) => HELD_STATES.includes(sub.state));
  const deals = await getDealsByIds([...new Set(held.map((sub) => sub.dealId))]);
  const book = ledgerBook(held, distributions.items);

  const asOf = new Date();
  const bookIrr = irr(
    [
      ...held
        .filter((sub) => sub.fundedAt)
        .map((sub) => ({ at: sub.fundedAt!, amount: -sub.amount })),
      ...distributions.items.map((item) => ({ at: item.paidAt, amount: item.amount })),
      { at: asOf.toISOString(), amount: book.fairValue },
    ],
    asOf,
  );

  const paidBySub = new Map<string, number>();
  for (const item of distributions.items) {
    paidBySub.set(item.subscriptionId, (paidBySub.get(item.subscriptionId) ?? 0) + item.amount);
  }

  const rows = held
    .map((sub) => {
      const deal = deals.get(sub.dealId);
      const exited = sub.realizedAt !== null;
      const fair = exited ? 0 : (sub.currentValue ?? sub.amount);
      const realized = paidBySub.get(sub.id) ?? 0;
      return {
        id: sub.id,
        name: deal?.name ?? sub.dealId,
        entity: deal?.entity ?? '',
        since: sub.fundedAt ?? sub.signedAt,
        invested: sub.amount,
        fair,
        realized,
        total: fair + realized,
        multiple: sub.amount ? (fair + realized) / sub.amount : 0,
        status: exited ? 'Exited' : sub.state === 'funded' ? 'In escrow' : 'Held',
      };
    })
    .sort((a, b) => b.invested - a.invested);

  const number = `AS-${asOf.getUTCFullYear()}${String(asOf.getUTCMonth() + 1).padStart(2, '0')}-${user.id
    .slice(-6)
    .toUpperCase()}`;

  return (
    <>
      <div className={`page-head ${s.chrome}`}>
        <div className="titles">
          <div className="eyebrow">Portfolio</div>
          <h1 className="display">Your statement.</h1>
          <p className="sub">
            One page, dated today. Save it as a PDF for your records or your accountant.
          </p>
        </div>
        <div className={s.actions}>
          <Link className="btn btn-ghost" href="/portfolio">
            Back to portfolio
          </Link>
          <PrintButton label="Save as PDF" />
        </div>
      </div>

      <article className={`${s.sheet} statement-sheet`}>
        <header className={s.head}>
          <div>
            <p className={s.brand}>
              AltSpot<span aria-hidden="true">.</span> Capital
            </p>
            <h2 className={s.title}>Capital account statement</h2>
          </div>
          <dl className={s.meta}>
            <div>
              <dt>Prepared for</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>As of</dt>
              <dd>{dateStr(asOf)}</dd>
            </div>
            <div>
              <dt>Statement</dt>
              <dd>{number}</dd>
            </div>
          </dl>
        </header>

        {rows.length === 0 ? (
          <p className={s.empty}>
            No positions yet. A statement is prepared once your first subscription reaches
            escrow.
          </p>
        ) : (
          <>
            <section className={s.summary} aria-label="Capital account">
              <Cell k="Invested" v={money(book.invested)} />
              <Cell k="Fair value" v={money(book.fairValue)} />
              <Cell k="Realized" v={money(book.realized)} />
              <Cell k="Total value" v={money(book.fairValue + book.realized)} lead />
              <Cell k="TVPI" v={`${book.tvpi.toFixed(2)}×`} />
              <Cell k="DPI" v={`${book.dpi.toFixed(2)}×`} />
              <Cell k="Net IRR" v={percent(bookIrr, 1, { signed: true })} />
            </section>

            <h3 className={s.section}>Positions</h3>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Since</th>
                  <th className={s.n}>Invested</th>
                  <th className={s.n}>Fair value</th>
                  <th className={s.n}>Realized</th>
                  <th className={s.n}>Total value</th>
                  <th className={s.n}>MOIC</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <b>{row.name}</b>
                      {row.entity ? <small>{row.entity}</small> : null}
                    </td>
                    <td>{row.since ? dateStr(row.since) : EMPTY}</td>
                    <td className={s.n}>{money(row.invested)}</td>
                    <td className={s.n}>{row.status === 'Exited' ? EMPTY : money(row.fair)}</td>
                    <td className={s.n}>{row.realized ? money(row.realized) : EMPTY}</td>
                    <td className={s.n}>{money(row.total)}</td>
                    <td className={s.n}>{row.multiple.toFixed(2)}×</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td className={s.n}>{money(book.invested)}</td>
                  <td className={s.n}>{money(book.fairValue)}</td>
                  <td className={s.n}>{money(book.realized)}</td>
                  <td className={s.n}>{money(book.fairValue + book.realized)}</td>
                  <td className={s.n}>{book.tvpi.toFixed(2)}×</td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <h3 className={s.section}>Distributions to date</h3>
            <div className={s.pair}>
              <Cell k="Return of capital" v={money(distributions.returnOfCapital)} />
              <Cell k="Gain" v={money(distributions.gain)} />
              <Cell k="Payments received" v={String(distributions.items.length)} />
            </div>
          </>
        )}

        <footer className={s.notes}>
          <p>
            <b>How these figures are built.</b> Invested is cost basis, including positions that
            have since exited. Fair value is the latest mark reported by each vehicle, is
            unaudited, and is not a price at which a position could be sold; it is zero once a
            position exits, when its result sits in Realized. Total value is the two together.
            MOIC is total value over invested for one position and TVPI is the same ratio across
            the book. Net IRR is money-weighted and annualized, with fair value as the closing
            flow. A subscription in escrow is carried at cost until its deal closes.
          </p>
          <p>
            Holdings entered under Held elsewhere are self-reported and are not part of this
            statement. This is not a tax document; Schedule K-1s are filed in Docs. Private
            investments are illiquid and can lose all of their value. Demo environment: every
            position here is seeded and no figure describes a real outcome.
          </p>
          <p className={s.sign}>
            Prepared by AltSpot Capital · {number} · {dateStr(asOf)}
          </p>
        </footer>
      </article>
    </>
  );
}

function Cell({ k, v, lead }: { k: string; v: string; lead?: boolean }) {
  return (
    <div className={s.cell} data-lead={lead ? 'true' : undefined}>
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
}
