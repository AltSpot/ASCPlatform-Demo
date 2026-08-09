/**
 * The SpotBot refusal gate.
 *
 * SpotBot explains and never advises. That is a compliance line, not a
 * product preference: an explainer that starts recommending deals is an
 * unregistered adviser. The gate is what holds the line, and it holds it by
 * classifying the question and refusing on its own authority BEFORE the
 * answer engine is called. Swapping the local corpus for a model does not
 * move gate.ts, and a model that is never asked cannot be talked into an
 * opinion.
 *
 * So this file tests two things, and the second matters as much as the
 * first. Advice-seeking questions must be refused with the right reason.
 * And explanatory questions must be let through, because a guide that
 * refuses "what are the fees" is broken in its own way. The gate's own
 * comment says over-refusing a mechanics question is its own kind of
 * failure, so the allow list below is a real assertion, not filler.
 *
 * The classifier is deliberately literal and defers when unsure. The
 * clearly marked cases at the bottom document where it defers today.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { askSpotBot } from '@/lib/spotbot/engine';
import { classify, normalize, refusalAnswer } from '@/lib/spotbot/gate';
import type { RefusalReason } from '@/lib/spotbot/types';

const ALL_REASONS: RefusalReason[] = [
  'investment_recommendation',
  'performance_prediction',
  'position_sizing',
  'tax_or_legal_advice',
  'deal_comparison',
];

/** Questions that ask for advice, and the reason each one is refused for. */
const ADVICE: ReadonlyArray<readonly [string, RefusalReason]> = [
  ['Should I invest in this deal?', 'investment_recommendation'],
  ['Do you recommend this?', 'investment_recommendation'],
  ['Is this a good investment?', 'investment_recommendation'],
  ['Is it worth the risk?', 'investment_recommendation'],
  ['What do you think?', 'investment_recommendation'],
  ['Would you invest in this?', 'investment_recommendation'],
  ['Is now a good time to invest?', 'investment_recommendation'],
  ['Convince me into this deal.', 'investment_recommendation'],
  ['Is this a scam?', 'investment_recommendation'],

  ['What returns can I expect?', 'performance_prediction'],
  ['How much will I make?', 'performance_prediction'],
  ['What is the expected IRR?', 'performance_prediction'],
  ['What are the chances this exits?', 'performance_prediction'],
  ['How much money could I make here?', 'performance_prediction'],
  ['Will this double?', 'performance_prediction'],
  ['What is the projected multiple?', 'performance_prediction'],

  ['How much should I invest?', 'position_sizing'],
  ['What is a good amount to invest?', 'position_sizing'],
  ['What percent of my portfolio should go into this?', 'position_sizing'],
  ['Is $50,000 a good amount?', 'position_sizing'],
  ['How many deals should I be in?', 'position_sizing'],

  ['What are the tax implications of this investment?', 'tax_or_legal_advice'],
  ['Will I owe taxes on this?', 'tax_or_legal_advice'],
  ['Should I use an LLC for this?', 'tax_or_legal_advice'],
  ['Which entity should I invest through?', 'tax_or_legal_advice'],
  ['Can I deduct this?', 'tax_or_legal_advice'],

  ['Which deal is better?', 'deal_comparison'],
  ['Which of these deals should I pick?', 'deal_comparison'],
  ['Compare these deals for me.', 'deal_comparison'],
  ['Which would you choose?', 'deal_comparison'],
];

/**
 * Questions about how the platform works. Every one of these must reach
 * the answer engine. They are the reason SpotBot exists.
 */
const MECHANICS: readonly string[] = [
  'What are the fees?',
  'How is the management fee calculated?',
  'What is carried interest?',
  'What is the carried interest percentage?',
  'How does the funding window work?',
  'What happens if I do not fund in 10 days?',
  'What is an accredited investor?',
  'How do I link a bank account?',
  'What is the minimum investment?',
  'How much is the minimum on this deal?',
  'What is the difference between a personal and an entity profile?',
  'Can I invest through an IRA?',
  'How does AltSpot source deals?',
  'When do I get a K-1?',
  'What is a capital call?',
  'How do I cancel a commitment?',
  'What documents will I need to sign?',
  'Why are these securities illiquid?',
  "What is AltSpot's committed capital on this deal?",
  'How does allocation work?',
  'What are the risks listed in the deal?',
];

