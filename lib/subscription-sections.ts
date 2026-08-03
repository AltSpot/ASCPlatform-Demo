/**
 * The subscription document, defined once.
 *
 * The invest flow's panels, the live document pane, the confirm endpoint's
 * validation and the sign endpoint's completeness check all read this file.
 * Adding or removing a section is a one-line change here and nowhere else.
 *
 * Every word below is derived from the ASC Synthera II subscription
 * agreement (GG 5.15.26) and its Exhibit A accredited investor
 * questionnaire. `covers` names the clauses each panel discharges, so
 * counsel can audit the mapping without reading a component.
 *
 * Two of the six are selections of fact, not acknowledgements, and carry a
 * `choices` list the investor must pick from: accredited investor category
 * (Exhibit A, Part II) and benefit plan investor status (§3.12 and
 * Exhibit A, Part IV). Confirming one of those records which option was
 * chosen, not merely that the panel was seen.
 *
 * Deliberately absent: the template's §3.5 language about additional
 * capital contributions. AltSpot does not make capital calls, so that
 * representation does not exist in this product.
 */

/** One line of a panel. `lead` is the conspicuous label a regulator looks for. */
export interface SectionPoint {
  lead?: string;
  text: string;
}

/** A selection of fact. Exactly one per section that has them. */
export interface SectionChoice {
  /** Stable key persisted in the answers map. Never renumber these. */
  key: string;
  /** Wire code posted to /confirm. See CONFIRMATION CODES below. */
  code: number;
  label: string;
  /** The test the investor is asserting, in plain language. */
  detail: string;
  /** How the choice reads once it is written into the executed document. */
  documentText: string;
}

export interface SubscriptionSection {
  id: number;
  /** Numeral of the matching article in the document pane. */
  numeral: string;
  /** Heading of that article. */
  documentTitle: string;
  /** Heading on the confirmation panel. */
  panelTitle: string;
  /** One sentence saying what this panel is for. */
  panelIntro: string;
  /** Clauses of the agreement this panel discharges. Rendered as a source line. */
  covers: string;
  points: SectionPoint[];
  /** Set only on sections with no choice: the code that confirms them. */
  code?: number;
  choicePrompt?: string;
  choices?: SectionChoice[];
}

/* ---------------- CONFIRMATION CODES ----------------
 *
 * A confirmation travels to the server as a single integer, because that is
 * what the browser API client carries: `section * 100 + choice ordinal`,
 * ordinal 0 where the section has no choice. Packing it this way keeps the
 * choice and the section atomic, so the audit trail can never record that a
 * category was picked without recording which one. Decode with
 * `decodeConfirmationCode`.
 */
const CODE_BASE = 100;

/** The wire code for a section that is a straight acknowledgement. */
const plain = (id: number) => id * CODE_BASE;

/** The wire code for the nth choice (1-based) of a section. */
const pick = (id: number, ordinal: number) => id * CODE_BASE + ordinal;

