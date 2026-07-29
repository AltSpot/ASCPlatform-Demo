#!/usr/bin/env node
/**
 * Convert counsel's .docx into the structured template the portal renders.
 *
 *   node scripts/import-legal-doc.mjs "<path.docx>" <slug> "<title>"
 *
 * The output is a DIGITAL TEMPLATE, not a PDF viewer. The words and the
 * clause numbering are counsel's and are never rewritten. What we add is
 * typography, merge fields, and the link from each clause to the panel
 * that discharges it.
 *
 * Fidelity matters more than convenience here. Bold and italic runs are
 * preserved because legal drafting uses them to mark defined terms, and
 * tables are preserved because Exhibit A's questionnaire is one. A
 * regulator comparing our render to counsel's original should find the
 * same emphasis in the same places.
 *
 * Structure is recovered from the text, because the source uses Word
 * auto-numbering rather than styled headings for most of the document.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [file, slug, title] = process.argv.slice(2);
if (!file || !slug) {
  console.error('Usage: node scripts/import-legal-doc.mjs "<path.docx>" <slug> "<title>"');
  process.exit(1);
}

const xml = execFileSync('unzip', ['-p', file, 'word/document.xml'], {
  maxBuffer: 80 * 1024 * 1024,
}).toString();

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/ /g, ' ');
}

/**
 * Pull the styled runs out of one paragraph. A run is a span of text with
 * consistent formatting, which is exactly the granularity we need to keep
 * bolded defined terms bolded.
 */
function runsFrom(paragraphXml) {
  const runs = [];

  for (const match of paragraphXml.matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)) {
    const body = match[1];

    // <w:b/> sets bold; <w:b w:val="0"/> explicitly clears it.
    const bold = /<w:b(?:\s+[^>]*)?\/>/.test(body) && !/<w:b\s+[^>]*w:val="(?:0|false)"/.test(body);
    const italic = /<w:i(?:\s+[^>]*)?\/>/.test(body) && !/<w:i\s+[^>]*w:val="(?:0|false)"/.test(body);

    let text = '';
    for (const t of body.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)) {
      text += decodeEntities(t[1]);
    }
    if (/<w:tab(?:\s[^>]*)?\/>/.test(body)) text += ' ';
    if (!text) continue;

    const last = runs[runs.length - 1];
    if (last && last.b === bold && last.i === italic) {
      last.text += text;
    } else {
      runs.push({ text, b: bold, i: italic });
    }
  }

  return runs
    .map((r) => ({ ...r, text: r.text.replace(/\s+/g, ' ') }))
    .filter((r) => r.text.trim().length > 0 || r.text === ' ');
}

const plain = (runs) => runs.map((r) => r.text).join('').replace(/\s+/g, ' ').trim();

/** Tables are lifted whole, since a questionnaire is meaningless in pieces. */
function tablesIn(xmlChunk) {
  const tables = [];
  for (const t of xmlChunk.matchAll(/<w:tbl>([\s\S]*?)<\/w:tbl>/g)) {
    const rows = [];
    for (const tr of t[1].matchAll(/<w:tr[\s>]([\s\S]*?)<\/w:tr>/g)) {
      const cells = [];
      for (const tc of tr[1].matchAll(/<w:tc>([\s\S]*?)<\/w:tc>/g)) {
        cells.push(plain(runsFrom(tc[1])));
      }
      if (cells.some((c) => c.length > 0)) rows.push(cells);
    }
    if (rows.length > 0) tables.push(rows);
  }
  return tables;
}

// Split the body into paragraphs and tables, in document order.
const nodes = [];
const bodyXml = xml;
const partRe = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>|<w:p(?:\s[^>]*)?\/>/g;

for (const part of bodyXml.match(partRe) ?? []) {
  if (part.startsWith('<w:tbl>')) {
    for (const rows of tablesIn(part)) nodes.push({ kind: 'table', rows });
    continue;
  }
  const style = (part.match(/w:pStyle w:val="([^"]+)"/) || [])[1] ?? '';
  const runs = runsFrom(part);
  if (runs.length === 0) continue;
  nodes.push({ kind: 'p', style, runs, text: plain(runs) });
}

