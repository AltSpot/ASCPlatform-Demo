/**
 * Investor repository — onboarding state, the Vault, investment profiles
 * and linked banks.
 *
 * `ensureInvestorRecords` is the bootstrap: it creates the one-per-user
 * rows and seeds a closed OpenAI position so a first login lands on a
 * dashboard that already feels lived-in. That seeding is a DEMO SEAM and
 * fabricates a holding nobody bought. Read the note on `SEED_POSITION`
 * before trusting any position on this platform.
 */
import 'server-only';

import { COOLING_OFF_DAYS } from '../config';
import { prisma } from '../db';
import { DEMO_PERSONA, personaEmail } from '../demo-persona';
import { DAY_MS } from '../domain';
import type {
  AccreditationStatus,
  AccreditationView,
  BankView,
  ProfileView,
  VaultView,
  WizardView,
} from '../domain';
import {
  evaluateQuestionnaire,
  relationshipStage,
  type Evaluation,
  type QuestionnaireAnswers,
  type RelationshipView,
} from '../relationship';

/**
 * DEMO SEAM — READ THIS ONE. Every new investor is handed a position
 * they never bought.
 *
 * The figures below are invented. `seedOpeningPosition` writes them into
 * the real Subscription and Document tables the moment an account is
 * bootstrapped, so within milliseconds of a first sign-in the investor
 * holds an `accepted` $25,000 commitment in the OpenAI SPV, marked up to
 * $29,600, dated seven months ago, with a "Countersigned · closed"
 * subscription agreement filed in Docs. No money moved. Nothing was
 * signed: `signature` is null and the document has no body to open.
 *
 * It exists because a dashboard with nothing on it demonstrates nothing.
 * It is also the single most misleading thing in the codebase, because
 * these rows are indistinguishable from real ones at a glance. The only
 * marker is `seeded: true` on the subscription.
 *
 *   Production contract: there is none. A new investor holds nothing.
 *   Replacement: delete `SEED_POSITION`, delete `seedOpeningPosition`,
 *     and delete the call in `ensureInvestorRecords`. Nothing else reads
 *     them. The `seeded` column on Subscription goes with them, and until
 *     it does, anything that reports on positions should be checked for
 *     whether it filters on it.
 */
const SEED_POSITION = {
  dealId: 'aurelia',
  amount: 25_000,
  currentValue: 29_600,
  signedDaysAgo: 210,
  fundedDaysAgo: 208,
  acceptedDaysAgo: 205,
};

/**
 * DEMO SEAM — the rest of the book.
 *
 * One position is not a portfolio, and a portfolio page cannot say
 * anything useful about a single line. These four give it something to
 * describe: three vintages, four asset classes, one position marked
 * below cost, one that has exited and returned its capital plus a gain,
 * and one live position that has already returned some capital.
 *
 * DATABRICKS IS DELIBERATELY NOT HELD. It carries the seeded pending
 * commitment instead, so the funding timer has a deal of its own. A
 * deal that is both held and awaiting funding puts two rows with the
 * same name on the dashboard, which reads as a duplicate rather than
 * as a follow-on.
 *
 * The down mark is deliberate. A demo book where every position is up
 * is a brochure, and the first thing an investor looks for on a
 * portfolio screen is what went wrong.
 *
 * `dealId` points at deals seeded with status 'closed', so none of them
 * appears on the shelf. Same production contract as SEED_POSITION:
 * there is none. Delete the array and the loop that reads it.
 */
const SEED_BOOK = [
  {
    dealId: 'growth-fund',
    amount: 50_000,
    currentValue: 58_400,
    signedDaysAgo: 300,
    /** Paid out of the fund's first realization. */
    distributions: [
      { amount: 6_000, kind: 'return_of_capital', daysAgo: 75, note: 'First realization' },
    ],
  },
  {
    dealId: 'harborline',
    amount: 20_000,
    currentValue: 21_400,
    signedDaysAgo: 700,
    distributions: [
      { amount: 900, kind: 'gain', daysAgo: 190, note: 'Operating distribution' },
      { amount: 900, kind: 'gain', daysAgo: 8, note: 'Operating distribution' },
    ],
  },
  {
    /* Marked below cost after a flat round. It stays on the page. */
    dealId: 'vantage',
    amount: 30_000,
    currentValue: 24_900,
    signedDaysAgo: 260,
    distributions: [],
  },
  {
    /* Exited. Nothing left to mark, and the proceeds are the return. */
    dealId: 'northwind',
    amount: 18_000,
    currentValue: 0,
    signedDaysAgo: 900,
    /** Days ago the sale closed and the proceeds went out. */
    realizedDaysAgo: 42,
    distributions: [
      { amount: 18_000, kind: 'return_of_capital', daysAgo: 42, note: 'Sale proceeds' },
      { amount: 25_200, kind: 'gain', daysAgo: 42, note: 'Sale proceeds' },
    ],
  },
] as const;

