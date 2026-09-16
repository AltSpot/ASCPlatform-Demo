/**
 * The 506(b) relationship gate (lib/relationship.ts).
 *
 * What these pin: the questionnaire refuses a partial record; the
 * evaluation declines a member with no accredited basis and refers the
 * thinnest experience profile to a person rather than approving it; the
 * stage turns on the approval date plus the cooling-off period and
 * nothing else; and no gate copy a member reads contains an em dash or a
 * deal-specific word.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ACKNOWLEDGEMENTS,
  BASIS_OPTIONS,
  EVALUATION_OPTIONS,
  PRIVATE_DEAL_OPTIONS,
  STAGE_LABEL,
  YEARS_OPTIONS,
  canSeeOfferings,
  canSubscribeToDeal,
  evaluateQuestionnaire,
  gateCopy,
  parseQuestionnaire,
  questionnaireSubmitted,
  relationshipStage,
  viewOnlyCopy,
  type QuestionnaireAnswers,
  type RelationshipStage,
} from '@/lib/relationship';

const DAY = 86_400_000;

function answers(overrides: Partial<QuestionnaireAnswers> = {}): QuestionnaireAnswers {
  return {
    basis: 'net_worth',
    privateDeals: 'some',
    yearsInvesting: '3_to_10',
    evaluates: 'self',
    acknowledgements: { loss: true, illiquid: true, no_advice: true },
    ...overrides,
  };
}

describe('parseQuestionnaire', () => {
  test('a complete submission parses to exactly the answers given', () => {
    const result = parseQuestionnaire(answers());
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.answers, answers());
  });

  test('every single-choice question is required', () => {
    for (const field of ['basis', 'privateDeals', 'yearsInvesting', 'evaluates'] as const) {
      const body: Record<string, unknown> = { ...answers() };
      delete body[field];
      assert.equal(parseQuestionnaire(body).ok, false, `${field} was not required`);
    }
  });

  test('an answer outside the defined options is refused', () => {
    assert.equal(parseQuestionnaire({ ...answers(), basis: 'rich' }).ok, false);
    assert.equal(parseQuestionnaire({ ...answers(), evaluates: 42 }).ok, false);
  });

  test('every acknowledgement must be affirmed, and only literal true counts', () => {
    for (const ack of ACKNOWLEDGEMENTS) {
      const unticked = { ...answers().acknowledgements, [ack.key]: false };
      assert.equal(
        parseQuestionnaire({ ...answers(), acknowledgements: unticked }).ok,
        false,
        `${ack.key} could be left unticked`,
      );
      const truthy = { ...answers().acknowledgements, [ack.key]: 'yes' };
      assert.equal(parseQuestionnaire({ ...answers(), acknowledgements: truthy }).ok, false);
    }
  });

  test('extra fields do not survive into the stored record', () => {
    const result = parseQuestionnaire({ ...answers(), referredBy: 'someone', approved: true });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(Object.keys(result.answers).sort(), [
        'acknowledgements',
        'basis',
        'evaluates',
        'privateDeals',
        'yearsInvesting',
      ]);
    }
  });

  test('non-objects are refused rather than thrown on', () => {
    for (const input of [null, undefined, 'answers', 7, []]) {
      assert.equal(parseQuestionnaire(input).ok, false);
    }
  });
});

describe('evaluateQuestionnaire', () => {
  test('no accredited basis is declined, whatever the experience', () => {
    const result = evaluateQuestionnaire(
      answers({ basis: 'none', privateDeals: 'many', yearsInvesting: 'over_10' }),
    );
    assert.equal(result.outcome, 'declined');
  });

  test('the thinnest experience profile is referred to a person, not approved by a rule', () => {
    const result = evaluateQuestionnaire(
      answers({ privateDeals: 'none', evaluates: 'learning', yearsInvesting: 'under_3' }),
    );
    assert.equal(result.outcome, 'under_review');
  });

  test('any one sign of experience or professional help is enough to approve', () => {
    const thin = { privateDeals: 'none', evaluates: 'learning', yearsInvesting: 'under_3' } as const;
    assert.equal(evaluateQuestionnaire(answers({ ...thin, privateDeals: 'some' })).outcome, 'approved');
    assert.equal(evaluateQuestionnaire(answers({ ...thin, evaluates: 'adviser' })).outcome, 'approved');
    assert.equal(evaluateQuestionnaire(answers({ ...thin, yearsInvesting: '3_to_10' })).outcome, 'approved');
  });

  test('every accredited basis can be approved', () => {
    for (const option of BASIS_OPTIONS.filter((o) => o.key !== 'none')) {
      assert.equal(evaluateQuestionnaire(answers({ basis: option.key })).outcome, 'approved');
    }
  });

  test('every outcome carries a reason to show the member', () => {
    for (const a of [answers(), answers({ basis: 'none' }), answers({ privateDeals: 'none', evaluates: 'learning', yearsInvesting: 'under_3' })]) {
      assert.ok(evaluateQuestionnaire(a).reason.length > 0);
    }
  });
});

describe('relationshipStage', () => {
  const now = Date.parse('2026-09-17T12:00:00.000Z');

  test('no record, or an unapproved one, is the questionnaire stage', () => {
    for (const status of ['not_started', 'anything-else']) {
      const view = relationshipStage({ status, establishedAt: null }, 30, now);
      assert.equal(view.stage, 'questionnaire');
      assert.equal(view.unlocksAt, null);
    }
  });

  test('review and decline carry no relationship date', () => {
    for (const status of ['under_review', 'declined'] as const) {
      const view = relationshipStage(
        { status, establishedAt: new Date(now - 90 * DAY).toISOString() },
        30,
        now,
      );
      assert.equal(view.stage, status);
      assert.equal(view.establishedAt, null);
    }
  });

  test('approved without a relationship date is not treated as established', () => {
    assert.equal(relationshipStage({ status: 'approved', establishedAt: null }, 30, now).stage, 'questionnaire');
  });

  test('approval starts the cooling-off period and eligibility begins exactly at its end', () => {
    const established = now - 10 * DAY;
    const view = relationshipStage(
      { status: 'approved', establishedAt: new Date(established).toISOString() },
      30,
      now,
    );
    assert.equal(view.stage, 'cooling_off');
    assert.equal(view.unlocksAt, new Date(established + 30 * DAY).toISOString());

    const unlock = established + 30 * DAY;
    const record = { status: 'approved', establishedAt: new Date(established).toISOString() };
    assert.equal(relationshipStage(record, 30, unlock - 1).stage, 'cooling_off');
    assert.equal(relationshipStage(record, 30, unlock).stage, 'eligible');
  });

  test('the cooling-off length is a setting, not a constant', () => {
    const record = { status: 'approved', establishedAt: new Date(now - 10 * DAY).toISOString() };
    assert.equal(relationshipStage(record, 30, now).stage, 'cooling_off');
    assert.equal(relationshipStage(record, 7, now).stage, 'eligible');
    assert.equal(relationshipStage(record, -5, now).stage, 'eligible');
  });

  test('only eligible sees offerings; review and cooling off count as submitted', () => {
    const stages: RelationshipStage[] = ['questionnaire', 'under_review', 'declined', 'cooling_off', 'eligible'];
    for (const stage of stages) {
      const view = { stage, establishedAt: null, unlocksAt: null };
      assert.equal(canSeeOfferings(view), stage === 'eligible');
      assert.equal(
        questionnaireSubmitted(view),
        stage === 'under_review' || stage === 'cooling_off' || stage === 'eligible',
      );
    }
  });
});

describe('member-facing copy', () => {
  const stages: RelationshipStage[] = ['questionnaire', 'under_review', 'declined', 'cooling_off', 'eligible'];

  const allCopy = [
    ...BASIS_OPTIONS.flatMap((o) => [o.label, o.detail]),
    ...PRIVATE_DEAL_OPTIONS.flatMap((o) => [o.label, o.detail]),
    ...YEARS_OPTIONS.flatMap((o) => [o.label, o.detail]),
    ...EVALUATION_OPTIONS.flatMap((o) => [o.label, o.detail]),
    ...ACKNOWLEDGEMENTS.map((a) => a.label),
    ...Object.values(STAGE_LABEL),
    ...stages.flatMap((stage) => {
      const copy = gateCopy({ stage, establishedAt: null, unlocksAt: null }, () => 'Oct 17, 2026', '/wizard?step=1');
      return [copy.title, copy.body, copy.action?.label ?? ''];
    }),
    evaluateQuestionnaire(answers()).reason,
    evaluateQuestionnaire(answers({ basis: 'none' })).reason,
    evaluateQuestionnaire(answers({ privateDeals: 'none', evaluates: 'learning', yearsInvesting: 'under_3' })).reason,
  ];

  test('no em dashes', () => {
    for (const line of allCopy) assert.ok(!line.includes('—'), `em dash in: ${line}`);
  });

  test('nothing says 506(c), verified, or a letter', () => {
    for (const line of allCopy) {
      assert.ok(!/506\(c\)|verif|letter|certifier/i.test(line), `retired language in: ${line}`);
    }
  });

  test('the gate names no offering and invites action only where the member can act', () => {
    for (const stage of stages) {
      const copy = gateCopy({ stage, establishedAt: null, unlocksAt: null }, () => 'Oct 17, 2026', '/q');
      const waiting = stage === 'cooling_off' || stage === 'under_review';
      assert.equal(copy.action === null, waiting, `stage ${stage} action mismatch`);
    }
  });
});

describe('canSubscribeToDeal', () => {
  const established = '2026-08-01T12:00:00.000Z';
  const eligible = { stage: 'eligible' as const, establishedAt: established, unlocksAt: '2026-08-31T12:00:00.000Z' };

  test('a deal that opened after the relationship may be subscribed to', () => {
    assert.equal(canSubscribeToDeal(eligible, '2026-08-01T12:00:00.001Z'), true);
    assert.equal(canSubscribeToDeal(eligible, '2026-09-10T00:00:00.000Z'), true);
  });

  test('a deal that opened before, or at the same instant, is view-only', () => {
    assert.equal(canSubscribeToDeal(eligible, '2026-07-15T00:00:00.000Z'), false);
    assert.equal(canSubscribeToDeal(eligible, established), false);
  });

  test('nobody short of eligible may subscribe, whatever the dates', () => {
    for (const stage of ['questionnaire', 'under_review', 'declined', 'cooling_off'] as const) {
      assert.equal(
        canSubscribeToDeal({ ...eligible, stage }, '2027-01-01T00:00:00.000Z'),
        false,
        `stage ${stage} could subscribe`,
      );
    }
  });

  test('a missing or unreadable date fails closed', () => {
    assert.equal(canSubscribeToDeal({ ...eligible, establishedAt: null }, '2027-01-01T00:00:00.000Z'), false);
    assert.equal(canSubscribeToDeal(eligible, 'not a date'), false);
  });

  test('the view-only line names the relationship date and carries no em dash', () => {
    const line = viewOnlyCopy(eligible, () => 'Aug 1, 2026');
    assert.equal(line, 'Opened before you joined. You are eligible for deals that open after Aug 1, 2026.');
    assert.ok(!line.includes('\u2014'));
  });
});