export const SUBSCRIPTION_SECTIONS: readonly SubscriptionSection[] = [
  {
    id: 1,
    code: plain(1),
    numeral: 'II',
    documentTitle: 'Offering documents and reliance',
    panelTitle: 'What you have read',
    panelIntro:
      'Everything AltSpot told you about this deal is in the documents. This confirms you read them and that nothing outside them is part of the bargain.',
    covers: 'Agreement §2 in full, §1.2, §1.3, §1.5, §1.6',
    points: [
      {
        text: 'You have received and read this subscription agreement, the private placement memorandum and the operating agreement, including the risk factors, the conflicts of interest and the tax discussion.',
      },
      {
        text: 'You had the chance to put questions to the Manager about the offering, the Company and Synthera, and you got answers.',
      },
      {
        text: 'You are relying on those documents and on your own diligence and advisors. Nothing said or written outside them forms part of this deal, and nobody is authorized to add to them.',
      },
      {
        text: 'The memorandum is a summary. Where it and the operating agreement disagree, the operating agreement controls.',
      },
      {
        text: 'Beyond what the offering documents say, AltSpot makes no representation about Synthera, its business or its prospects, and has not independently verified the Synthera information in them.',
      },
      {
        text: 'Your subscription binds you, not the Company. The Manager may accept it in full, in part or not at all, may hold one or more closings, and may modify, extend or withdraw the offering.',
      },
      {
        text: 'If the Company does not end up buying the Synthera securities, uninvested funds come back to you without interest.',
      },
    ],
  },

  {
    id: 2,
    numeral: 'III',
    documentTitle: 'Accredited investor status and verification',
    panelTitle: 'How you qualify',
    panelIntro:
      'This offering is only open to accredited investors. Pick the standard you actually meet. AltSpot has to verify it independently before you can close.',
    covers:
      'Agreement §3.1, §3.6, §3.7, §3.9, §3.10 · Exhibit A Parts I, II, III, V and VI',
    choicePrompt: 'Select the category you meet. You must meet at least one.',
    choices: [
      {
        key: 'income',
        code: pick(2, 1),
        label: 'Income',
        detail:
          'Over $200,000 of individual income, or $300,000 jointly with your spouse or spousal equivalent, in each of the last two years, and you reasonably expect the same this year.',
        documentText:
          'the income test under Rule 501(a)(6): individual income over $200,000, or joint income over $300,000, in each of the two most recent years',
      },
      {
        key: 'net-worth',
        code: pick(2, 2),
        label: 'Net worth',
        detail:
          'Individual or joint net worth over $1,000,000, excluding the value of your primary residence.',
        documentText:
          'the net worth test under Rule 501(a)(5): net worth over $1,000,000, excluding the primary residence',
      },
      {
        key: 'certification',
        code: pick(2, 3),
        label: 'Professional certification',
        detail:
          'You hold a Series 7, Series 65 or Series 82 license in good standing, and can show it on request.',
        documentText:
          'the professional certification test under Rule 501(a)(10): an active Series 7, Series 65 or Series 82 license',
      },
      {
        key: 'entity-assets',
        code: pick(2, 4),
        label: 'Entity over $5M',
        detail:
          'An entity that was not formed to make this investment and holds more than $5,000,000 in total assets.',
        documentText:
          'the entity test under Rule 501(a)(3): total assets over $5,000,000 and not formed to acquire the securities',
      },
      {
        key: 'all-owners',
        code: pick(2, 5),
        label: 'All owners accredited',
        detail:
          'An entity whose equity owners are each accredited investors. Be ready to confirm each of them.',
        documentText:
          'the look-through test under Rule 501(a)(8): an entity all of whose equity owners are accredited investors',
      },
    ],
    points: [
      {
        text: 'The offering runs under Rule 506(c), so AltSpot must take reasonable steps to verify your status. You upload a signed certification letter and AltSpot reviews it directly, or you hand us a letter dated within the last three months from your broker-dealer, registered investment adviser, attorney or CPA. If your status cannot be verified, the Manager can decline your subscription.',
      },
      {
        text: 'You have the legal capacity to sign, and if you are investing through an entity you have the authority to bind it. Signing violates no law, no organizational document and no other agreement you are party to. Once signed, this agreement is enforceable against you.',
      },
      {
        text: 'Either you already have a relationship with AltSpot, or your own business and financial experience lets you judge this investment and protect your own interests.',
      },
      {
        text: 'To your knowledge, none of the Rule 506(d) bad actor disqualifying events applies to you or your principals. You are not affiliated with a FINRA member firm, not a politically exposed person, and you are buying for your own account rather than as a nominee for someone else. If any of that is wrong, stop here and call us before you sign.',
      },
    ],
  },

  {
    id: 3,
    code: plain(3),
    numeral: 'IV',
    documentTitle: 'Investment intent, transfer restrictions and risk',
    panelTitle: 'What you are buying, and what it costs',
    panelIntro:
      'One company, one security, no market to sell into. This is the panel where the downside is stated plainly.',
    covers: 'Agreement §3.2, §3.3, §3.4, §3.5',
    points: [
      {
        text: 'This is speculative. The Company holds one asset: Series Seed Preferred Stock of Synthera AI, Inc., together with warrants over its common stock. There is no diversification inside the Company and you can lose the entire amount.',
      },
      {
        text: 'The Company is newly formed and has no operating or financial history.',
      },
      {
        text: 'Your units are restricted securities under Rule 144. They are not registered, no public market exists or is expected, and transfer is limited by the operating agreement and by securities law. Neither the Company nor the Manager has any obligation to register them or to help you find an exemption.',
      },
      {
        text: 'You are buying for your own account, for investment, not to resell or distribute. You have no arrangement with anyone to pass the units along.',
      },
      {
        text: 'You can hold something illiquid for an indefinite period. You have no need for liquidity here, your current needs are provided for elsewhere, and a total loss would not change your circumstances.',
      },
      {
        text: 'Class B Units do not vote and carry limited information rights. The Manager operates under narrowed duties and broad indemnification, and it holds an earlier position in Synthera from the pre-seed round through ASC Synthera LLC. The revenue participation rights are contingent and capped, and the warrants expire. All of this is in the memorandum risk factors.',
      },
      {
        lead: 'What you pay',
        text: 'A 5% management fee, charged once at closing, never annually. Ten percent carried interest on profits at exit. Nothing else, and no capital calls, ever.',
      },
    ],
  },

  {
    id: 4,
    numeral: 'V',
    documentTitle: 'Source of funds, tax and plan status',
    panelTitle: 'Where the money comes from',
    panelIntro:
      'The compliance questions: lawful funds, how the Company is taxed, and whether this is retirement money.',
    covers: 'Agreement §3.8, §3.11, §3.12 · Exhibit A Parts IV and VII',
    choicePrompt:
      'Are you a benefit plan investor? That means an ERISA plan, an IRA or another plan under Code Section 4975, or an entity holding plan assets.',
    choices: [
      {
        key: 'not-benefit-plan',
        code: pick(4, 1),
        label: 'No',
        detail:
          'Personal, trust or entity money. Not an ERISA plan, not an IRA, not an entity holding plan assets.',
        documentText: 'is not a Benefit Plan Investor',
      },
      {
        key: 'benefit-plan',
        code: pick(4, 2),
        label: 'Yes',
        detail:
          'An ERISA plan, an IRA or another Section 4975 plan. The fiduciary directing this has decided the investment is appropriate and authorized, and that it is not a prohibited transaction. AltSpot keeps benefit plan money under 25% of the class, so your allocation may be limited or declined for that reason.',
        documentText:
          'is a Benefit Plan Investor whose investment has been authorized by a fiduciary that determined it appropriate under ERISA and the Code',
      },
    ],
    points: [
      {
        text: 'Your money is lawfully sourced. Neither you nor any beneficial owner or affiliate behind you is on an OFAC sanctions list or resident in a comprehensively sanctioned country, and you will supply whatever anti-money-laundering documentation the Manager reasonably asks for.',
      },
      {
        text: 'The Company is taxed as a partnership. You pick up your share of income, gain, loss, deduction and credit on a K-1 whether or not the Company distributes any cash that year.',
      },
      {
        text: 'The Company intends to make the Section 6226 push-out election, so IRS adjustments can land on you for the reviewed year. You will give the Tax Representative the forms, certifications and identification numbers it asks for, and you indemnify the Company if you do not.',
      },
      {
        text: 'Nobody at AltSpot is advising you on tax. You are relying on your own advisors, you carry your own tax liability, and the tax rules may change against you.',
      },
      {
        text: 'You will provide a Form W-9, or the right W-8 series form if you are not a U.S. person, along with any other tax documentation the Manager requests.',
      },
    ],
  },

  {
    id: 5,
    code: plain(5),
    numeral: 'VI',
    documentTitle: 'Admission, power of attorney and Manager authority',
    panelTitle: 'What you hand to the Manager',
    panelIntro:
      'Signing makes you a member and gives AltSpot authority to act in your name. Read the power of attorney in full.',
    covers: 'Agreement §4.1, §4.2, §4.3, §6.1',
    points: [
      {
        lead: 'You become a member',
        text: 'Signing admits you as a Class B Member of ASC Synthera II, LLC and binds you to the operating agreement in full, including the representations in its Article 10, as if you had signed it on its original date.',
      },
      {
        lead: 'Power of attorney',
        text: 'You appoint AltSpot Capital, LLC as your attorney-in-fact to sign, deliver, file and record in your name: the operating agreement and its amendments, the schedules that record your admission, capital contribution and percentage interest, the certificates that keep the Company qualified in any state it operates in, and the instruments that dissolve and liquidate it. This power is coupled with an interest. It is irrevocable and it survives your death, incapacity or bankruptcy.',
      },
      {
        lead: 'The Manager decides',
        text: 'AltSpot runs the Company. It negotiates and signs the Synthera transaction documents, votes the shares, exercises or lets the warrants lapse, responds to drag-along, tag-along and right-of-first-refusal calls, makes the tax elections, and chooses when and how to sell. Class B Units do not vote and Class B Members do not participate in management.',
      },
      {
        lead: 'Governing law',
        text: 'Delaware law governs this agreement, without regard to conflicts-of-laws principles.',
      },
    ],
  },

  {
    id: 6,
    code: plain(6),
    numeral: 'VII',
    documentTitle: 'Irrevocability, indemnification and dispute resolution',
    panelTitle: 'The terms that bind you hardest',
    panelIntro:
      'These four are the ones people miss. They are here on their own, in their own words, because you should see them before you sign and not after.',
    covers: 'Agreement §1.4, §5, §6.2 · §3.13, §3.14, §3.15',
    points: [
      {
        lead: 'Your offer is irrevocable',
        text: 'Once you deliver this signed agreement you cannot withdraw it, cancel it or revoke it, except where the law requires otherwise. The Manager can still reject it in whole or in part and return your money without interest. You, however, cannot change your mind.',
      },
      {
        lead: 'You indemnify AltSpot',
        text: 'If you breach a representation or covenant, give inaccurate or incomplete information, transfer units in violation of the agreement, or cause the Company a tax liability by not complying with Section 7.4 of the operating agreement, you cover the resulting losses, claims, damages and legal fees of the Company, the Manager and their people. This obligation is on top of the operating agreement, and it outlives both the Company and any transfer of your units.',
      },
      {
        lead: 'Arbitration and jury trial waiver',
        text: 'Disputes go to binding, non-appealable arbitration before the American Arbitration Association in Los Angeles, California. You are knowingly and voluntarily giving up your right to a jury trial and your right to appeal. That is a genuine waiver of rights you otherwise have. Read it as one.',
      },
      {
        lead: 'Confidentiality',
        text: 'The memorandum and the rest of the offering documents are confidential. Share them only with your own advisors, who are bound to the same standard, or where the law compels you, in which case tell us first if you are allowed to.',
      },
      {
        lead: 'Keep it current',
        text: 'If anything you confirmed here stops being true, before or after closing, tell the Manager in writing. Until you do, we rely on it. Everything you confirm here survives closing and the eventual wind-up of the Company.',
      },
    ],
  },
];