/**
 * DEMO SEAM — a second fabricated row, this one still in flight.
 *
 * The dashboard shows each open position's timeline: what has happened,
 * what has to happen next, and by when. A demo account that holds only
 * a closed position never renders any of it, so the surface that
 * matters most, a funding window running out, was the one nobody could
 * see. This writes one signed-but-unfunded commitment with three days
 * left on its ten day window.
 *
 * Three rather than eight: the window is most of the way through, so
 * the bar is visibly spent and the row sits inside the threshold where
 * the timeline turns ember, which is the state worth demonstrating.
 *
 * Same production contract as SEED_POSITION: there is none. Delete it
 * with the rest of `seedOpeningPosition`.
 */
const SEED_PENDING = {
  /*
   * NOT the lead deal, on purpose.
   *
   * A seeded commitment on Calder puts that deal permanently past its
   * own invest flow: its CTA becomes "Fund your commitment" and there
   * is no way to walk it from the shelf through documents to funding.
   * Calder is the deal with the full editorial and the principal
   * capital line, so it is the one a demo needs to be able to walk.
   * The funding timer is worth showing too, so it moves to Tessellate
   * rather than being dropped.
   */
  dealId: 'tessellate',
  amount: 50_000,
  signedDaysAgo: 7,
  /** The funding window, in days from signature. Matches lib/domain.ts. */
  windowDays: 10,
};

/**
 * DEMO SEAM — the address that mints a genuinely empty account.
 *
 * Everything else about a demo account is seeded, which is what makes
 * the product demonstrable. But an empty account is a thing that has to
 * be demonstrable too: the empty states are real screens with real
 * copy, and the only way to reach them was to have never signed in.
 *
 * Any address whose local part carries "+new" skips every seam below.
 * No positions, no votes, no watchlist, no onboarding.
 */
const CLEAN_ADDRESS = /\+new(\+|@)/i;

/**
 * DEMO SEAM — the address that mints a member who joined recently.
 *
 * Onboarded, eligible, and holding nothing, with a relationship
 * established RECENT_RELATIONSHIP_DAYS_AGO days ago: past the cooling-off
 * period, but after some open deals launched. That is the only way to
 * show the Rule 506(b) view-only state, where a deal that opened before
 * the member joined can be read but not joined, without waiting a month.
 */
const RECENT_ADDRESS = /\+recent(\+|@)/i;
const RECENT_RELATIONSHIP_DAYS_AGO = 40;

