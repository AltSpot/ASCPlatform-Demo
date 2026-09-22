/**
 * Terminal — the AltSpot library.
 *
 * EVERYTHING THE TERMINAL PUBLISHES IS READ HERE, INSIDE THE PORTAL.
 * Articles, reports and podcasts all resolve to `/terminal/<slug>` and
 * render in the portal shell. Nothing links out. That is a product
 * decision, not an implementation detail: the Terminal is the reason a
 * member opens the portal on a day they are not investing, and a link
 * that lands them on a newsletter site has ended the session.
 *
 * The newsletter archive on the publication site is the back catalogue,
 * and `lib/terminal/journal.ts` is the importer that brings it in. See
 * the note on that file. After the import there is no external
 * destination for Terminal content at all.
 *
 * DEMO SEAM — the pieces below are written for the demo. In production
 * this module is the read side of a content store: same `LibraryItem`
 * shape, same functions, contents from the database instead of a
 * constant. Nothing that consumes it changes.
 *
 * Editorial rules that outlive the demo content:
 *  - Every piece carries a `sourceNote`. Terminal explains, it does not
 *    advise, and the provenance line is how a reader can tell which one
 *    they are getting. Same rule as Spot.
 *  - No piece names a return, projects one, or recommends an action.
 *  - A piece about a live deal is not editorial. Deal writing belongs on
 *    the deal page, where the disclosures are.
 */
import 'server-only';

export type LibraryKind = 'article' | 'report' | 'podcast';

export interface LibraryBlock {
  type: 'p' | 'h' | 'quote' | 'list' | 'note';
  text?: string;
  items?: string[];
  attribution?: string;
}

/** Podcast chapters. `at` is a display timestamp, not a seek offset. */
export interface LibraryChapter {
  at: string;
  label: string;
}

export interface LibraryItem {
  slug: string;
  kind: LibraryKind;
  title: string;
  /** The standfirst. One sentence, always present. */
  standfirst: string;
  topic: string;
  author: string;
  /** ISO 8601. */
  publishedAt: string;
  /** Minutes to read, or to listen. */
  minutes: number;
  /** A CSS gradient. Editorial art is generated, never stock photography. */
  art: string;
  body: LibraryBlock[];
  /** Reports only. The three figures the piece is built around. */
  figures?: { k: string; v: string }[];
  /** Podcasts only. */
  chapters?: LibraryChapter[];
  /** Where this came from and what it is. Rendered under every piece. */
  sourceNote: string;
}

export const KIND_LABEL: Record<LibraryKind, string> = {
  article: 'Article',
  report: 'Report',
  podcast: 'Podcast',
};

