'use client';

/**
 * The investor's own saved deals.
 *
 * Four things per row and no more: what it is, what class it is, how
 * much of it is spoken for, and when it closes. The row briefly carried
 * five figures under the bar as well, and that was the wrong trade: the
 * amount left and the minimum are on the deal page one press away, and
 * reading them here turned a glance into a paragraph.
 *
 * The bar is the whole answer. It says whether waiting is still an
 * option, which is the only question a saved deal raises, and it goes
 * ember inside the last fortnight because at that point the date is the
 * story rather than the size.
 *
 * A REDACTED ROW SHOWS NONE OF IT. Deal detail is for verified
 * accredited investors, the repository withholds the package before it
 * reaches this component, and the discriminant is checked here rather
 * than trusted: `deal.redacted` narrows the type, so a figure that was
 * never sent cannot be printed by accident.
 *
 * Ordering is the investor's own, dragged, and stored per account.
 * app/api/watchlist/order is the authority and ignores any id they have
 * not saved.
 */
import { ArrowRight, CircleCheck, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import CompanyMark from '@/components/CompanyMark';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/client/api';
import {
  ACCREDITATION_STEP,
  type DealShelfItem,
  type DealView,
} from '@/lib/domain';
import { dateStr, daysLeft, money } from '@/lib/format';
import { fundingView } from '@/lib/funding';
import { ASSET_CLASSES, isAssetClass } from '@/lib/taxonomy';

import w from './WatchlistBlock.module.css';

/** Inside this many days the closing date stops being background. */
const CLOSING_SOON_DAYS = 14;

/** Move one item. The same primitive Your Radar uses. */
function moved<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Put a list back into a known sequence of ids. Used to undo. */
function applyOrder(list: DealShelfItem[], ids: string[]): DealShelfItem[] {
  return [...list].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export default function WatchlistBlock({
  deals,
  investedAmounts = {},
}: {
  deals: DealShelfItem[];
  /** What the member has in each watched deal they went on to join. */
  investedAmounts?: Record<string, number>;
}) {
  const toast = useToast();

  const [rows, setRows] = useState(deals);
  const membership = deals.map((d) => d.id).join(',');
  const seeded = useRef(membership);

  const [lifted, setLifted] = useState<string | null>(null);
  const saved = useRef<string[]>(deals.map((d) => d.id));
  /* Chained rather than parallel: three drags in a second, left to
     race, can finish out of order and store the stale one. */
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const handles = useRef(new Map<string, HTMLButtonElement | null>());

  useEffect(() => {
    if (seeded.current === membership) return;
    seeded.current = membership;
    saved.current = deals.map((d) => d.id);
    setRows(deals);
  }, [membership, deals]);

  if (rows.length === 0) {
    return (
      <div className={`card ${w.empty}`}>
        <p className={w.emptyLead}>Nothing on your watchlist yet.</p>
        <p className={w.emptyNote}>
          Save the deals you are weighing and they collect here.
        </p>
        <Link className="btn btn-primary btn-sm" href="/marketplace">
          Explore investments
        </Link>
      </div>
    );
  }

  function commit(next: DealShelfItem[]) {
    const order = next.map((d) => d.id);
    const previous = saved.current;
    if (order.join() === previous.join()) return;

    saved.current = order;
    writes.current = writes.current
      // An earlier failure has already been handled and reverted.
      .catch(() => {})
      .then(() => api.reorderWatchlist(order))
      .catch(() => {
        saved.current = previous;
        setRows((current) => applyOrder(current, previous));
        toast('That order did not save. Nothing else changed.');
      });
  }

  function onHandleKey(event: React.KeyboardEvent, index: number) {
    const to =
      event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : null;
    if (to === null) return;

    event.preventDefault();
    const next = moved(rows, index, to);
    if (next === rows) return;

    const id = rows[index].id;
    setRows(next);
    commit(next);
    requestAnimationFrame(() => handles.current.get(id)?.focus());
  }

  return (
    <div className="card">
      <div className={w.list}>
        {rows.map((deal, index) => {
          const klass = isAssetClass(deal.assetClass)
            ? ASSET_CLASSES[deal.assetClass]
            : null;

          return (
            <div
              key={deal.id}
              className={w.row}
              data-in={!deal.redacted && deal.youAreIn ? 'true' : undefined}
              data-lifted={lifted === deal.id}
              style={klass ? { ['--tint' as string]: klass.tint } : undefined}
              draggable
              onDragStart={(event) => {
                setLifted(deal.id);
                event.dataTransfer.effectAllowed = 'move';
                // Firefox refuses to start a drag with no payload.
                event.dataTransfer.setData('text/plain', deal.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => {
                if (!lifted || lifted === deal.id) return;
                setRows((current) => {
                  const from = current.findIndex((d) => d.id === lifted);
                  return moved(current, from, index);
                });
              }}
              onDrop={(event) => {
                event.preventDefault();
                setLifted(null);
                commit(rows);
              }}
              onDragEnd={(event) => {
                setLifted(null);
                if (event.dataTransfer.dropEffect === 'none') {
                  setRows((current) => applyOrder(current, saved.current));
                  return;
                }
                commit(rows);
              }}
            >
              <button
                type="button"
                className={w.handle}
                ref={(node) => {
                  handles.current.set(deal.id, node);
                }}
                onKeyDown={(event) => onHandleKey(event, index)}
                aria-label={`${deal.name}, number ${index + 1} on your watchlist. Use the arrow keys to move it.`}
              >
                <GripVertical size={14} strokeWidth={1.5} aria-hidden="true" />
              </button>

              <CompanyMark name={deal.name} logoUrl={deal.logoUrl} size={38} />

              <div className={w.body}>
                <div className={w.top}>
                  <b className={w.name}>{deal.name}</b>
                  {!deal.redacted && deal.youAreIn ? (
                    <span className={w.invested}>
                      <CircleCheck size={12} strokeWidth={2.1} aria-hidden="true" />
                      You invested
                      {investedAmounts[deal.id] ? ` ${money(investedAmounts[deal.id])}` : ''}
                    </span>
                  ) : null}
                  {klass ? <span className={w.klass}>{klass.label}</span> : null}
                  {deal.redacted ? null : <Closes deal={deal} />}
                </div>

                {deal.redacted ? (
                  <p className={w.locked}>
                    Terms, allocation and the minimum are withheld until your
                    accreditation is verified.
                  </p>
                ) : (
                  <Figures deal={deal} />
                )}
              </div>

              {deal.redacted ? (
                <Link
                  className="btn btn-quiet btn-sm"
                  href={`/wizard?step=${ACCREDITATION_STEP}&then=${deal.id}`}
                >
                  Finish accreditation
                </Link>
              ) : !deal.redacted && deal.youAreIn ? (
                <Link className={w.go} href="/portfolio">
                  Your position
                  <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              ) : (
                <Link className={w.go} href={`/deals/${deal.id}`}>
                  View deal
                  <ArrowRight size={12} strokeWidth={1.8} aria-hidden="true" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className={w.foot}>
        Drag to reorder. Saving a deal is private to you. It reserves no
        allocation, tells the issuer nothing, and is not an indication of
        interest.
      </p>
    </div>
  );
}

/**
 * How much of the deal is spoken for.
 *
 * The bar and nothing else. It carried a row of five figures under it,
 * which turned a glance into a paragraph: the percentage, the amount
 * left and the minimum are on the deal page, one press away, and none
 * of them changes the answer this section exists to give. The bar says whether waiting is still an
 * option, which is the only question a saved deal raises.
 */
function Figures({ deal }: { deal: DealView }) {
  /* Against the minimum to close, like every funding bar. */
  const pct = fundingView(deal).toMinimumPct;

  const days = daysLeft(deal.targetClose);

  return (
    <div
      className={w.bar}
      data-soon={days > 0 && days <= CLOSING_SOON_DAYS}
      role="img"
      aria-label={`${pct} percent of the minimum raised`}
    >
      <div className={w.fill} style={{ width: `${Math.max(2, pct)}%` }} />
    </div>
  );
}

/**
 * When it closes. The one figure that survived the cull, because it is
 * the only one that is about time rather than size, and a date nobody
 * saw is how an investor misses a deal they meant to take.
 */
function Closes({ deal }: { deal: DealView }) {
  const days = daysLeft(deal.targetClose);
  if (days <= 0) return <span className={w.closes}>Closed</span>;

  const soon = days <= CLOSING_SOON_DAYS;
  return (
    <span className={w.closes} data-soon={soon}>
      {soon ? `${days} days left` : `Closes ${dateStr(deal.targetClose)}`}
    </span>
  );
}