export async function ensureInvestorRecords(userId: string): Promise<void> {
  const existing = await prisma.wizardState.findUnique({ where: { userId } });
  if (existing) return;

  await prisma.$transaction([
    prisma.wizardState.create({ data: { userId } }),
    prisma.accreditation.create({ data: { userId } }),
    prisma.kycRecord.create({ data: { userId } }),
    prisma.vaultInfo.create({ data: { userId } }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  /* A brand-new account, and nothing is written into it. */
  if (!user || CLEAN_ADDRESS.test(user.email)) return;

  /* A recent member: onboarded, no book. */
  if (RECENT_ADDRESS.test(user.email)) {
    await completeOnboarding(userId, user.name, RECENT_RELATIONSHIP_DAYS_AGO);
    return;
  }

  /*
   * ONBOARDING COMES WITH THE BOOK, AND HAS TO.
   *
   * A seeded account held six funded positions while the dashboard
   * told it to finish verifying its accreditation. Those two cannot
   * both be true: the invest gate requires verification, so capital
   * that is already at work is proof the gate was passed. The setup
   * banner sat over a portfolio it contradicted.
   */
  await completeOnboarding(userId, user.name);
  await seedOpeningPosition(userId);
}

/**
 * DEMO SEAM — how long ago a seeded member's relationship was
 * established. Three years: earlier than the oldest seeded position
 * (signed 900 days ago) plus its cooling-off period, so the book a
 * seeded member holds is consistent with the 506(b) gate it had to pass.
 */
const SEED_RELATIONSHIP_DAYS_AGO = 3 * 365;

/**
 * The questionnaire a seeded member is recorded as having given: an
 * experienced investor, so the evaluation approves it on its merits
 * rather than the seam writing `approved` by hand.
 */
const SEED_ANSWERS: QuestionnaireAnswers = {
  basis: 'net_worth',
  privateDeals: 'many',
  yearsInvesting: 'over_10',
  evaluates: 'self',
  acknowledgements: { loss: true, illiquid: true, no_advice: true },
};

/**
 * DEMO SEAM — mark an account fully onboarded without any of it having
 * happened.
 *
 * The questionnaire is recorded with SEED_ANSWERS and back-dated so the
 * relationship predates the seeded book, KYC is cleared with a
 * filename, the Vault is filled and a bank is written directly rather
 * than through `linkBank`. Everything the invest gate checks is
 * satisfied, so a seeded member can go straight into a subscription.
 *
 * The address, tax class and bank come from DEMO_PERSONA because they
 * have to come from somewhere; the name is the member's own, so the
 * documents and the profile are titled correctly for whoever signed in.
 *
 * Production contract: there is none. Delete this with the rest.
 */
async function completeOnboarding(
  userId: string,
  name: string,
  relationshipDaysAgo: number = SEED_RELATIONSHIP_DAYS_AGO,
): Promise<void> {
  const now = new Date();
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.join(' ') || DEMO_PERSONA.vault.last;

  await recordQuestionnaire(
    userId,
    SEED_ANSWERS,
    new Date(now.getTime() - relationshipDaysAgo * DAY_MS),
  );
  await saveVault(userId, {
    ...DEMO_PERSONA.vault,
    first: first || DEMO_PERSONA.vault.first,
    last,
  });

  await prisma.kycRecord.update({
    where: { userId },
    data: {
      idUploaded: true,
      idFileName: 'government-id.jpg',
      selfieCaptured: true,
      status: 'cleared',
      submittedAt: now,
      clearedAt: now,
    },
  });

  await createProfile(userId, {
    type: DEMO_PERSONA.profile.type,
    name: `${name} · Personal`,
    taxClass: DEMO_PERSONA.vault.taxClass,
  });

  await prisma.bankAccount.create({
    data: {
      userId,
      institution: DEMO_PERSONA.bank.institution,
      mask: DEMO_PERSONA.bank.mask,
      type: DEMO_PERSONA.bank.type,
      isDefault: true,
    },
  });

  await prisma.wizardState.update({
    where: { userId },
    data: { profileDone: true, bankDone: true, completedAt: now },
  });
}

/**
 * DEMO SEAM — fabricates one accepted position plus its countersigned
 * agreement. See the note on SEED_POSITION above; this is the function
 * that writes invented holdings into the real tables.
 *
 * Skipped silently if the deal is not present, so the bootstrap never
 * blocks a login on seed data.
 */
async function seedOpeningPosition(userId: string): Promise<void> {
  const deal = await prisma.deal.findUnique({
    where: { id: SEED_POSITION.dealId },
  });
  if (!deal) return;

  const now = Date.now();
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      dealId: deal.id,
      amount: SEED_POSITION.amount,
      state: 'accepted',
      seeded: true,
      currentValue: SEED_POSITION.currentValue,
      signature: null,
      signedAt: new Date(now - SEED_POSITION.signedDaysAgo * DAY_MS),
      fundedAt: new Date(now - SEED_POSITION.fundedDaysAgo * DAY_MS),
      acceptedAt: new Date(now - SEED_POSITION.acceptedDaysAgo * DAY_MS),
      fundingMethod: 'ACH · linked account',
      createdAt: new Date(now - SEED_POSITION.signedDaysAgo * DAY_MS),
    },
  });

  await prisma.document.create({
    data: {
      userId,
      dealId: deal.id,
      subscriptionId: subscription.id,
      name: `Subscription Agreement: ${deal.entity}`,
      type: 'agreement',
      note: 'Countersigned · closed',
      savedAt: new Date(now - SEED_POSITION.acceptedDaysAgo * DAY_MS),
    },
  });

  await seedMarks(
    subscription.id,
    SEED_POSITION.amount,
    SEED_POSITION.currentValue,
    new Date(now - SEED_POSITION.fundedDaysAgo * DAY_MS),
    new Date(now),
  );

  await seedPendingCommitment(userId, now);
  await seedBook(userId, now);
  await seedTaxForms(userId, now);
  await seedRadarAndWatchlist(userId);
}

