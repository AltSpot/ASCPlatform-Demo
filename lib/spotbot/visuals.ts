/**
 * The pictures Spot answers with, one per mechanic, keyed by knowledge
 * topic id. See SpotVisual in ./types.ts for the shapes.
 *
 * Every figure here comes from the same function the product uses for
 * it (lib/fees.ts, lib/config.ts, lib/funding.ts), and anything behind
 * SHOW_FEE_TERMS or SHOW_CARRY_TERMS stays out of the picture when the
 * switch is off: with fees off the sum shows its rows and no amounts,
 * with carry off the split is replaced by the order of payments with no
 * rate. A picture is never a projection: the meters are illustrative
 * positions with the rule's own marks on them, and say so.
 *
 * Pure and isomorphic. Nothing here may depend on how a member arrived.
 */
import {
  ADMISSION_CUTOFF_HOURS,
  CARRY_PERCENT,
  COOLING_OFF_DAYS,
  FEE_TERMS,
  INVESTOR_CAP_DEFAULT,
  INVESTOR_CAP_MAX,
  MIN_INVESTMENT_FLOOR,
  MIN_INVESTMENT_LARGE,
  MIN_INVESTMENT_LARGE_VEHICLE,
  MIN_INVESTMENT_SMALL_VEHICLE,
  MIN_INVESTMENT_STANDARD,
  RETIREMENT_BLOCK_PERCENT,
  RETIREMENT_WARN_PERCENT,
  SHOW_CARRY_TERMS,
  SHOW_FEE_TERMS,
} from '../config';
import { feeBreakdown, reservePercent } from '../fees';
import { money } from '../format';
import { chanceOfAtLeastOne, SLEEVE } from '../portfolio-plan';
import type { SpotVisual } from './types';

/** The worked example every fee picture is drawn on. Illustrative. */
const EXAMPLE_SUBSCRIPTION = 50_000;

function escrowPath(): SpotVisual {
  return {
    kind: 'path',
    title: 'From signing to close',
    steps: [
      { label: 'You sign', note: 'Your spot in the SPV is reserved.' },
      { label: 'You send to escrow', note: 'ACH or wire, to an account in the SPV\'s name.' },
      {
        label: 'Admissions close',
        note: `${ADMISSION_CUTOFF_HOURS} hours before the wire. The register locks.`,
        tone: 'warn',
      },
      { label: 'The deal closes', note: 'Minimum met: escrow funds the SPV.', tone: 'good' },
    ],
    otherwise: {
      label: 'Minimum not met by the closing date',
      note: 'Escrow returns every subscription in full.',
    },
  };
}

function feesSum(): SpotVisual {
  const example = feeBreakdown(EXAMPLE_SUBSCRIPTION);
  if (!SHOW_FEE_TERMS) {
    return {
      kind: 'sum',
      title: 'What goes to escrow',
      rows: [
        { label: 'Your subscription', value: money(example.amount) },
        {
          label: 'Management fee reserve',
          value: 'In the memorandum',
          note: 'Funded once at close, drawn down as earned, unearned returned.',
          tone: 'quiet',
        },
      ],
      total: { label: 'Sent to escrow', value: 'Subscription + reserve' },
      caption: `Illustrative, on a ${money(EXAMPLE_SUBSCRIPTION)} subscription. Nothing billed annually. No capital calls.`,
    };
  }
  return {
    kind: 'sum',
    title: 'What goes to escrow',
    rows: [
      { label: 'Your subscription', value: money(example.amount) },
      {
        label: `Management fee reserve, ${reservePercent()}%`,
        value: money(example.reserve),
        note: `${FEE_TERMS.annualPercent}% a year for ${FEE_TERMS.termYears} years, funded once. Unearned fee is returned.`,
      },
    ],
    total: { label: 'Sent to escrow', value: money(example.allIn) },
    caption: `Illustrative, on a ${money(EXAMPLE_SUBSCRIPTION)} subscription. The SPV also pays a flat ${money(FEE_TERMS.flatPerSpv)}, disclosed in the memorandum. Nothing billed annually. No capital calls.`,
  };
}

function carrySplit(): SpotVisual {
  if (!SHOW_CARRY_TERMS) {
    return {
      kind: 'path',
      title: 'How an exit is paid out',
      steps: [
        { label: 'The position is sold', note: 'The SPV receives the proceeds.' },
        { label: 'Capital comes back first', note: 'Every member\'s invested capital, before any carry.' },
        { label: 'Profit is shared', note: 'Carried interest applies only above your capital. The rate is in the memorandum.', tone: 'gold' },
      ],
      otherwise: { label: 'No profit', note: 'No carry. Nothing is deducted while a position is held.' },
    };
  }
  const memberShare = 100 - CARRY_PERCENT;
  return {
    kind: 'split',
    title: 'Where a dollar of profit goes',
    segments: [
      { label: `To members, ${memberShare}%`, share: memberShare, tone: 'gold' },
      { label: `Carried interest, ${CARRY_PERCENT}%`, share: CARRY_PERCENT, tone: 'ember' },
    ],
    caption: 'Profit only: invested capital is returned in full first. No profit, no carry.',
  };
}

function fundingMeter(): SpotVisual {
  return {
    kind: 'meter',
    title: 'The funding bar',
    value: 62,
    fillLabel: 'Raised so far',
    marks: [
      { at: 50, label: 'Minimum to close', tone: 'gold' },
      { at: 100, label: 'Up to (allocation)', tone: 'quiet' },
    ],
    caption:
      'Illustrative. The deal closes once raised reaches the minimum by the closing date; past it, the round may fill up to the allocation.',
  };
}

