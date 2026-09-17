/**
 * Paragraphs for Spot's answers (Tyler, 2026-09-17: "provide paragraph
 * breaks where necessary"). The knowledge base is written as one run of
 * sentences per topic, which reads as a wall in a chat bubble. This
 * groups sentences into short paragraphs: a break after every two or
 * three sentences, sooner when a paragraph would run long, and never
 * inside a figure like "$1,000,000" or an abbreviation like "e.g.".
 *
 * Pure. The engine applies it on the way out, so a stored thread already
 * carries its breaks and the dock only has to render them.
 */

/** Sentences per paragraph before a break is forced. */
const SENTENCES_PER_PARAGRAPH = 3;
/** Characters after which a break is taken at the next sentence end. */
const SOFT_LIMIT = 260;

const ABBREVIATIONS = /\b(e\.g|i\.e|etc|vs|no|inc|llc|st|dr|mr|ms|mrs|u\.s)\.$/i;

/** Split text into sentences, keeping their punctuation. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  let current = '';
  for (const piece of text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)) {
    current = current ? `${current} ${piece}` : piece;
    if (ABBREVIATIONS.test(current)) continue;
    out.push(current);
    current = '';
  }
  if (current) out.push(current);
  return out;
}

/** Break a run of prose into paragraphs joined by a blank line. */
export function paragraphs(text: string): string {
  if (text.includes('\n\n')) return text;
  const parts = sentences(text.trim());
  if (parts.length <= SENTENCES_PER_PARAGRAPH) return text.trim();

  const out: string[] = [];
  let current: string[] = [];
  let length = 0;
  for (const sentence of parts) {
    current.push(sentence);
    length += sentence.length;
    if (current.length >= SENTENCES_PER_PARAGRAPH || length >= SOFT_LIMIT) {
      out.push(current.join(' '));
      current = [];
      length = 0;
    }
  }
  /* A one-sentence tail joins the paragraph before it rather than
     standing alone. */
  if (current.length === 1 && out.length > 0) {
    out[out.length - 1] = `${out[out.length - 1]} ${current[0]}`;
  } else if (current.length > 0) {
    out.push(current.join(' '));
  }
  return out.join('\n\n');
}
