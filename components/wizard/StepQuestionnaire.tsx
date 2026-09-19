'use client';

/**
 * Step 1 — the investor questionnaire.
 *
 * AltSpot offerings are made under Rule 506(b). Before a member sees any
 * offering, the platform establishes a relationship with them: this
 * questionnaire on accreditation basis, investment experience and
 * financial sophistication, evaluated by AltSpot, then a cooling-off
 * period. Accreditation is self-certified. There is no letter to get
 * signed and nothing to upload.
 *
 * The questions render from lib/relationship.ts and the server validates
 * and evaluates with the same definitions, so what qualifies is decided
 * there and only displayed here.
 *
 * Once the relationship exists the form does not come back: the date it
 * was established anchors every eligibility decision after it. The step
 * shows where the member stands instead.
 */
import { useState, type KeyboardEvent } from 'react';

import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';
import type { WizardView } from '@/lib/domain';
import { dateStr } from '@/lib/format';
import {
  ACKNOWLEDGEMENTS,
  BASIS_OPTIONS,
  EVALUATION_OPTIONS,
  PRIVATE_DEAL_OPTIONS,
  STAGE_LABEL,
  YEARS_OPTIONS,
  type AcknowledgementKey,
  type QuestionOption,
  type QuestionnaireAnswers,
} from '@/lib/relationship';

interface Draft {
  basis: string | null;
  privateDeals: string | null;
  yearsInvesting: string | null;
  evaluates: string | null;
  acknowledgements: Record<AcknowledgementKey, boolean>;
}

const EMPTY_DRAFT: Draft = {
  basis: null,
  privateDeals: null,
  yearsInvesting: null,
  evaluates: null,
  acknowledgements: { loss: false, illiquid: false, no_advice: false },
};