/**
 * DEMO SEAM — a Radar board and a watchlist the member never built.
 *
 * Both dashboard sections have real empty states, and both of those
 * empty states are correct for a genuinely new account. They are also
 * the two sections a first-time visitor is least likely to populate
 * before deciding whether the product is interesting, which left the
 * two most interactive surfaces on the dashboard showing nothing.
 *
 * Votes are ranked in the member's own order rather than by demand, so
 * the drag handles have something to have already done. The watchlist
 * holds deals that are open and not already held, because saving
 * something you own reads as a bug.
 *
 * Production contract: there is none. A new member has voted on
 * nothing and saved nothing. Delete this function and its call.
 */
const SEED_VOTES = [
  { slug: 'ferrule', amount: 50_000, rank: 1 },
  { slug: 'orrery', amount: 25_000, rank: 2 },
  { slug: 'aurelia', amount: 100_000, rank: 3 },
];

/** Open deals the member has not committed to. Order is the list order. */
const SEED_WATCHLIST = ['calder', 'growth-fund'];

/**
 * DEMO SEAM — a K-1 per position, per completed tax year.
 *
 * The Tax Center was a hardcoded empty state saying the first K-1
 * arrives after a full tax year in a deal, on an account holding
 * positions since 2024. Now it is a real read over documents of type
 * 'k1', and this fills it for the seeded book.
 *
 * A K-1 is issued for a tax year the position was actually held, and
 * only for years that have closed. Nobody has a K-1 for the year they
 * are still in. Delivery is dated mid-March of the following year,
 * which is when these actually arrive.
 *
 * Production contract: none. K-1s are uploaded by the administrator.
 */
async function seedTaxForms(userId: string, now: number): Promise<void> {
  const positions = await prisma.subscription.findMany({
    where: { userId, seeded: true, state: { in: ['accepted', 'closed'] } },
    select: { id: true, dealId: true, fundedAt: true, realizedAt: true },
  });

  const thisYear = new Date(now).getUTCFullYear();

  for (const position of positions) {
    if (!position.fundedAt) continue;

    const deal = await prisma.deal.findUnique({ where: { id: position.dealId } });
    if (!deal) continue;

    const from = position.fundedAt.getUTCFullYear();
    /* Held all year, or until it exited. A position that closed in 2026
       still has a 2026 K-1, but that year has not ended yet. */
    const to = Math.min(
      position.realizedAt ? position.realizedAt.getUTCFullYear() : thisYear,
      thisYear - 1,
    );

    for (let year = from; year <= to; year += 1) {
      await prisma.document.create({
        data: {
          userId,
          dealId: deal.id,
          subscriptionId: position.id,
          name: `Schedule K-1 (Form 1065) · ${year}`,
          type: 'k1',
          note: deal.entity,
          savedAt: new Date(Date.UTC(year + 1, 2, 14)),
        },
      });
    }
  }
}

async function seedRadarAndWatchlist(userId: string): Promise<void> {
  for (const vote of SEED_VOTES) {
    await prisma.radarInterest.create({
      data: {
        userId,
        companySlug: vote.slug,
        amount: vote.amount,
        rank: vote.rank,
      },
    });
  }

  for (const [index, dealId] of SEED_WATCHLIST.entries()) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) continue;

    await prisma.watchlistItem.create({
      data: { userId, dealId, rank: index + 1 },
    });
  }
}

/**
 * DEMO SEAM — a mark history for one seeded position.
 *
 * Private marks arrive per reporting period, so this writes one mark
 * per quarter from the quarter after funding through to today, walking
 * from cost to the position's current value. The walk is not a straight
 * line: `SHAPE` holds it flat for a period or two and dips it, because
 * a curve that only ever rises is a sales chart rather than a portfolio
 * and the value curve is the most conspicuous thing on the page.
 *
 * The final mark equals `currentValue` exactly, so the chart's last
 * point and every figure derived from the subscription agree.
 *
 * Production contract: there is none. Marks arrive from the vehicle's
 * administrator and are written when a reporting period closes.
 */
const SHAPE = [0, 0.06, 0.04, 0.19, 0.3, 0.26, 0.44, 0.58, 0.71, 0.86, 1];

