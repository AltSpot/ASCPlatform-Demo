/**
 * Bind the offering binder to the deal being subscribed to.
 *
 * WHY THIS EXISTS. `lib/documents/generated/*.json` is counsel's export
 * of one complete worked example: a subscription into ASC Synthera II,
 * LLC, a vehicle holding shares of Synthera AI, Inc. Neither name is a
 * placeholder in the source. Rendered as delivered, an investor
 * subscribing to Calder Grid read a memorandum, a subscription
 * agreement and an operating agreement that named a different company
 * on every page, while the chrome around them said Calder. In a
 * securities product that is the worst possible place for a wrong
 * name, and it is the first thing anyone reading the documents notices.
 *
 * So the party names are substituted at render time. Only names: the
 * vehicle the investor joins and the portfolio company it holds. The
 * clause text, the numbering and the ordering are counsel's and are
 * never touched, which is the same contract the import already had.
 *
 * WHAT THIS DOES NOT FIX. The memorandum's business description is
 * still Synthera's: what the company sells, who buys it, the risks
 * specific to that model. Substituting the name there would produce a
 * document that describes the wrong business under the right name,
 * which is worse than an obvious specimen. So the memorandum carries a
 * specimen notice instead, and the real fix is a tokenised template
 * from counsel, per the note in CLAUDE.md.
 *
 * ONE PASS, NOT ONE PER RULE. Applying the rules in sequence re-scans
 * text a previous rule already produced: on the lead deal, "Calder
 * Grid, Inc." survived its own rule unchanged, then the bare "Calder"
 * rule fired inside the result and produced "Calder Grid Grid, Inc.".
 * So every pattern is compiled into one alternation and the string is
 * walked once. Nothing this function writes is ever read back.
 *
 * Order still matters, because a JavaScript alternation takes the first
 * branch that matches at a position: longest form first, or "ASC
 * Synthera II, LLC" matches the bare "Synthera" branch and is left as
 * "ASC Calder Grid II, LLC".
 */
import type { DocumentArticle, LegalDocument, TextRun } from './types';

export interface DocumentParty {
  /** The vehicle, e.g. "ASC Calder I, LLC". `Deal.entity`. */
  entity: string;
  /** The portfolio company, e.g. "Calder Grid". `Deal.name`. */
  company: string;
}

/** The vehicle name without its suffix, for prose that omits ", LLC". */
function bareEntity(entity: string): string {
  return entity.replace(/,?\s*(LLC|L\.L\.C\.|Inc\.?|Corp\.?)\s*$/i, '').trim();
}

/**
 * The specimen names, longest first. Each maps to a function of the
 * deal so a rule can pick the right form of the same name.
 */
const RULES: [RegExp, (party: DocumentParty) => string][] = [
  /* Before the name rules, or this becomes "https://openai.ai/". The
     specimen's own domain has no equivalent on a real deal, and
     example.com is IANA-reserved for documentation, so it reads as the
     placeholder it is rather than as a half-finished substitution. */
  [/synthera\.ai/gi, () => 'example.com'],

  [/ASC SYNTHERA II, LLC/g, (p) => p.entity.toUpperCase()],
  [/ASC Synthera II, LLC/g, (p) => p.entity],
  [/ASC Synthera, LLC/g, (p) => p.entity],
  [/ASC Synthera LLC/g, (p) => p.entity],
  [/ASC SYNTHERA II/g, (p) => bareEntity(p.entity).toUpperCase()],
  [/ASC Synthera II/g, (p) => bareEntity(p.entity)],
  [/SYNTHERA AI, INC\./g, (p) => `${p.company.toUpperCase()}, INC.`],
  [/Synthera AI, Inc\./g, (p) => `${p.company}, Inc.`],
  [/SYNTHERA, INC\./g, (p) => `${p.company.toUpperCase()}, INC.`],
  [/Synthera, Inc\./g, (p) => `${p.company}, Inc.`],
  /* A product brand in the specimen. There is no equivalent on a real
     deal, so it becomes the company's own name rather than inventing
     a product that does not exist. */
  [/Synthera Care/g, (p) => p.company],
  [/Synthera AI/g, (p) => p.company],
  [/SYNTHERA/g, (p) => p.company.toUpperCase()],
  [/Synthera/g, (p) => p.company],

  /* Our own confirmation-panel copy in lib/subscription-sections.ts was
     written against the lead deal and names Calder throughout. Same
     problem, same fix, and on the Calder deal every rule below is a
     no-op because the names already match. */
  [/ASC CALDER I, LLC/g, (p) => p.entity.toUpperCase()],
  [/ASC Calder I, LLC/g, (p) => p.entity],
  [/Calder Grid, Inc\./g, (p) => `${p.company}, Inc.`],
  [/Calder Grid/g, (p) => p.company],
  [/Calder/g, (p) => p.company],
];

/** Every pattern as one alternation, in declaration order. */
const COMBINED = new RegExp(
  RULES.map(([pattern]) => `(?:${pattern.source})`).join('|'),
  'g',
);

/** Each rule again, anchored, to identify which branch matched. */
const ANCHORED = RULES.map(
  ([pattern, replacement]) =>
    [new RegExp(`^(?:${pattern.source})$`, pattern.flags.replace('g', '')), replacement] as const,
);

export function personalizeText(text: string, party: DocumentParty): string {
  if (!text) return text;

  return text.replace(COMBINED, (match) => {
    for (const [anchored, replacement] of ANCHORED) {
      if (anchored.test(match)) return replacement(party);
    }
    return match;
  });
}

function personalizeRun(run: TextRun, party: DocumentParty): TextRun {
  const text = personalizeText(run.text, party);
  return text === run.text ? run : { ...run, text };
}

function personalizeArticle(
  article: DocumentArticle,
  party: DocumentParty,
): DocumentArticle {
  return {
    ...article,
    title: personalizeText(article.title, party),
    blocks: article.blocks.map((block) => ({
      ...block,
      title: block.title ? personalizeText(block.title, party) : block.title,
      runs: block.runs?.map((run) => personalizeRun(run, party)),
      rows: block.rows?.map((row) =>
        row.map((cell) => personalizeText(cell, party)),
      ),
      mergeValue: block.mergeValue
        ? personalizeText(block.mergeValue, party)
        : block.mergeValue,
    })),
  };
}

/**
 * A copy of the document with the party names bound to this deal.
 *
 * `contentHash` is deliberately carried through unchanged: it pins the
 * words counsel wrote, and a subscription executed against this
 * template must still pin the same version whichever deal it was for.
 */
export function personalizeDocument(
  document: LegalDocument,
  party: DocumentParty,
): LegalDocument {
  return {
    ...document,
    title: document.title ? personalizeText(document.title, party) : document.title,
    subtitle: document.subtitle?.map((line) => personalizeText(line, party)),
    articles: document.articles.map((article) =>
      personalizeArticle(article, party),
    ),
  };
}
