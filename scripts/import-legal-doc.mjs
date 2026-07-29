#!/usr/bin/env node
/**
 * Convert a .docx subscription agreement into the structured template the
 * portal renders.
 *
 *   node scripts/import-legal-doc.mjs "<path to .docx>" > out.json
 *
 * The goal is a DIGITAL TEMPLATE, not a PDF viewer. The words and the
 * section structure must match counsel's document exactly; only the
 * typography and the merge fields are ours. Nothing here rewrites,
 * summarises or reorders the text.
 *
 * Structure is recovered from the text itself, because the source uses
 * Word auto-numbering rather than styled headings for most of the
 * document:
 *
 *   "3. REPRESENTATIONS, WARRANTIES..."  an article heading (caps)
 *   "3.1 Accredited Investor."           a numbered section
 *   ListParagraph runs                   lettered sub-clauses
 *
 * Merge fields are inserted afterwards by a curated map, never guessed,
 * so a change in counsel's wording can never silently move an investor's
 * data into the wrong clause.
 */
import { execFileSync } from 'node:child_process';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/import-legal-doc.mjs "<path to .docx>"');
  process.exit(1);
}

const xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], {
  maxBuffer: 80 * 1024 * 1024,
}).toString();

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** One entry per Word paragraph, with the style we need to spot lists. */
const paragraphs = xml
  .split(/<w:p[ >]/)
  .slice(1)
  .map((chunk) => {
    const style = (chunk.match(/w:pStyle w:val="([^"]+)"/) || [])[1] ?? '';

    // The split consumed the opening "<w:p", so this chunk still begins
    // with that element's own attributes. They are not inside a tag pair
    // any more, so tag-stripping alone would leave them in the text.
    const body = chunk.slice(chunk.indexOf('>') + 1);

    const text = decode(
      body.replace(/<w:tab[^>]*\/>/g, ' ').replace(/<[^>]+>/g, ''),
    );
    return { style, text };
  })
  .filter((p) => p.text.length > 0);

const ARTICLE = /^(\d+)\.\s+([A-Z][A-Z0-9 ,&;'’\-\/()]{4,})$/;
const SECTION = /^(\d+\.\d+)\s+(.+?\.)\s*(.*)$/;
const EXHIBIT = /^(EXHIBIT\s+[A-Z])\b(.*)$/i;

const doc = { title: null, subtitle: [], articles: [] };
let article = null;

function pushBlock(block) {
  if (!article) {
    article = { numeral: null, title: 'PREAMBLE', blocks: [] };
    doc.articles.push(article);
  }
  article.blocks.push(block);
}

for (const p of paragraphs) {
  const { text, style } = p;

  if (!doc.title && /^SUBSCRIPTION AGREEMENT$/i.test(text)) {
    doc.title = text;
    continue;
  }

  const exhibit = EXHIBIT.exec(text);
  if (exhibit) {
    article = { numeral: exhibit[1], title: exhibit[2].trim() || exhibit[1], blocks: [] };
    doc.articles.push(article);
    continue;
  }

  const heading = ARTICLE.exec(text);
  if (heading) {
    article = { numeral: heading[1], title: heading[2].trim(), blocks: [] };
    doc.articles.push(article);
    continue;
  }

  const section = SECTION.exec(text);
  if (section) {
    pushBlock({
      type: 'section',
      n: section[1],
      title: section[2].replace(/\.$/, ''),
      text: section[3] ?? '',
    });
    continue;
  }

  pushBlock({
    type: style === 'ListParagraph' ? 'item' : 'p',
    text,
  });
}

// Everything before the first real article is front matter, not a clause.
const preamble = doc.articles[0];
if (preamble && preamble.title === 'PREAMBLE') {
  doc.subtitle = preamble.blocks.filter((b) => b.type === 'p').map((b) => b.text);
}

process.stdout.write(JSON.stringify(doc, null, 2));