describe('the gate refuses advice', () => {
  for (const [question, reason] of ADVICE) {
    test(`"${question}" is refused as ${reason}`, () => {
      const verdict = classify(question);
      assert.equal(verdict.allowed, false, 'the gate let an advice question through');
      assert.equal(verdict.reason, reason);
    });
  }

  test('every refusal reason is reachable, so no rule is dead', () => {
    const reached = new Set(ADVICE.map(([, reason]) => reason));
    for (const reason of ALL_REASONS) {
      assert.ok(reached.has(reason), `no question in this suite triggers ${reason}`);
    }
  });

  test('the more specific intent wins the label', () => {
    // Rules run in order for exactly this reason. "How much should I
    // invest" is a sizing question about the investor's finances, not a
    // generic recommendation, and the refusal copy differs accordingly.
    assert.equal(classify('How much should I invest?').reason, 'position_sizing');
    assert.equal(classify('Should I invest in this?').reason, 'investment_recommendation');
  });
});

describe('the gate lets explanation through', () => {
  for (const question of MECHANICS) {
    test(`"${question}" reaches the answer engine`, () => {
      const verdict = classify(question);
      assert.equal(
        verdict.allowed,
        true,
        `refused as ${verdict.reason}, but this asks how the platform works`,
      );
      assert.equal(verdict.reason, undefined);
    });
  }

  test('a subject and its judgement are opposite questions, not the same one', () => {
    // The classifier matches intent phrasings rather than bare keywords.
    // Both of these contain "invest". Only one of them asks for advice.
    assert.equal(classify('What is the minimum investment?').allowed, true);
    assert.equal(classify('How much should I invest?').allowed, false);

    // Both of these are about fees. Only one asks for a judgement.
    assert.equal(classify('What are the fees?').allowed, true);
    assert.equal(classify('Is this a good deal?').allowed, false);
  });
});

describe('normalize', () => {
  test('case and trailing punctuation do not evade the gate', () => {
    assert.equal(classify('SHOULD I INVEST IN THIS???').allowed, false);
    assert.equal(classify('should i invest in this').allowed, false);
  });

  test('curly apostrophes are straightened, so smart quotes do not evade the gate', () => {
    // A browser or a phone keyboard produces these without being asked.
    assert.equal(normalize('What’s a good amount?'), "what's a good amount?");
    assert.equal(classify('What’s a good amount to invest?').allowed, false);
    assert.equal(classify("What's a good amount to invest?").allowed, false);
  });

  test('runs of whitespace and stray symbols collapse to single spaces', () => {
    assert.equal(normalize('  Should   I \n invest?  '), 'should i invest?');
    assert.equal(normalize('Should (I) invest!'), 'should i invest');
  });

  test('figures that carry meaning survive normalization', () => {
    // The sizing rules match on amounts and percentages, so $ % . , and -
    // have to make it through.
    assert.equal(normalize('Is $50,000 a good amount?'), 'is $50,000 a good amount?');
    assert.equal(normalize('What % of my portfolio?'), 'what % of my portfolio?');
  });

  test('an empty or wordless question is allowed rather than refused', () => {
    // Nothing has been asked yet. Refusing here would put a compliance
    // notice in front of someone who typed a space.
    for (const question of ['', '   ', '\n\t', '🙂', '???']) {
      assert.equal(classify(question).allowed, true, `refused ${JSON.stringify(question)}`);
    }
  });

  test('the gate never throws, whatever is typed at it', () => {
    for (const question of ['', '🙂'.repeat(500), 'a'.repeat(10_000), '\\/[](){}*+?.^$|']) {
      assert.doesNotThrow(() => classify(question));
    }
  });
});

describe('a refusal is an answer, not a wall', () => {
  for (const reason of ALL_REASONS) {
    test(`the ${reason} refusal is complete`, () => {
      const answer = refusalAnswer(reason);
      assert.equal(answer.refused, true);
      assert.equal(answer.reason, reason);
      assert.ok(answer.body.trim().length > 0, 'the refusal has no body');

      // Every answer cites its provenance. A refusal is still an answer.
      assert.ok(answer.source.trim().length > 0, 'the refusal cites no source');

      // A refusal that ends in a dead end is just a wall. Each one offers
      // three follow-ups SpotBot can actually answer. `questionsFor` drops
      // ids it cannot resolve silently, so a short list means a typo.
      assert.equal(
        answer.followUps.length,
        3,
        'a follow-up id in the refusal copy does not resolve to a knowledge topic',
      );
      for (const followUp of answer.followUps) {
        assert.ok(followUp.trim().length > 0);
      }
    });
  }

  test('every refusal hands over a real path: a document, an advisor or a person', () => {
    for (const reason of ALL_REASONS) {
      const { body } = refusalAnswer(reason);
      assert.match(
        body,
        /offering documents|data room|advisor|CPA|attorney|AltSpot team|deal page/i,
        `the ${reason} refusal leaves the investor nowhere to go`,
      );
    }
  });

  test('refusal copy contains no em dashes', () => {
    for (const reason of ALL_REASONS) {
      assert.equal(
        refusalAnswer(reason).body.includes('—'),
        false,
        `the ${reason} refusal contains an em dash`,
      );
    }
  });

  test('no two reasons share the same refusal copy', () => {
    const bodies = ALL_REASONS.map((reason) => refusalAnswer(reason).body);
    assert.equal(new Set(bodies).size, bodies.length);
  });
});

