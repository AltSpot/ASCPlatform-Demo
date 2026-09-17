/**
 * Deal email audience (lib/deal-email.ts). Members only, and only those
 * whose relationship predates the deal and who are past cooling off.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { dealEmailAudience, type EmailCandidate } from '@/lib/deal-email';
import type { RelationshipStage } from '@/lib/relationship';

const LAUNCH = '2026-09-01T00:00:00.000Z';

function member(id: string, stage: RelationshipStage, establishedAt: string | null): EmailCandidate {
  return {
    userId: id,
    email: `${id}@altspot.demo`,
    relationship: { stage, establishedAt, unlocksAt: establishedAt },
  };
}

describe('dealEmailAudience', () => {
  test('only eligible members whose relationship predates the launch', () => {
    const audience = dealEmailAudience(
      [
        member('before', 'eligible', '2026-06-01T00:00:00.000Z'),
        member('after', 'eligible', '2026-09-02T00:00:00.000Z'),
        member('same-instant', 'eligible', LAUNCH),
        member('cooling', 'cooling_off', '2026-08-20T00:00:00.000Z'),
        member('questionnaire', 'questionnaire', null),
        member('review', 'under_review', null),
        member('declined', 'declined', null),
      ],
      LAUNCH,
    );
    assert.deepEqual(audience.map((m) => m.userId), ['before']);
  });

  test('an empty membership sends to nobody', () => {
    assert.deepEqual(dealEmailAudience([], LAUNCH), []);
  });
});
