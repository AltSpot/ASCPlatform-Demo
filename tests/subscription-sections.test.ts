/**
 * The subscription agreement, checked against itself.
 *
 * lib/subscription-sections.ts defines the document once. The confirmation
 * panels, the live document pane, the confirm endpoint's validation and the
 * sign endpoint's completeness check all read it. The invariant that buys
 * is: a section cannot exist in the UI and be missing from the executed
 * text. These tests defend it from the inside, by asserting the file is
 * internally coherent rather than that any one consumer agrees with it.
 *
 * Two things here are not merely structural.
 *
 * The confirmation codes and the answers-map keys are persisted on live
 * subscriptions. Renumbering a code or renaming a key would silently
 * reinterpret what an investor already confirmed, so both are pinned by
 * value below and a change has to be made here on purpose.
 *
 * And the "What you pay" clause is the same promise lib/fees.ts computes.
 * If the two ever drift, the investor is charged one thing and signs
 * another. tests/fees.test.ts holds the other end of that check.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SUBSCRIPTION_SECTION_COUNT,
  SUBSCRIPTION_SECTIONS,
  choiceKey,
  decodeConfirmationCode,
  getSection,
  isSectionConfirmed,
  sectionKey,
  selectedChoice,
  unconfirmedSections,
} from '@/lib/subscription-sections';

/** Every confirmation code the product can legitimately produce. */
const VALID_CODES = SUBSCRIPTION_SECTIONS.flatMap((section) =>
  section.choices ? section.choices.map((c) => c.code) : [section.code as number],
);

/** An answers map in which every section has been confirmed. */
function fullyConfirmed(): Record<string, boolean> {
  const answers: Record<string, boolean> = {};
  for (const section of SUBSCRIPTION_SECTIONS) {
    answers[sectionKey(section.id)] = true;
    if (section.choices) {
      answers[choiceKey(section.id, section.choices[0].key)] = true;
    }
  }
  return answers;
}

/** Every string in the document that an investor can read. */
const ALL_PROSE = SUBSCRIPTION_SECTIONS.flatMap((section) => [
  section.documentTitle,
  section.panelTitle,
  section.panelIntro,
  section.covers,
  section.choicePrompt ?? '',
  ...section.points.flatMap((p) => [p.lead ?? '', p.text]),
  ...(section.choices ?? []).flatMap((c) => [c.label, c.detail, c.documentText]),
]).join('\n');

describe('the document is structurally whole', () => {
  test('there are six sections and the exported count agrees', () => {
    assert.equal(SUBSCRIPTION_SECTIONS.length, 6);
    assert.equal(SUBSCRIPTION_SECTION_COUNT, SUBSCRIPTION_SECTIONS.length);
  });

  test('section ids are unique and contiguous from one', () => {
    // decodeConfirmationCode derives the section from `code / 100`, so a
    // gap or a duplicate would make a code ambiguous.
    assert.deepEqual(
      SUBSCRIPTION_SECTIONS.map((s) => s.id),
      [1, 2, 3, 4, 5, 6],
    );
  });

  test('every section carries the prose the panel and the document pane need', () => {
    for (const section of SUBSCRIPTION_SECTIONS) {
      for (const field of ['numeral', 'documentTitle', 'panelTitle', 'panelIntro'] as const) {
        assert.ok(
          section[field].trim().length > 0,
          `section ${section.id} has no ${field}`,
        );
      }
      assert.ok(section.points.length > 0, `section ${section.id} has no points`);
      for (const point of section.points) {
        assert.ok(point.text.trim().length > 0, `section ${section.id} has an empty point`);
      }
    }
  });

  test('every section names the clauses it discharges, so counsel can audit the mapping', () => {
    // `covers` is rendered as the source line under each panel. A section
    // without one is a confirmation nobody can trace to the agreement.
    for (const section of SUBSCRIPTION_SECTIONS) {
      assert.match(
        section.covers,
        /§|Exhibit/,
        `section ${section.id} covers "${section.covers}", which cites no clause`,
      );
    }
  });

  test('document numerals are unique, so two articles cannot claim the same numeral', () => {
    const numerals = SUBSCRIPTION_SECTIONS.map((s) => s.numeral);
    assert.equal(new Set(numerals).size, numerals.length);
  });

  test('getSection resolves every id and refuses anything else', () => {
    for (const section of SUBSCRIPTION_SECTIONS) {
      assert.equal(getSection(section.id), section);
    }
    for (const id of [0, -1, 7, 100, 1.5, NaN]) {
      assert.equal(getSection(id), null, `getSection(${id}) resolved`);
    }
  });
});

