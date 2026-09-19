import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { hasJoined, joinedDealIds, positionStage, stagesByDeal } from '../lib/position-stage';

const DAY = 86_400_000;
const now = Date.UTC(2026, 8, 19, 12);
const base = { id: 's1', dealId: 'ferrule', amountLabel: '$50,000' };

describe("where a member stands in a deal they started", () => {
  test('signing is not investing: nothing is called invested before money moves', () => {
    for (const state of ['started', 'docs_signed'] as const) {
      const view = positionStage({ ...base, state });
      assert.ok(view);
      assert.equal(view.moneyIn, false);
      assert.doesNotMatch(`${view.label} ${view.detail}`, /\binvested\b/i);
      assert.equal(view.actionNeeded, true);
    }
  });

  test('a signed subscription says what is owed, by when, and where to send it', () => {
    const view = positionStage({ ...base, state: 'docs_signed', dueLabel: 'Sep 22, 2026', daysLeft: 3 });
    assert.equal(view?.label, 'Signed · not yet sent');
    assert.match(view?.detail ?? '', /Send \$50,000 to escrow by Sep 22, 2026, 3 days left\./);
    assert.deepEqual(view?.action, { label: 'Complete investment', href: '/payment/s1' });
  });

  test('money in escrow says escrow; a closed deal says invested', () => {
    const escrow = positionStage({ ...base, state: 'funded' });
    assert.equal(escrow?.label, 'In escrow');
    assert.equal(escrow?.moneyIn, true);
    assert.equal(escrow?.actionNeeded, false);
    const closed = positionStage({ ...base, state: 'closed' });
    assert.equal(closed?.label, 'Invested');
    assert.match(closed?.detail ?? '', /You invested \$50,000/);
  });

  test('a lapsed or refunded subscription has no stage', () => {
    for (const state of ['expired', 'refunded', 'cut_back'] as const) {
      assert.equal(positionStage({ ...base, state }), null);
    }
  });

  test('joined means at least signed: started has not joined', () => {
    assert.equal(hasJoined('started'), false);
    assert.equal(hasJoined('docs_signed'), true);
    assert.equal(hasJoined('funded'), true);
    assert.deepEqual(
      joinedDealIds([
        { dealId: 'a', state: 'started' },
        { dealId: 'b', state: 'docs_signed' },
        { dealId: 'b', state: 'funded' },
        { dealId: 'c', state: 'expired' },
      ]),
      ['b'],
    );
  });

  test('per deal, the subscription that needs the member wins, and days are counted from now', () => {
    const stages = stagesByDeal(
      [
        { id: 'x', dealId: 'ferrule', state: 'funded', amount: 25_000, fundingDeadline: null },
        {
          id: 'y',
          dealId: 'ferrule',
          state: 'docs_signed',
          amount: 50_000,
          fundingDeadline: new Date(now + 3 * DAY).toISOString(),
        },
        { id: 'z', dealId: 'gone', state: 'expired', amount: 10_000, fundingDeadline: null },
      ],
      now,
    );
    assert.deepEqual(Object.keys(stages), ['ferrule']);
    assert.equal(stages.ferrule.stage, 'signed');
    assert.match(stages.ferrule.detail, /3 days left/);
  });

  test('no em dashes in anything a member reads', () => {
    for (const state of ['started', 'docs_signed', 'funded', 'closed'] as const) {
      const view = positionStage({ ...base, state, dueLabel: 'Sep 22, 2026', daysLeft: 1 });
      assert.doesNotMatch(`${view?.label} ${view?.detail} ${view?.action.label}`, /—/);
    }
  });
});
