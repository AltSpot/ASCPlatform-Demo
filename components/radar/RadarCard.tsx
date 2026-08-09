'use client';

/**
 * One Radar company, with the ask attached.
 *
 * Client island because the whole point is that indicating interest
 * feels instant: type an amount, press once, the card settles into its
 * confirmed state and the tally moves. No navigation, no reload.
 *
 * The server is the authority on every rule enforced here. The minimum,
 * the maximum and the slug are all re-checked in
 * app/api/radar/interest/route.ts. What this component does is spare
 * the member a round trip to be told something obvious.
 */
import { useState } from 'react';

import { useToast } from '@/components/Toast';
import { api, ApiError } from '@/lib/client/api';
import { money } from '@/lib/format';
import {
  MAX_INDICATION,
  priceFromCents,
  valuationShort,
  type RadarCompanyView,
} from '@/lib/terminal/radar';

import s from './Radar.module.css';

/** Initials for the monogram: "Anduril Industries" becomes AI. */
function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** $9.6M, $412K, $9,640. Compact enough for a one-line tally. */
function compactDollars(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions >= 100 ? Math.round(millions) : millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 10_000) return `$${Math.round(value / 1000)}K`;
  return money(value);
}

export default function RadarCard({
  company,
  /** This company's share of the loudest demand on the board, 0 to 1. */
  demandShare,
}: {
  company: RadarCompanyView;
  demandShare: number;
}) {
  const toast = useToast();

  const [view, setView] = useState(company);
  const [amount, setAmount] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = view.yourAmount !== null && !editing;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    const parsed = Math.round(Number(amount.replace(/[^0-9.]/g, '')));

    if (!Number.isFinite(parsed) || parsed < view.minIndication) {
      setError(`Minimum ${money(view.minIndication)}`);
      return;
    }
    if (parsed > MAX_INDICATION) {
      setError(`Maximum ${money(MAX_INDICATION)}`);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const next = await api.indicateRadarInterest(view.slug, parsed);
      setView(next);
      setEditing(false);
      setAmount('');
      toast(
        <>
          Noted. <b>{view.name}</b> now shows your interest.
        </>,
      );
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : 'Could not save that. Try again.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.card} data-indicated={view.yourAmount !== null}>
      <div className={s.head}>
        <div className={s.mark} aria-hidden="true">
          {monogram(view.name)}
        </div>
        <div>
          <div className={s.name}>{view.name}</div>
          <div className={s.sector}>{view.sector}</div>
        </div>
      </div>

      <p className={s.about}>{view.description}</p>

      <div className={s.figures}>
        <div className={s.figure}>
          <span className={s.figureKey}>Market average</span>
          <span className={s.figureValue}>
            {priceFromCents(view.marketAverageCents)}
            <small>{view.marketAverageAsOf}</small>
          </span>
        </div>
        <div className={s.figure}>
          <span className={s.figureKey}>Last round</span>
          <span className={s.figureValue}>
            {valuationShort(view.lastRoundValuation)}
            <small>{view.lastRoundLabel}</small>
          </span>
        </div>
        <div className={`${s.figure} ${s.target}`}>
          <span className={s.figureKey}>AltSpot target</span>
          <span className={s.figureValue}>
            {priceFromCents(view.targetLowCents)} to {priceFromCents(view.targetHighCents)}
            <small>Per share, if we source it</small>
          </span>
        </div>
      </div>

      <div className={s.demand}>
        <div className={s.demandBar}>
          <div
            className={s.demandFill}
            style={{ width: `${Math.max(6, Math.round(demandShare * 100))}%` }}
          />
        </div>
        <div className={s.demandLine}>
          <span>
            <b>{view.interestInvestors.toLocaleString('en-US')}</b> indicated
          </span>
          <span>
            <b>{compactDollars(view.interestDollars)}</b> behind it
          </span>
        </div>
      </div>

      <div className={s.ask}>
        {confirmed ? (
          <div className={s.done}>
            <span className={s.doneText}>
              You indicated <b>{money(view.yourAmount ?? 0)}</b>
            </span>
            <button
              type="button"
              className={s.change}
              onClick={() => {
                setAmount(String(view.yourAmount ?? ''));
                setEditing(true);
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className={s.askRow}>
              <div className={s.amountWrap}>
                <span className={s.currency}>$</span>
                <input
                  className={s.amount}
                  type="number"
                  inputMode="numeric"
                  min={view.minIndication}
                  max={MAX_INDICATION}
                  step={1000}
                  value={amount}
                  placeholder={String(view.minIndication)}
                  aria-label={`Amount you would put behind ${view.name}`}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>
              <button className="btn btn-gold btn-sm" type="submit" disabled={busy}>
                {busy ? 'Saving' : view.yourAmount === null ? 'Indicate' : 'Update'}
              </button>
            </div>
            <div className={s.hint} data-error={error !== null}>
              {error ?? `Minimum ${money(view.minIndication)}. Not a commitment.`}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
