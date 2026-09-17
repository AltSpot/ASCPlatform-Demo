/**
 * The subscription state machine and the invest gate.
 *
 * These are the two rules that decide whether money may move. The state
 * machine is what stops a commitment being funded twice, refunded after it
 * closed, or resurrected after it lapsed. The invest gate is what stops an
 * investor starting a subscription before the 506(b) relationship gate is
 * open and their W-9 and identity check are done. Both are re-checked
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
  ACCREDITATION_STEP,
  DAY_MS,
  FUNDING_WINDOW_DAYS,
  HELD_STATES,
  isLivePosition,
  InvalidTransitionError,
  RESUMABLE_STATES,
  SUBSCRIPTION_STATES,
  assertTransition,
  canTransition,
  canViewDealDetail,
  evaluateInvestGate,
  firstIncompleteStep,
  redactDeal,
  type DealView,
  type SubscriptionState,
  type WizardView,
} from '@/lib/domain';
import type { RelationshipStage, RelationshipView } from '@/lib/relationship';

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

  /* The distinction that cost the dashboard a wrong number once: a
     realized position is still `closed`, and `closed` is held. Totalling
     current exposure on the state alone reported an exit that returned
     2.4x as a position worth nothing. */
  test('a realized position is held but not live', () => {
    const exited = { state: 'closed', realizedAt: '2026-07-19T00:00:00.000Z' };

    assert.ok(HELD_STATES.includes('closed'));
    assert.equal(isLivePosition(exited), false);
  });

  test('a position still held is live in every held state', () => {
    for (const state of HELD_STATES) {
      assert.equal(
        isLivePosition({ state, realizedAt: null }),
        true,
        `${state} holds capital but was not counted as live`,
      );
    }
  });

  test('an unheld state is never live, realized or not', () => {
    for (const state of ['started', 'docs_signed', 'expired', 'refunded'] as const) {
      assert.equal(isLivePosition({ state, realizedAt: null }), false, state);
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
  test('the funding window is ten days', () => {
    assert.equal(FUNDING_WINDOW_DAYS, 10);
    assert.equal(DAY_MS, 86_400_000);
  });
});

// ---------------- the invest gate ----------------

const ALL_STAGES: readonly RelationshipStage[] = [
  'questionnaire',
  'under_review',
  'declined',
  'cooling_off',
  'eligible',
];

function relationship(stage: RelationshipStage): RelationshipView {
  const established = new Date(Date.now() - 60 * DAY_MS).toISOString();
  const dated = stage === 'cooling_off' || stage === 'eligible';
  return {
    stage,
    establishedAt: dated ? established : null,
    unlocksAt: dated ? established : null,
  };
}

/** An investor who satisfies every gate condition. */
function cleared(): WizardView {
  return {
    accreditation: {
      status: 'approved',
      basis: 'net_worth',
      submittedAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
      reason: null,
    },
    relationship: relationship('eligible'),
    info: { complete: true },
    kyc: { idUploaded: true, selfieCaptured: true, complete: true },
    profileDone: true,
    bankDone: true,
    complete: true,
  };
}

describe('evaluateInvestGate', () => {
  test('an eligible, fully onboarded investor may start a subscription', () => {
    const gate = evaluateInvestGate(cleared());
    assert.equal(gate.ok, true);
    assert.deepEqual(gate.missing, []);
  });

  test('every stage short of eligible closes the gate at step 1, with its own label', () => {
    const labels: Record<Exclude<RelationshipStage, 'eligible'>, string> = {
      questionnaire: 'Investor questionnaire',
      under_review: 'Questionnaire under review',
      declined: 'Investor questionnaire',
      cooling_off: 'Cooling-off period',
    };
    for (const [stage, label] of Object.entries(labels)) {
      const wizard = cleared();
      wizard.relationship = relationship(stage as RelationshipStage);
      const gate = evaluateInvestGate(wizard);
      assert.equal(gate.ok, false, 'stage ' + stage + ' left the gate open');
      assert.deepEqual(gate.missing, [{ step: 1, label }]);
    }
  });

  test('an approved questionnaire still inside its cooling-off period does not open the gate', () => {
    // The boundary that matters under 506(b): the status column says
    // approved, and only the clock says the member may not invest yet.
    const wizard = cleared();
    wizard.relationship = relationship('cooling_off');
    assert.equal(evaluateInvestGate(wizard).ok, false);
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
    // them here would block an investor who is otherwise cleared.
    const wizard = cleared();
    wizard.profileDone = false;
    wizard.bankDone = false;
    assert.equal(evaluateInvestGate(wizard).ok, true);
  });

  test('every unmet condition is reported at once, in wizard step order', () => {
    const wizard = cleared();
    wizard.relationship = relationship('questionnaire');
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
});

// ---------------- the view gate ----------------

/**
 * Rule 506(b) restricts who may be *shown* an offering, which is a
 * narrower question than who may invest. These tests pin that
 * difference: the view gate turns on the relationship stage and nothing
 * else.
 */
describe('canViewDealDetail', () => {
  test('only an eligible member is shown offerings', () => {
    for (const stage of ALL_STAGES) {
      assert.equal(
        canViewDealDetail(relationship(stage)),
        stage === 'eligible',
        'stage ' + stage + ' got the wrong answer',
      );
    }
  });

  test('viewing turns on the relationship alone: an unfinished W-9 or KYC does not close it', () => {
    // Deliberate. The W-9 and the identity check are money-movement
    // requirements, so they gate investing and not seeing.
    const wizard = cleared();
    wizard.info.complete = false;
    wizard.kyc.complete = false;
    assert.equal(evaluateInvestGate(wizard).ok, false);
    assert.equal(canViewDealDetail(wizard.relationship), true);
  });

  test('the questionnaire is wizard step 1, which is where a gated investor is sent', () => {
    assert.equal(ACCREDITATION_STEP, 1);
    const wizard = cleared();
    wizard.relationship = relationship('questionnaire');
    assert.equal(firstIncompleteStep(wizard), ACCREDITATION_STEP);
  });
});

/** A deal with every field carrying a recognisable value. */
function fullDeal(): DealView {
  return {
    id: 'calder',
    name: 'Calder Grid',
    entity: 'AltSpot Calder SPV I LLC',
    tag: 'AltSpot-led · Series Seed',
    kind: 'led',
    sector: 'Vertical AI · Senior Care',
    assetClass: 'venture',
    industry: 'artificial-intelligence',
    stage: 'Series Seed Preferred',
    art: 'linear-gradient(120deg,#1b1410,#2a1c10)',
    logoUrl: '/logos/calder.svg',
    videoUrl: null,
    charts: [],
    backing: [],
    headline: 'WITHHELD_HEADLINE',
    summary: 'WITHHELD_SUMMARY',
    pricePerShare: 'WITHHELD_PPS',
    metrics: [{ k: 'ARR', v: 'WITHHELD_METRIC' }],
    terms: [{ k: 'Security', v: 'WITHHELD_TERM' }],
    preferredTerms: [{ k: 'Liquidation', v: 'WITHHELD_PREFERRED' }],
    whatWeLike: ['WITHHELD_LIKE'],
    outcomes: { intro: 'WITHHELD_OUTCOME' },
    indicators: { arr: { value: 'WITHHELD_INDICATOR' } },
    rounds: [{ round: 'Seed', date: '2025', preMoney: 'WITHHELD_ROUND' }],
    blurb: 'Clinical documentation for senior care.',
    risks: 'WITHHELD_RISK',
    minInvestment: 25_000,
    allocationTotal: 2_000_000,
    allocationRemaining: 640_000,
    targetClose: 'WITHHELD_CLOSE',
    minimumToClose: 1_000_000,
    leadType: 'altspot',
    investorCap: 100,
    members: 0,
    launchedAt: '2026-08-01T00:00:00.000Z',
    subscribable: false,
    altspotCommitted: 250_000,
    committedNote: 'WITHHELD_COMMITTED_NOTE',
    status: 'open',
    thesis: ['WITHHELD_THESIS'],
    media: { type: 'metric', label: 'WITHHELD_MEDIA', series: [1, 2], caption: '' },
    docs: ['WITHHELD_DOC'],
    spotbot: [{ q: 'WITHHELD_Q', a: 'WITHHELD_A' }],
    deck: [{ kicker: 'WITHHELD_DECK', title: '', body: [] }],
    redacted: false,
  };
}

describe('redactDeal', () => {
  test('the teaser is exactly the agreed public shell, and nothing else', () => {
    // Written out rather than derived, so widening what an unverified
    // member can see requires changing this list on purpose.
    //
    // assetClass and industry are on the list deliberately. They say
    // what the company is, which is the same category as sector and the
    // tag, both of which were already public. They say nothing about
    // price, allocation, terms or the thesis, which are the things the
    // gate exists to withhold.
    assert.deepEqual(Object.keys(redactDeal(fullDeal())).sort(), [
      'art',
      'assetClass',
      'blurb',
      'id',
      'industry',
      'kind',
      'logoUrl',
      'name',
      'redacted',
      'sector',
      'status',
      'tag',
    ]);
  });

  test('no figure, term, document or narrative survives redaction', () => {
    const wire = JSON.stringify(redactDeal(fullDeal()));

    // Every editorial field is marked, so one grep proves the lot.
    assert.equal(/WITHHELD_/.test(wire), false, `a withheld field reached the wire: ${wire}`);

    for (const figure of ['25000', '2000000', '640000', '250000']) {
      assert.equal(wire.includes(figure), false, `${figure} reached the wire`);
    }
    // The fee model is public copy on the marketplace, but not per deal.
    assert.equal(wire.includes('management'), false);
    assert.equal(wire.includes('carry'), false);
    // The SPV and the security type name the terms of the offering.
    assert.equal(wire.includes('SPV'), false);
    assert.equal(wire.includes('Preferred'), false);
  });

  test('enough survives to know the deal exists and who it is', () => {
    const teaser = redactDeal(fullDeal());
    assert.equal(teaser.name, 'Calder Grid');
    assert.equal(teaser.sector, 'Vertical AI · Senior Care');
    assert.equal(teaser.blurb, 'Clinical documentation for senior care.');
    assert.equal(teaser.logoUrl, '/logos/calder.svg');
  });

  test('the discriminant flips, so a consumer cannot read a teaser as a full deal', () => {
    assert.equal(fullDeal().redacted, false);
    assert.equal(redactDeal(fullDeal()).redacted, true);
  });
});

describe('firstIncompleteStep', () => {
  test('the investor is sent to the earliest step they have not finished', () => {
    const wizard = cleared();
    wizard.relationship = relationship('questionnaire');
    assert.equal(firstIncompleteStep(wizard), 1);

    wizard.relationship = relationship('eligible');
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

  test('review and cooling off are waits, not steps: setup carries on past step 1', () => {
    for (const stage of ['under_review', 'cooling_off'] as const) {
      const wizard = cleared();
      wizard.relationship = relationship(stage);
      wizard.info.complete = false;
      assert.equal(firstIncompleteStep(wizard), 2, 'stage ' + stage + ' held the member on step 1');
    }
  });

  test('a declined questionnaire sends the member back to step 1', () => {
    const wizard = cleared();
    wizard.relationship = relationship('declined');
    assert.equal(firstIncompleteStep(wizard), 1);
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