const LIBRARY: LibraryItem[] = [
  {
    slug: 'twenty-positions-equal-weight',
    kind: 'article',
    title: 'Twenty positions, equal weight',
    standfirst:
      'Early-stage outcomes are skewed, so the count matters more than the pick. How a diversified sleeve is built, and why the minimums on this platform sit where they do.',
    topic: 'Portfolio construction',
    author: 'AltSpot Capital',
    publishedAt: '2026-09-17T15:00:00.000Z',
    minutes: 5,
    art: 'linear-gradient(135deg,#140F07 0%,#4A3010 50%,#B8924A 118%)',
    body: [
      {
        type: 'p',
        text: 'A single early-stage investment is a coin with a bent edge: most land small, a few land very large, and nobody can tell you in advance which. That shape is why the people who do this well talk less about picking and more about counting.',
      },
      { type: 'h', text: 'What the count does' },
      {
        type: 'p',
        text: 'Suppose any one deal has a one-in-twenty chance of a very large outcome. With five positions the chance of holding at least one is about 23%. With ten it is about 40%. With twenty it is about 64%. The arithmetic is the whole argument: the count is what turns a skewed distribution from a lottery ticket into a portfolio.',
      },
      {
        type: 'p',
        text: 'The evidence from angel portfolios points the same way. In the Angel Capital Association’s portfolio data, investors holding fifteen to twenty-five companies saw median returns well above those holding one to five, and 88% of investors with fifteen or more positions had positive returns. Past portfolios, other investors, other decades: it says nothing about any deal on this platform, and it is the best-known study of the question.',
      },
      { type: 'h', text: 'How a sleeve is usually built' },
      {
        type: 'list',
        items: [
          'A sleeve of 5% to 10% of investable assets. The rest of a portfolio stays where it is.',
          'Deployed over about three years, six or seven positions a year, so no single vintage decides the outcome.',
          'About twenty positions at equal weight, around 5% of the sleeve each. Early positions will look heavy until the count catches up.',
          '20% to 30% kept back for follow-ons in the ones that break out.',
        ],
      },
      {
        type: 'note',
        text: 'For someone with $2M of investable assets that is a sleeve of up to $200,000 and about $10,000 a deal. For $5M it is about $25,000 a deal. That $10,000 to $25,000 band is where the minimums on this platform sit: $10,000 as the standard, $5,000 on the smallest vehicles, $25,000 on the largest.',
      },
      { type: 'h', text: 'What this is not' },
      {
        type: 'p',
        text: 'A description of a structure, not advice about your money. How much of your own assets belongs in early-stage investing, if any, depends on things this page cannot see: your liquidity, your horizon, your tax position, everything else you hold. That conversation belongs with your advisor. What the platform can do is make the structure easy to follow: minimums in the band, a Portfolio page that counts your positions against twenty, and a marketplace that keeps the shelf full enough to get there.',
      },
    ],
    sourceNote:
      'Written by AltSpot Capital. The probabilities are arithmetic on an assumed hit rate, illustrative only. The angel portfolio findings are the Angel Capital Association’s published portfolio data, cited as published and not independently verified; they describe other investors’ portfolios in other periods and are not a projection of any outcome here. Not investment advice.',
  },
  {
    slug: 'what-a-secondary-actually-buys',
    kind: 'article',
    title: 'What a secondary actually buys',
    standfirst:
      'A late-stage secondary is a transfer of someone else’s position, not a new investment in the company. The difference decides what you own and what you can be told.',
    topic: 'Structure',
    author: 'AltSpot Capital',
    publishedAt: '2026-08-24T13:00:00.000Z',
    minutes: 7,
    art: 'linear-gradient(135deg,#120E08 0%,#3A2A12 55%,#8A6D35 118%)',
    body: [
      {
        type: 'p',
        text: 'When a company stays private for fifteen years, the people who joined it in year three need a way out that does not require the company to sell itself. That way out is the secondary market: an existing holder sells their shares to a new one. The company issues nothing and receives nothing.',
      },
      { type: 'h', text: 'You are buying a position, not funding a plan' },
      {
        type: 'p',
        text: 'In a primary round the money goes to the company and you can ask what it will be spent on. In a secondary the money goes to the seller. There is no use of proceeds, because there are no proceeds to use. What you are underwriting is the price against the company as it already is.',
      },
      {
        type: 'p',
        text: 'This is why the diligence question changes shape. On a primary you ask whether the plan is fundable. On a secondary you ask three narrower questions: what class of shares is actually moving, whether the company will consent to the transfer, and what you are permitted to know before you commit.',
      },
      { type: 'h', text: 'Common, not preferred, most of the time' },
      {
        type: 'p',
        text: 'Employees and early holders usually hold common stock. Preferred stock, with its liquidation preference and its protective provisions, sits with the funds that led the priced rounds. A secondary is most often common, which means it sits behind every preference in the stack.',
      },
      {
        type: 'list',
        items: [
          'A preference of 1x non-participating means the preferred holders take their money back first, then share the rest.',
          'Stacked preferences from several rounds compound that, and in a flat outcome common can receive very little.',
          'The headline valuation of the last round is a preferred-share price. Common is worth less than that, and the gap is not a discount you negotiated.',
        ],
      },
      {
        type: 'note',
        text: 'A price described as a discount to the last round is only meaningful if both sides of the comparison are the same class of share. Ask which class the last round priced.',
      },
      { type: 'h', text: 'Transfer restrictions are the real gate' },
      {
        type: 'p',
        text: 'Almost every private company restricts transfers. A right of first refusal lets the company or its investors step in and buy on the same terms. A board consent requirement lets them decline the transfer outright. Neither is unusual and neither is a red flag, but both mean a signed purchase agreement is not the end of the process.',
      },
      {
        type: 'p',
        text: 'The practical consequence is time. A secondary can take weeks between agreement and settlement, and it can fail at the consent step after everything else is done. Any structure that promises immediate ownership of a restricted private share is describing something other than what it is selling.',
      },
      { type: 'h', text: 'What you are allowed to know' },
      {
        type: 'p',
        text: 'A selling employee is usually under confidentiality and typically has no current financials to give you. The company has no obligation to open its books to a buyer it did not invite. So the information available on a secondary is often thinner than on a primary round in the same company, and it is thinner for a structural reason rather than because someone is hiding something.',
      },
      {
        type: 'quote',
        text: 'On a secondary the question is not what the company will do next. It is what the position already is, and what the paperwork will let you keep.',
        attribution: 'AltSpot investment committee note',
      },
      { type: 'h', text: 'How to read a secondary offering' },
      {
        type: 'list',
        items: [
          'Which share class is transferring, and where it sits against the preference stack.',
          'Who the seller is, and whether the sale tells you anything about their view. Often it tells you nothing: people buy houses.',
          'What consent is required, who gives it, and what happens to your money while that is pending.',
          'What the price is a discount to, and whether that reference price is the same class of share.',
          'Whether the vehicle holds the shares directly or holds an interest in another vehicle that holds them.',
        ],
      },
      {
        type: 'p',
        text: 'None of this makes a secondary better or worse than a primary. They are different instruments that happen to reference the same company, and the failure mode is treating one as the other.',
      },
    ],
    sourceNote:
      'Explainer written by AltSpot Capital. General structural education about how private secondaries work. It is not investment advice, it is not about any specific offering, and no figure in it describes an actual transaction.',
  },
  {
    slug: 'how-altspot-is-paid',
    kind: 'article',
    title: 'How AltSpot is paid',
    standfirst:
      'Every deal on the platform is its own SPV, and AltSpot organizes and advises each one. Here is how that work is paid for, in the order the money moves.',
    topic: 'How AltSpot works',
    author: 'AltSpot Capital',
    publishedAt: '2026-09-17T13:00:00.000Z',
    minutes: 4,
    art: 'linear-gradient(135deg,#1A1206 0%,#5A3C14 55%,#C79A4B 118%)',
    body: [
      {
        type: 'p',
        text: 'A deal-by-deal platform does its expensive work before a member ever sees a deal: sourcing, diligence, structuring the vehicle. After that comes the part that lasts for years, which is holding the position, reporting on it, and filing a K-1 every season until it exits. The fee is built around both.',
      },
      { type: 'h', text: 'First, your money waits in escrow' },
      {
        type: 'p',
        text: 'When you subscribe, your money goes to escrow, in an account in the SPV\'s name, never to an AltSpot account. The deal closes only when its minimum is met by the closing date. If it is not, escrow returns what you sent.',
      },
      { type: 'h', text: 'At closing, out of the investment' },
      {
        type: 'p',
        text: 'Each vehicle pays one flat admin fee for its lifetime, the same whatever its size, shared pro rata across its investors. The management fee is an annual rate on committed capital, with an assumed term reserved at closing. Both come out of the investment, not on top of it: you send your investment and nothing more. The reserve is drawn down as it is earned, and anything unearned comes back to members.',
      },
      {
        type: 'note',
        text: 'Reserving the fee at closing is what lets us promise no capital calls. Nothing is billed annually and no one is asked for more money later.',
      },
      { type: 'h', text: 'At exit, a share of profit' },
      {
        type: 'p',
        text: 'Carried interest is a share of profit, not of capital, and only when a position exits. Capital comes back first. If a position returns your capital and nothing more, or is written off, the carry is zero.',
      },
      {
        type: 'list',
        items: [
          'Money waits in escrow until the minimum is met.',
          'A flat admin fee per vehicle, and the management fee reserved at closing, both out of the investment.',
          'Carried interest on profits at exit only.',
          'The exact terms are in each deal\'s memorandum. No capital calls.',
        ],
      },
    ],
    sourceNote:
      'Written by AltSpot Capital about its own fee structure. It describes how fees work, not what any deal costs; the figures for each deal are in its memorandum. Nothing here is a projection or a statement about what any position will return.',
  },
  {
    slug: 'the-denominator-problem',
    kind: 'article',
    title: 'The denominator problem',
    standfirst:
      'Institutions cut private allocations in 2022 for a reason that had nothing to do with private markets. Understanding it explains most of what has happened to pricing since.',
    topic: 'Market structure',
    author: 'AltSpot Capital',
    publishedAt: '2026-08-08T13:00:00.000Z',
    minutes: 8,
    art: 'linear-gradient(135deg,#0F0F0A 0%,#33301F 55%,#7A7060 118%)',
    body: [
      {
        type: 'p',
        text: 'A pension fund with a ten percent target allocation to private markets is not making a fresh decision every year. It is holding a ratio. When the listed side of the portfolio falls thirty percent and the private side is marked once a quarter with a lag, the ratio moves on its own.',
      },
      { type: 'h', text: 'How the ratio breaks' },
      {
        type: 'p',
        text: 'Suppose a hundred dollar portfolio holds ninety dollars of public assets and ten of private. Public markets fall thirty percent. The public side is now sixty three dollars. The private side is still marked near ten, because private marks lag and because a company that has not raised has no new price.',
      },
      {
        type: 'p',
        text: 'The portfolio is now seventy three dollars and the private allocation is nearly fourteen percent. Nothing was bought. Nothing was sold. The target was breached by arithmetic.',
      },
      {
        type: 'note',
        text: 'This is the denominator effect. The numerator did not move. The denominator did.',
      },
      { type: 'h', text: 'What an allocator does next' },
      {
        type: 'p',
        text: 'They stop committing to new funds, because a new commitment makes the breach worse. And some of them sell existing positions on the secondary market, which is where the supply of secondaries came from in the years that followed.',
      },
      {
        type: 'p',
        text: 'The seller in that trade is not making a judgement about the asset. They are rebalancing a policy. That is a different kind of seller from one who has decided a company is worth less, and the distinction matters to anyone standing on the other side of the trade.',
      },
      { type: 'h', text: 'What it did to pricing' },
      {
        type: 'p',
        text: 'A market where the sellers are forced and the buyers are not is a market where the buyer sets the price. Discounts to the last marked round widened, and stayed wide long after listed markets recovered, because the recovery reversed the arithmetic slowly and the pipeline of postponed commitments took years to clear.',
      },
      {
        type: 'quote',
        text: 'The most useful question about any private position on offer is why the person selling it is selling it. Sometimes the honest answer is that a spreadsheet told them to.',
        attribution: 'AltSpot investment committee note',
      },
      { type: 'h', text: 'What it does not tell you' },
      {
        type: 'p',
        text: 'A wide discount is a fact about the seller’s situation, not a fact about the company. Structural pressure on sellers explains why a price is available. It does not establish that the price is low relative to what the asset is worth, and treating the two as the same thing is the most common error in this market.',
      },
      {
        type: 'p',
        text: 'The company still has to be underwritten on its own terms. The denominator problem tells you why you are being shown the position at all.',
      },
    ],
    sourceNote:
      'Market-structure explainer written by AltSpot Capital. Illustrative arithmetic, not market data. It describes a mechanism and makes no claim about current pricing or any specific position.',
  },
  {
    slug: 'private-markets-q3-2026',
    kind: 'report',
    title: 'Private markets, Q3 2026',
    standfirst:
      'Where the money went, what it paid, and how long positions are being held. Sixteen pages compressed into what actually changed.',
    topic: 'Quarterly',
    author: 'AltSpot Capital research',
    publishedAt: '2026-08-28T13:00:00.000Z',
    minutes: 12,
    art: 'linear-gradient(135deg,#1A0F08 0%,#4A2A16 55%,#A8461A 118%)',
    figures: [
      { k: 'Median hold to exit', v: '8.4 years' },
      { k: 'Secondary volume, trailing year', v: '$142B' },
      { k: 'Median secondary discount', v: '17%' },
    ],
    body: [
      {
        type: 'p',
        text: 'Three things moved this quarter and only one of them was priced. Companies are staying private longer, secondary volume set another record, and the discount at which those secondaries clear narrowed for the third consecutive quarter without closing.',
      },
      { type: 'h', text: 'Holding periods' },
      {
        type: 'p',
        text: 'The median venture-backed company that exited this quarter had been private for eight point four years. Ten years ago that figure was closer to six. The extension is not evenly distributed: it is concentrated in companies that raised large late-stage rounds and now have the balance sheet to decline an exit they do not like.',
      },
      {
        type: 'p',
        text: 'For an investor the consequence is mechanical. A longer hold means more of the return has to come from operating progress and less from timing, and it means any structure charging an annual fee is charging it for longer than the structure was designed around.',
      },
      { type: 'h', text: 'Secondary volume' },
      {
        type: 'p',
        text: 'Trailing twelve month volume reached one hundred and forty two billion dollars. The mix continues to shift from fund-level transfers toward direct positions in single companies, which is the part of the market that is legible to an individual investor rather than only to an institution.',
      },
      {
        type: 'list',
        items: [
          'Fund-level secondaries remain the majority of dollars, and are largely institutional.',
          'Direct single-company secondaries are the faster-growing share by count.',
          'Employee tender offers run by companies themselves accounted for a meaningful part of the growth, and those are priced by the company rather than negotiated.',
        ],
      },
      { type: 'h', text: 'Pricing' },
      {
        type: 'p',
        text: 'The median direct secondary cleared at a seventeen percent discount to the last primary round price. That is narrower than the twenty four percent of a year ago and still wider than the pre-2022 norm.',
      },
      {
        type: 'note',
        text: 'A discount to a last round is a comparison to a price set at a different time, in a different class of share, under different terms. It is a starting point for underwriting and not a measure of value.',
      },
      { type: 'h', text: 'What we are watching next quarter' },
      {
        type: 'list',
        items: [
          'Whether tender-offer pricing continues to anchor the broader secondary market for the same names.',
          'Whether the narrowing discount survives the next repricing of listed comparables.',
          'Whether hold periods extend again, which would keep pressure on any annual-fee structure.',
        ],
      },
    ],
    sourceNote:
      'AltSpot Capital research. Demo environment: the figures in this report are illustrative and were written for the demo. They are not market data, they describe no AltSpot position, and nothing here is a forecast or a recommendation.',
  },
  {
    slug: 'inside-a-data-room',
    kind: 'podcast',
    title: 'Inside a data room',
    standfirst:
      'Forty minutes on what AltSpot actually receives from a company, what it looks at first, and the three things that end a diligence process early.',
    topic: 'Process',
    author: 'AltSpot Capital',
    publishedAt: '2026-08-21T13:00:00.000Z',
    minutes: 41,
    art: 'linear-gradient(135deg,#1A0B06 0%,#5A2414 55%,#E5661A 118%)',
    chapters: [
      { at: '00:00', label: 'What a data room contains, and what it never does' },
      { at: '06:20', label: 'Cohort tables: the first thing we open' },
      { at: '14:05', label: 'Reading a cap table against the preference stack' },
      { at: '22:40', label: 'Customer concentration, and when it is fine' },
      { at: '30:15', label: 'Three things that end the process' },
      { at: '36:50', label: 'What we tell a company we could not get to' },
    ],
    body: [
      {
        type: 'p',
        text: 'A data room is a folder of documents a company opens to a prospective investor. What is in it varies enormously, and what is missing from it is often the more useful signal.',
      },
      { type: 'h', text: 'The first thing we open' },
      {
        type: 'p',
        text: 'Cohort tables. Revenue growth tells you the company added customers. Cohorts tell you whether the customers it added last year are still there and spending more. A company can grow revenue for years while every cohort decays, and only the cohort table shows it.',
      },
      { type: 'h', text: 'The cap table is a document about the future' },
      {
        type: 'p',
        text: 'A cap table lists who owns what. Read against the preference stack, it also tells you what each of those owners has to receive before anyone else receives anything. On a company that has raised five rounds, that arithmetic can change what a given exit price means for a common shareholder by a very large margin.',
      },
      {
        type: 'quote',
        text: 'We have passed on companies we liked because the preference stack meant the outcome we thought was likely paid the common holders almost nothing.',
        attribution: 'From the episode',
      },
      { type: 'h', text: 'Three things that end it early' },
      {
        type: 'list',
        items: [
          'Numbers that do not reconcile between two documents in the same room, and no one can say which is right.',
          'A concentration the company has not thought about. One customer at forty percent of revenue is a fact. Not having a view on it is a judgement.',
          'A reluctance to let us speak to customers. It is not always a problem, but it is always a question, and the answer to the question is what matters.',
        ],
      },
      {
        type: 'note',
        text: 'This episode is about process. It does not discuss any company currently on the AltSpot marketplace.',
      },
    ],
    sourceNote:
      'AltSpot Capital podcast. A description of AltSpot’s own diligence process. It is not advice, and no company discussed as an example is a current or past AltSpot position.',
  },
  {
    slug: 'accreditation-explained',
    kind: 'podcast',
    title: 'Accreditation, explained properly',
    standfirst:
      'Twenty five minutes on Rule 506(b): why no deal is ever named in public, why you answer a questionnaire first, and why there is a short wait before offerings open.',
    topic: 'Regulation',
    author: 'AltSpot Capital',
    publishedAt: '2026-09-17T13:00:00.000Z',
    minutes: 25,
    art: 'linear-gradient(135deg,#0B0A08 0%,#2A2418 55%,#B8924A 118%)',
    chapters: [
      { at: '00:00', label: 'Two exemptions, and the one we use' },
      { at: '05:30', label: 'Why a relationship comes before any deal' },
      { at: '12:10', label: 'Income, net worth, and the professional pathways' },
      { at: '18:00', label: 'The questionnaire, and the relationship date' },
      { at: '21:40', label: 'What we keep and what we never keep' },
    ],
    body: [
      {
        type: 'p',
        text: 'A private offering has to fit inside an exemption from registration. Two of them matter here. Rule 506(c) permits general solicitation and, in exchange, requires the issuer to verify that every investor is accredited. Rule 506(b) permits no general solicitation at all, and lets an issuer rely on a reasonable belief that its investors are accredited. Every deal on AltSpot is offered under 506(b).',
      },
      { type: 'h', text: 'Why a relationship comes first' },
      {
        type: 'p',
        text: 'No general solicitation means no deal is ever named in public: not in an ad, not on social, not on the logged-out site. Offerings go only to people the platform already has a substantive relationship with. That relationship starts with the investor questionnaire, which asks how you qualify and how you evaluate private investments, and AltSpot reviews it before anything opens.',
      },
      { type: 'h', text: 'The pathways' },
      {
        type: 'list',
        items: [
          'Income: over two hundred thousand dollars individually, or three hundred thousand jointly, in each of the last two years, with a reasonable expectation of the same this year.',
          'Net worth: over one million dollars excluding the value of your primary residence.',
          'Professional: holding a Series 7, 65 or 82 license in good standing.',
          'Entities: several routes, most commonly five million dollars in assets.',
        ],
      },
      { type: 'h', text: 'Why there is a wait' },
      {
        type: 'p',
        text: 'Offerings open the moment your questionnaire is approved, and you may join deals that open after the date the relationship began. A deal that opened before you joined is shown to you, but only to read. That is what keeps a relationship from being formed around a particular deal.',
      },
      {
        type: 'note',
        text: 'The questionnaire gates what you can see. The W-9 and identity check gate what you can invest in. They are separate steps on purpose.',
      },
    ],
    sourceNote:
      'AltSpot Capital podcast. General education about Rule 506 as it applies to this platform. It is not legal or tax advice, and an investor’s own status is a question for their own adviser.',
  },
];

