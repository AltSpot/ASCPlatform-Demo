/**
 * The subscription state machine and the invest gate.
 *
 * These are the two rules that decide whether money may move. The state
 * machine is what stops a commitment being funded twice, refunded after it
 * closed, or resurrected after it lapsed. The invest gate is what stops an
 * unverified investor starting a subscription at all. Both are re-checked
 * server side, so a regression here is not caught by the UI.
 *
 * The transition table below is written out independently of lib/domain.ts
 * on purpose. TRANSITIONS is private, and a test that imported it would
 * only prove the module agrees with itself. Restating the machine as
 * CLAUDE.md and the README document it means widening the graph requires
 * changing this file too, which is the deliberate step we want.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ACCREDITATION_VALIDITY_DAYS,
  DAY_MS,
  FUNDING_WINDOW_DAYS,
  HELD_STATES,
  InvalidTransitionError,
  RESUMABLE_STATES,
  SUBSCRIPTION_STATES,
  assertTransition,
  canTransition,
  evaluateInvestGate,
  firstIncompleteStep,
  type SubscriptionState,
  type WizardView,
} from '@/lib/domain';

const ALL_STATES = Object.values(SUBSCRIPTION_STATES);

/**
 *   started -> docs_signed -> funded -> accepted -> closed
 *   exits:   expired (funding window lapsed) | refunded | cut_back
 */
const SPEC: Record<SubscriptionState, readonly SubscriptionState[]> = {
  started: ['docs_signed'],
  docs_signed: ['funded', 'expired'],
  funded: ['accepted', 'refunded'],
  accepted: ['closed', 'cut_back'],
  cut_back: ['closed'],
  closed: [],
  expired: [],
  refunded: [],
};

const TERMINAL: readonly SubscriptionState[] = ['closed', 'expired', 'refunded'];

describe('subscription state machine', () => {
  test('the documented machine is exactly the machine that is enforced', () => {
    // All 64 ordered pairs, so a transition cannot be added or removed
    // without this file disagreeing.
    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        assert.equal(
          canTransition(from, to),
          SPEC[from].includes(to),
          `canTransition(${from}, ${to}) disagrees with the documented machine`,
        );
      }
    }
  });

  test('a signed commitment cannot be funded twice', () => {
    assert.equal(canTransition('docs_signed', 'funded'), true);
    assert.equal(canTransition('funded', 'funded'), false);
  });

  test('a funded subscription cannot go back to started or to docs_signed', () => {
    assert.equal(canTransition('funded', 'started'), false);
    assert.equal(canTransition('funded', 'docs_signed'), false);
  });

  test('no state may transition to itself', () => {
    for (const state of ALL_STATES) {
      assert.equal(canTransition(state, state), false, `${state} -> ${state}`);
    }
  });

  test('nothing reaches funded except a signed commitment', () => {
    const sources = ALL_STATES.filter((from) => canTransition(from, 'funded'));
    assert.deepEqual(sources, ['docs_signed']);
  });

  test('only a signed commitment can expire, so an unsigned one holds no allocation to return', () => {
    const sources = ALL_STATES.filter((from) => canTransition(from, 'expired'));
    assert.deepEqual(sources, ['docs_signed']);
  });

  test('money cannot be refunded before it has been funded', () => {
    const sources = ALL_STATES.filter((from) => canTransition(from, 'refunded'));
    assert.deepEqual(sources, ['funded']);
  });

  test('closed, expired and refunded accept nothing further', () => {
    for (const terminal of TERMINAL) {
      for (const to of ALL_STATES) {
        assert.equal(
          canTransition(terminal, to),
          false,
          `terminal state ${terminal} accepted a transition to ${to}`,
        );
      }
    }
  });

  test('cut_back is not terminal: a cut back allocation still closes', () => {
    assert.equal(canTransition('accepted', 'cut_back'), true);
    assert.equal(canTransition('cut_back', 'closed'), true);
  });

  test('every state except the terminals is reachable from started', () => {
    const seen = new Set<SubscriptionState>(['started']);
    const queue: SubscriptionState[] = ['started'];
    while (queue.length > 0) {
      const from = queue.shift() as SubscriptionState;
      for (const to of ALL_STATES) {
        if (canTransition(from, to) && !seen.has(to)) {
          seen.add(to);
          queue.push(to);
        }
      }
    }
    assert.deepEqual(
      [...seen].sort(),
      [...ALL_STATES].sort(),
      'a state exists that no subscription can ever be in',
    );
  });
});

