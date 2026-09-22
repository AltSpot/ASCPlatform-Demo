/**
 * Illustrative return scenarios (counsel's build spec, 2026-09-17), drawn
 * for someone who has never read a term sheet (Tyler, 2026-09-19).
 *
 * The question a member actually has is "what happens to my money", so
 * the section answers it in dollars: one example investment (the deal's
 * minimum), and for each case a bar showing what went in (grey), what is
 * lost (ember) or gained (gold), and the amount that comes back, net. The
 * cases run downside first and the total loss is among them. Everything
 * the spec requires is still on the screen:
 *
 *   - ILLUSTRATIVE, the as-of date, and that no scenario is more likely;
 *   - every input, as one row of small tiles, and whose numbers they are;
 *   - NET figures (the spec allows net alone where one number fits; gross
 *     sits beside net under Methodology, never without it);
 *   - what net is after, and that nothing assumes a tax treatment;
 *   - comparables with source, date and criteria, when any were used;
 *   - the methodology and the limits, folded;
 *   - counsel's disclaimer, adjacent.
 *
 * Renders only when SHOW_RETURN_SCENARIOS is on AND the deal's set passed
 * every check in lib/scenarios.ts. Never in the hero, a share card, an
 * email or a public page. Nothing here reads the diligence score, names
 * AltSpot's past deals, or assumes any tax treatment. Server component;
 * the page records the showing (lib/repositories/scenario-views.ts).
 */
import { CircleAlert } from 'lucide-react';

import { CARRY_PERCENT, FEE_TERMS, SHOW_CARRY_TERMS, SHOW_FEE_TERMS } from '@/lib/config';
import { feeBreakdown } from '@/lib/fees';
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

/** To the nearest hundred: an illustration is not a quote to the dollar. */
function roundHundred(x: number): number {
  return Math.round(x / 100) * 100;
}

export default function ReturnScenarios({
  set,
  example,
}: {
  set: ScenarioSet;
  /** The example investment the bars are drawn on: the deal's minimum. */
  example: number;
}) {
  const results = evaluateScenarios(set);
  const { inputs } = set;
  const post = inputs.entryPreMoney + inputs.roundSize;

  const sent = feeBreakdown(example).allIn;
  const rows = results.map((r) => ({ ...r, back: roundHundred(sent * r.netMultiple) }));
  const scale = Math.max(sent, ...rows.map((r) => r.back));

  /* One sentence: what net is after. The full fee wording is on the Terms
     cards and in checkout; here it would bury the bars. */
  const netOf = SHOW_FEE_TERMS
    ? `the ${FEE_TERMS.annualPercent}% a year management fee (${FEE_TERMS.termYears} years), the ${money(FEE_TERMS.flatPerSpv)} formation and administration fee per SPV, and ${SHOW_CARRY_TERMS ? `${CARRY_PERCENT}% ` : ''}carried interest, as the offering documents describe them.`
    : 'the platform fee, the management fee reserve and carried interest, each as described in the offering documents.';

  const tiles: { k: string; v: string; note?: string }[] = [
    { k: 'Entry', v: `${compactMoney(inputs.entryPreMoney)} pre`, note: `${compactMoney(post)} post` },
    ...(inputs.roundSize > 0 ? [{ k: 'Round', v: compactMoney(inputs.roundSize) }] : []),
    { k: 'SPV invests', v: compactMoney(inputs.spvInvestment), note: `${pct(ownershipAtClose(inputs))} at close` },
    { k: 'Dilution to exit', v: `${inputs.dilutionToExitPercent}%`, note: `${pct(ownershipAtExit(inputs))} at exit` },
    { k: 'Assumed exit', v: `Year ${inputs.exitYear}` },
    ...(inputs.metric
      ? [{ k: inputs.metric.label, v: inputs.metric.value, note: inputs.metric.source }]
      : []),
  ];

  return (
    <Section
      eyebrow="Illustrative scenarios"
      title={`Four illustrative outcomes for a ${money(example)} investment.`}
      id="scenarios"
    >
      <p className={s.banner} role="note">
        <CircleAlert size={15} strokeWidth={1.8} aria-hidden="true" />
        <span>
          <b>Illustrative, not a projection.</b> Hypothetical, as of {dateStr(set.asOf)}. No
          scenario is more likely than any other, and one of them is losing everything.
        </span>
      </p>

      <div className={s.start}>
        <span className={s.startKey}>You send to escrow</span>
        <span className={s.startValue}>{money(sent)}</span>
        <span className={s.startNote}>
          Your investment. The fees come out of it, not on top of it.
        </span>
      </div>

      <ol className={s.cases}>
        {rows.map((r) => {
          const kept = Math.min(r.back, sent);
          const gain = Math.max(0, r.back - sent);
          const lost = Math.max(0, sent - r.back);
          return (
            <li className={s.case} key={r.label} data-loss={r.totalLoss}>
              <div className={s.caseHead}>
                <b>{r.label}</b>
                <span>
                  {r.totalLoss
                    ? r.note
                    : `${r.note} Company value at exit: ${compactMoney(r.exitValuation)}.`}
                </span>
              </div>
              <div
                className={s.bar}
                role="img"
                aria-label={`${r.label}: ${money(r.back)} back on ${money(sent)} sent`}
              >
                {kept > 0 ? <span className={s.kept} style={{ width: `${(kept / scale) * 100}%` }} /> : null}
                {lost > 0 ? <span className={s.lost} style={{ width: `${(lost / scale) * 100}%` }} /> : null}
                {gain > 0 ? <span className={s.gain} style={{ width: `${(gain / scale) * 100}%` }} /> : null}
              </div>
              <div className={s.caseFoot}>
                <span className={s.back}>
                  {r.totalLoss ? 'Nothing comes back' : `${money(r.back)} comes back`}
                </span>
                <span className={s.rate}>
                  {r.totalLoss
                    ? 'Total loss'
                    : `${formatMultiple(r.netMultiple)} net · ${formatIrr(r.netIrr)} a year, net`}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <ul className={s.legend} aria-hidden="true">
        <li data-tone="kept">What you sent</li>
        <li data-tone="gain">Gain</li>
        <li data-tone="lost">Loss</li>
      </ul>

      <p className={s.netNote}>
        <b>Net</b> means after {netOf} Before tax; no scenario assumes any tax treatment.
      </p>

      <h3 className={s.key}>The assumptions behind the bars</h3>
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
        <b>Whose numbers.</b> {set.numbersFrom} The exit figure is the {inputs.basis.charAt(0).toLowerCase()}
        {inputs.basis.slice(1)}. Model built by {set.preparedBy}.
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
              assumed exit. The dollar amounts apply the net multiple to what you send to escrow
              and are rounded to the nearest hundred.
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
