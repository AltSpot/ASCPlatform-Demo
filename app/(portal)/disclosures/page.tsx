/**
 * Disclosures, in one place (Tyler, 2026-09-19, institutional polish).
 *
 * Every statement here already appears on the surface it belongs to; this
 * page gathers them so the footer has somewhere to point. It introduces no
 * new claim: fee wording is lib/fees.ts, the scenario disclaimer is
 * lib/scenarios.ts, and the rest restates the product invariants in
 * CLAUDE.md. Counsel reviews this page as a whole before launch.
 */
import Link from 'next/link';

import { requireUser } from '@/lib/auth';
import {
  DEMO_MODE,
  ESCROW_WINDOW_DAYS,
  SHOW_FEE_TERMS,
  SHOW_RETURN_SCENARIOS,
} from '@/lib/config';
import {
  ESCROW_INTEREST_LINE,
  NOT_A_PERCENT_OF_RAISE,
  feeSentence,
} from '@/lib/fees';
import { SCENARIO_DISCLAIMER } from '@/lib/scenarios';

import s from './Disclosures.module.css';

export const metadata = { title: 'Disclosures · AltSpot Capital' };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What is offered here, and to whom',
    body: [
      'Each investment on AltSpot is a private placement in a single-purpose vehicle, offered under Rule 506(b) of Regulation D. Offerings are shown only to members whose investor questionnaire AltSpot has evaluated and approved, and a member may subscribe only to offerings that open after that approval.',
      'Accreditation is a self-certification. You are responsible for the accuracy of your answers, and AltSpot relies on them.',
      'Nothing on this platform is an offer to the public, and no offering is named outside a signed-in session.',
    ],
  },
  {
    title: 'Risk',
    body: [
      'Private investments are illiquid. There is no market for an interest in a vehicle, transfers are restricted, and you should expect to hold a position until the underlying company is sold, lists, or fails. You can lose the whole amount you invest.',
      'Early-stage outcomes are skewed: most positions return little or nothing and a small number account for most of the result. Diversification reduces this risk and does not remove it.',
    ],
  },
  {
    title: 'Fees and expenses',
    /* The platform's own sentence, so the fee and carry switches decide
       what is named here exactly as they do everywhere else. */
    body: [feeSentence(), NOT_A_PERCENT_OF_RAISE],
  },
  {
    title: 'Escrow',
    body: [
      'A subscription is sent to an escrow account in the name of the vehicle, never to an AltSpot account. A deal closes when its minimum is met by its closing date; if it is not, escrow returns subscriptions in full.',
      /* The fee sentence already says this while fee terms are shown. */
      ...(SHOW_FEE_TERMS ? [] : [ESCROW_INTEREST_LINE]),
      `Once you sign, you have ${ESCROW_WINDOW_DAYS} days to send your subscription to escrow. After that it lapses, nothing is charged, and the allocation is released to other members.`,
    ],
  },
  {
    title: 'Valuations and performance figures',
    body: [
      'Fair value is the latest mark reported by each vehicle. Marks are unaudited, are updated periodically rather than continuously, and are not prices at which a position could be sold.',
      'Multiples and IRR on your portfolio describe your own positions to date. Past results do not predict future results.',
      'Holdings you enter under Held elsewhere are self-reported, are not verified by AltSpot, and are excluded from every AltSpot total.',
    ],
  },
  /* Scenarios exist only behind their switch, and so does their notice. */
  ...(SHOW_RETURN_SCENARIOS
    ? [{ title: 'Illustrative scenarios', body: [SCENARIO_DISCLAIMER] }]
    : []),
  {
    title: 'The Radar, Spot and the Terminal',
    body: [
      'A Radar vote is an expression of interest. It is not a commitment, reserves nothing, and does not oblige AltSpot to source a deal or you to invest in one.',
      'Spot explains how the platform and its documents work. It does not give investment, legal or tax advice, and it will not tell you whether or how much to invest.',
      'Terminal articles, reports and podcasts are education. They are not research on any offering and recommend no action.',
    ],
  },
  {
    title: 'Conflicts of interest',
    body: [
      'AltSpot organizes and advises each vehicle and is paid the fees described above, so it benefits when a vehicle closes. The offering documents for each deal describe the conflicts specific to it.',
    ],
  },
];

export default async function DisclosuresPage() {
  await requireUser();

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="eyebrow">Legal</div>
          <h1 className="display">Disclosures.</h1>
          <p className="sub">
            Everything the platform says about risk, fees and figures, gathered in one place. The
            offering documents for each deal govern; where this page and a document differ, the
            document wins.
          </p>
        </div>
        <Link className="btn btn-ghost" href="/docs">
          Your documents
        </Link>
      </div>

      <div className={s.list}>
        {SECTIONS.map((section, index) => (
          <section className={`card ${s.item}`} key={section.title}>
            <span className={s.index}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2 className={s.title}>{section.title}</h2>
              {section.body.map((line) => (
                <p className={s.body} key={line}>
                  {line}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {DEMO_MODE ? (
        <p className={s.demo}>
          Demo environment. Every company, term and figure on this platform is invented, and this
          page has not yet been reviewed by counsel.
        </p>
      ) : null}
    </>
  );
}
