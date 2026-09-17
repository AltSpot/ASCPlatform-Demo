/**
 * Illustrative return scenarios (counsel's build spec, 2026-09-17).
 *
 * Renders only when SHOW_RETURN_SCENARIOS is on AND the deal carries a
 * set that passed every check in lib/scenarios.ts; otherwise the page
 * has no such section. Inside the memo, never in the hero, a share card,
 * an email or a public page. What it shows, all of it on one screen:
 *
 *   - the label ILLUSTRATIVE, always, and the as-of date;
 *   - every input: entry valuation, round, ownership at close, assumed
 *     dilution, exit year, the basis, and whose numbers they are;
 *   - the cases, downside first, the total loss among them, with gross
 *     AND net multiple and IRR side by side, net of the platform fee, the
 *     management fee reserve and carried interest as the offering
 *     documents describe them (figures only behind their own switches);
 *   - the line that no scenario is more likely than another;
 *   - comparables with source, date pulled and the selection criteria;
 *   - the methodology and the limitations of hypothetical figures;
 *   - the disclaimer, adjacent, not in a footer.
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

export default function ReturnScenarios({ set }: { set: ScenarioSet }) {
  const results = evaluateScenarios(set);
  const { inputs } = set;
  const post = inputs.entryPreMoney + inputs.roundSize;

  const netOf =
    SHOW_FEE_TERMS || SHOW_CARRY_TERMS
      ? feeSentence()
      : 'the platform fee, the management fee reserve and carried interest, each as described in the offering documents.';

  return (
    <Section
      eyebrow="Illustrative scenarios"
      title="If it worked out badly, middling, or well. Illustrative only."
      id="scenarios"
    >
      <div className={s.banner} role="note">
        <CircleAlert size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>
          <b>Illustrative. Not a projection.</b> Hypothetical figures from the assumptions shown,
          as of {dateStr(set.asOf)}. No scenario is more likely than any other, and one of them is
          the total loss of your investment.
        </span>
      </div>

      <div className={s.grid}>
        <div className={s.inputs}>
          <h3 className={s.key}>Every input</h3>
          <dl className={s.facts}>
            <div>
              <dt>Entry valuation</dt>
              <dd>
                {money(inputs.entryPreMoney)} pre-money, {money(post)} post
              </dd>
            </div>
            <div>
              <dt>Round</dt>
              <dd>{money(inputs.roundSize)}</dd>
            </div>
            <div>
              <dt>SPV investment</dt>
              <dd>{money(inputs.spvInvestment)}</dd>
            </div>
            <div>
              <dt>Ownership at close</dt>
              <dd>{pct(ownershipAtClose(inputs))}</dd>
            </div>
            <div>
              <dt>Assumed dilution to exit</dt>
              <dd>
                {inputs.dilutionToExitPercent}%, to {pct(ownershipAtExit(inputs))} at exit
              </dd>
            </div>
            <div>
              <dt>Assumed exit</dt>
              <dd>Year {inputs.exitYear} after close</dd>
            </div>
            <div>
              <dt>The exit figure is</dt>
              <dd>{inputs.basis}</dd>
            </div>
            {inputs.metric ? (
              <div>
                <dt>{inputs.metric.label}</dt>
                <dd>
                  {inputs.metric.value}
                  <small>{inputs.metric.source}</small>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className={s.whose}>
            <b>Whose numbers.</b> {set.numbersFrom} Model built by {set.preparedBy}.
          </p>
        </div>

        <div className={s.tableWrap}>
          <h3 className={s.key}>The cases, downside first</h3>
          <table className={`tbl ${s.table}`}>
            <thead>
              <tr>
                <th>Scenario</th>
                <th className="num">Exit value</th>
                <th className="num">Gross multiple</th>
                <th className="num">
                  <Term q="What are the fees?" quiet>
                    Net multiple
                  </Term>
                </th>
                <th className="num">Gross IRR</th>
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
                  <td className="num">{r.totalLoss ? 'Nothing recovered' : money(r.exitValuation)}</td>
                  <td className="num">{formatMultiple(r.grossMultiple)}</td>
                  <td className={`num ${s.net}`}>{formatMultiple(r.netMultiple)}</td>
                  <td className="num">{formatIrr(r.grossIrr)}</td>
                  <td className={`num ${s.net}`}>{formatIrr(r.netIrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={s.netNote}>
            <b>Net</b> is after {netOf} Gross is before any of them. Both are before tax, and no
            scenario assumes any tax treatment.
          </p>
        </div>
      </div>

      {set.comparables.length > 0 ? (
        <div className={s.comps}>
          <h3 className={s.key}>Comparable data used</h3>
          <table className={`tbl ${s.table}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th className="num">Value</th>
                <th>Source</th>
                <th className="num">Pulled</th>
              </tr>
            </thead>
            <tbody>
              {set.comparables.map((c) => (
                <tr key={c.name}>
                  <td>
                    <b>{c.name}</b>
                  </td>
                  <td className="num">{c.value}</td>
                  <td className="small">{c.source}</td>
                  <td className="num">{dateStr(c.pulledOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={s.criteria}>
            <b>Why these.</b> {set.comparablesCriteria} None of these companies reviewed, endorsed
            or agreed with the scenarios.
          </p>
        </div>
      ) : null}

      <details className={s.method}>
        <summary>Methodology, the full assumption set, and the limits of hypothetical figures</summary>
        <div className={s.methodBody}>
          <h4>How the figures are built</h4>
          <ol>
            {set.methodology.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>
              Net figures deduct the platform fee from what the SPV deploys, apply carried
              interest only to proceeds above the SPV&apos;s raise, and count the management fee
              reserve in what you paid in, returning any part unearned at the assumed exit.
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
