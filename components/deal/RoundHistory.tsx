/**
 * Priced-round history.
 *
 * Deliberately steps, not a line chart. A private company has no
 * continuously traded price: the valuation is only observable at a priced
 * round, and drawing a smooth curve between two of them would imply
 * marks, and a liquidity, that do not exist. Each entry here is a real
 * priced event.
 *
 * The multiple between the first and current round is the honest version
 * of "how the stock has climbed".
 */
import type { FundingRound } from '@/lib/domain';

import Section from './Section';
import s from './Deal.module.css';

/** Parse "$11,000,000" or "$5.5M" into a number, for the step arithmetic. */
function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, '');
  const match = cleaned.match(/^([\d.]+)([MBK]?)$/i);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  const scale = { K: 1e3, M: 1e6, B: 1e9 }[match[2]?.toUpperCase() ?? ''] ?? 1;
  return value * scale;
}

export default function RoundHistory({ rounds }: { rounds: FundingRound[] }) {
  if (rounds.length < 2) return null;

  const first = parseMoney(rounds[0].preMoney);
  const last = parseMoney(rounds[rounds.length - 1].preMoney);
  const step = first && last && first > 0 ? last / first : null;

  const max = Math.max(
    ...rounds.map((r) => parseMoney(r.preMoney) ?? 0),
    1,
  );

  return (
    <Section
      eyebrow="Round history"
      title="How the price has moved."
      id="rounds"
    >
      <p className={s.sectionLede}>
        Private valuations move in steps, not curves. Each bar is a priced round,
        not a mark.
        {step && (
          <>
            {' '}
            Pre-money is{' '}
            <b style={{ color: 'var(--orange-b)' }}>{step.toFixed(1)}x</b> the first
            round shown.
          </>
        )}
      </p>

      <div className={s.rounds}>
        {rounds.map((round) => {
          const value = parseMoney(round.preMoney) ?? 0;
          const pct = Math.max(6, Math.round((value / max) * 100));

          return (
            <div
              key={round.round}
              className={round.current ? `${s.round} ${s.roundNow}` : s.round}
            >
              <div className={s.roundHead}>
                <span className={s.roundName}>{round.round}</span>
                <span className={s.roundDate}>{round.date}</span>
              </div>

              <div className={s.roundBarTrack}>
                <div className={s.roundBar} style={{ width: `${pct}%` }} />
              </div>

              <div className={s.roundFacts}>
                <span className={s.roundValue}>{round.preMoney}</span>
                <span className={s.roundPps}>
                  {round.pricePerShare ?? 'Price per share not disclosed'}
                </span>
              </div>

              {round.note && <div className={s.roundNote}>{round.note}</div>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