describe('the two selections of fact', () => {
  test('exactly two sections record a choice, and they are the ones counsel expects', () => {
    // Accredited investor category (Exhibit A Part II) and benefit plan
    // status (§3.12). Everything else is an acknowledgement.
    const withChoices = SUBSCRIPTION_SECTIONS.filter((s) => s.choices);
    assert.equal(withChoices.length, 2);
    assert.deepEqual(
      withChoices.map((s) => s.id),
      [2, 4],
    );
    assert.match(withChoices[0].documentTitle, /Accredited investor status/);
    assert.match(withChoices[1].documentTitle, /plan status/);
  });

  test('a section is either an acknowledgement or a selection, never both and never neither', () => {
    // decodeConfirmationCode branches on exactly this. A section with both
    // a code and choices would accept a bare confirmation that records no
    // choice, which is the failure the packed code exists to prevent.
    for (const section of SUBSCRIPTION_SECTIONS) {
      const isSelection = Boolean(section.choices);
      assert.equal(
        section.code === undefined,
        isSelection,
        `section ${section.id} mixes an acknowledgement code with choices`,
      );
      if (isSelection) {
        assert.ok(
          section.choices!.length >= 2,
          `section ${section.id} offers a choice of one`,
        );
        assert.ok(
          (section.choicePrompt ?? '').trim().length > 0,
          `section ${section.id} asks for a choice without a prompt`,
        );
      }
    }
  });

  test('every option carries the text it contributes to the executed agreement', () => {
    // `documentText` is what gets written into the signed document. An
    // option without one would be a choice the investor makes that the
    // agreement never records.
    for (const section of SUBSCRIPTION_SECTIONS) {
      for (const choice of section.choices ?? []) {
        for (const field of ['key', 'label', 'detail', 'documentText'] as const) {
          assert.ok(
            choice[field].trim().length > 0,
            `section ${section.id} option "${choice.key}" has no ${field}`,
          );
        }
      }
    }
  });

  test('the five accreditation categories cover the Rule 501 tests the offering relies on', () => {
    const choices = getSection(2)!.choices!;
    assert.deepEqual(
      choices.map((c) => c.key),
      ['income', 'net-worth', 'certification', 'entity-assets', 'all-owners'],
    );
    for (const choice of choices) {
      assert.match(
        choice.documentText,
        /Rule 501\(a\)\(\d+\)/,
        `option "${choice.key}" cites no Rule 501 test`,
      );
    }
  });

  test('benefit plan status is a yes or a no, and both are recorded in the document', () => {
    const choices = getSection(4)!.choices!;
    assert.deepEqual(
      choices.map((c) => c.key),
      ['not-benefit-plan', 'benefit-plan'],
    );
    assert.match(choices[0].documentText, /is not a Benefit Plan Investor/);
    assert.match(choices[1].documentText, /is a Benefit Plan Investor/);
  });
});

describe('confirmation codes are persisted, so they are pinned', () => {
  test('acknowledgement sections use section * 100', () => {
    assert.deepEqual(
      SUBSCRIPTION_SECTIONS.filter((s) => s.code !== undefined).map((s) => [s.id, s.code]),
      [
        [1, 100],
        [3, 300],
        [5, 500],
        [6, 600],
      ],
    );
  });

  test('choice codes are section * 100 plus the one-based ordinal, in the order shown', () => {
    for (const section of SUBSCRIPTION_SECTIONS) {
      section.choices?.forEach((choice, index) => {
        assert.equal(
          choice.code,
          section.id * 100 + index + 1,
          `option "${choice.key}" has a code that does not match its position`,
        );
      });
    }
    assert.deepEqual(getSection(2)!.choices!.map((c) => c.code), [201, 202, 203, 204, 205]);
    assert.deepEqual(getSection(4)!.choices!.map((c) => c.code), [401, 402]);
  });

  test('no two confirmations share a code', () => {
    assert.equal(new Set(VALID_CODES).size, VALID_CODES.length);
  });

  test('every code fits the bound the confirm endpoint validates against', () => {
    // app/api/subscriptions/[id]/confirm/route.ts admits 100 through
    // (SUBSCRIPTION_SECTION_COUNT + 1) * 100. A code outside that window
    // would be rejected as malformed before it ever reached the table.
    const max = (SUBSCRIPTION_SECTION_COUNT + 1) * 100;
    for (const code of VALID_CODES) {
      assert.ok(code >= 100 && code <= max, `code ${code} is outside the accepted range`);
      assert.ok(Number.isInteger(code), `code ${code} is not an integer`);
    }
  });

  test('the answers-map keys are stable, because live subscriptions already hold them', () => {
    // Renaming any of these reinterprets what an investor previously
    // confirmed. They are part of the record, not an implementation detail.
    assert.equal(sectionKey(1), 'sec1');
    assert.equal(sectionKey(6), 'sec6');
    assert.equal(choiceKey(2, 'income'), 'sec2.income');
    assert.equal(choiceKey(4, 'benefit-plan'), 'sec4.benefit-plan');
  });
});