function limitsMeter(): SpotVisual {
  return {
    kind: 'meter',
    title: 'Retirement money in one SPV',
    value: 12,
    fillLabel: 'IRA and 401(k) subscriptions',
    marks: [
      { at: RETIREMENT_WARN_PERCENT, label: `${RETIREMENT_WARN_PERCENT}% warns`, tone: 'warn' },
      { at: RETIREMENT_BLOCK_PERCENT, label: `${RETIREMENT_BLOCK_PERCENT}% refused`, tone: 'bad' },
    ],
    caption: `Illustrative. Members: ${INVESTOR_CAP_DEFAULT} per SPV, ${INVESTOR_CAP_MAX} for a qualifying venture fund. Past the cap, new members join the waitlist.`,
  };
}

function gatePath(): SpotVisual {
  return {
    kind: 'path',
    title: 'Before any deal is shown',
    steps: [
      { label: 'Investor questionnaire', note: 'Accreditation, experience, how you evaluate deals.' },
      { label: 'AltSpot reviews it', note: 'The approval date is when the relationship begins.' },
      { label: `Cooling off, ${COOLING_OFF_DAYS} days`, note: 'No offering is named or shown yet.', tone: 'warn' },
      { label: 'Offerings open', note: 'You may join deals that open after your date.', tone: 'good' },
    ],
  };
}

function spvPath(): SpotVisual {
  return {
    kind: 'path',
    title: 'What you are buying',
    steps: [
      { label: 'You', note: 'Subscribe for membership interests.' },
      { label: 'The SPV', note: 'One LLC, one investment, one line on the cap table. Organized and advised by AltSpot.', tone: 'gold' },
      { label: 'The company', note: 'The SPV holds the position on behalf of its members.' },
    ],
  };
}

function noCallsPath(): SpotVisual {
  return {
    kind: 'path',
    title: 'One payment, ever',
    steps: [
      { label: 'Subscribe once', note: 'Subscription plus the fee reserve, to escrow.' },
      { label: 'The SPV closes', note: 'Fully funded on day one.', tone: 'good' },
      { label: 'Nothing later', note: 'No capital calls, nothing billed annually.', tone: 'good' },
    ],
    otherwise: { label: 'A later round', note: 'Offered as a separate deal you can decline.' },
  };
}

function minimumsSum(): SpotVisual {
  return {
    kind: 'sum',
    title: 'The minimum, by vehicle size',
    rows: [
      { label: `Vehicles under ${money(MIN_INVESTMENT_SMALL_VEHICLE)}`, value: money(MIN_INVESTMENT_FLOOR), note: 'The platform floor.' },
      {
        label: `${money(MIN_INVESTMENT_SMALL_VEHICLE)} to ${money(MIN_INVESTMENT_LARGE_VEHICLE)}`,
        value: money(MIN_INVESTMENT_STANDARD),
        note: 'The standard.',
      },
      { label: `Vehicles over ${money(MIN_INVESTMENT_LARGE_VEHICLE)}`, value: money(MIN_INVESTMENT_LARGE) },
    ],
    total: { label: 'Set per offering by the lead', value: `From ${money(MIN_INVESTMENT_FLOOR)}` },
    caption: 'Every deal page states its own minimum, and checkout holds you to it.',
  };
}

function sleevePath(): SpotVisual {
  const pct = (bets: number) => Math.round(chanceOfAtLeastOne(bets) * 100);
  return {
    kind: 'path',
    title: 'How a diversified sleeve is built',
    steps: [
      { label: `${SLEEVE.minPercent}% to ${SLEEVE.maxPercent}% of investable assets`, note: 'The sleeve. The rest of a portfolio stays where it is.' },
      { label: `Deployed over about ${SLEEVE.deployYears} years`, note: 'Six or seven positions a year, not all at once.' },
      { label: `About ${SLEEVE.targetPositions} positions, equal weight`, note: `Around ${Math.round(100 / SLEEVE.targetPositions)}% of the sleeve each.`, tone: 'gold' },
      { label: `${SLEEVE.reserveMinPercent}% to ${SLEEVE.reserveMaxPercent}% kept back`, note: 'For follow-ons in the ones that break out.' },
    ],
    otherwise: {
      label: 'Why twenty',
      note: `At a one-in-twenty chance of a very large outcome per deal, 20 positions give a ${pct(20)}% chance of holding one; 10 give ${pct(10)}%; 5 give ${pct(5)}%. Illustrative arithmetic, not a forecast.`,
    },
  };
}

const BY_TOPIC: Record<string, () => SpotVisual> = {
  'minimum-investment': minimumsSum,
  'portfolio-construction': sleevePath,
  fees: feesSum,
  'carry-mechanics': carrySplit,
  'no-capital-calls': noCallsPath,
  'funding-window': escrowPath,
  'funding-methods': escrowPath,
  'after-funding': escrowPath,
  expiry: escrowPath,
  allocation: fundingMeter,
  'spv-limits': limitsMeter,
  'relationship-506b': gatePath,
  spv: spvPath,
};

/** The picture for a topic, or undefined when prose is the whole answer. */
export function visualFor(topicId: string): SpotVisual | undefined {
  return BY_TOPIC[topicId]?.();
}
