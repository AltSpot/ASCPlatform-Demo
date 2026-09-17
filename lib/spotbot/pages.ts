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
    'This is your position summary: what you have invested, what it is currently marked at, and anything still in flight. Work top down, because anything needing action from you is pinned above the table with its deadline.',
  suggested: questionsFor(['dashboard-numbers', 'position-value', 'signing']),
  topics: ['dashboard-numbers', 'position-value', 'signing', 'funding-window', 'wizard-steps'],
};

const MARKETPLACE: PageContext = {
  key: 'marketplace',
  label: 'Marketplace',
  brief:
    'Deals AltSpot sourced and diligenced, each organized and advised by AltSpot and open to subscribe today. Each card shows who leads it and how close it is to its minimum; Quick look opens the rest. Further down the same page, the Radar is the opposite: companies AltSpot does not own and is asking members to vote on.',
  suggested: questionsFor(['sourcing', 'allocation', 'radar']),
  topics: ['sourcing', 'allocation', 'deal-page', 'spv', 'radar'],
};

/**
 * RADAR IS NOT THE MARKETPLACE, AND IT USED TO GET THE MARKETPLACE'S
 * ANSWERS.
 *
 * The two are tabs on one route and the view lives in a query
 * parameter, so matching on the pathname alone made them the same room
 * to Spot: standing on the vote board, the offered questions were about
 * allocation bars and committed capital, and nothing invited a member to
 * ask what a vote actually does. They are opposite halves of one
 * product, which is exactly the pair a guide has to be able to tell
 * apart.
 */
const RADAR: PageContext = {
  key: 'radar',
  label: 'Radar',
  brief:
    'A board of private companies AltSpot does not own and is not offering. Vote for the ones you want AltSpot to pursue and indicate the allocation you would want, and the board ranks by what the membership has put behind each name. A vote reserves nothing and moves no money. Demand here is what decides where sourcing goes next.',
  suggested: questionsFor(['radar', 'radar-vote', 'sourcing']),
  topics: ['radar', 'radar-vote', 'sourcing', 'secondaries', 'allocation'],
};

/**
 * The pitch and the page are the same thing now, so there is no separate
 * deck context: /deals/x/deck redirects here before SpotBot sees it.
 */
const DEAL: PageContext = {
  key: 'deal',
  label: 'Deal',
  brief:
    'The whole pitch on one page, in the same order for every deal: the funding picture, the numbers, the story, the risks, the terms and what it costs, then the data room. The offering documents govern, so read them before you sign.',
  suggested: questionsFor(['deal-page', 'fees', 'spv']),
  topics: ['deal-page', 'fees', 'spv', 'data-room', 'allocation'],
};

const INVEST: PageContext = {
  key: 'invest',
  label: 'Subscription',
  brief:
    'The document on the left fills in as you complete the three confirmations on the right. Each confirmation completes one section of representations. When all three are done you sign, your spot is reserved, and you have until admissions close to send to escrow.',
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
  label: 'Escrow',
  brief:
    'You have signed, so your spot is held until admissions close. Send to escrow by ACH from your linked account, or by wire. The money waits in escrow until the deal closes, and comes back if it does not reach its minimum.',
  suggested: questionsFor(['funding-window', 'funding-methods', 'after-funding']),
  topics: ['funding-window', 'funding-methods', 'after-funding', 'expiry', 'cancel'],
};

/* Portfolio and Terminal both fell through to the general context,
   which meant two of the platform's main rooms offered the same three
   questions as an unmatched route. */
const PORTFOLIO: PageContext = {
  key: 'portfolio',
  label: 'Portfolio',
  brief:
    "Your whole book, in an LP capital account's vocabulary. Invested is cost basis, fair value is the latest mark on what you still hold, realized is cash returned, and a multiple counts both. Holdings you have elsewhere can sit here too, tagged as self-reported and kept out of the AltSpot totals.",
  suggested: questionsFor(['portfolio-page', 'position-value', 'external-positions']),
  topics: [
    'portfolio-page',
    'position-value',
    'external-positions',
    'dashboard-numbers',
    'after-funding',
  ],
};

const WATCHLIST: PageContext = {
  key: 'watchlist',
  label: 'Watchlist',
  brief:
    'The deals you saved and the companies you voted for, private to you. Saving a deal reserves nothing and tells the issuer nothing. A vote reserves nothing and moves no money; it tells AltSpot what to go and source.',
  suggested: questionsFor(['radar', 'radar-vote', 'sourcing']),
  topics: ['radar', 'radar-vote', 'sourcing', 'spotbot-scope'],
};

const TERMINAL: PageContext = {
  key: 'terminal',
  label: 'Terminal',
  brief:
    "AltSpot's reading room: articles, reports and podcasts on how private markets work, plus a wire of outside headlines. Every piece names its source. Nothing here recommends an action or names a return, and anything specific to an offering lives on that deal's page.",
  suggested: questionsFor(['terminal', 'sourcing', 'spotbot-scope']),
  topics: ['terminal', 'sourcing', 'spotbot-scope', 'secondaries'],
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
    'Five one-time steps: the investor questionnaire, your information, identity, investment profile, link bank. Offerings open the moment the questionnaire is approved; your information and identity gate investing.',
  suggested: questionsFor(['wizard-steps', 'accreditation', 'kyc']),
  topics: ['wizard-steps', 'accreditation', 'relationship-506b', 'kyc', 'vault', 'profile-types'],
};

const GENERAL: PageContext = {
  key: 'general',
  label: 'AltSpot',
  brief:
    'I explain how the platform and the process work. Ask me what a step requires, what a term means, or what a document contains.',
  suggested: questionsFor(['spotbot-scope', 'fees', 'wizard-steps']),
  topics: ['spotbot-scope', 'fees', 'wizard-steps', 'sourcing'],
};

/**
 * Matched against pathname AND query, in order, first hit wins.
 *
 * Radar has to sit above the marketplace it lives on, because
 * `/marketplace?view=radar` matches both and the more specific one has
 * to win. It is the only context whose test looks at the query, and it
 * is why `pageContext` takes the whole location rather than the path.
 */
const MATCHERS: readonly Matcher[] = [
  { test: /^\/dashboard/, context: DASHBOARD },
  { test: /^\/marketplace\?(?:.*&)?view=radar\b/, context: RADAR },
  { test: /^\/marketplace/, context: MARKETPLACE },
  { test: /^\/deals\//, context: DEAL },
  { test: /^\/invest\//, context: INVEST },
  { test: /^\/payment\//, context: PAYMENT },
  { test: /^\/watchlist/, context: WATCHLIST },
  { test: /^\/portfolio/, context: PORTFOLIO },
  { test: /^\/terminal/, context: TERMINAL },
  { test: /^\/docs/, context: DOCS },
  { test: /^\/profiles/, context: PROFILES },
  { test: /^\/settings/, context: SETTINGS },
  { test: /^\/wizard/, context: WIZARD },
];

/**
 * Never throws and never returns undefined: an unknown route is general.
 *
 * Takes a path with its query attached, because one of the platform's
 * two most different surfaces is a query parameter away from the other.
 * A bare pathname still works and still resolves to the right room for
 * every context except Radar.
 */
export function pageContext(location: string): PageContext {
  const here = location || '/';
  return MATCHERS.find((m) => m.test.test(here))?.context ?? GENERAL;
}