/**
 * The card fields, and only those. The rail is a client component and a
 * body is several kilobytes of prose that nothing on the Terminal page
 * renders, so it never crosses. A piece's body is fetched by its own
 * page, which is the only surface that shows it.
 */
export interface LibraryCard {
  slug: string;
  kind: LibraryKind;
  title: string;
  standfirst: string;
  topic: string;
  publishedAt: string;
  minutes: number;
  art: string;
}

export function toCard(item: LibraryItem): LibraryCard {
  return {
    slug: item.slug,
    kind: item.kind,
    title: item.title,
    standfirst: item.standfirst,
    topic: item.topic,
    publishedAt: item.publishedAt,
    minutes: item.minutes,
    art: item.art,
  };
}

/** Newest first, optionally narrowed to one kind. */
export function listLibrary(options?: {
  kind?: LibraryKind;
  limit?: number;
}): LibraryItem[] {
  const items = LIBRARY.filter(
    (item) => !options?.kind || item.kind === options.kind,
  ).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return options?.limit ? items.slice(0, options.limit) : items;
}

export function getLibraryItem(slug: string): LibraryItem | null {
  return LIBRARY.find((item) => item.slug === slug) ?? null;
}

/**
 * What to read next. Same topic first, then whatever is newest, so the
 * end of a piece is never a dead end.
 */
export function relatedLibrary(slug: string, limit = 3): LibraryItem[] {
  const current = getLibraryItem(slug);
  if (!current) return listLibrary({ limit });

  return listLibrary()
    .filter((item) => item.slug !== slug)
    .sort((a, b) => {
      const aSame = a.topic === current.topic ? 0 : 1;
      const bSame = b.topic === current.topic ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      return b.publishedAt.localeCompare(a.publishedAt);
    })
    .slice(0, limit);
}