describe('decodeConfirmationCode', () => {
  test('every legitimate code resolves back to its own section and option', () => {
    for (const section of SUBSCRIPTION_SECTIONS) {
      if (section.choices) {
        for (const choice of section.choices) {
          const decoded = decodeConfirmationCode(choice.code);
          assert.ok(decoded, `code ${choice.code} did not decode`);
          assert.equal(decoded.section.id, section.id);
          assert.equal(decoded.choice, choice);
        }
      } else {
        const decoded = decodeConfirmationCode(section.code as number);
        assert.ok(decoded, `code ${section.code} did not decode`);
        assert.equal(decoded.section.id, section.id);
        assert.equal(decoded.choice, null);
      }
    }
  });

  test('a selection section cannot be confirmed without naming which option was chosen', () => {
    // The whole reason the code is packed. A bare 200 would record that
    // the investor asserted an accreditation category without recording
    // which one, and the audit trail would be unable to say.
    assert.equal(decodeConfirmationCode(200), null);
    assert.equal(decodeConfirmationCode(400), null);
  });

  test('an acknowledgement section rejects a code that pretends to carry a choice', () => {
    assert.equal(decodeConfirmationCode(101), null);
    assert.equal(decodeConfirmationCode(601), null);
  });

  test('an option ordinal that does not exist is rejected', () => {
    assert.equal(decodeConfirmationCode(206), null);
    assert.equal(decodeConfirmationCode(403), null);
  });

  test('a code for a section that does not exist is rejected', () => {
    for (const code of [0, 99, 700, 701, 9_900, -100]) {
      assert.equal(decodeConfirmationCode(code), null, `code ${code} decoded`);
    }
  });
});

describe('the completeness check the sign endpoint runs', () => {
  test('an untouched agreement lists every section as outstanding', () => {
    // This is the set the invest flow renders as panels and the set the
    // sign endpoint refuses on. They are the same array by construction,
    // which is the invariant.
    const outstanding = unconfirmedSections({});
    assert.deepEqual(outstanding, [...SUBSCRIPTION_SECTIONS]);
    assert.equal(outstanding.length, SUBSCRIPTION_SECTION_COUNT);
  });

  test('a fully confirmed agreement is ready to sign', () => {
    assert.deepEqual(unconfirmedSections(fullyConfirmed()), []);
  });

  test('one missing confirmation is enough to block signing', () => {
    for (const section of SUBSCRIPTION_SECTIONS) {
      const answers = fullyConfirmed();
      delete answers[sectionKey(section.id)];
      const outstanding = unconfirmedSections(answers);
      assert.deepEqual(
        outstanding.map((s) => s.id),
        [section.id],
        `dropping section ${section.id} did not block signing`,
      );
    }
  });

  test('confirming through the real codes is enough to clear the agreement', () => {
    // Walks the codes the browser actually posts, decoding each one the
    // way the repository does, and checks the sign endpoint would let it
    // through. This is the whole flow expressed over pure functions.
    const answers: Record<string, boolean> = {};
    for (const code of VALID_CODES) {
      const decoded = decodeConfirmationCode(code);
      assert.ok(decoded, `code ${code} did not decode`);
      answers[sectionKey(decoded.section.id)] = true;
      if (decoded.choice) {
        answers[choiceKey(decoded.section.id, decoded.choice.key)] = true;
      }
    }
    assert.deepEqual(unconfirmedSections(answers), []);
  });

  test('a falsy answer counts as unconfirmed, not as a confirmation that exists', () => {
    const answers = fullyConfirmed();
    answers[sectionKey(3)] = false;
    assert.equal(isSectionConfirmed(answers, 3), false);
    assert.deepEqual(unconfirmedSections(answers).map((s) => s.id), [3]);
  });

  test('the completeness check counts panels, not choices', () => {
    // Documented, not endorsed. `unconfirmedSections` only looks for
    // `secN`, so an answers map that marks a selection section confirmed
    // without recording which option was chosen still reads as ready to
    // sign. That state is unreachable through the API: `confirmSection` in
    // lib/repositories/subscriptions.ts writes the section key and the
    // choice key in the same update, and rejects any code that does not
    // name a choice. The check is a count, and the atomic write is what
    // makes the count sufficient.
    const answers = fullyConfirmed();
    delete answers[choiceKey(2, getSection(2)!.choices![0].key)];
    assert.deepEqual(unconfirmedSections(answers), []);
    assert.equal(selectedChoice(answers, getSection(2)!), null);
  });
});

