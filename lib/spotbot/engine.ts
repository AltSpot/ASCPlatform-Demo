/**
 * The answer engine.
 *
 * DEMO SEAM — SpotBot is not a model. Answers are retrieved from the
 * fixed corpus in ./knowledge.ts by word overlap, which is why they are
 * instant, identical on every run, and unable to say anything that is not
 * already written down. The refusal gate in ./gate.ts is NOT part of this
 * seam and stays exactly where it is.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  WIRING IN CLAUDE LATER                                          │
 * │                                                                  │
 * │  Replace the body of `generateAnswer` below. Nothing else.       │
 * │                                                                  │
 * │  Keep the signature (AnswerInput -> Promise<SpotBotAnswer>) and  │
 * │  keep it async, so no call site changes. Send the KNOWLEDGE      │
 * │  entries from ./knowledge.ts as the retrieval corpus and the     │
 * │  page brief from ./pages.ts as context, and require the model    │
 * │  to return the `source` of whatever it drew from, because every  │
 * │  answer has to stay checkable against a real document.           │
 * │                                                                  │
 * │  Do NOT move the gate. `askSpotBot` classifies the question and  │
 * │  refuses before this function is ever called, which is what      │
 * │  makes the refusal hold regardless of what produces the answers. │
 * │  On a model or network failure, fall back to `fallbackAnswer`    │
 * │  rather than throwing: a guide that 500s mid-signing is worse    │
 * │  than a guide that says it does not know.                        │
 * │                                                                  │
 * │  There is no Anthropic API key in this environment and nothing   │
 * │  here depends on one. Today the answers are retrieved locally,   │
 * │  which is also why they are fast and identical on every run.     │
 * └──────────────────────────────────────────────────────────────────┘
 */
import { classify, normalize, refusalAnswer } from './gate';
import { KNOWLEDGE, questionsFor, topic, type KnowledgeTopic } from './knowledge';
import { pageContext, type PageContext } from './pages';
import type { SpotBotAnswer, SpotBotRequest } from './types';

export interface AnswerInput {
  question: string;
  page: PageContext;
}

/** Words that carry no signal and would otherwise dominate the overlap. */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'does',
  'for', 'from', 'get', 'has', 'have', 'how', 'i', 'if', 'in', 'is', 'it',
  'its', 'me', 'my', 'of', 'on', 'or', 'our', 'so', 'that', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'we', 'what',
  'whats', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'you',
  'your', 'about', 'mean', 'means', 'work', 'works', 'tell', 'explain',
]);

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9$%]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Keyword matchers are cached and anchored to word edges. A plain substring
 * test finds "ach" inside "reach" and "mark" inside "marketplace", which is
 * how a funding answer ends up under a question about sourcing.
 */
const MATCHERS = new Map<string, RegExp>();

function matches(text: string, keyword: string): boolean {
  let matcher = MATCHERS.get(keyword);
  if (!matcher) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    matcher = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`);
    MATCHERS.set(keyword, matcher);
  }
  return matcher.test(text);
}

/**
 * Score a topic against the question. Phrase hits are worth far more than
 * loose token overlap, because "capital call" is a subject and "capital"
 * on its own is noise.
 */
function score(entry: KnowledgeTopic, text: string, words: Set<string>): number {
  let total = 0;

  for (const keyword of entry.keywords) {
    if (matches(text, keyword)) total += 3 + keyword.split(' ').length;
  }

  const canonical = new Set([...tokens(entry.question), ...entry.keywords.flatMap(tokens)]);
  for (const word of words) {
    if (canonical.has(word)) total += 1;
  }

  return total;
}

const MIN_CONFIDENCE = 4;

/** Best matching topic for a question, or null when nothing is close. */
export function retrieve(question: string, page: PageContext): KnowledgeTopic | null {
  const text = normalize(question);
  const words = new Set(tokens(question));

  // The suggested chips send back canonical phrasings verbatim. Honour the
  // exact match so a tapped question can never miss its own answer.
  const exact = KNOWLEDGE.find((entry) => normalize(entry.question) === text);
  if (exact) return exact;

  let best: KnowledgeTopic | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE) {
    let value = score(entry, text, words);
    // A page boost breaks ties toward what the investor is looking at. It
    // only lifts topics that already matched, so it cannot invent a hit.
    if (value > 0 && page.topics.includes(entry.id)) value += 2;

    if (value > bestScore) {
      best = entry;
      bestScore = value;
    }
  }

  return bestScore >= MIN_CONFIDENCE ? best : null;
}

/** Said out loud when retrieval finds nothing. Honest beats plausible. */
export function fallbackAnswer(page: PageContext): SpotBotAnswer {
  return {
    body: `I do not have that one in the platform guide, and I would rather say so than guess. I cover how the platform and the process work: what a step requires, what a term means, what is in a document, and how the fees are charged. For anything specific to a deal, the offering documents in its data room govern. For anything about your own account or a live commitment, contact the AltSpot team directly. On this page, ${page.brief.charAt(0).toLowerCase()}${page.brief.slice(1)}`,
    source: 'AltSpot platform guide',
    refused: false,
    followUps: page.suggested,
  };
}

const GREETING = /^(hi|hello|hey|yo|howdy|good (morning|afternoon|evening))\b/;
const THANKS = /^(thanks|thank you|ty|cheers|got it|makes sense|perfect)\b/;

/**
 * Produce an answer for a question the gate has already allowed.
 *
 * THIS IS THE FUNCTION TO REPLACE when the Claude API is wired in. See the
 * header comment. Callers must not call it directly; go through
 * `askSpotBot` so the gate always runs first.
 */
export async function generateAnswer(input: AnswerInput): Promise<SpotBotAnswer> {
  const text = normalize(input.question);

  if (THANKS.test(text)) {
    return {
      body: 'Any time. I am here on every page, so ask again whenever something on screen needs explaining.',
      source: 'AltSpot platform guide, SpotBot',
      refused: false,
      followUps: input.page.suggested,
    };
  }

  if (GREETING.test(text) && text.split(' ').length <= 4) {
    const scope = topic('spotbot-scope');
    return {
      body: `Hello. ${scope?.answer ?? ''}`.trim(),
      source: scope?.source ?? 'AltSpot platform guide',
      refused: false,
      followUps: input.page.suggested,
    };
  }

  const match = retrieve(input.question, input.page);
  if (!match) return fallbackAnswer(input.page);

  return {
    body: match.answer,
    source: match.source,
    refused: false,
    followUps: questionsFor(match.related ?? []).slice(0, 3),
  };
}

/**
 * The one call the rest of the app makes. Gate, then answer, in that order
 * and never the other way round.
 */
export async function askSpotBot(request: SpotBotRequest): Promise<SpotBotAnswer> {
  const page = pageContext(request.pathname);

  const verdict = classify(request.question);
  if (!verdict.allowed && verdict.reason) return refusalAnswer(verdict.reason);

  return generateAnswer({ question: request.question, page });
}
