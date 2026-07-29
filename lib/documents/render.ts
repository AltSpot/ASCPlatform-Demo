/**
 * Server-side rendering of the offering binder to a standalone document.
 *
 * This is the authoritative record. It runs at the moment of signature and
 * produces the frozen artifact that gets stored, hashed and downloaded.
 *
 * Why not capture the browser's DOM instead: because then the client is
 * asserting what was signed. An electronic record has to be accurately
 * reproducible by the party relying on it, and "whatever the investor's
 * browser posted back" is not that. Rendering here means the server can
 * always reproduce the exact text an investor executed, from the template
 * version pinned alongside it.
 *
 * The output is self-contained HTML with print styles, so it opens as a
 * document and saves to PDF without a headless browser. That matters
 * operationally: rendering PDFs server-side would need Chromium, which
 * does not fit in the demo instance's memory.
 */
import 'server-only';

import { createHash } from 'node:crypto';

import { BINDER, binderVersion } from './registry';
import { mergeRuns, type MergeValues, type TextRun } from './types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRuns(runs: TextRun[] | undefined, values: Partial<MergeValues>): string {
  if (!runs) return '';

  return runs
    .map((run) =>
      mergeRuns(run.text, values)
        .map((piece) => {
          if (piece.merged) {
            const cls = piece.filled ? 'merge filled' : 'merge';
            return `<span class="${cls}">${escapeHtml(piece.text)}</span>`;
          }
          const text = escapeHtml(piece.text);
          if (run.b) return `<strong>${text}</strong>`;
          if (run.i) return `<em>${text}</em>`;
          return text;
        })
        .join(''),
    )
    .join('');
}

const PRINT_CSS = `
@page { margin: 22mm 18mm; }
* { box-sizing: border-box; }
body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 11pt; line-height: 1.7; color: #221E18;
  max-width: 46em; margin: 40px auto; padding: 0 24px; background: #fff;
}
h1 { font-size: 15pt; text-transform: uppercase; letter-spacing: .06em;
     text-align: center; margin: 0 0 6px; }
.sub { text-align: center; font-size: 8.5pt; letter-spacing: .14em;
       text-transform: uppercase; color: #8A7B5E; margin-bottom: 4px; }
.role { text-align: center; font-size: 8pt; letter-spacing: .14em;
        text-transform: uppercase; color: #A07A22; margin-bottom: 28px; }
.instrument { page-break-before: always; padding-top: 8px; }
.instrument:first-of-type { page-break-before: avoid; }
h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: .12em;
     margin: 26px 0 12px; padding-bottom: 7px; border-bottom: 1px solid #ccc;
     page-break-after: avoid; }
h3 { font-size: 11pt; margin: 18px 0 6px; page-break-after: avoid; }
h3 .n { color: #A07A22; margin-right: 8px; font-family: ui-monospace, monospace;
        font-size: 9.5pt; }
p { margin: 0 0 11px; orphans: 3; widows: 3; }
li, .item { margin: 0 0 9px 22px; }
.merge { border-bottom: 1px solid #999; padding: 0 3px; font-style: italic; color: #8A7B5E; }
.merge.filled { font-style: normal; font-weight: 700; color: #12100C;
                background: rgba(184,146,74,.15); border-bottom-color: #A07A22; }
table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9.5pt;
        page-break-inside: avoid; }
td { border: 1px solid #bbb; padding: 7px 9px; vertical-align: top; }
tr:first-child td { background: #f3ecd9; font-weight: 700; }
.summary { display: flex; justify-content: space-between; gap: 20px;
           padding: 9px 0; border-bottom: 1px solid #ddd; }
.summary .k { font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: #8A7B5E; }
.foot { margin-top: 36px; padding-top: 14px; border-top: 1px solid #ddd;
        font-size: 8pt; line-height: 1.6; color: #8A7B5E; }
.marker { text-align: center; font-style: italic; color: #8A7B5E;
          font-size: 9.5pt; margin: 22px 0; }
.hint { background: #f6f1e4; border: 1px solid #ddd0ad; padding: 12px 16px;
        font-family: system-ui, sans-serif; font-size: 9.5pt; margin-bottom: 26px; }
@media print { .hint { display: none; } }
`;

export interface RenderedBinder {
  html: string;
  /** SHA-256 of the rendered document. The integrity check for the record. */
  sha256: string;
  /** Which template versions this was produced from. */
  version: string;
}

/**
 * Render the whole binder for one investor, as it stood at this moment.
 */
export function renderBinder(
  values: Partial<MergeValues>,
  context: { investorName: string; dealName: string },
): RenderedBinder {
  const instruments = BINDER.map((entry) => {
    const articles = entry.document.articles
      .map((article) => {
        const heading =
          article.numeral === null
            ? ''
            : `<h2>${escapeHtml(
                /^(EXHIBIT|SCHEDULE)/.test(article.numeral)
                  ? article.title
                  : `${article.numeral}. ${article.title}`,
              )}</h2>`;

        const blocks = article.blocks
          .map((block) => {
            if (block.type === 'table') {
              const rows = (block.rows ?? [])
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
                )
                .join('');
              return `<table><tbody>${rows}</tbody></table>`;
            }

            if (block.type === 'marker') {
              return `<p class="marker">${renderRuns(block.runs, values)}</p>`;
            }

            if (block.type === 'section') {
              const body = block.runs?.length
                ? `<p>${renderRuns(block.runs, values)}</p>`
                : '';
              return `<h3><span class="n">${escapeHtml(block.n ?? '')}</span>${escapeHtml(
                block.title ?? '',
              )}</h3>${body}`;
            }

            if (block.mergeValue) {
              return `<div class="summary"><span class="k">${renderRuns(
                block.runs,
                values,
              )}</span><span>${renderRuns(
                [{ text: block.mergeValue }],
                values,
              )}</span></div>`;
            }

            const cls = block.type === 'item' ? ' class="item"' : '';
            return `<p${cls}>${renderRuns(block.runs, values)}</p>`;
          })
          .join('\n');

        return heading + blocks;
      })
      .join('\n');

    return `<section class="instrument">
<h1>${escapeHtml(entry.document.title ?? entry.title)}</h1>
<div class="sub">ASC Simphonic II, LLC · Managed by AltSpot Capital, LLC</div>
<div class="role">${escapeHtml(
      { disclosure: 'Delivered, not signed', executed: 'Executed by the subscriber', counterpart: 'Joined by counterpart signature' }[
        entry.role
      ] ?? '',
    )} · version ${escapeHtml(entry.document.contentHash ?? '')}</div>
${articles}
</section>`;
  }).join('\n');

  const version = binderVersion().combined;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(context.dealName)} offering documents · ${escapeHtml(context.investorName)}</title>
<style>${PRINT_CSS}</style>
</head><body>
<div class="hint">
  <b>Saving as PDF:</b> print this page and choose &ldquo;Save as PDF&rdquo;.
  This notice does not appear in the printed copy.
</div>
${instruments}
<p class="foot">
  Offering documents for ${escapeHtml(context.dealName)}, prepared for
  ${escapeHtml(context.investorName)}. Wording, clause numbering and emphasis are
  counsel&rsquo;s; typography and merged values are produced by the AltSpot
  platform. Template version ${escapeHtml(version)}.
  Demo environment: not an offer to sell securities.
</p>
</body></html>`;

  return {
    html,
    sha256: createHash('sha256').update(html).digest('hex'),
    version,
  };
}
