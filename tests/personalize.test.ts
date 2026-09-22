/**
 * Binding the offering binder to the deal being subscribed to.
 *
 * The bug this pins: counsel's export is one worked example naming
 * Synthera throughout, and the confirmation panels are written against
 * the lead deal and name Calder. Rendered as authored, an investor
 * subscribing to OpenAI executed documents that named two other
 * companies. A wrong company name in a securities document is the worst
 * class of defect this product can ship, so it is tested rather than
 * checked by eye.
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { BINDER } from '../lib/documents/registry';
import { partyFor, personalizeDocument, personalizeText } from '../lib/documents/personalize';
import type { LegalDocument } from '../lib/documents/types';

const PARTY = { entity: 'ASC OpenAI SPV, LLC', company: 'OpenAI' };
const LEAD = { entity: 'ASC Calder I, LLC', company: 'Calder Grid' };

/** Every word in a document, so a leak anywhere is caught. */
function allText(document: LegalDocument): string {
  const parts: string[] = [document.title ?? '', ...(document.subtitle ?? [])];

  for (const article of document.articles) {
    parts.push(article.title);
    for (const block of article.blocks) {
      parts.push(block.title ?? '', block.mergeValue ?? '');
      for (const run of block.runs ?? []) parts.push(run.text);
      for (const row of block.rows ?? []) parts.push(...row);
    }
  }
  return parts.join('\n');
}

describe('personalizeText', () => {
  test('the vehicle keeps the case it was written in', () => {
    assert.equal(
      personalizeText('ASC SYNTHERA II, LLC', PARTY),
      'ASC OPENAI SPV, LLC',
    );
    assert.equal(
      personalizeText('ASC Synthera II, LLC', PARTY),
      'ASC OpenAI SPV, LLC',
    );
  });

  /* The rule that ordering exists to protect. With the bare "Synthera"
     rule first, this came out as "ASC OpenAI II, LLC": a vehicle that
     does not exist, built from half of each name. */
  test('the longest form wins, so a vehicle is never half-replaced', () => {
    const out = personalizeText('ASC Synthera II, LLC', PARTY);
    assert.equal(out.includes('II'), false, out);
    assert.equal(out, PARTY.entity);
  });

  test('the portfolio company keeps its corporate suffix', () => {
    assert.equal(personalizeText('SYNTHERA, INC.', PARTY), 'OPENAI, INC.');
    assert.equal(personalizeText('Synthera AI, Inc.', PARTY), 'OpenAI, Inc.');
  });

  test('the panel copy written against the lead deal is bound too', () => {
    assert.equal(
      personalizeText('no representation about Calder Grid, Inc.', PARTY),
      'no representation about OpenAI, Inc.',
    );
    assert.equal(
      personalizeText('admits you as a Class B Member of ASC Calder I, LLC', PARTY),
      'admits you as a Class B Member of ASC OpenAI SPV, LLC',
    );
  });

  test('the specimen domain becomes a reserved placeholder, not a fake one', () => {
    const out = personalizeText('located at https://synthera.ai/.', PARTY);
    assert.equal(out, 'located at https://example.com/.');
    assert.equal(/openai\.ai/i.test(out), false, 'invented a domain');
  });

  test('on the lead deal every rule is a no-op', () => {
    const line = 'AltSpot makes no representation about Calder Grid, Inc.';
    assert.equal(personalizeText(line, LEAD), line);
  });

  test('substitution is idempotent', () => {
    const once = personalizeText('ASC Synthera II, LLC holds Synthera, Inc.', PARTY);
    assert.equal(personalizeText(once, PARTY), once);
  });
});

describe('the binder as delivered', () => {
  for (const entry of BINDER) {
    test(`${entry.shortTitle} names no company but the deal's`, () => {
      const text = allText(personalizeDocument(entry.document, PARTY));

      assert.equal(
        /synthera/i.test(text),
        false,
        'the specimen company leaked into a document the investor executes',
      );
      assert.equal(
        /calder/i.test(text),
        false,
        'the lead deal leaked into another deal’s document',
      );
    });
  }

  test('the words counsel wrote are otherwise untouched', () => {
    const [ppm] = BINDER;
    const before = allText(ppm.document);
    const after = allText(personalizeDocument(ppm.document, PARTY));

    /* Only names change, so the shape of the document does not: same
       article count, same block count, same line count. */
    assert.equal(after.split('\n').length, before.split('\n').length);
    assert.equal(
      personalizeDocument(ppm.document, PARTY).articles.length,
      ppm.document.articles.length,
    );
  });

  test('the content hash still pins counsel’s version', () => {
    const [ppm] = BINDER;
    assert.equal(
      personalizeDocument(ppm.document, PARTY).contentHash,
      ppm.document.contentHash,
    );
  });
});

describe('the cover names the deal it belongs to', () => {
  test('the round and the size come from the deal', () => {
    const party = partyFor({ entity: 'ASC Calder I, LLC', name: 'Calder Grid', tag: 'AltSpot-led · Series A', allocationTotal: 2_000_000 });
    assert.equal(party.round, 'Series A');
    assert.equal(party.allocation, 2_000_000);
    assert.equal(
      personalizeText('Up to $588,235 in Class B Common Units · Series Seed Preferred Stock Financing', party),
      'Up to $2,000,000 in Class B Common Units · Series A Preferred Stock Financing',
    );
  });

  test('a round that is not a lettered series keeps the specimen wording', () => {
    assert.equal(partyFor({ entity: 'ASC Aurelia SPV, LLC', name: 'Aurelia Labs', tag: 'Late-stage secondary', allocationTotal: 3_000_000 }).round, undefined);
    assert.equal(partyFor({ entity: 'ASC Harrow I, LLC', name: 'Harrow Labs', tag: 'AltSpot-led · Seed', allocationTotal: 240_000 }).round, 'Series Seed');
  });
});
