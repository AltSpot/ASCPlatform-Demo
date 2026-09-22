/**
 * Illustrative return scenarios, stated once (counsel's build spec,
 * 2026-09-17; docs/structure-decisions-sept-2026.md).
 *
 * A scenario set is data on the deal (Deal.scenariosJson). This module
 * validates it against the spec and evaluates it, gross and net, from
 * the same fee and carry terms the rest of the platform uses
 * (lib/config.ts, lib/fees.ts). The component renders a set only if
 * `validateScenarioSet` returns no errors: all of the spec, or nothing.
 *
 * WHAT NET MEANS HERE, per dollar subscribed:
 *   the SPV raises R and pays the flat fee F, so it deploys R - F;
 *   ownership at close is what R - F buys at the post-money;
 *   dilution to exit reduces that ownership;
 *   proceeds at exit are that ownership times the exit valuation;
 *   carry applies only to proceeds above R;
 *   the member's all-in cost is R plus the management fee reserve,
 *   less any reserve unearned at exit (the reserve covers termYears).
 * Gross is the same arithmetic with no fee, no reserve and no carry.
 *
 * Nothing here reads the internal diligence score, names a probability,
 * or compares to any past AltSpot deal. Pure and isomorphic.
 */
import { CARRY_PERCENT, FEE_TERMS } from './config';
import { reservePercent, type FeeTerms } from './fees';

export interface ScenarioInputs {
  /** Dollars. */
  entryPreMoney: number;
  roundSize: number;
  /** The SPV's allocation into the round, dollars. */
  spvInvestment: number;
  /** Assumed dilution from future rounds between close and exit, percent. */
  dilutionToExitPercent: number;
  /** Years from close to the assumed exit. */
  exitYear: number;
  /** What the exit figure is: e.g. "Equity value at exit". */
  basis: string;
  /** The company metric the cases key off, with whose number it is. */
  metric?: { label: string; value: string; source: string };
}

export interface ScenarioCase {
  /** Neutral: "Scenario A", "Lower". Never base, target, expected. */
  label: string;
  /** Equity value at exit, dollars. 0 is the total loss of capital. */
  exitValuation: number;
  note: string;
}

export interface ScenarioComparable {
  name: string;
  value: string;
  source: string;
  /** ISO date the figure was pulled. */
  pulledOn: string;
}

export interface ScenarioSet {
  /** Bumped whenever any assumption changes; the record is keyed on it. */
  version: string;
  /** ISO date the whole component is "as of". */
  asOf: string;
  /** Who built the model. */
  preparedBy: string;
  /** Whose numbers the inputs are, e.g. company-provided, not verified. */
  numbersFrom: string;
  inputs: ScenarioInputs;
  cases: ScenarioCase[];
  comparables: ScenarioComparable[];
  /** Why those comparables and no others. */
  comparablesCriteria: string;
  methodology: string[];
  limitations: string[];
}

export interface ScenarioResult {
  label: string;
  note: string;
  exitValuation: number;
  totalLoss: boolean;
  grossMultiple: number;
  netMultiple: number;
  /** Annualized, as a fraction (0.18 is 18%). -1 on a total loss. */
  grossIrr: number;
  netIrr: number;
}

/** Words the spec forbids on a case, as a label or a note. */
const FORBIDDEN =
  /\b(base case|target|expected|projected|projection|our model|likely|unlikely|probab\w*|confiden\w*|worst case|best case|floor|downside protection|protected|guarantee\w*)\b/i;

export function ownershipAtClose(inputs: ScenarioInputs, deployed = inputs.spvInvestment): number {
  const post = inputs.entryPreMoney + inputs.roundSize;
  return post > 0 ? deployed / post : 0;
}

export function ownershipAtExit(inputs: ScenarioInputs, deployed = inputs.spvInvestment): number {
  return ownershipAtClose(inputs, deployed) * (1 - inputs.dilutionToExitPercent / 100);
}

function irr(multiple: number, years: number): number {
  if (multiple <= 0) return -1;
  if (years <= 0) return multiple - 1;
  return Math.pow(multiple, 1 / years) - 1;
}

export function evaluateCase(
  set: ScenarioSet,
  c: ScenarioCase,
  terms: FeeTerms = FEE_TERMS,
  carryPercent: number = CARRY_PERCENT,
): ScenarioResult {
  const { inputs } = set;
  const R = inputs.spvInvestment;
  const years = Math.max(0, inputs.exitYear);

  if (c.exitValuation <= 0 || R <= 0) {
    return {
      label: c.label,
      note: c.note,
      exitValuation: 0,
      totalLoss: true,
      grossMultiple: 0,
      netMultiple: 0,
      grossIrr: -1,
      netIrr: -1,
    };
  }

  /* Gross: every dollar deployed, no fee, no reserve, no carry. */
  const grossProceeds = ownershipAtExit(inputs) * c.exitValuation;
  const grossMultiple = grossProceeds / R;

  /* Net: members send R and nothing more (Tyler, 2026-09-21). The
     management fee reserve and the flat fee come out of R at close, so
     less is deployed; carry comes off the profit; any unearned reserve
     comes back at exit. */
  const reserve = R * (reservePercent(terms) / 100);
  const deployed = Math.max(0, R - reserve - terms.flatPerSpv);
  const proceeds = ownershipAtExit(inputs, deployed) * c.exitValuation;
  const carry = Math.max(0, proceeds - R) * (carryPercent / 100);
  const unearned = R * (Math.max(0, terms.termYears - years) * terms.annualPercent) / 100;
  const toMembers = proceeds - carry + Math.min(reserve, unearned);
  const netMultiple = R > 0 ? Math.max(0, toMembers / R) : 0;

  return {
    label: c.label,
    note: c.note,
    exitValuation: c.exitValuation,
    totalLoss: false,
    grossMultiple,
    netMultiple,
    grossIrr: irr(grossMultiple, years),
    netIrr: irr(netMultiple, years),
  };
}