async function seedMarks(
  subscriptionId: string,
  cost: number,
  latest: number,
  fundedAt: Date,
  through: Date,
  finalBasis: string = 'vehicle',
): Promise<void> {
  /* Quarter ends between funding and today. The first mark a position
     gets is the close of the quarter after the money went in. */
  const dates: Date[] = [];
  const cursor = new Date(
    Date.UTC(fundedAt.getUTCFullYear(), Math.floor(fundedAt.getUTCMonth() / 3) * 3 + 3, 0),
  );

  while (cursor <= through) {
    dates.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 3);
    cursor.setUTCDate(0);
  }

  if (dates.length === 0) return;

  for (const [index, asOf] of dates.entries()) {
    const progress = dates.length === 1 ? 1 : index / (dates.length - 1);
    const eased = SHAPE[Math.round(progress * (SHAPE.length - 1))];

    await prisma.positionMark.create({
      data: {
        subscriptionId,
        asOf,
        /* The last period is the current mark, exactly. Anything else
           would put the chart and the ledger a few dollars apart. */
        value:
          index === dates.length - 1
            ? latest
            : Math.round(cost + (latest - cost) * eased),
        basis: index === dates.length - 1 ? finalBasis : 'vehicle',
      },
    });
  }
}

/**
 * DEMO SEAM — writes the rest of the book described on SEED_BOOK,
 * including its distributions.
 *
 * Straight to the tables rather than through the repositories, for the
 * same reason as the rest of this seam: the state machine is for
 * transitions a member actually made, and none of these happened.
 */
async function seedBook(userId: string, now: number): Promise<void> {
  for (const entry of SEED_BOOK) {
    const deal = await prisma.deal.findUnique({ where: { id: entry.dealId } });
    if (!deal) continue;

    const signedAt = new Date(now - entry.signedDaysAgo * DAY_MS);
    /* An exited position stays `closed`: that is the healthy end of the
       subscription, and the exit is `realizedAt`. See lib/domain.ts. */
    const realizedAt =
      'realizedDaysAgo' in entry
        ? new Date(now - entry.realizedDaysAgo * DAY_MS)
        : null;

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        dealId: deal.id,
        amount: entry.amount,
        state: realizedAt ? 'closed' : 'accepted',
        seeded: true,
        currentValue: entry.currentValue,
        realizedAt,
        signature: null,
        signedAt,
        fundedAt: new Date(signedAt.getTime() + 2 * DAY_MS),
        acceptedAt: new Date(signedAt.getTime() + 5 * DAY_MS),
        fundingMethod: 'ACH · linked account',
        createdAt: signedAt,
      },
    });

    /* A realized position was worth something right up until it sold,
       and its last mark is what it sold for, not the zero it carries
       today. Marking it to zero on the way out would draw a portfolio
       collapsing in the quarter its best position exited. */
    const proceeds = entry.distributions.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    await seedMarks(
      subscription.id,
      entry.amount,
      realizedAt ? proceeds : entry.currentValue,
      new Date(signedAt.getTime() + 2 * DAY_MS),
      realizedAt ?? new Date(now),
      realizedAt ? 'exit' : 'vehicle',
    );

    for (const payment of entry.distributions) {
      await prisma.distribution.create({
        data: {
          subscriptionId: subscription.id,
          amount: payment.amount,
          kind: payment.kind,
          paidAt: new Date(now - payment.daysAgo * DAY_MS),
          note: payment.note,
        },
      });
    }

    await prisma.document.create({
      data: {
        userId,
        dealId: deal.id,
        subscriptionId: subscription.id,
        name: `Subscription Agreement: ${deal.entity}`,
        type: 'agreement',
        note: realizedAt ? 'Closed · realized' : 'Countersigned · closed',
        savedAt: new Date(signedAt.getTime() + 5 * DAY_MS),
      },
    });
  }
}

/**
 * DEMO SEAM — fabricates the in-flight commitment described on
 * SEED_PENDING, so the dashboard has a live funding window to draw.
 *
 * Written straight to the table rather than through
 * lib/repositories/subscriptions.ts on purpose: the state machine is
 * for transitions a member actually made, and this one never happened.
 * That also means no allocation is decremented, which is correct for a
 * commitment nobody made.
 */