describe('selectedChoice', () => {
  test('reports the option the investor picked', () => {
    const section = getSection(2)!;
    for (const choice of section.choices!) {
      const answers = { [choiceKey(section.id, choice.key)]: true };
      assert.equal(selectedChoice(answers, section), choice);
    }
  });

  test('reports nothing when no option has been recorded', () => {
    assert.equal(selectedChoice({}, getSection(2)!), null);
    assert.equal(selectedChoice({ sec2: true }, getSection(2)!), null);
  });

  test('an acknowledgement section never has a selected option', () => {
    assert.equal(selectedChoice(fullyConfirmed(), getSection(1)!), null);
  });
});

describe('the document states the fee model lib/fees.ts computes', () => {
  test('the "What you pay" clause is 5% once at closing and 10% carry, and nothing else', () => {
    const section = getSection(3)!;
    const clause = section.points.find((p) => p.lead === 'What you pay');
    assert.ok(clause, 'the executed agreement no longer states what the investor pays');
    assert.match(clause.text, /5% management fee/);
    assert.match(clause.text, /once at closing/);
    assert.match(clause.text, /never annually/);
    assert.match(clause.text, /[Tt]en percent carried interest/);
    assert.match(clause.text, /at exit/);
    assert.match(clause.text, /no capital calls, ever/);
  });

  test('the agreement never introduces a fee the product does not charge', () => {
    // The product commits to two numbers. If a third charge is ever
    // written into the document it has to be written into lib/fees.ts too,
    // and this is the half of that pair that catches the document.
    for (const banned of [
      /annual fee/i,
      /admin(istrative)? reserve/i,
      /reserve for expenses/i,
      /subsequent capital contribution/i,
      /additional capital contribution/i,
    ]) {
      assert.equal(
        banned.test(ALL_PROSE),
        false,
        `the agreement now contains ${banned}`,
      );
    }
  });

  test('every mention of a capital call is a denial of one', () => {
    // "No capital calls, ever" is a promise the product makes. The phrase
    // is allowed to appear, but only in the negative.
    const mentions = ALL_PROSE.match(/.{0,30}capital calls?.{0,10}/gi) ?? [];
    assert.ok(mentions.length > 0, 'the agreement stopped mentioning capital calls at all');
    for (const mention of mentions) {
      assert.match(
        mention,
        /\bno capital calls?\b/i,
        `capital calls are mentioned other than to deny them: "${mention.trim()}"`,
      );
    }
  });

  test('every mention of a recurring charge is a denial of one', () => {
    // The fee is charged once. "Never annually" is the only way the word
    // may appear, because anything else is a second, recurring fee.
    const mentions = ALL_PROSE.match(/.{0,20}(annual|annually|per annum|each year).{0,10}/gi) ?? [];
    assert.ok(mentions.length > 0, 'the agreement stopped saying the fee is not annual');
    for (const mention of mentions) {
      assert.match(
        mention,
        /\b(never|not|no)\b/i,
        `a recurring charge is described without being denied: "${mention.trim()}"`,
      );
    }
  });
});

describe('the document is written in the house voice', () => {
  test('no em dashes reach the investor', () => {
    // The voice rule is absolute for user-facing copy, and this is the
    // most user-facing copy in the product.
    const offenders = SUBSCRIPTION_SECTIONS.filter((section) =>
      [
        section.panelIntro,
        section.panelTitle,
        section.documentTitle,
        section.choicePrompt ?? '',
        ...section.points.map((p) => p.text),
        ...(section.choices ?? []).map((c) => c.detail),
      ].some((text) => text.includes('—')),
    );
    assert.deepEqual(
      offenders.map((s) => s.id),
      [],
      'a section contains an em dash',
    );
  });
});
