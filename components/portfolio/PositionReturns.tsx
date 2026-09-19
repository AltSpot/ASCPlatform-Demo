"use client";

/**
 * How each position is doing, as a picture (Tyler, 2026-09-19).
 *
 * The ledger gives every position a row of figures; this gives each one a
 * bar, growing right from a zero line when it is up and left when it is
 * down, so a member reads the whole book in one look. Two ways to read
 * the same positions, because they answer different questions:
 *
 *   PERCENT   how well the position has done for its size. A small
 *             position that doubled leads.
 *   DOLLARS   what it did to the total. A large position that moved a
 *             little leads. (This is the old Contribution chart.)
 *
 * Gold is gain and ember is loss, the rule for every two-amount bar on
 * the platform. Losses are never omitted: the first thing an investor
 * looks for on a portfolio page is what went wrong. An exited position
 * says so, because its figure is settled rather than marked. Figures are
 * the ledger's own (total value over cost), so the chart and the table
 * cannot disagree.
 */
import { useState } from "react";

import CompanyMark from "@/components/CompanyMark";
import { money } from "@/lib/format";

import s from "./PositionReturns.module.css";

export interface PositionReturn {
  id: string;
  name: string;
  logoUrl: string | null;
  cost: number;
  /** Fair value plus everything returned. */
  totalValue: number;
  exited: boolean;
}

type Mode = "percent" | "dollars";

export default function PositionReturns({ rows }: { rows: PositionReturn[] }) {
  const [mode, setMode] = useState<Mode>("percent");
  if (rows.length === 0) return null;

  const measured = rows.map((row) => {
    const gain = row.totalValue - row.cost;
    return { ...row, gain, pct: row.cost > 0 ? (gain / row.cost) * 100 : 0 };
  });
  const ordered = [...measured].sort((a, b) =>
    mode === "percent" ? b.pct - a.pct : b.gain - a.gain,
  );
  const widest = Math.max(
    1,
    ...ordered.map((r) => Math.abs(mode === "percent" ? r.pct : r.gain)),
  );

  const net = measured.reduce((sum, r) => sum + r.gain, 0);
  const cost = measured.reduce((sum, r) => sum + r.cost, 0);
  const up = measured.filter((r) => r.gain > 0).length;
  const down = measured.filter((r) => r.gain < 0).length;
  /* At cost: in escrow or too new for a first mark. Flat, not a gain. */
  const flat = measured.length - up - down;

  return (
    <div className="card">
      <div className={s.head}>
        <div className={s.summary}>
          <span className={s.net} data-up={net >= 0}>
            {net >= 0 ? "+" : "−"}
            {money(Math.abs(net))}
            <small>
              {cost > 0
                ? ` ${net >= 0 ? "+" : "−"}${Math.abs((net / cost) * 100).toFixed(1)}%`
                : ""}
            </small>
          </span>
          <span className={s.split}>
            {up} up{down > 0 ? `, ${down} down` : ", none down"}
            {flat > 0 ? `, ${flat} not yet marked` : ""}
          </span>
        </div>

        <div className={s.modes} role="group" aria-label="Read the chart in">
          {(["percent", "dollars"] as Mode[]).map((key) => (
            <button
              key={key}
              type="button"
              className={s.mode}
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {key === "percent" ? "Percent" : "Dollars"}
            </button>
          ))}
        </div>
      </div>

      <ul className={s.rows}>
        {ordered.map((row) => {
          const size = Math.abs(mode === "percent" ? row.pct : row.gain);
          const width = (size / widest) * 50;
          const isUp = row.gain >= 0;
          const isFlat = row.gain === 0;
          const sign = isFlat ? "" : isUp ? "+" : "−";
          return (
            <li className={s.row} key={row.id}>
              <span className={s.who}>
                <CompanyMark name={row.name} logoUrl={row.logoUrl} size={28} />
                <span className={s.name}>
                  {row.name}
                  {row.exited ? (
                    <small>Exited</small>
                  ) : isFlat ? (
                    <small>At cost, not yet marked</small>
                  ) : null}
                </span>
              </span>

              <span
                className={s.track}
                role="img"
                aria-label={`${row.name}: ${isUp ? "up" : "down"} ${Math.abs(row.pct).toFixed(1)} percent, ${money(Math.abs(row.gain))}`}
              >
                <span className={s.zero} aria-hidden="true" />
                {isFlat ? null : (
                  <span
                    className={s.bar}
                    data-up={isUp}
                    style={
                      isUp
                        ? { left: "50%", width: `${Math.max(0.6, width)}%` }
                        : { right: "50%", width: `${Math.max(0.6, width)}%` }
                    }
                  />
                )}
              </span>

              <span className={s.figures} data-up={isUp} data-flat={isFlat}>
                <b>
                  {sign}
                  {mode === "percent"
                    ? `${Math.abs(row.pct).toFixed(1)}%`
                    : money(Math.abs(row.gain))}
                </b>
                <small>
                  {mode === "percent"
                    ? `${sign}${money(Math.abs(row.gain))}`
                    : `${sign}${Math.abs(row.pct).toFixed(1)}%`}
                </small>
              </span>
            </li>
          );
        })}
      </ul>

      <p className={s.foot}>
        Total value (the latest mark plus everything paid back) against what you
        put in. Marks are reported by each vehicle and are not a price you could
        sell at.
      </p>
    </div>
  );
}
