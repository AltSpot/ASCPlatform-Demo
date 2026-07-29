/**
 * The shape of an imported legal document.
 *
 * Counsel writes .docx; the portal renders a digital template. The words
 * and the clause numbering are theirs and are never rewritten here. What
 * this layer adds is typography, merge fields, and the link between each
 * clause and the confirmation panel that discharges it.
 */

export type BlockType = 'section' | 'p' | 'item';

export interface DocumentBlock {
  type: BlockType;
  /** Clause number, e.g. "3.9". Present on section blocks. */
  n?: string;
  /** Clause heading, e.g. "Accredited Investor Verification". */
  title?: string;
  text: string;
  /** A value rendered beside a label, e.g. the Subscription Amount line. */
  mergeValue?: string;
  /** Confirmation panel that covers this clause, if any. */
  panel?: number | null;
}

export interface DocumentArticle {
  /** "1" through "6", or "EXHIBIT A". Null for the preamble. */
  numeral: string | null;
  title: string;
  blocks: DocumentBlock[];
  panel?: number | null;
}

export interface LegalDocument {
  title: string | null;
  subtitle: string[];
  articles: DocumentArticle[];
}

/** Values merged into {{tokens}} as the investor completes the flow. */
export interface MergeValues {
  legalName: string;
  amount: string;
  units: string;
  date: string;
  signature: string;
  entityName: string;
  address: string;
  taxId: string;
  profile: string;
}

const TOKEN = /\{\{(\w+)\}\}/g;

/**
 * Split text into literal and merged runs, so the renderer can style a
 * merged value differently without resorting to dangerouslySetInnerHTML.
 * An unresolved token renders as a blank rule, exactly as it would on
 * paper before signing.
 */
export function mergeRuns(
  text: string,
  values: Partial<MergeValues>,
): { text: string; merged: boolean; filled: boolean }[] {
  const runs: { text: string; merged: boolean; filled: boolean }[] = [];
  let cursor = 0;

  for (const match of text.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > cursor) {
      runs.push({ text: text.slice(cursor, at), merged: false, filled: true });
    }

    const value = values[match[1] as keyof MergeValues];
    runs.push({
      text: value && value.trim() ? value : ' '.repeat(18),
      merged: true,
      filled: Boolean(value && value.trim()),
    });

    cursor = at + match[0].length;
  }

  if (cursor < text.length) {
    runs.push({ text: text.slice(cursor), merged: false, filled: true });
  }
  return runs;
}