const ARTICLE = /^(\d+)\.\s+([A-Z][A-Z0-9 ,&;'’\-\/()]{4,})$/;
/** The PPM numbers its parts in Roman, e.g. "XI. RISK FACTORS". */
const ROMAN = /^([IVXLC]{1,6})\.\s+([A-Z][A-Z0-9 ,&;'’\-\/().—]{4,})$/;
const SECTION = /^(\d+\.\d+)\s+(.+?\.)\s*(.*)$/;
const EXHIBIT = /^(EXHIBIT\s+[A-Z])\b(.*)$/i;
const SCHEDULE = /^(SCHEDULE\s+[A-Z0-9]+)\b(.*)$/i;

/**
 * Counsel's own table of contents is dropped: the portal builds navigation
 * from the recovered structure, and two tables of contents that can drift
 * apart is worse than one that cannot.
 */
const TOC_HEADING = /^TABLE OF CONTENTS$/i;
let skippingToc = false;

/**
 * The Operating Agreement splits its headings across two paragraphs:
 * "ARTICLE 1" then "ORGANIZATIONAL MATTERS". When we see the first, the
 * next paragraph is the title rather than body text.
 */
const ARTICLE_ALONE = /^ARTICLE\s+(\d+|[IVXLC]+)$/i;
let pendingArticle = null;

/**
 * Explicit, logged text normalisations. Approved by Ryan on 2026-07-28:
 * counsel's draft calls the security "Series B Preferred" in places while
 * the deal is a Series Seed. Applied here rather than silently at render
 * time, and printed on every import, so the change is auditable and can be
 * reverted the moment counsel reissues the document.
 */
const SUBSTITUTIONS = [
  { from: /Series B Preferred Stock/g, to: 'Series Seed Preferred Stock' },
  { from: /Series B Preferred/g, to: 'Series Seed Preferred' },
  { from: /Series B Financing/g, to: 'Series Seed Financing' },
  // Counsel's unset date placeholder. The documents are dated 15 May 2026.
  { from: /\[●\]/g, to: 'May 15' },
];

/**
 * Fill-in lines, normalised so they render as ruled fields rather than
 * runs of underscores.
 *
 * Where the label tells us what belongs there, it becomes a merge field
 * and fills itself from the investor's record. Everything else becomes a
 * neutral blank, which still renders as a rule but is never filled: those
 * are the lines a countersigning Manager completes, not the investor.
 */
const LABEL_FIELDS = [
  { from: /\b(Print Name|Name of Subscriber|Name)\s*:\s*_{3,}/g, to: '$1: {{legalName}}' },
  { from: /\bSignature\s*:\s*_{3,}/g, to: 'Signature: {{signature}}' },
  { from: /\bDate\s*:\s*_{3,}/g, to: 'Date: {{date}}' },
  { from: /\b(Subscription Amount|Amount)\s*:\s*_{3,}/g, to: '$1: {{amount}}' },
  { from: /\b(Address|Residence Address|Mailing Address)\s*:\s*_{3,}/g, to: '$1: {{address}}' },
];

const doc = { slug, title: title ?? null, articles: [] };
let article = null;

function ensureArticle() {
  if (!article) {
    article = { numeral: null, title: 'PREAMBLE', blocks: [] };
    doc.articles.push(article);
  }
  return article;
}

for (const node of nodes) {
  if (node.kind === 'table') {
    ensureArticle().blocks.push({ type: 'table', rows: node.rows });
    continue;
  }

  const { text, runs, style } = node;

  if (TOC_HEADING.test(text)) {
    skippingToc = true;
    continue;
  }
  if (skippingToc) {
    // The contents list ends at the first real heading.
    if (ROMAN.test(text) && text === text.toUpperCase()) skippingToc = false;
    else continue;
  }

  if (pendingArticle) {
    article = { numeral: pendingArticle, title: text.trim(), blocks: [] };
    doc.articles.push(article);
    pendingArticle = null;
    continue;
  }

  const alone = ARTICLE_ALONE.exec(text);
  if (alone) {
    pendingArticle = alone[1].toUpperCase();
    continue;
  }

  const roman = ROMAN.exec(text);
  if (roman && text === text.toUpperCase()) {
    article = { numeral: roman[1], title: roman[2].trim(), blocks: [] };
    doc.articles.push(article);
    continue;
  }

  const exhibit = EXHIBIT.exec(text) ?? SCHEDULE.exec(text);
  if (exhibit) {
    article = { numeral: exhibit[1].toUpperCase(), title: exhibit[2].trim() || exhibit[1], blocks: [] };
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
    // Re-run the split against the runs so the body keeps its formatting.
    const heading_ = `${section[1]} ${section[2]}`;
    const rest = [];
    let consumed = 0;
    for (const run of runs) {
      if (consumed >= heading_.length) {
        rest.push(run);
      } else if (consumed + run.text.length > heading_.length) {
        rest.push({ ...run, text: run.text.slice(heading_.length - consumed) });
      }
      consumed += run.text.length;
    }

    ensureArticle().blocks.push({
      type: 'section',
      n: section[1],
      title: section[2].replace(/\.$/, ''),
      runs: rest.filter((r) => r.text.trim()),
    });
    continue;
  }

  ensureArticle().blocks.push({
    type: style === 'ListParagraph' ? 'item' : 'p',
    runs,
  });
}

/**
 * Merge points. Matched on exact source text rather than position, so a
 * change in counsel's wording fails loudly at import instead of quietly
 * moving an investor's data into the wrong clause.
 */
const MERGE_POINTS = [
  {
    from: 'the number of Class B Units set forth on the signature page hereto',
    to: '{{units}} Class B Units',
  },
  { from: 'Print Name: _______________________________________________', to: 'Print Name: {{legalName}}' },
  { from: 'Signature: _______________________________________________', to: 'Signature: {{signature}}' },
  { from: 'Name of Subscriber: _______________________________________', to: 'Name of Subscriber: {{legalName}}' },
];

let mergeHits = 0;
for (const article of doc.articles) {
  for (const block of article.blocks) {
    if (block.type === 'table') continue;
    for (const run of block.runs ?? []) {
      for (const point of MERGE_POINTS) {
        if (run.text.includes(point.from)) {
          run.text = run.text.split(point.from).join(point.to);
          mergeHits++;
        }
      }
    }
    // Signature-page summary lines carry their value on the right.
    const flat = (block.runs ?? []).map((r) => r.text).join('').trim();
    if (flat === 'Subscription Amount') block.mergeValue = '{{amount}}';
    if (flat === 'Subscription Date') block.mergeValue = '{{date}}';
  }
}
if (mergeHits) console.error(`  inserted ${mergeHits} merge field(s)`);

// Apply the approved normalisations and report exactly what changed.
const applied = {};
for (const article of doc.articles) {
  for (const block of article.blocks) {
    if (block.type === 'table') {
      block.rows = block.rows.map((row) =>
        row.map((cell) => {
          let out = cell;
          for (const sub of SUBSTITUTIONS) {
            const hits = out.match(sub.from);
            if (hits) applied[sub.to] = (applied[sub.to] ?? 0) + hits.length;
            out = out.replace(sub.from, sub.to);
          }
          return out;
        }),
      );
      continue;
    }
    for (const run of block.runs ?? []) {
      for (const sub of SUBSTITUTIONS) {
        const hits = run.text.match(sub.from);
        if (hits) applied[sub.to] = (applied[sub.to] ?? 0) + hits.length;
        run.text = run.text.replace(sub.from, sub.to);
      }
    }
  }
}
// Normalise fill-in lines after the substitutions, so a label that was
// itself normalised still gets matched.
let fieldsFilled = 0;
let blanksRuled = 0;
for (const article of doc.articles) {
  for (const block of article.blocks) {
    // Table cells carry fill-in lines too, in the questionnaire.
    if (block.type === 'table') {
      block.rows = block.rows.map((row) =>
        row.map((cell) => {
          const hits = cell.match(/_{3,}/g);
          if (hits) blanksRuled += hits.length;
          return cell.replace(/_{3,}/g, '{{blank}}');
        }),
      );
      continue;
    }

    for (const run of block.runs ?? []) {
      for (const field of LABEL_FIELDS) {
        const before = run.text;
        run.text = run.text.replace(field.from, field.to);
        if (run.text !== before) fieldsFilled++;
      }
      // Whatever underscores remain are blanks nobody can pre-fill.
      const remaining = run.text.match(/_{3,}/g);
      if (remaining) {
        blanksRuled += remaining.length;
        run.text = run.text.replace(/_{3,}/g, '{{blank}}');
      }
    }

    // Typesetting markers read as artifacts in body type. Tag them so the
    // renderer can centre and quieten them, as a typesetter would.
    const flat = (block.runs ?? []).map((r) => r.text).join('').trim();
    if (/^\[(Signature page follows|End of [^\]]+)\]$/i.test(flat)) {
      block.type = 'marker';
    }
  }
}
if (fieldsFilled) console.error(`  filled ${fieldsFilled} labelled field(s)`);
if (blanksRuled) console.error(`  ruled ${blanksRuled} unlabelled blank(s)`);

doc.substitutions = applied;
for (const [to, count] of Object.entries(applied)) {
  console.error(`  normalised ${count} occurrence(s) to "${to}"`);
}

// Content hash over the words only, so a formatting tweak in Word does not
// look like a substantive amendment, but a wording change always does.
const words = doc.articles
  .flatMap((a) => a.blocks)
  .flatMap((b) => (b.type === 'table' ? b.rows.flat() : (b.runs ?? []).map((r) => r.text)))
  .join(' ')
  .replace(/\s+/g, ' ')
  .trim();

doc.contentHash = createHash('sha256').update(words).digest('hex').slice(0, 16);
doc.wordCount = words.split(' ').length;

process.stdout.write(JSON.stringify(doc, null, 2));
