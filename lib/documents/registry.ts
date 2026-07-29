/**
 * The offering binder.
 *
 * Three instruments, one reading surface. They are presented together and
 * downloaded together, but they are NOT one document, because they are not
 * one instrument:
 *
 *   PPM                    delivered, not signed. A disclosure document.
 *   Subscription Agreement executed by the investor.
 *   Operating Agreement    joined by counterpart signature page.
 *
 * Merging them into a single document with one signature block would imply
 * the investor executed the memorandum, which is wrong and is the first
 * thing counsel would strike. Keeping them separate also lets the PPM be
 * reissued without amending the operating agreement.
 *
 * Each carries a content hash over its words. A formatting change in Word
 * does not move the hash; a wording change always does. That is what a
 * subscription pins itself to at signature.
 */
import type { LegalDocument } from './types';

import ppm from './generated/ppm.json';
import operatingAgreement from './generated/operating-agreement.json';
import subscriptionAgreement from './generated/subscription-agreement.json';

export type ExecutionRole =
  /** Delivered to the investor. Never signed. */
  | 'disclosure'
  /** Signed by the investor. */
  | 'executed'
  /** Joined by a counterpart signature page. */
  | 'counterpart';

export interface BinderEntry {
  slug: string;
  title: string;
  /** Shown in navigation. Shorter than the title. */
  shortTitle: string;
  role: ExecutionRole;
  /** One line on what this instrument does, for the investor. */
  purpose: string;
  document: LegalDocument;
}

/** Order matters: this is the order counsel expects them read in. */
export const BINDER: BinderEntry[] = [
  {
    slug: 'ppm',
    title: 'Confidential Private Placement Memorandum',
    shortTitle: 'Memorandum',
    role: 'disclosure',
    purpose:
      'The disclosure document. It describes the offering, the company, the terms and the risks. You are not asked to sign it.',
    document: ppm as unknown as LegalDocument,
  },
  {
    slug: 'subscription-agreement',
    title: 'Subscription Agreement',
    shortTitle: 'Subscription',
    role: 'executed',
    purpose:
      'The agreement you execute. It carries your representations, the accredited investor questionnaire, and your subscription amount.',
    document: subscriptionAgreement as unknown as LegalDocument,
  },
  {
    slug: 'operating-agreement',
    title: 'Operating Agreement',
    shortTitle: 'Operating Agreement',
    role: 'counterpart',
    purpose:
      'The agreement governing the vehicle you are joining. You become a party by counterpart signature page rather than by signing it directly.',
    document: operatingAgreement as unknown as LegalDocument,
  },
];

export function binderEntry(slug: string): BinderEntry | null {
  return BINDER.find((entry) => entry.slug === slug) ?? null;
}

/**
 * The version an executed subscription pins itself to.
 *
 * A signed record has to be reproducible years later. Storing the hash of
 * every instrument in the binder at the moment of signature means we can
 * always prove which text was on screen, and detect it if counsel reissues
 * a document underneath a live subscription.
 */
export function binderVersion(): {
  documents: { slug: string; hash: string; words: number }[];
  combined: string;
} {
  const documents = BINDER.map((entry) => ({
    slug: entry.slug,
    hash: entry.document.contentHash ?? 'unknown',
    words: entry.document.wordCount ?? 0,
  }));

  return {
    documents,
    combined: documents.map((d) => `${d.slug}:${d.hash}`).join('|'),
  };
}