describe('assertTransition', () => {
  test('a legal transition is silent', () => {
    assert.doesNotThrow(() => assertTransition('started', 'docs_signed'));
  });

  test('an illegal transition throws InvalidTransitionError naming both states', () => {
    assert.throws(
      () => assertTransition('funded', 'docs_signed'),
      (error: unknown) => {
        assert.ok(error instanceof InvalidTransitionError);
        assert.equal(error.name, 'InvalidTransitionError');
        // The 409 body is built from this message, so an operator reading
        // a log has to be able to see what was attempted.
        assert.match(error.message, /funded/);
        assert.match(error.message, /docs_signed/);
        return true;
      },
    );
  });

  test('a state string the machine has never heard of is rejected, not waved through', () => {
    // `from` is typed as string because it arrives out of a database
    // column, so an unrecognised value is a real input, not a type error.
    assert.throws(
      () => assertTransition('half_signed', 'funded'),
      InvalidTransitionError,
    );
    assert.throws(() => assertTransition('', 'funded'), InvalidTransitionError);
  });
});

describe('held and resumable state sets', () => {
  test('held means capital is actually in the deal', () => {
    assert.deepEqual([...HELD_STATES], ['funded', 'accepted', 'closed']);
  });

  test('an unfunded, lapsed or refunded commitment is never counted as held capital', () => {
    for (const state of ['started', 'docs_signed', 'expired', 'refunded'] as const) {
      assert.equal(
        HELD_STATES.includes(state),
        false,
        `${state} would be counted in portfolio value`,
      );
    }
  });

  test('resumable means the investor can still pick the commitment back up', () => {
    assert.deepEqual([...RESUMABLE_STATES], ['started', 'docs_signed']);
  });

  test('a state is never both held and resumable', () => {
    for (const state of HELD_STATES) {
      assert.equal(RESUMABLE_STATES.includes(state), false, `${state} is both`);
    }
  });

  test('every resumable state can still move forward', () => {
    for (const state of RESUMABLE_STATES) {
      assert.ok(
        ALL_STATES.some((to) => canTransition(state, to)),
        `${state} is offered as resumable but is a dead end`,
      );
    }
  });
});

describe('product constants', () => {
  test('accreditation is valid five years and the funding window is ten days', () => {
    assert.equal(ACCREDITATION_VALIDITY_DAYS, 5 * 365);
    assert.equal(FUNDING_WINDOW_DAYS, 10);
    assert.equal(DAY_MS, 86_400_000);
  });
});

// ---------------- the invest gate ----------------

const YEAR_AHEAD = new Date(Date.now() + 365 * DAY_MS).toISOString();
const YESTERDAY = new Date(Date.now() - DAY_MS).toISOString();

/** An investor who satisfies every gate condition. */
function cleared(): WizardView {
  return {
    accreditation: {
      status: 'verified',
      method: 'letter',
      verifiedAt: new Date().toISOString(),
      expiresAt: YEAR_AHEAD,
    },
    info: { complete: true },
    kyc: { idUploaded: true, selfieCaptured: true, complete: true },
    profileDone: true,
    bankDone: true,
    complete: true,
  };
}

