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
2. **Setup** — accreditation letter (downloaded, signed, uploaded, reviewed
   in-house, valid 5 years) → W-9 into the Vault → KYC (ID upload + live camera
   capture) → investment profile → bank link through a simulated Plaid Link.
   The last two are skippable.
3. **Dashboard** — portfolio value, positions, pending-funding countdowns
4. **Marketplace** — four curated deals, allocation bars, AltSpot's committed
   capital on every card
5. **Deal** — the whole pitch on one scrollable page: committed capital, the
   numbers, the story, the thesis, the trend, risk, terms, fees, data room
6. **Invest** — profile + amount, then a split-screen subscription agreement that
   fills itself in as you confirm three grouped questions; one typed signature
   executes everything
7. **Payment** — ACH now, or hold the spot for 10 days
8. **Docs / Profiles / Settings** — filed agreements, the Vault, demo reset

**SpotBot** rides along the whole way, in a dock that knows which page you are
on. It explains and never advises: the refusal gate runs server-side, before any
answer is produced.

To see the expiry state, sign a commitment and leave it unfunded past its
deadline — or use **Settings → Reset demo data** to start over.

## Economics shown in the product

- **One 5% management fee**, charged **once at closing**. Not annual.
- **10% carried interest** on profits at exit, on every deal.
- Nothing else. No annual fees, no capital calls, ever.

`lib/fees.ts` is the only place this math lives, so the deal page, the checkout
summary, the subscription agreement and the funding page cannot disagree.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 · SQLite

See [CLAUDE.md](./CLAUDE.md) for architecture, conventions, the subscription
state machine, and the path to production.

## Status

Demo environment. All companies are fictional, all money is simulated, and every
third-party integration is stubbed. The code is written to production standard —
demo behaviour is confined to marked seams behind `ASC_DEMO_MODE`.

Not an offer of securities.