export function evaluateScenarios(
  set: ScenarioSet,
  terms: FeeTerms = FEE_TERMS,
  carryPercent: number = CARRY_PERCENT,
): ScenarioResult[] {
  return [...set.cases]
    .sort((a, b) => a.exitValuation - b.exitValuation)
    .map((c) => evaluateCase(set, c, terms, carryPercent));
}

/**
 * The spec, as checks. Empty means the set may render. Each string names
 * the rule broken, so a lead fixing a deal's data knows what to change.
 */
export function validateScenarioSet(set: unknown): string[] {
  const errors: string[] = [];
  if (!set || typeof set !== 'object') return ['no scenario set'];
  const s = set as Partial<ScenarioSet>;

  if (!s.version) errors.push('version is missing');
  if (!s.asOf || Number.isNaN(Date.parse(s.asOf))) errors.push('asOf date is missing');
  if (!s.preparedBy) errors.push('preparedBy is missing');
  if (!s.numbersFrom) errors.push('numbersFrom (whose numbers these are) is missing');

  const i = s.inputs;
  if (!i) errors.push('inputs are missing');
  else {
    for (const k of ['entryPreMoney', 'roundSize', 'spvInvestment', 'dilutionToExitPercent', 'exitYear'] as const) {
      if (typeof i[k] !== 'number' || !Number.isFinite(i[k])) errors.push(`inputs.${k} is missing`);
    }
    if (typeof i.dilutionToExitPercent === 'number' && i.dilutionToExitPercent <= 0) {
      errors.push('dilution must be modelled: a scenario that ignores future rounds is misleading');
    }
    if (!i.basis) errors.push('inputs.basis (what the exit figure is) is missing');
  }

  const cases = Array.isArray(s.cases) ? s.cases : [];
  if (cases.length < 3) errors.push('at least three scenarios are required');
  if (!cases.some((c) => c && c.exitValuation === 0)) errors.push('one scenario must be the total loss of capital');
  for (const c of cases) {
    if (!c || typeof c.label !== 'string' || typeof c.exitValuation !== 'number') {
      errors.push('a scenario is malformed');
      continue;
    }
    if (FORBIDDEN.test(c.label) || FORBIDDEN.test(c.note ?? '')) {
      errors.push(`scenario "${c.label}" uses forbidden language`);
    }
  }

  const comps = Array.isArray(s.comparables) ? s.comparables : [];
  for (const c of comps) {
    if (!c?.name || !c.value || !c.source || !c.pulledOn || Number.isNaN(Date.parse(c.pulledOn))) {
      errors.push('every comparable needs a name, a value, a source and the date it was pulled');
      break;
    }
  }
  if (comps.length > 0 && !s.comparablesCriteria) errors.push('comparables need their selection criteria');

  if (!Array.isArray(s.methodology) || s.methodology.length === 0) errors.push('methodology is missing');
  if (!Array.isArray(s.limitations) || s.limitations.length === 0) {
    errors.push('the risks and limitations of hypothetical figures are missing');
  }

  return errors;
}

/** A set that may render, or null. `{}` (no set on the deal) is null quietly. */
export function usableScenarioSet(raw: unknown): ScenarioSet | null {
  if (!raw || typeof raw !== 'object' || Object.keys(raw as object).length === 0) return null;
  return validateScenarioSet(raw).length === 0 ? (raw as ScenarioSet) : null;
}

/** Rendered adjacent to the component, not in a footer. Counsel's words. */
export const SCENARIO_DISCLAIMER =
  'Illustrative only. These scenarios are hypothetical, are not predictions or projections of performance, and do not reflect actual results. They are based on the assumptions shown, which may prove incorrect. Actual outcomes may differ materially and may include the total loss of your investment. No scenario is more likely than any other. Figures shown net of fees and carried interest are estimates based on the terms described in the offering documents. Comparable company data is from the sources and dates shown and does not imply any relationship with, or endorsement by, those companies. Not investment, legal, or tax advice.';

export function formatMultiple(x: number): string {
  return `${x.toFixed(x >= 10 ? 0 : 1)}x`;
}

export function formatIrr(x: number): string {
  if (x <= -1) return 'Total loss';
  return `${x >= 0 ? '' : '−'}${Math.abs(x * 100).toFixed(0)}%`;
}