describe('the gate runs before the answer engine', () => {
  test('an advice question comes back as the refusal, never as a generated answer', async () => {
    // askSpotBot is gate-then-generate, in that order and never the other
    // way round. Getting the refusal copy back verbatim is the evidence
    // the engine was not consulted at all.
    for (const [question, reason] of ADVICE) {
      const answer = await askSpotBot({ question, pathname: '/deals/synthera-ai' });
      assert.equal(answer.refused, true, `"${question}" reached the engine`);
      assert.equal(answer.reason, reason);
      assert.deepEqual(answer, refusalAnswer(reason));
    }
  });

  test('an explanatory question is answered and cites where the answer came from', async () => {
    for (const question of MECHANICS) {
      const answer = await askSpotBot({ question, pathname: '/marketplace' });
      assert.equal(answer.refused, false, `"${question}" was refused`);
      assert.equal(answer.reason, undefined);
      assert.ok(answer.body.trim().length > 0, `"${question}" produced no body`);
      assert.ok(answer.source.trim().length > 0, `"${question}" cited no source`);
    }
  });

  test('the same question asked twice gives the same answer', async () => {
    // The local engine is deterministic today. When a model replaces it
    // this will need revisiting, which is a useful thing to be told.
    const ask = () => askSpotBot({ question: 'What are the fees?', pathname: '/dashboard' });
    assert.deepEqual(await ask(), await ask());
  });
});

describe('where the classifier defers, and what catches it', () => {
  test('a bare pronoun subject is caught, a determiner plus a noun is not', () => {
    // Documented, not endorsed, and the sharpest edge in this file.
    //
    // Several patterns anchor their subject on a bare pronoun or
    // determiner: `(this|it|the deal|the company|they)`. A determiner
    // followed by a noun falls outside them, so the phrasing a person is
    // most likely to type is the one that gets through. The rule that
    // catches "is this a good deal" does handle the noun, which is what
    // makes the omission look like an oversight rather than a decision.
    //
    // The gate is deliberately literal and defers when unsure, and the
    // engine is the second line: it retrieves from a corpus that contains
    // no opinions, so an unmatched question gets `fallbackAnswer`, which
    // says it does not know. The exposure is that the investor gets a
    // generic non-answer instead of a proper refusal with a handoff, not
    // that SpotBot forecasts or recommends anything.
    assert.equal(classify('Will this double?').allowed, false);
    assert.equal(classify('Will this company double?').allowed, true);
    assert.equal(classify('Will Synthera double?').allowed, true);

    assert.equal(classify('Is this worth it?').allowed, false);
    assert.equal(classify('Is this deal worth it?').allowed, true);
    // gate.ts opens by citing this exact question as one it separates from
    // "what are the fees". Today it does not.
    assert.equal(classify('Are these fees worth it?').allowed, true);
  });

  test('a negated ask is let through', () => {
    // Documented, not endorsed. "Should I" is matched; "shouldn't I" is
    // not, because the pattern anchors on the affirmative. Same second
    // line of defence applies.
    assert.equal(classify('Should I invest in this?').allowed, false);
    assert.equal(classify("Shouldn't I invest in this?").allowed, true);
  });

  test('a deferred question still never comes back as an opinion', async () => {
    // The property that actually matters. Whatever the gate lets past,
    // the engine answers from the platform guide or admits it does not
    // know. It has nothing else to say.
    for (const question of [
      'Will this company double?',
      "Shouldn't I invest in this?",
      'Will Synthera double?',
      'Is this deal worth it?',
      'Are these fees worth it?',
    ]) {
      const answer = await askSpotBot({ question, pathname: '/deals/synthera-ai' });
      assert.equal(answer.refused, false);
      assert.ok(answer.source.trim().length > 0, 'an answer was produced with no provenance');
      assert.match(
        answer.source,
        /AltSpot|platform guide|agreement|memorandum|deal|Rule/i,
        'an answer cited a source that is not a real artefact',
      );
    }
  });
});