async function seedPendingCommitment(userId: string, now: number): Promise<void> {
  const deal = await prisma.deal.findUnique({
    where: { id: SEED_PENDING.dealId },
  });
  if (!deal) return;

  const signedAt = new Date(now - SEED_PENDING.signedDaysAgo * DAY_MS);
  const deadline = new Date(
    signedAt.getTime() + SEED_PENDING.windowDays * DAY_MS,
  );

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      dealId: deal.id,
      amount: SEED_PENDING.amount,
      state: 'docs_signed',
      seeded: true,
      signature: null,
      signedAt,
      fundingDeadline: deadline,
      createdAt: signedAt,
    },
  });

  /* The dashboard timeline shows "Documents signed" for this row, and
     the product promises signed documents file themselves. Without this
     the two surfaces disagreed: the timeline said signed, Docs had
     nothing. Awaiting funding rather than countersigned, because it is. */
  await prisma.document.create({
    data: {
      userId,
      dealId: deal.id,
      subscriptionId: subscription.id,
      name: `Subscription Agreement: ${deal.entity}`,
      type: 'agreement',
      note: 'Signed · awaiting funding',
      savedAt: signedAt,
    },
  });
}

// ---------------- wizard ----------------

export async function getWizardView(userId: string): Promise<WizardView> {
  await ensureInvestorRecords(userId);

  const [user, accreditation, kyc, vault, wizard] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { relationshipEstablishedAt: true },
    }),
    prisma.accreditation.findUnique({ where: { userId } }),
    prisma.kycRecord.findUnique({ where: { userId } }),
    prisma.vaultInfo.findUnique({ where: { userId } }),
    prisma.wizardState.findUnique({ where: { userId } }),
  ]);

  // The W-9 step counts as complete once the identifying fields are on file.
  const infoComplete = Boolean(
    vault?.first && vault?.last && vault?.street && vault?.tinLast4,
  );

  return {
    accreditation: toAccreditationView(accreditation),
    relationship: toRelationshipView(
      accreditation?.status ?? null,
      user?.relationshipEstablishedAt ?? null,
    ),
    info: { complete: infoComplete },
    kyc: {
      idUploaded: kyc?.idUploaded ?? false,
      selfieCaptured: kyc?.selfieCaptured ?? false,
      complete: kyc?.status === 'cleared' || kyc?.status === 'pending',
    },
    profileDone: wizard?.profileDone ?? false,
    bankDone: wizard?.bankDone ?? false,
    complete: Boolean(wizard?.completedAt),
  };
}

function toAccreditationView(
  row: {
    status: string;
    basis: string | null;
    reason: string | null;
    submittedAt: Date | null;
    decidedAt: Date | null;
  } | null,
): AccreditationView {
  return {
    status: (row?.status ?? 'not_started') as AccreditationStatus,
    basis: row?.basis ?? null,
    submittedAt: row?.submittedAt?.toISOString() ?? null,
    decidedAt: row?.decidedAt?.toISOString() ?? null,
    reason: row?.reason ?? null,
  };
}

function toRelationshipView(
  status: string | null,
  establishedAt: Date | null,
): RelationshipView {
  return relationshipStage(
    {
      status: status ?? 'not_started',
      establishedAt: establishedAt?.toISOString() ?? null,
    },
    COOLING_OFF_DAYS,
  );
}

/**
 * Just where the member stands on the 506(b) gate. The deal repository
 * reads this on every browse to decide whether any offering may go on
 * the wire, and has no use for the rest of the wizard.
 *
 * A member with no record reads as the questionnaire stage, which is the
 * answer getWizardView gives and closes every gate.
 */
export async function getRelationshipView(userId: string): Promise<RelationshipView> {
  const [user, accreditation] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { relationshipEstablishedAt: true },
    }),
    prisma.accreditation.findUnique({ where: { userId }, select: { status: true } }),
  ]);

  return toRelationshipView(
    accreditation?.status ?? null,
    user?.relationshipEstablishedAt ?? null,
  );
}

export async function markWizardComplete(userId: string): Promise<void> {
  await prisma.wizardState.update({
    where: { userId },
    data: { completedAt: new Date() },
  });
}

// ---------------- the investor questionnaire ----------------

/**
 * Record a questionnaire and the platform's evaluation of it, in one
 * transaction.
 *
 * The answers, the basis, the reason and both timestamps are kept: under
 * Rule 506(b) this row is the record behind a reasonable belief that the
 * member is accredited and able to evaluate the offering. An approval
 * writes the member's relationship date, which starts the cooling-off
 * period. A referral or a decline writes none.
 *
 * `at` is the submission time. It is a parameter so the demo seam can
 * back-date a seeded member; the route always passes now.
 *
 * The relationship date is written once. A member whose relationship is
 * already established cannot move it by answering again, because every
 * eligibility decision after that date depends on it. The route refuses
 * that case before calling this; the guard here makes it structural.
 */
