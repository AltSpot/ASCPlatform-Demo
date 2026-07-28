/**
 * Page awareness.
 *
 * SpotBot is a guide, and a guide that does not know which room you are
 * standing in is a search box. Each surface gets a brief that says what
 * the investor is looking at and what to do next, a set of suggested
 * questions, and the knowledge topics the retriever should favour there.
 *
 * Matchers are ordered: the first hit wins, so a specific route always
 * goes above the general one it lives under.
 */
import { questionsFor } from './knowledge';

export interface PageContext {
  key: string;
  /** Monospace eyebrow in the panel header. */
  label: string;
  /** What this page is, and the next move. Two sentences at most. */
  brief: string;
  /** One-tap questions. Canonical phrasings, so retrieval always lands. */
  suggested: string[];
  /** Topic ids to boost while the investor is on this page. */
  topics: string[];
}

interface Matcher {
  test: RegExp;
  context: PageContext;
}

const DASHBOARD: PageContext = {
  key: 'dashboard',
  label: 'Dashboard',
  brief:
    'This is your position summary: what you have funded, what it is currently marked at, and anything still in flight. Work top down, because anything needing action from you is pinned above the table with its deadline.',
  suggested: questionsFor(['dashboard-numbers', 'position-value', 'signing']),
  topics: ['dashboard-numbers', 'position-value', 'signing', 'funding-window', 'wizard-steps'],
};

const MARKETPLACE: PageContext = {
  key: 'marketplace',
  label: 'Marketplace',
  brief:
    'A handful of deals AltSpot sourced, underwrote and put its own capital into. Each card shows the sector, the minimum, AltSpot\'s committed amount and how much of the round is still open. Open one to read the thesis, the terms and the risks.',
  suggested: questionsFor(['sourcing', 'allocation', 'altspot-committed']),
  topics: ['sourcing', 'allocation', 'altspot-committed', 'deal-page', 'spv'],
};

/**
 * The pitch and the page are the same thing now, so there is no separate
 * deck context: /deals/x/deck redirects here before SpotBot sees it.
 */
const DEAL: PageContext = {
  key: 'deal',
  label: 'Deal',
  brief:
    'The whole pitch on one page, in the same order for every deal: AltSpot\'s committed capital, the numbers, the story, the thesis, the risks, the terms, the two fees, then the data room. The offering documents govern, so read them before you sign.',
  suggested: questionsFor(['deal-page', 'fees', 'spv']),
  topics: ['deal-page', 'fees', 'spv', 'data-room', 'allocation', 'altspot-committed'],
};

const INVEST: PageContext = {
  key: 'invest',
  label: 'Subscription',
  brief:
    'The document on the left fills in as you complete the three confirmations on the right. Each confirmation completes one section of representations. When all three are done you sign, your allocation is reserved, and the 10 day funding window opens.',
  suggested: questionsFor(['confirmations', 'subscription-agreement', 'fees']),
  topics: [
    'confirmations',
    'subscription-agreement',
    'fees',
    'signing',
    'funding-window',
    'illiquidity',
    'profile-types',
  ],
};

const PAYMENT: PageContext = {
  key: 'payment',
  label: 'Funding',
  brief:
    'You have signed, so the allocation is held for you and the 10 day clock is running. Fund by ACH from your linked account, or wire against the instructions here. Nothing else is outstanding.',
  suggested: questionsFor(['funding-window', 'funding-methods', 'after-funding']),
  topics: ['funding-window', 'funding-methods', 'after-funding', 'expiry', 'cancel'],
};

const DOCS: PageContext = {
  key: 'docs',
  label: 'Docs',
  brief:
    'Everything you have executed and everything issued to you, filed automatically. Signed agreements land here the moment you sign. Tax forms arrive each season under the Tax Center, separated by profile and by deal.',
  suggested: questionsFor(['documents', 'subscription-agreement', 'after-funding']),
  topics: ['documents', 'subscription-agreement', 'after-funding', 'profile-types'],
};

const PROFILES: PageContext = {
  key: 'profiles',
  label: 'Profiles',
  brief:
    'Profiles are the legal owners your deals are held under, personal, an entity or an IRA. The Vault is the standard information that fills every document you sign after it is captured once.',
  suggested: questionsFor(['profile-types', 'vault', 'ira-profile']),
  topics: ['profile-types', 'vault', 'ira-profile', 'documents', 'funding-methods'],
};

const SETTINGS: PageContext = {
  key: 'settings',
  label: 'Settings',
  brief:
    'Account details, notification preferences and your session. Anything that appears on a document, your legal name, taxpayer ID or address, lives in the Vault under Profiles instead.',
  suggested: questionsFor(['settings', 'vault', 'contact']),
  topics: ['settings', 'vault', 'contact', 'documents'],
};

const WIZARD: PageContext = {
  key: 'wizard',
  label: 'Account setup',
  brief:
    'Five one-time steps: accreditation, your information, identity, investment profile, link bank. Accreditation and identity are the two that gate investing. Finish those and the marketplace opens.',
  suggested: questionsFor(['wizard-steps', 'accreditation', 'kyc']),
  topics: ['wizard-steps', 'accreditation', 'verification-506c', 'kyc', 'vault', 'profile-types'],
};

const GENERAL: PageContext = {
  key: 'general',
  label: 'AltSpot',
  brief:
    'I explain how the platform and the process work. Ask me what a step requires, what a term means, or what a document contains.',
  suggested: questionsFor(['spotbot-scope', 'fees', 'wizard-steps']),
  topics: ['spotbot-scope', 'fees', 'wizard-steps', 'sourcing'],
};

const MATCHERS: readonly Matcher[] = [
  { test: /^\/dashboard/, context: DASHBOARD },
  { test: /^\/marketplace/, context: MARKETPLACE },
  { test: /^\/deals\//, context: DEAL },
  { test: /^\/invest\//, context: INVEST },
  { test: /^\/payment\//, context: PAYMENT },
  { test: /^\/docs/, context: DOCS },
  { test: /^\/profiles/, context: PROFILES },
  { test: /^\/settings/, context: SETTINGS },
  { test: /^\/wizard/, context: WIZARD },
];

/** Never throws and never returns undefined: an unknown route is general. */
export function pageContext(pathname: string): PageContext {
  const path = (pathname || '/').split('?')[0];
  return MATCHERS.find((m) => m.test.test(path))?.context ?? GENERAL;
}
