import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  evaluateScenarios,
  ownershipAtClose,
  usableScenarioSet,
  validateScenarioSet,
  type ScenarioSet,
} from '../lib/scenarios';

const SET: ScenarioSet = {
  version: 't.1',
  asOf: '2026-09-17',
  preparedBy: 'AltSpot',
  numbersFrom: 'Company-provided, not verified.',
  inputs: {
    entryPreMoney: 30_000_000,
    roundSize: 6_000_000,
    spvInvestment: 2_000_000,
    dilutionToExitPercent: 30,
    exitYear: 6,
    basis: 'Equity value at exit',
  },
  cases: [
    { label: 'Scenario C', exitValuation: 150_000_000, note: '' },
    { label: 'Scenario A', exitValuation: 0, note: 'Nothing recovered.' },
    { label: 'Scenario B', exitValuation: 45_000_000, note: '' },
  ],
  comparables: [{ name: 'X (fictional)', value: '3x', source: 'Demo', pulledOn: '2026-09-10' }],
  comparablesCriteria: 'Invented.',
  methodology: ['Ownership times exit value.'],
  limitations: ['Assumptions may be wrong.'],
};

describe('illustrative scenarios', () => {
  test('a complete set passes, and the total loss is required', () => {
    assert.deepEqual(validateScenarioSet(SET), []);
    const noLoss = { ...SET, cases: SET.cases.filter((c) => c.exitValuation > 0) };
    assert.ok(validateScenarioSet(noLoss).length > 0);
    assert.equal(usableScenarioSet(noLoss), null);
    assert.equal(usableScenarioSet({}), null);
  });

  test('forbidden framing is refused', () => {
    for (const label of ['Base case', 'Target', 'Expected', 'Worst case', 'Likely']) {
      const bad = { ...SET, cases: [...SET.cases, { label, exitValuation: 1, note: '' }] };
      assert.ok(validateScenarioSet(bad).some((e) => /forbidden/.test(e)), label);
    }
    const noDilution = { ...SET, inputs: { ...SET.inputs, dilutionToExitPercent: 0 } };
    assert.ok(validateScenarioSet(noDilution).some((e) => /dilution/.test(e)));
  });

  test('cases evaluate downside first, net never above gross', () => {
    const results = evaluateScenarios(SET);
    assert.deepEqual(
      results.map((r) => r.label),
      ['Scenario A', 'Scenario B', 'Scenario C'],
    );
    assert.equal(results[0].totalLoss, true);
    assert.equal(results[0].grossMultiple, 0);
    assert.equal(results[0].netIrr, -1);
    for (const r of results) {
      assert.ok(r.netMultiple <= r.grossMultiple + 1e-9, r.label);
      assert.ok(r.netIrr <= r.grossIrr + 1e-9, r.label);
    }
  });

  test('the arithmetic is the stated one', () => {
    /* 2M of 36M post is 5.56%; 30% dilution leaves 3.89%; of 150M that is
       5.83M on 2M: 2.92x gross. */
    assert.ok(Math.abs(ownershipAtClose(SET.inputs) - 2 / 36) < 1e-9);
    const c = evaluateScenarios(SET).find((r) => r.label === 'Scenario C')!;
    assert.ok(Math.abs(c.grossMultiple - (0.7 * 150) / 36) < 1e-6);
    /* Net with a 10,000 flat fee, 5% reserve and 20% carry sits below. */
    assert.ok(c.netMultiple < c.grossMultiple);
    assert.ok(c.netMultiple > 2);
  });
});
