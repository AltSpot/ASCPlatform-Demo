/**
 * SPV admissions (work order screens 12 and 13): the admission cut-off,
 * the member register lock, the per-SPV investor cap and the retirement
 * money limit.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { admissionCutoff } from '@/lib/funding';
import {
  buildRegister,
  decideAdmission,
  effectiveCap,
  isRetirementProfile,
  type SpvStanding,
} from '@/lib/spv-rules';

const CLOSE = 'Oct 6, 2026';
const CUTOFF = admissionCutoff(CLOSE)!;
const BEFORE = CUTOFF - 60_000;

const ROOMY: SpvStanding = { members: 40, cap: 100, committed: 1_000_000, retirement: 100_000 };

function decide(overrides: Partial<Parameters<typeof decideAdmission>[0]> = {}) {
  return decideAdmission({
    targetClose: CLOSE,
    status: 'open',
    standing: ROOMY,
    alreadyMember: false,
    amount: 25_000,
    retirement: false,
    now: BEFORE,
    ...overrides,
  });
}

describe('admission cut-off', () => {
  test('open before the cut-off, closed at and after it', () => {
    assert.equal(decide().ok, true);
    const closed = decide({ now: CUTOFF });
    assert.equal(closed.ok, false);
    assert.equal(!closed.ok && closed.code, 'admissions_closed');
  });

  test('a closed deal admits no one', () => {
    const d = decide({ status: 'closed' });
    assert.equal(!d.ok && d.code, 'admissions_closed');
  });
});

describe('investor cap', () => {
  const FULL: SpvStanding = { ...ROOMY, members: 100 };

  test('a new member past the cap is sent to the waitlist', () => {
    const d = decide({ standing: FULL });
    assert.equal(!d.ok && d.code, 'investor_cap');
    assert.match(!d.ok ? d.message : '', /waitlist/);
  });

  test('a member already in keeps their spot', () => {
    assert.equal(decide({ standing: FULL, alreadyMember: true }).ok, true);
  });

  test('the cap defaults to 100 and never exceeds 250', () => {
    assert.equal(effectiveCap(0), 100);
    assert.equal(effectiveCap(undefined), 100);
    assert.equal(effectiveCap(250), 250);
    assert.equal(effectiveCap(400), 250);
  });
});

describe('retirement money', () => {
  test('recognises the retirement profile types', () => {
    assert.equal(isRetirementProfile('IRA / 401(k)'), true);
    assert.equal(isRetirementProfile('Roth IRA'), true);
    assert.equal(isRetirementProfile('Individual'), false);
    assert.equal(isRetirementProfile('Hale Family Trust'), false);
  });

  test('under 20% passes quietly', () => {
    const d = decide({ retirement: true, amount: 10_000 });
    assert.equal(d.ok, true);
    assert.equal(d.ok && d.warning, null);
  });

  test('at 20% it warns, and still admits', () => {
    const d = decide({ retirement: true, amount: 125_000 });
    assert.equal(d.ok, true);
    assert.match((d.ok && d.warning) || '', /20|2\d%/);
  });

  test('at 25% it refuses', () => {
    const d = decide({ retirement: true, amount: 200_000 });
    assert.equal(!d.ok && d.code, 'retirement_cap');
  });

  test('money that is not retirement money never trips it', () => {
    assert.equal(decide({ retirement: false, amount: 5_000_000 }).ok, true);
  });
});

describe('member register', () => {
  const rows = [
    { subscriptionId: 'a', member: 'A', amount: 75_000, admittedAt: new Date(CUTOFF - 5 * 86_400_000).toISOString(), retirement: false },
    { subscriptionId: 'b', member: 'B', amount: 25_000, admittedAt: new Date(CUTOFF - 86_400_000).toISOString(), retirement: true },
    { subscriptionId: 'c', member: 'C', amount: 100_000, admittedAt: new Date(CUTOFF + 3_600_000).toISOString(), retirement: false },
  ];

  test('percentages are shares of the members admitted by the cut-off', () => {
    const register = buildRegister(rows, CLOSE, CUTOFF + 7_200_000);
    assert.equal(register.locked, true);
    assert.deepEqual(register.entries.map((e) => e.subscriptionId), ['a', 'b']);
    assert.equal(register.total, 100_000);
    assert.deepEqual(register.entries.map((e) => e.percent), [75, 25]);
  });

  test('before the cut-off the register is open', () => {
    assert.equal(buildRegister(rows.slice(0, 2), CLOSE, BEFORE).locked, false);
  });
});