export default function StepQuestionnaire({
  wizard,
  onComplete,
}: {
  wizard: WizardView;
  onComplete: (next: WizardView) => void;
}) {
  const toast = useToast();

  const [view, setView] = useState<WizardView>(wizard);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);

  const { stage, unlocksAt } = view.relationship;
  const answering = stage === 'questionnaire' || stage === 'declined';

  const complete =
    draft.basis !== null &&
    draft.privateDeals !== null &&
    draft.yearsInvesting !== null &&
    draft.evaluates !== null &&
    ACKNOWLEDGEMENTS.every((ack) => draft.acknowledgements[ack.key]);

  async function submit() {
    if (busy || !complete) return;
    setBusy(true);
    try {
      const next = await api.submitQuestionnaire(draft as QuestionnaireAnswers);
      setView(next);
      toast(
        next.relationship.stage === 'cooling_off' || next.relationship.stage === 'eligible' ? (
          <>
            <b>Questionnaire approved.</b> Your relationship with AltSpot starts today.
          </>
        ) : next.relationship.stage === 'under_review' ? (
          'Questionnaire received. An AltSpot team member will be in touch.'
        ) : (
          'Questionnaire received.'
        ),
      );
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Could not save your answers. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const basisLabel = BASIS_OPTIONS.find((o) => o.key === view.accreditation.basis)?.label;

  return (
    <>
      <div className="eyebrow">Step 1 of 5</div>
      <h2 className="display" style={{ margin: '10px 0 12px' }}>
        Investor questionnaire
      </h2>
      <p className="sub" style={{ marginBottom: 24 }}>
        Offerings on AltSpot are private placements under SEC Rule 506(b). Before you
        see one, we get to know you: how you meet the accredited investor standard,
        your experience, and how you evaluate a private deal. Offerings open the
        moment your answers are approved, and you may join deals that open after
        that date.
      </p>

      {!answering && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              className={
                stage === 'eligible' ? 'chip good' : stage === 'under_review' ? 'chip neutral' : 'chip'
              }
            >
              <span className="dot" />
              {STAGE_LABEL[stage]}
            </span>
            {view.relationship.establishedAt && (
              <span className="tiny">
                Approved {dateStr(view.relationship.establishedAt)}
              </span>
            )}
          </div>

          <h3 style={{ marginTop: 14 }}>
            {stage === 'cooling_off'
              ? `Offerings open to you on ${dateStr(unlocksAt)}.`
              : stage === 'eligible'
                ? 'Offerings are open to you.'
                : 'Your questionnaire is under review.'}
          </h3>
          <p className="small" style={{ marginTop: 6 }}>
            {stage === 'cooling_off'
              ? 'Keep going with setup in the meantime. Your information, identity and bank will be ready the day offerings open.'
              : view.accreditation.reason}
          </p>
          {basisLabel && (
            <p className="tiny" style={{ marginTop: 12 }}>
              Certified basis · {basisLabel}
            </p>
          )}
        </div>
      )}

      {answering && (
        <>
          {stage === 'declined' && view.accreditation.reason && (
            <div className="demo-note" style={{ marginBottom: 16 }}>
              {view.accreditation.reason}
            </div>
          )}

          <Section kicker="1 · Accreditation basis" title="How do you meet the accredited investor standard?">
            <Choices
              label="Accreditation basis"
              options={BASIS_OPTIONS}
              value={draft.basis}
              onChange={(basis) => setDraft((d) => ({ ...d, basis }))}
            />
          </Section>

          <Section kicker="2 · Investment experience" title="What have you invested in before?">
            <p className="small" style={{ marginBottom: 10 }}>
              Private company investments in the last five years.
            </p>
            <Choices
              label="Private company investments"
              options={PRIVATE_DEAL_OPTIONS}
              value={draft.privateDeals}
              onChange={(privateDeals) => setDraft((d) => ({ ...d, privateDeals }))}
            />
            <p className="small" style={{ margin: '18px 0 10px' }}>
              How long you have been investing.
            </p>
            <Choices
              label="Years investing"
              options={YEARS_OPTIONS}
              value={draft.yearsInvesting}
              onChange={(yearsInvesting) => setDraft((d) => ({ ...d, yearsInvesting }))}
            />
          </Section>

          <Section kicker="3 · Financial sophistication" title="How do you evaluate a private deal?">
            <Choices
              label="How you evaluate private deals"
              options={EVALUATION_OPTIONS}
              value={draft.evaluates}
              onChange={(evaluates) => setDraft((d) => ({ ...d, evaluates }))}
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {ACKNOWLEDGEMENTS.map((ack) => (
                <label className="check" key={ack.key}>
                  <input
                    type="checkbox"
                    checked={draft.acknowledgements[ack.key]}
                    onChange={(event) =>
                      setDraft((d) => ({
                        ...d,
                        acknowledgements: {
                          ...d.acknowledgements,
                          [ack.key]: event.target.checked,
                        },
                      }))
                    }
                  />
                  <span>{ack.label}</span>
                </label>
              ))}
            </div>
          </Section>

          <p className="tiny" style={{ marginTop: 4 }}>
            Your answers and the date you gave them are kept as AltSpot&rsquo;s record of
            your eligibility. AltSpot may ask follow-up questions before offerings open.
          </p>
        </>
      )}

      <div className="wiz-actions">
        {answering ? (
          <>
            <button className="btn btn-primary" disabled={!complete || busy} onClick={submit}>
              {busy ? 'Saving…' : 'Submit questionnaire'}
            </button>
            <span className="tiny">
              {complete ? 'Ready to submit.' : 'Answer every question to continue.'}
            </span>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => onComplete(view)}>
            Continue setup
          </button>
        )}
      </div>
    </>
  );
}

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="kicker">{kicker}</div>
      <h3 style={{ margin: '8px 0 14px' }}>{title}</h3>
      {children}
    </div>
  );
}

/** A single-choice question as cards. A radio group to assistive tech. */
function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly QuestionOption[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  function onKey(event: KeyboardEvent<HTMLDivElement>, key: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange(key);
    }
  }

  return (
    <div className="choice-grid" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <div
          key={option.key}
          className={value === option.key ? 'choice sel' : 'choice'}
          role="radio"
          aria-checked={value === option.key}
          tabIndex={0}
          onClick={() => onChange(option.key)}
          onKeyDown={(event) => onKey(event, option.key)}
        >
          <b>{option.label}</b>
          <span>{option.detail}</span>
        </div>
      ))}
    </div>
  );
}