export const SUBSCRIPTION_SECTION_COUNT = SUBSCRIPTION_SECTIONS.length;

/** The answers-map key recording that a section was confirmed. */
export const sectionKey = (id: number) => `sec${id}`;

/** The answers-map key recording which option was chosen for a section. */
export const choiceKey = (id: number, key: string) => `sec${id}.${key}`;

export function getSection(id: number): SubscriptionSection | null {
  return SUBSCRIPTION_SECTIONS.find((s) => s.id === id) ?? null;
}

/**
 * Resolve a posted confirmation code. Returns null for anything not in the
 * table, so an unknown or stale code is rejected rather than silently
 * recorded as a confirmation the investor never made.
 */
export function decodeConfirmationCode(
  code: number,
): { section: SubscriptionSection; choice: SectionChoice | null } | null {
  const section = getSection(Math.floor(code / CODE_BASE));
  if (!section) return null;

  if (section.choices) {
    const choice = section.choices.find((c) => c.code === code);
    return choice ? { section, choice } : null;
  }

  return section.code === code ? { section, choice: null } : null;
}

export function isSectionConfirmed(
  answers: Record<string, boolean>,
  id: number,
): boolean {
  return Boolean(answers[sectionKey(id)]);
}

/** The option the investor picked for a section, if it has options. */
export function selectedChoice(
  answers: Record<string, boolean>,
  section: SubscriptionSection,
): SectionChoice | null {
  return (
    section.choices?.find((c) => answers[choiceKey(section.id, c.key)]) ?? null
  );
}

/** Sections still outstanding. Empty means the agreement is ready to sign. */
export function unconfirmedSections(
  answers: Record<string, boolean>,
): SubscriptionSection[] {
  return SUBSCRIPTION_SECTIONS.filter((s) => !isSectionConfirmed(answers, s.id));
}
