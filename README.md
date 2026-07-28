# ASCPlatform

The AltSpot Capital investor platform — a high-fidelity, fully clickable
walkthrough of the whole investor journey, backed by a real database and a real
API.

## Quick start

```bash
npm install
npm run setup     # generate client, apply migrations, seed the three deals
npm run serve     # http://localhost:4000
```

Sign in with **any email and any password**. There is nothing to look up: an
unknown email creates the investor on the spot, seeded with a closed Meridian
position so the dashboard has history.

### Day-to-day

| Command | What it does |
| --- | --- |
| `npm run serve` | Start on :4000, detached, auto-restarting |
| `npm run serve:restart` | Restart |
| `npm run serve:stop` | Stop |
| `npm run serve:status` | Is it up? |
| `npm run serve:logs` | Tail the log |
| `npm run db:reset` | Wipe everything, re-seed the deals |
| `npm run typecheck` | `tsc --noEmit` |

The server keeps running after you close the terminal and restarts itself if it
crashes. To have it start when you log in to macOS:

```bash
node scripts/autostart.mjs install     # and `uninstall` to undo
```

## The walkthrough

1. **Login** → first-time setup
2. **Setup** — accreditation letter (Parallel Markets handoff, valid 5 years) →
   W-9 into the Vault → KYC (ID upload + live camera capture) → investment
   profile → bank link. The last two are skippable.
3. **Dashboard** — portfolio value, positions, pending-funding countdowns
4. **Marketplace** — three curated deals, allocation bars, AltSpot's committed
   capital on every card
5. **Deal** — thesis, metric chart, risk, itemized fees, data room, SpotBot
6. **Invest** — profile + amount, then a split-screen subscription agreement that
   fills itself in as you confirm three grouped questions; one typed signature
   executes everything
7. **Payment** — ACH now, or hold the spot for 10 days
8. **Docs / Profiles / Settings** — filed agreements, the Vault, demo reset

To see the expiry state, sign a commitment and leave it unfunded past its
deadline — or use **Settings → Reset demo data** to start over.

## Economics shown in the product

- 5% platform fee
- Up to 2% admin reserve, itemized per deal (SPV formation & legal, fund
  administration, tax prep & K-1s, banking/escrow/compliance) — **unused
  remainder returned to investors at close**
- 10% carry standard · 20% on AltSpot-led deals
- Collected once at closing. No annual fees. No capital calls, ever.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 · SQLite

See [CLAUDE.md](./CLAUDE.md) for architecture, conventions, the subscription
state machine, and the path to production.

## Status

Demo environment. All companies are fictional, all money is simulated, and every
third-party integration is stubbed. The code is written to production standard —
demo behaviour is confined to marked seams behind `ASC_DEMO_MODE`.

Not an offer of securities.