describe('evaluateInvestGate', () => {
  test('a fully verified investor may start a subscription', () => {
    const gate = evaluateInvestGate(cleared());
    assert.equal(gate.ok, true);
    assert.deepEqual(gate.missing, []);
  });

  test('accreditation that is not verified closes the gate', () => {
    for (const status of ['not_started', 'downloaded', 'pending', 'expired'] as const) {
      const wizard = cleared();
      wizard.accreditation.status = status;
      const gate = evaluateInvestGate(wizard);
      assert.equal(gate.ok, false, `status ${status} left the gate open`);
      assert.deepEqual(gate.missing, [
        { step: 1, label: 'Accreditation verification' },
      ]);
    }
  });

  test('accreditation that is verified but past its expiry closes the gate', () => {
    // The boundary that matters: the status column still says verified,
    // and only the date says otherwise. Five year old approvals must not
    // keep letting an investor through.
    const wizard = cleared();
    wizard.accreditation.expiresAt = YESTERDAY;
    const gate = evaluateInvestGate(wizard);
    assert.equal(gate.ok, false);
    assert.deepEqual(gate.missing, [
      { step: 1, label: 'Accreditation re-verification (expired)' },
    ]);
  });

  test('accreditation expiring in the future does not close the gate', () => {
    const wizard = cleared();
    wizard.accreditation.expiresAt = new Date(Date.now() + 60_000).toISOString();
    assert.equal(evaluateInvestGate(wizard).ok, true);
  });

  test('verified accreditation with no recorded expiry is treated as current', () => {
    const wizard = cleared();
    wizard.accreditation.expiresAt = null;
    assert.equal(evaluateInvestGate(wizard).ok, true);
  });

  test('an incomplete W-9 closes the gate on its own', () => {
    const wizard = cleared();
    wizard.info.complete = false;
    const gate = evaluateInvestGate(wizard);
    assert.equal(gate.ok, false);
    assert.deepEqual(gate.missing, [{ step: 2, label: 'Your information (W-9)' }]);
  });

  test('incomplete KYC closes the gate on its own', () => {
    const wizard = cleared();
    wizard.kyc.complete = false;
    const gate = evaluateInvestGate(wizard);
    assert.equal(gate.ok, false);
    assert.deepEqual(gate.missing, [{ step: 3, label: 'Identity verification' }]);
  });

  test('a profile and a bank account are not gate conditions', () => {
    // Both can be supplied later, at checkout and at funding. Requiring
    // them here would block an investor who is fully verified.
    const wizard = cleared();
    wizard.profileDone = false;
    wizard.bankDone = false;
    assert.equal(evaluateInvestGate(wizard).ok, true);
  });

  test('every unmet condition is reported at once, in wizard step order', () => {
    const wizard = cleared();
    wizard.accreditation.status = 'pending';
    wizard.info.complete = false;
    wizard.kyc.complete = false;
    const gate = evaluateInvestGate(wizard);
    assert.equal(gate.ok, false);
    assert.deepEqual(
      gate.missing.map((m) => m.step),
      [1, 2, 3],
    );
    for (const requirement of gate.missing) {
      assert.ok(requirement.label.length > 0, 'a requirement was reported unlabelled');
    }
  });

  test('an expired accreditation is reported once, not twice', () => {
    // The two step-1 branches are an either/or. Reporting both would put
    // the same requirement in front of the investor twice.
    const wizard = cleared();
    wizard.accreditation.status = 'expired';
    wizard.accreditation.expiresAt = YESTERDAY;
    const steps = evaluateInvestGate(wizard).missing.map((m) => m.step);
    assert.deepEqual(steps, [1]);
  });
});

describe('firstIncompleteStep', () => {
  test('the investor is sent to the earliest step they have not finished', () => {
    const wizard = cleared();
    wizard.accreditation.status = 'not_started';
    assert.equal(firstIncompleteStep(wizard), 1);

    wizard.accreditation.status = 'verified';
    wizard.info.complete = false;
    assert.equal(firstIncompleteStep(wizard), 2);

    wizard.info.complete = true;
    wizard.kyc.complete = false;
    assert.equal(firstIncompleteStep(wizard), 3);

    wizard.kyc.complete = true;
    wizard.profileDone = false;
    assert.equal(firstIncompleteStep(wizard), 4);

    wizard.profileDone = true;
    wizard.bankDone = false;
    assert.equal(firstIncompleteStep(wizard), 5);
  });

  test('an earlier incomplete step wins over a later one', () => {
    const wizard = cleared();
    wizard.info.complete = false;
    wizard.bankDone = false;
    assert.equal(firstIncompleteStep(wizard), 2);
  });

  test('a finished wizard reports step 1, so callers must check completeness first', () => {
    // Documented, not endorsed. There is no "nothing left" value, so the
    // function collapses onto step 1 when everything is done. WizardFlow
    // only calls it while the wizard is still open, which is what makes
    // this safe today. A caller that trusted the number alone would send a
    // finished investor back to the first step.
    assert.equal(firstIncompleteStep(cleared()), 1);
  });
});
