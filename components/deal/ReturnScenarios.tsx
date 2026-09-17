/**
 * Illustrative return scenarios (counsel's build spec, 2026-09-17),
 * simplified to what the spec requires and no more (Tyler: "way more
 * digestible").
 *
 * Renders only when SHOW_RETURN_SCENARIOS is on AND the deal carries a
 * set that passed every check in lib/scenarios.ts. Inside the memo, never
 * in the hero, a share card, an email or a public page. On one screen:
 *
 *   - ILLUSTRATIVE, the as-of date, and that no scenario is more likely;
 *   - every input as a row of small tiles, and whose numbers they are;
 *   - the cases, downside first, the total loss among them, with the NET
 *     multiple and IRR (the spec allows net alone where one number fits;
 *     gross is one press away under Methodology, never without net);
 *   - what net is after, and that nothing assumes a tax treatment;
 *   - comparables with source, date and criteria, when any were used;
 *   - the methodology, the gross figures and the limits, folded;
 *   - counsel's disclaimer, adjacent.
 *
 * Nothing here reads the diligence score, names AltSpot's past deals, or
 * assumes any tax treatment. Server component; the page records the
 * showing (lib/repositories/scenario-views.ts).
 */
import { CircleAlert } from 'lucide-react';

import Term from '@/components/Term';
import { SHOW_CARRY_TERMS, SHOW_FEE_TERMS } from '@/lib/config';
import { feeSentence } from '@/lib/fees';
import { dateStr, money } from '@/lib/format';
import {
  evaluateScenarios,
  formatIrr,
  formatMultiple,
  ownershipAtClose,
  ownershipAtExit,
  SCENARIO_DISCLAIMER,
  type ScenarioSet,
} from '@/lib/scenarios';

import Section from './Section';
import s from './ReturnScenarios.module.css';

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function compactMoney(x: number): string {
  if (x >= 1e9) return `$${(x / 1e9).toFixed(x % 1e9 === 0 ? 0 : 1)}B`;
  if (x >= 1e6) return `$${(x / 1e6).toFixed(x % 1e6 === 0 ? 0 : 1)}M`;
  return money(x);
}

export default function ReturnScenarios({ set }: { set: ScenarioSet }) {
  const results = evaluateScenarios(set);
  const { inputs } = set;
  const post = inputs.entryPreMoney + inputs.roundSize;

  const netOf =
    SHOW_FEE_TERMS || SHOW_CARRY_TERMS
      ? feeSentence()
      : 'the platform fee, the management fee reserve and carried interest, each as described in the offering documents.';

  const tiles: { k: string; v: string; note?: string }[] = [
    { k: 'Entry', v: `${compactMoney(inputs.entryPreMoney)} pre`, note: `${compactMoney(post)} post` },
    ...(inputs.roundSize > 0 ? [{ k: 'Round', v: compactMoney(inputs.roundSize) }] : []),
    { k: 'SPV invests', v: compactMoney(inputs.spvInvestment), note: `${pct(ownershipAtClose(inputs))} at close` },
    {
      k: 'Dilution to exit',
      v: `${inputs.dilutionToExitPercent}%`,
      note: `${pct(ownershipAtExit(inputs))} at exit`,
    },
    { k: 'Assumed exit', v: `Year ${inputs.exitYear}` },
    { k: 'Exit figure', v: inputs.basis },
    ...(inputs.metric
      ? [{ k: inputs.metric.label, v: inputs.metric.value, note: inputs.metric.source }]
      : []),
  ];

  return (
    <Section eyebrow="Illustrative scenarios" title="Three ways it could go, and the loss." id="scenarios">
      <p className={s.banner} role="note">
        <CircleAlert size={15} strokeWidth={1.8} aria-hidden="true" />
        <span>
          <b>Illustrative, not a projection.</b> Hypothetical figures from the assumptions below,
          as of {dateStr(set.asOf)}. No scenario is more likely than any other.
        </span>
      </p>

      <dl className={s.tiles}>
        {tiles.map((t) => (
          <div className={s.tile} key={t.k}>
            <dt>{t.k}</dt>
            <dd>
              {t.v}
              {t.note ? <small>{t.note}</small> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className={s.whose}>
        <b>Whose numbers.</b> {set.numbersFrom} Model built by {set.preparedBy}.
      </p>

      <div className={s.tableWrap}>
        <table className={`tbl ${s.table}`}>
          <thead>
            <tr>
              <th>Scenario</th>
              <th className="num">Exit value</th>
              <th className="num">
                <Term q="What are the fees?" quiet>
                  Net multiple
                </Term>
              </th>
              <th className="num">Net IRR</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.label} data-loss={r.totalLoss}>
                <td>
                  <b>{r.label}</b>
                  <span className={s.note}>{r.note}</span>
                </td>
                <td className="num">{r.totalLoss ? 'Nothing recovered' : compactMoney(r.exitValuation)}</td>
                <td className={`num ${s.net}`}>{formatMultiple(r.netMultiple)}</td>
                <td className={`num ${s.net}`}>{formatIrr(r.netIrr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={s.netNote}>
        <b>Net</b> is after {netOf} Before tax; no scenario assumes any tax treatment. Gross
        figures are under Methodology.
      </p>

      {set.comparables.length > 0 ? (
        <div className={s.comps}>
          <h3 className={s.key}>Comparable data used</h3>
          <ul className={s.compList}>
            {set.comparables.map((c) => (
              <li key={c.name}>
                <b>{c.name}</b> {c.value}. <span>{c.source}, {dateStr(c.pulledOn)}.</span>
              </li>
            ))}
          </ul>
          <p className={s.criteria}>
            <b>Why these.</b> {set.comparablesCriteria} None of these companies reviewed, endorsed
            or agreed with the scenarios.
          </p>
        </div>
      ) : null}

      <details className={s.method}>
        <summary>Methodology, gross figures, and the limits of hypothetical numbers</summary>
        <div className={s.methodBody}>
          <h4>Gross beside net</h4>
          <table className={`tbl ${s.table}`}>
            <thead>
              <tr>
                <th>Scenario</th>
                <th className="num">Gross multiple</th>
                <th className="num">Net multiple</th>
                <th className="num">Gross IRR</th>
                <th className="num">Net IRR</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td className="num">{formatMultiple(r.grossMultiple)}</td>
                  <td className="num">{formatMultiple(r.netMultiple)}</td>
                  <td className="num">{formatIrr(r.grossIrr)}</td>
                  <td className="num">{formatIrr(r.netIrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>How the figures are built</h4>
          <ol>
            {set.methodology.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>
              Net figures deduct the formation and administration fee from what the SPV deploys,
              apply carried interest only to proceeds above the SPV&apos;s raise, and count the
              management fee reserve in what you paid in, returning any part unearned at the
              assumed exit.
            </li>
          </ol>
          <h4>Limits of hypothetical figures</h4>
          <ul>
            {set.limitations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>
            Version {set.version}, as of {dateStr(set.asOf)}. The set you were shown is recorded to
            your account with these assumptions.
          </p>
        </div>
      </details>

      <p className={s.disclaimer}>{SCENARIO_DISCLAIMER}</p>
    </Section>
  );
}