export async function recordQuestionnaire(
  userId: string,
  answers: QuestionnaireAnswers,
  at: Date = new Date(),
): Promise<Evaluation> {
  const evaluation = evaluateQuestionnaire(answers);
  const decided = evaluation.outcome !== 'under_review';

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { relationshipEstablishedAt: true },
    });
    if (user?.relationshipEstablishedAt) {
      throw new Error('Relationship already established; questionnaire is closed.');
    }

    await tx.accreditation.update({
      where: { userId },
      data: {
        status: evaluation.outcome,
        method: 'questionnaire',
        basis: answers.basis,
        answersJson: JSON.stringify(answers),
        reason: evaluation.reason,
        submittedAt: at,
        decidedAt: decided ? at : null,
      },
    });

    if (evaluation.outcome === 'approved') {
      await tx.user.update({
        where: { id: userId },
        data: { relationshipEstablishedAt: at },
      });
    }
  });

  return evaluation;
}

// ---------------- the Vault (W-9) ----------------

export interface VaultInput {
  first: string;
  last: string;
  taxClass: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  /** Raw entry from the form. Only the last 4 digits are ever persisted. */
  tin: string;
}

export async function saveVault(userId: string, input: VaultInput): Promise<void> {
  const digits = input.tin.replace(/\D/g, '');
  const last4 = digits.slice(-4);

  await prisma.vaultInfo.update({
    where: { userId },
    data: {
      first: input.first,
      last: input.last,
      taxClass: input.taxClass,
      street: input.street,
      city: input.city,
      state: input.state,
      zip: input.zip,
      tinLast4: last4 || null,
      // DEMO SEAM — this is not a token. It is the last four digits with
      // a prefix, so it carries exactly the information it is supposed to
      // protect and reverses trivially. The full taxpayer ID is correctly
      // never persisted, which is the part that matters and must stay
      // true. Production sends the raw value to a tokenization vault and
      // stores the opaque handle it returns. Replace this expression, not
      // the column.
      tinToken: last4 ? `tok_demo_${last4}` : null,
    },
  });
}

export async function getVault(userId: string): Promise<VaultView> {
  const vault = await prisma.vaultInfo.findUnique({ where: { userId } });
  return {
    first: vault?.first ?? null,
    last: vault?.last ?? null,
    taxClass: vault?.taxClass ?? null,
    street: vault?.street ?? null,
    city: vault?.city ?? null,
    state: vault?.state ?? null,
    zip: vault?.zip ?? null,
    tinLast4: vault?.tinLast4 ?? null,
  };
}

// ---------------- KYC ----------------

export async function recordIdUpload(
  userId: string,
  fileName: string,
): Promise<void> {
  await prisma.kycRecord.update({
    where: { userId },
    data: { idUploaded: true, idFileName: fileName },
  });
}

export async function recordSelfie(userId: string): Promise<void> {
  await prisma.kycRecord.update({
    where: { userId },
    data: { selfieCaptured: true },
  });
}

/**
 * DEMO SEAM — submit for screening, and clear in the same write.
 *
 * `submittedAt` and `clearedAt` are both `now`, and `idUploaded` /
 * `selfieCaptured` are forced true whether or not either happened. No
 * KYC, AML, OFAC or PEP check runs. See app/api/kyc/submit/route.ts for
 * the production contract; this is the function that stops writing
 * `cleared` when the vendor adapter goes in.
 */
export async function submitKyc(userId: string): Promise<void> {
  const now = new Date();
  await prisma.kycRecord.update({
    where: { userId },
    data: {
      idUploaded: true,
      selfieCaptured: true,
      status: 'cleared',
      submittedAt: now,
      clearedAt: now,
    },
  });
}

// ---------------- investment profiles ----------------

function toProfileView(row: {
  id: string;
  type: string;
  name: string;
  taxClass: string | null;
  isDefault: boolean;
  createdAt: Date;
}): ProfileView {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    taxClass: row.taxClass,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listProfiles(userId: string): Promise<ProfileView[]> {
  const rows = await prisma.investmentProfile.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toProfileView);
}

