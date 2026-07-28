/**
 * SpotBot's knowledge base: what the platform is and how the process runs.
 *
 * Every entry describes structure, mechanics or vocabulary. Nothing here
 * evaluates a deal, projects a return or sizes a position, because those
 * questions never reach the engine. The gate in ./gate.ts stops them first.
 *
 * `source` is not decoration. An investor has to be able to take any
 * sentence SpotBot says back to the document it came from, so each entry
 * names the artefact that governs it. When the answers move to a model,
 * these entries become the retrieval corpus and the source line stays.
 *
 * House rules for the copy: short sentences, no em dashes, specific about
 * process and never about performance.
 */

export interface KnowledgeTopic {
  id: string;
  /** The canonical phrasing. Doubles as a suggested question. */
  question: string;
  /** Other words a person might reach for. Matched as phrases. */
  keywords: string[];
  answer: string;
  /** Where this is written down for real. Rendered under the answer. */
  source: string;
  /** Ids offered as follow-ups after this answer. */
  related?: string[];
}

export const KNOWLEDGE: readonly KnowledgeTopic[] = [
  // ---------------- entities, identity, eligibility ----------------
  {
    id: 'profile-types',
    question: "What's the difference between a personal and an entity profile?",
    keywords: [
      'personal vs entity',
      'entity vs personal',
      'personal or entity',
      'investment profile',
      'profile type',
      'llc',
      'trust',
      'joint',
      'hold it under',
      'who signs',
      'signs for',
      'invest through',
      'whose name',
    ],
    answer:
      'An investment profile is the legal owner of the position. Personal means you hold it in your own name, and your Vault details fill the documents. Entity means an LLC, a partnership, a corporation or a trust holds it, so the documents are titled in that name and signed by an authorised person. IRA means a self-directed retirement account holds it, and the custodian signs and wires on the account\'s behalf. You can keep several profiles and pick one at the top of each investment. The choice sets who signs, whose taxpayer ID is on the agreement, and where the K-1 is addressed.',
    source: 'AltSpot platform guide, Profiles',
    related: ['ira-profile', 'vault', 'documents'],
  },
  {
    id: 'ira-profile',
    question: 'How does investing through an IRA work here?',
    keywords: [
      'ira',
      'sdira',
      'self directed',
      'retirement account',
      'custodian',
      '401k',
      'roth',
    ],
    answer:
      'A self-directed IRA invests through a custodian. You create an IRA profile with the custodian name and the account number, and the subscription agreement is issued in the account\'s name rather than yours. The custodian countersigns and sends the funds, so plan for their turnaround inside the 10 day funding window. Distributions return to the IRA, not to you. Whether a retirement account should hold a private position at all is a question for your CPA, not for me.',
    source: 'AltSpot platform guide, Profiles',
    related: ['profile-types', 'funding-window', 'documents'],
  },
  {
    id: 'accreditation',
    question: 'What does accredited investor mean?',
    keywords: [
      'accredited',
      'accreditation',
      'accredited investor',
      'qualify',
      'eligible',
      'income test',
      'net worth',
      '501',
    ],
    answer:
      'Accredited investor is an SEC definition in Rule 501(a) of Regulation D. The common paths are income over 200,000 dollars individually or 300,000 dollars with a spouse in each of the last two years with the same expected this year, or a net worth over 1,000,000 dollars excluding your primary residence. Certain licence holders and entities qualify too. AltSpot offerings are open only to accredited investors. Your certification here is good for five years, and the portal shows the date it was verified.',
    source: 'Regulation D, Rule 501(a) and Rule 506(c)',
    related: ['verification-506c', 'kyc', 'wizard-steps'],
  },
  {
    id: 'verification-506c',
    question: 'Why do I have to verify accreditation instead of just checking a box?',
    keywords: [
      '506c',
      '506(c)',
      'verify',
      'verify accreditation',
      'verify my accreditation',
      'why verify',
      'verification',
      'self certify',
      'parallel markets',
      'letter',
      'cpa letter',
      'proof',
    ],
    answer:
      'These deals are offered under Rule 506(c), which allows an issuer to speak about an offering publicly. The trade is that the issuer must take reasonable steps to verify that every investor really is accredited. Ticking a box is not enough. So you either upload a letter from a CPA, attorney or registered adviser, or you verify through our third-party provider. AltSpot keeps the verification result and the date, not your underlying financial statements. The verification lasts five years, then you renew it.',
    source: 'Regulation D, Rule 506(c)',
    related: ['accreditation', 'kyc', 'wizard-steps'],
  },
  {
    id: 'kyc',
    question: 'What is the identity check for?',
    keywords: [
      'kyc',
      'identity',
      'id check',
      'selfie',
      'aml',
      'ofac',
      'passport',
      'drivers license',
      'why do you need my id',
      'know your customer',
    ],
    answer:
      'Know Your Customer is the anti-money-laundering requirement that sits on anyone moving investor capital. You photograph a government ID and take a live capture, and both are screened against sanctions and watch lists including OFAC. It confirms you are who the agreement says you are and that the funds can be accepted. The images are checked and the result is retained. AltSpot keeps the outcome and the reference, not the documents themselves.',
    source: 'AltSpot onboarding requirements, AML programme',
    related: ['vault', 'accreditation', 'wizard-steps'],
  },
  {
    id: 'vault',
    question: 'What is the Vault?',
    keywords: [
      'vault',
      'w-9',
      'w9',
      'saved information',
      'prefill',
      'pre-fill',
      'my details',
      'taxpayer id',
      'tin',
      'ssn',
    ],
    answer:
      'The Vault is your standard subscription information captured once: legal name, tax classification, address and taxpayer ID. Every document you sign after that fills itself in from it, which is why signing a second deal takes a minute instead of an afternoon. You can edit it from Profiles at any time, and the change applies to documents generated after the edit. The taxpayer ID is stored as the last four digits plus a token, never in full.',
    source: 'AltSpot platform guide, Profiles and the Vault',
    related: ['profile-types', 'documents', 'signing'],
  },

  // ---------------- structure and economics ----------------
  {
    id: 'spv',
    question: 'What is an SPV?',
    keywords: [
      'spv',
      'special purpose vehicle',
      'entity offering',
      'what am i buying',
      'membership interest',
      'units',
      'who holds the shares',
      'cap table',
    ],
    answer:
      'A special purpose vehicle is a single-purpose LLC formed to hold one investment and nothing else. You subscribe for membership interests in the SPV, and the SPV holds the position in the underlying company or asset. It exists so a group of investors can come in through one line on the cap table, with one set of documents and one administrator. The deal page names the SPV that issues your agreement. AltSpot manages it and invests its own capital alongside you in the same vehicle.',
    source: 'AltSpot subscription agreement, offering entity',
    related: ['fees', 'altspot-committed', 'documents'],
  },
  {
    id: 'fees',
    question: 'What are the fees?',
    keywords: [
      'fee',
      'fees',
      'cost',
      'costs',
      'charge',
      'management fee',
      'what do you charge',
      'expenses',
      'all in',
      'annual fee',
      'two and twenty',
    ],
    answer:
      'Two numbers, and that is the whole model. A 5 percent management fee on your subscription, charged once at closing, not every year. Then 10 percent carried interest on profits at exit, on every deal. There is no annual fee, no capital call and no line item that appears later. The invest page itemizes your all-in cost before you sign, so the total you see on day one is the total you ever pay in.',
    source: 'AltSpot fee schedule and the subscription agreement',
    related: ['carry-mechanics', 'no-capital-calls', 'confirmations'],
  },
  {
    id: 'carry-mechanics',
    question: 'How does carried interest actually work?',
    keywords: [
      'carry',
      'carried interest',
      '10 percent',
      'profits',
      'at exit',
      'promote',
      'waterfall',
      'when do you get paid',
    ],
    answer:
      'Carried interest is AltSpot\'s share of the profit, not of your capital. At an exit the SPV returns your invested capital first. Anything above that is profit, and AltSpot takes 10 percent of it. If there is no profit there is no carry. It is charged at exit, so nothing is deducted while the position is held. That is deliberate: AltSpot gets paid meaningfully only when the deal works.',
    source: 'AltSpot fee schedule and the subscription agreement',
    related: ['fees', 'illiquidity', 'after-funding'],
  },
  {
    id: 'no-capital-calls',
    question: 'Will I be asked for more money later?',
    keywords: [
      'capital call',
      'capital calls',
      'more money',
      'follow on',
      'additional capital',
      'commitment vs contribution',
      'drawdown',
      'unfunded',
    ],
    answer:
      'No. There are no capital calls on this platform, ever. You commit an amount, you fund it once, and that is the end of your obligation. A traditional fund calls capital in tranches, so your real exposure is unknown for years. AltSpot deals are single assets funded in full at closing, so the number you fund is the number at risk. If a later round happens, it is offered as a separate deal you can decline.',
    source: 'AltSpot subscription agreement, no capital calls',
    related: ['fees', 'funding-window', 'illiquidity'],
  },
  {
    id: 'illiquidity',
    question: 'What does illiquid mean here?',
    keywords: [
      'illiquid',
      'illiquidity',
      'liquidity',
      'get my money out',
      'get my money back',
      'money back',
      'sell early',
      'lock up',
      'lockup',
      'how long',
      'time horizon',
      'redeem',
      'withdraw',
    ],
    answer:
      'It means there is no market to sell into. Private positions have no exchange, no daily price and no redemption window. Money goes in at closing and comes back only when the underlying investment has a liquidity event, which is typically a sale, a recapitalisation or a public listing. That can take years, and it can end at zero. Assume the capital is committed until the deal resolves. Transfers need manager consent and are rare.',
    source: 'AltSpot subscription agreement, risk factors',
    related: ['secondaries', 'position-value', 'after-funding'],
  },
  {
    id: 'secondaries',
    question: 'Why is Secondaries greyed out?',
    keywords: [
      'secondaries',
      'secondary',
      'greyed out',
      'grayed out',
      'coming soon',
      'disabled',
      'sell my position',
      'resell',
    ],
    answer:
      'Secondaries is visible because it is real on the roadmap and disabled because it is not built yet. A working secondary market needs a broker-dealer partner and a counsel sign-off on transfer mechanics, and until both are in place turning it on would be a compliance problem, not a feature. It stays in the navigation so nobody has to guess whether it is planned. Until it opens, treat every position as held to exit.',
    source: 'AltSpot platform guide, roadmap',
    related: ['illiquidity', 'position-value'],
  },
  {
    id: 'altspot-committed',
    question: 'What does AltSpot committed capital mean?',
    keywords: [
      'altspot committed',
      'own capital',
      'skin in the game',
      'do you invest',
      'alongside',
      'gp commitment',
      'your own money',
    ],
    answer:
      'Every deal page shows the dollar amount AltSpot has put into that deal from its own balance sheet, on the same terms as you. It is there because the alternative model is placing someone else\'s listing and collecting a fee whatever happens. AltSpot takes positions instead. That number is the honest version of alignment: not a statement about conviction, a wire.',
    source: 'AltSpot platform guide, sourcing and alignment',
    related: ['sourcing', 'spv', 'fees'],
  },

  // ---------------- the marketplace and the deal page ----------------
  {
    id: 'sourcing',
    question: 'How does a deal end up on the marketplace?',
    keywords: [
      'sourced',
      'sourcing',
      'marketplace',
      'how do deals get',
      'how do you find',
      'diligence',
      'due diligence',
      'underwriting',
      'vetted',
      'screening',
      'how many deals',
      'listing board',
    ],
    answer:
      'It is a shelf, not a listing board. Deals reach AltSpot through operators and specialists it already knows, then go through diligence: the operator and their record, the unit economics, the structure and the terms, and the specific way this one loses money. Most stop there. What survives is offered only if AltSpot is willing to commit its own capital on the same terms. That is why the marketplace holds a handful of deals at a time rather than a scrolling feed. Diligence reduces surprises. It does not remove risk.',
    source: 'AltSpot platform guide, sourcing and diligence',
    related: ['altspot-committed', 'deal-page', 'data-room'],
  },
  {
    id: 'deal-page',
    question: 'How is a deal page laid out?',
    keywords: [
      'deal page',
      'what am i looking at',
      'what is this page',
      'sections',
      'thesis',
      'risk',
      'terms',
      'metrics',
      'layout',
      'structure of this page',
      'pitch deck',
    ],
    answer:
      'The deal page is the whole pitch, top to bottom, in the same order every time so pages can be compared like for like. The header carries the deal, the sector and the SPV that issues your agreement. Then AltSpot\'s own committed capital, the headline numbers, the story chapter by chapter, the thesis, the trend chart, the risk section stated plainly, the terms table, the two fees at 5 percent once at closing and 10 percent carry at exit, and the data room. The allocation bar shows how much of the round is still open.',
    source: 'AltSpot platform guide, deal pages',
    related: ['allocation', 'fees', 'data-room'],
  },
  {
    id: 'allocation',
    question: 'What does the allocation bar mean?',
    keywords: [
      'allocation',
      'allocation bar',
      'remaining',
      'how much is left',
      'filled',
      'round size',
      'reserved',
      'minimum',
      'reserve my spot',
    ],
    answer:
      'The bar is the share of the round already spoken for. Your spot is reserved the moment you sign, not when the money lands, which is why signing early matters when a deal is filling. If you start an investment and walk away without signing, nothing is held. The deal terms carry the minimum subscription, and the amount field will not accept less. When a round is oversubscribed, allocations can be cut back at closing.',
    source: 'AltSpot platform guide, allocation and closing',
    related: ['cut-back', 'funding-window', 'signing'],
  },
  {
    id: 'data-room',
    question: 'What is in the data room?',
    keywords: [
      'data room',
      'materials',
      'offering documents',
      'memo',
      'deck',
      'financials',
      'read more',
      'diligence file',
    ],
    answer:
      'The data room holds the approved materials for that deal: the offering memorandum, the operating agreement of the SPV, the financial model and the supporting diligence. Those documents govern. Anything I say is a plain-language summary, and where the two differ the document wins. Read the memorandum and the risk factors before you sign, not after.',
    source: 'AltSpot deal data room',
    related: ['deal-page', 'subscription-agreement', 'illiquidity'],
  },
  {
    id: 'position-value',
    question: 'How is the value of my position calculated?',
    keywords: [
      'current value',
      'valuation',
      'valued',
      'position valued',
      'mark',
      'how is value calculated',
      'is that real',
      'unrealized',
      'up or down',
      'nav',
    ],
    answer:
      'The value shown is the most recent reported mark for the underlying asset, carried at cost until there is a reason to change it. A mark is an estimate on a reporting date. It is not a price anyone has offered you and not an amount you can sell at. Nothing is realised until the deal exits and the SPV distributes.',
    source: 'AltSpot platform guide, reporting',
    related: ['illiquidity', 'after-funding', 'dashboard-numbers'],
  },

  // ---------------- the investment flow ----------------
  {
    id: 'subscription-agreement',
    question: 'What am I actually signing?',
    keywords: [
      'subscription agreement',
      'the document',
      'what am i signing',
      'contract',
      'legally binding',
      'operating agreement',
      'signature',
      'e-sign',
    ],
    answer:
      'A subscription agreement. It is your offer to buy membership interests in the SPV at a stated amount, plus the representations the issuer needs on file to accept it. It fills in live on the left of the invest page as you work through the confirmations on the right, so nothing is hidden behind a checkbox. It is binding when you sign it and the issuer accepts. Your signed copy files itself into Docs immediately.',
    source: 'AltSpot subscription agreement',
    related: ['confirmations', 'signing', 'documents'],
  },
  {
    id: 'confirmations',
    question: 'What are the three confirmations on the invest page?',
    keywords: [
      'confirmations',
      'three steps',
      'sections',
      'confirm',
      'representations',
      'section ii',
      'section iii',
      'section iv',
      'guided track',
      'what does this confirm',
    ],
    answer:
      'The document has three blocks of representations, and each card confirms one of them. Who you are completes Section II: you are a verified accredited investor, your profile information is true, and you are investing for your own account after reviewing the materials. Where the money comes from completes Section III, the anti-money-laundering statements about lawful source of funds and sanctions screening. Risk and your all-in cost completes Section IV: the investment is speculative and illiquid and can go to zero, and the fee table above the button is every dollar you will ever pay. Each confirmation fills its section of the document and saves as you go.',
    source: 'AltSpot subscription agreement, Sections II to IV',
    related: ['subscription-agreement', 'fees', 'signing'],
  },
  {
    id: 'signing',
    question: 'What happens when I sign?',
    keywords: [
      'sign',
      'signed',
      'after signing',
      'what happens next',
      'commitment',
      'binding',
      'countersign',
      'reserve',
    ],
    answer:
      'Three things at once. Your allocation is reserved, so that amount comes out of the remaining round. Your executed copy is filed into Docs. And the 10 day funding window opens. The commitment moves to signed and waiting for funds, and it shows on your dashboard with the deadline on it. Funding is the only step left after this.',
    source: 'AltSpot platform guide, subscription lifecycle',
    related: ['funding-window', 'documents', 'allocation'],
  },
  {
    id: 'funding-window',
    question: 'What is the 10 day funding window?',
    keywords: [
      '10 day',
      'ten day',
      'funding window',
      'deadline',
      'how long do i have',
      'countdown',
      'expire',
      'expires',
      'late',
    ],
    answer:
      'Once you sign, you have 10 days to fund. That window exists because your signature took the allocation off the board, and a spot cannot sit reserved indefinitely while a round is closing. Fund by ACH from a linked bank in a click, or wire against the instructions on the funding page. The countdown is on the funding page and on your dashboard. If the window lapses, the commitment expires and the allocation returns to the deal. You can start again if the round is still open.',
    source: 'AltSpot platform guide, funding window',
    related: ['funding-methods', 'expiry', 'signing'],
  },
  {
    id: 'funding-methods',
    question: 'How do I send the money?',
    keywords: [
      'ach',
      'wire',
      'bank',
      'plaid',
      'link bank',
      'payment',
      'send funds',
      'send the money',
      'send money',
      'how do i pay',
      'transfer',
      'escrow',
    ],
    answer:
      'Two ways. ACH pulls from the bank account you linked during setup, which is one click and settles in a couple of business days. Or wire, using the instructions on the funding page, which is faster to arrive and needs your bank to initiate it. Funds go to the SPV\'s account, not to AltSpot\'s operating account. The linked bank account is also where distributions are sent later.',
    source: 'AltSpot platform guide, funding',
    related: ['funding-window', 'after-funding', 'wizard-steps'],
  },
  {
    id: 'after-funding',
    question: 'What happens after I fund?',
    keywords: [
      'after funding',
      'after i fund',
      'what next',
      'accepted',
      'closing',
      'closed',
      'when does it close',
      'updates',
      'reporting',
      'distributions',
    ],
    answer:
      'Your funds are held until the round closes. At closing the issuer accepts the subscription, the one-time 5 percent management fee is taken, and the SPV deploys the capital. The position then appears on your dashboard at cost. After that you get periodic updates from the operator, a K-1 for the SPV each tax season filed into Docs, and distributions to your linked account if and when the deal produces them. The final outcome is settled at exit, which is where the 10 percent carry applies.',
    source: 'AltSpot platform guide, subscription lifecycle',
    related: ['position-value', 'carry-mechanics', 'documents'],
  },
  {
    id: 'expiry',
    question: 'What if I miss the funding deadline?',
    keywords: [
      'expired',
      'missed',
      'miss the deadline',
      'miss the window',
      'lapsed',
      'too late',
      'didnt fund',
      'did not fund',
      'window closed',
      'what happens if i dont fund',
    ],
    answer:
      'The commitment expires and the allocation goes back to the deal for someone else. Nothing is charged and nothing is owed. The expired commitment stays visible on your dashboard as a record of what happened. If the round is still open you can start again from the deal page, at whatever allocation remains. If you know a wire will be late, contact AltSpot before the window closes rather than after.',
    source: 'AltSpot platform guide, funding window',
    related: ['funding-window', 'cancel', 'allocation'],
  },
  {
    id: 'cancel',
    question: 'Can I cancel an investment?',
    keywords: [
      'cancel',
      'back out',
      'change my mind',
      'undo',
      'withdraw commitment',
      'stop',
      'delete',
      'refund',
    ],
    answer:
      'Before you sign, yes, and cleanly. An investment you started but have not signed can be abandoned or the amount changed, and nothing has been reserved. After you sign, you have entered a binding agreement, so contact AltSpot directly rather than letting the window lapse. After the round closes, the position is committed and the illiquidity terms apply.',
    source: 'AltSpot platform guide, subscription lifecycle',
    related: ['expiry', 'illiquidity', 'signing'],
  },
  {
    id: 'cut-back',
    question: 'What does cut back mean?',
    keywords: [
      'cut back',
      'cutback',
      'oversubscribed',
      'scaled back',
      'reduced',
      'pro rata',
      'didnt get full allocation',
    ],
    answer:
      'When a round takes more demand than it has room for, the issuer reduces subscriptions at closing. That is a cut back. You are accepted for less than you asked for, the difference is returned, and fees are charged only on the accepted amount. Your dashboard shows the accepted figure once the round closes.',
    source: 'AltSpot platform guide, allocation and closing',
    related: ['allocation', 'after-funding', 'fees'],
  },

  // ---------------- the portal surfaces ----------------
  {
    id: 'dashboard-numbers',
    question: 'What am I looking at on the dashboard?',
    keywords: [
      'dashboard',
      'portfolio value',
      'total invested',
      'positions',
      'gain',
      'pending',
      'in flight',
      'what am i looking at',
      'what is this page',
      'what do these numbers mean',
      'home page',
    ],
    answer:
      'Total invested is the capital you have actually funded. Portfolio value is that capital carried at the most recent reported mark for each position. The change between them is unrealised and moves only when a mark is updated. The positions table lists funded deals plus anything still in flight, which is a started or signed commitment carrying no value yet. Anything needing action, a signed commitment waiting on funds or an unfinished setup step, sits at the top with the deadline on it. Start there.',
    source: 'AltSpot platform guide, dashboard',
    related: ['position-value', 'signing', 'wizard-steps'],
  },
  {
    id: 'documents',
    question: 'What lands in Docs?',
    keywords: [
      'docs',
      'documents',
      'paperwork',
      'where are my documents',
      'signed documents',
      'where do my documents go',
      'download',
      'tax forms',
      'k-1',
      'k1',
      'copies',
      'agreements',
    ],
    answer:
      'Everything you execute or that gets issued to you. Signed subscription agreements file themselves the moment you sign, one per deal per profile. Your accreditation verification and identity clearance are recorded there too. Each tax season the K-1 for every SPV you hold arrives in the Tax Center, filed by profile and by deal, so an entity and a personal position stay separate. Everything is downloadable, and nothing is deleted.',
    source: 'AltSpot platform guide, Docs and the Tax Center',
    related: ['subscription-agreement', 'profile-types', 'after-funding'],
  },
  {
    id: 'wizard-steps',
    question: 'What are the setup steps?',
    keywords: [
      'setup',
      'onboarding',
      'wizard',
      'steps',
      'get started',
      'why cant i invest',
      'blocked',
      'complete setup',
      'five steps',
    ],
    answer:
      'Five, and they are one-time. Accreditation certifies you are eligible and is good for five years. Your information is the Vault, the standard details that fill every document afterwards. Identity is the ID photo and live capture for the anti-money-laundering check. Investment profile decides who holds the position: personal, an entity or an IRA. Link bank sets up one-click funding and the account distributions return to. Accreditation and identity are the two that gate investing. The rest you can finish later, though the invest page will ask for them.',
    source: 'AltSpot onboarding requirements',
    related: ['accreditation', 'kyc', 'profile-types'],
  },
  {
    id: 'settings',
    question: 'What is in Settings?',
    keywords: [
      'settings',
      'account',
      'notifications',
      'email',
      'password',
      'sign out',
      'log out',
      'preferences',
      'change my email',
    ],
    answer:
      'Account details, notification preferences and your session. Notifications control what you hear about: new deals on the marketplace, funding reminders while a window is open, and reporting or distribution notices on positions you hold. Signing out ends the session on this device only. Changes to your legal name, taxpayer ID or address belong in the Vault under Profiles, because those flow into documents.',
    source: 'AltSpot platform guide, Settings',
    related: ['vault', 'profile-types', 'documents'],
  },
  {
    id: 'spotbot-scope',
    question: 'What can you help with?',
    keywords: [
      'what can you do',
      'who are you',
      'spotbot',
      'help',
      'what do you know',
      'can you advise',
      'are you ai',
      'are you human',
    ],
    answer:
      'I explain the platform and the process. How a step works, what a term means, what a document contains, what the fees are, what happens after you fund. I answer from AltSpot\'s own materials and I cite the source under every answer, so you can check me. What I will not do is tell you whether to invest, guess at returns, size a position, or give tax or legal advice. Those belong with the offering documents and your own advisor. If you want a person, contact AltSpot directly.',
    source: 'AltSpot platform guide, SpotBot',
    related: ['sourcing', 'fees', 'illiquidity'],
  },
  {
    id: 'contact',
    question: 'How do I reach a person at AltSpot?',
    keywords: [
      'contact',
      'talk to someone',
      'reach a person',
      'reach someone',
      'human',
      'phone',
      'email you',
      'support',
      'reach you',
      'speak to',
    ],
    answer:
      'Settings carries the contact details for the AltSpot team, and every deal page names the person who ran that transaction. For anything about a live commitment, a wire that will land late or a document that looks wrong, contact them directly rather than working around it in the portal. Deal-specific questions go faster if you name the deal and your profile.',
    source: 'AltSpot platform guide, contact',
    related: ['expiry', 'cancel', 'spotbot-scope'],
  },
];

const BY_ID = new Map(KNOWLEDGE.map((topic) => [topic.id, topic]));

export function topic(id: string): KnowledgeTopic | undefined {
  return BY_ID.get(id);
}

/** Canonical phrasings for a set of ids, used to build follow-up chips. */
export function questionsFor(ids: readonly string[]): string[] {
  return ids.map((id) => BY_ID.get(id)?.question).filter((q): q is string => Boolean(q));
}