export async function createProfile(
  userId: string,
  input: { type: string; name: string; taxClass?: string | null },
): Promise<ProfileView> {
  const count = await prisma.investmentProfile.count({ where: { userId } });

  const row = await prisma.investmentProfile.create({
    data: {
      userId,
      type: input.type,
      name: input.name,
      taxClass: input.taxClass ?? null,
      isDefault: count === 0,
    },
  });

  await prisma.wizardState.update({
    where: { userId },
    data: { profileDone: true },
  });

  return toProfileView(row);
}

/** Exactly one profile is default; setting one clears the rest. */
export async function setDefaultProfile(
  userId: string,
  profileId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.investmentProfile.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.investmentProfile.updateMany({
      where: { userId, id: profileId },
      data: { isDefault: true },
    }),
  ]);
}

// ---------------- bank ----------------

/**
 * One account as it comes back from the link flow. Mirrors the shape
 * Plaid returns for a selected account, so the real integration fills
 * this in unchanged.
 */
export interface LinkedAccountInput {
  /** Last four digits, as reported by the institution. */
  mask: string;
  /** Checking, Savings, and so on. */
  type: string;
}

/**
 * Link every account the investor selected. The first selection becomes
 * the default funding source, which is what `getBank` hands the payment
 * page. Masks come from the selection; nothing is fabricated here.
 */
export async function linkBank(
  userId: string,
  institution: string,
  accounts: LinkedAccountInput[],
): Promise<BankView[]> {
  // One transaction so a partial selection can never land, and so the
  // "exactly one default" invariant holds at every readable moment.
  const rows = await prisma.$transaction(async (tx) => {
    await tx.bankAccount.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const created = [];
    for (const [index, account] of accounts.entries()) {
      created.push(
        await tx.bankAccount.create({
          data: {
            userId,
            institution,
            mask: account.mask,
            type: account.type,
            isDefault: index === 0,
          },
        }),
      );
    }

    await tx.wizardState.update({
      where: { userId },
      data: { bankDone: true },
    });

    return created;
  });

  return rows.map((row) => ({
    id: row.id,
    institution: row.institution,
    mask: row.mask,
    type: row.type,
    linkedAt: row.linkedAt.toISOString(),
  }));
}

export async function getBank(userId: string): Promise<BankView | null> {
  const row = await prisma.bankAccount.findFirst({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { linkedAt: 'desc' }],
  });
  if (!row) return null;

  return {
    id: row.id,
    institution: row.institution,
    mask: row.mask,
    type: row.type,
    linkedAt: row.linkedAt.toISOString(),
  };
}

// ---------------- the "existing investor" persona ----------------

/**
 * DEMO SEAM — fully onboard a freshly created investor as the demo
 * persona, without any of it having happened.
 *
 * The questionnaire is recorded and back-dated, KYC is marked cleared
 * with a hardcoded filename, the Vault is filled from DEMO_PERSONA, and a
 * bank account is written directly rather than through `linkBank`. There
 * is no production equivalent: this and its caller,
 * `createDemoPersonaInvestor`, are deleted together with the
 * existing-investor button.
 *
 * Everything the invest gate checks is satisfied here: a relationship
 * past its cooling-off period, W-9 in the Vault, KYC cleared, an
 * investment profile, and a linked bank. The visitor lands on the
 * dashboard able to go straight into a subscription.
 *
 * Called only for accounts minted by the existing-investor button, so a
 * normally created investor still walks the whole setup.
 */
export async function provisionDemoPersona(userId: string): Promise<void> {
  /* Everything this used to do, ensureInvestorRecords now does for any
     seeded account: the persona is just a seeded account that happens
     to be called Hannah Smith. Kept as its own name because the
     existing-investor route reads as what it means. */
  await ensureInvestorRecords(userId);
}


/**
 * Mint a brand new investor under the demo persona and onboard them.
 *
 * A distinct address per visitor, so two people using the
 * existing-investor button at the same time never share a profile or see
 * each other's commitments. The caller supplies the password hash, which
 * keeps hashing in lib/auth.ts where it belongs.
 */
export async function createDemoPersonaInvestor(
  passwordHash: string,
): Promise<{ id: string; email: string; name: string }> {
  const user = await prisma.user.create({
    data: {
      email: personaEmail(),
      name: DEMO_PERSONA.name,
      passwordHash,
    },
  });

  await provisionDemoPersona(user.id);

  return { id: user.id, email: user.email, name: user.name };
}
