# ASCPlatform — AltSpot Capital investor platform

## What this is

A high-fidelity, fully clickable investor portal for AltSpot Capital: login →
accreditation & KYC setup → marketplace → deal → subscription document signing →
ACH funding → docs, profiles, settings.

**Right now it is a demo.** Logins accept anything, all money is fake, and every
third party (accreditation, KYC/AML/OFAC, Plaid, ACH, e-sign) is simulated.

**It is not throwaway code.** This is the foundation of an enterprise-grade
platform that will handle real securities transactions, real investor PII, and
real money. Write every line as if it ships to production, because the intent is
that most of it does.

## The standing rule

> Demo behaviour is confined to clearly marked seams. Everything else is written
> to production standard.

Concretely:

- **Never** scatter `if (demo)` through business logic. Demo behaviour lives
  behind `DEMO_MODE` in `lib/config.ts` and the seams it guards. Today that is
  exactly one place in `lib/auth.ts` (`authenticate`) plus the simulated
  third-party calls.
- **Never** trust the client. Every rule enforced in the UI is enforced again
  server-side. The invest gate, the state machine and ownership checks are all
  re-checked in route handlers — the UI versions are courtesies, not controls.
- **Never** store real PII. Taxpayer IDs keep last-4 plus a surrogate token. ID
  photos and selfies never leave the browser. Keep it that way when real
  integrations land: send to the vendor, retain the reference, not the data.
- **Always** go through the repository layer. Route handlers and pages do not
  call `prisma` directly for domain data — use `lib/repositories/*`. This is what
  makes the Postgres migration a datasource swap.
- **Always** audit state changes. Anything that would need books-and-records
  treatment calls `audit()` from `lib/audit.ts`.
- **Money is integer dollars.** No floats in the database. Fee math lives in
  `lib/fees.ts` and nowhere else, so the document, the checkout summary and the
  funding page can never disagree.

## Running it

```bash
npm run serve          # start on http://localhost:4000 (detached, auto-restarts)
npm run serve:restart  # restart
npm run serve:stop     # stop
npm run serve:status   # is it up?
npm run serve:logs     # tail the log
npm run db:reset       # wipe the database and re-seed the three deals
npm run typecheck      # tsc --noEmit
```

Port **4000** — not 3000 (in use by another project) and not 1000 (ports below
1024 require root on macOS, which breaks unattended start).

The server survives closing the terminal and restarts itself if Next crashes.
`node scripts/autostart.mjs install` additionally starts it at login;
`uninstall` removes it.

Sign in with **any email and any password**. An unknown email mints a new
investor with a seeded Meridian position so the dashboard looks lived-in.

## Architecture

```
app/
  page.tsx                  login (redirects if already signed in)
  wizard/                   5-step setup — own rail layout, outside the portal shell
  (portal)/                 everything behind auth; the layout enforces it
    dashboard/  marketplace/  deals/[id]/  deals/[id]/deck/
    invest/[dealId]/  payment/[id]/  docs/  profiles/  settings/
  api/                      the REST surface
  globals.css               THE design system — single source of visual truth

components/                 presentational components + client islands
lib/
  config.ts                 DEMO_MODE and every other production/demo switch
  domain.ts                 types, the subscription state machine, the invest gate
  fees.ts                   fee math (pure, isomorphic)
  format.ts                 money/date/mask helpers (pure, isomorphic)
  auth.ts                   sessions + credentials (server-only)
  audit.ts                  append-only audit trail
  http.ts                   route handler wrapper + validation helpers
  db.ts                     Prisma singleton
  repositories/             the ONLY place that touches domain tables
  client/api.ts             the ONLY place the browser calls fetch
prisma/
  schema.prisma             production-shaped; SQLite today, Postgres later
  seed.ts                   the three fictional deals
scripts/                    dev-server supervisor, db reset, optional autostart
legacy/                     the original static HTML demo, kept as visual reference
```

### Rendering split

Pages are **server components** that read through repositories, so numbers are
correct on first paint with no spinner. Interactivity lives in **client islands**
that mutate through `lib/client/api.ts`. Both paths exist deliberately — the REST
API is complete and inspectable on its own.

### The subscription state machine

```
started -> docs_signed -> funded -> accepted -> closed
exits:   expired (10-day funding window lapsed) | refunded | cut_back
```

Enforced by `assertTransition` in `lib/domain.ts`, called from
`lib/repositories/subscriptions.ts`. Illegal transitions return HTTP 409.

Two behaviours that are easy to get wrong:

- **Allocation is decremented at signature, not at funding** — signing is the
  moment the spot is actually reserved. It is returned on expiry and on cancel.
- **Expiry is swept on read**, not by a scheduler. Any authenticated read of a
  user's subscriptions lapses overdue commitments first. In production, move this
  to a job and keep the read-side sweep as a backstop.

## Design system

`app/globals.css` is ported verbatim from the original demo and is the single
source of visual truth: dark ink, gold identity, Cormorant Garamond display,
Archivo body, Spline Sans Mono for numbers.

**Add tokens to `:root` before introducing one-off values.** Components consume
these classes; they do not invent their own colours, radii or type scales. Inline
`style` is for layout one-offs only, never for colour.

## Product invariants

These are the claims the product makes. Do not let a change quietly break them.

- 5% platform fee · up to 2% admin reserve, **itemized**, unused remainder
  returned at close · 10% carry, 20% on AltSpot-led deals
- Collected **once at closing**. No annual fees. **No capital calls, ever.**
- Every deal shows **AltSpot's own committed capital**
- Signed documents file themselves into Docs automatically
- The Vault is captured once and pre-fills every document thereafter
- Accreditation is valid **five years**; the funding window is **10 days**
- SpotBot **explains, never advises** — every answer cites its provenance
- Secondaries is visible but disabled, pending a BD partner and counsel

## Deliberately out of scope

Liquidity/secondaries surfaces (legally gated), SPAN (discontinued), and the
public marketing site and application flow (the product starts at login).

## Oliphron (the CRM) — a first-class integration target

AltSpot's CRM, **Oliphron, runs on Supabase**, and ASCPlatform will need to talk
to it frequently. Treat that as a design constraint now, not a later problem.

What it means in practice:

- **The database will be Supabase Postgres**, not Neon or anything else. Two
  Postgres instances on the same platform can share a project, use foreign data
  wrappers, or at minimum share auth and networking conventions. Do not introduce
  a second database vendor.
- **Investor identity is the join key.** Oliphron already classifies people by
  `roles[]` (lp / operator / player), `platforms[]` (`ast` the newsletter, `asm`
  the marketplace), and tiers. An ASCPlatform investor is an Oliphron contact
  with `asm` in `platforms[]`. Keep a stable external identifier on `User` so the
  two sides can be reconciled — do not assume email is permanent.
- **The funnel is the product.** Oliphron's model is newsletter subscriber →
  marketplace member → invests in a deal. ASCPlatform owns the last two hops, so
  events like "account created", "accreditation verified", "subscription signed"
  and "subscription funded" are exactly what the CRM wants. `lib/audit.ts`
  already records all of them — it is the natural outbound feed.
- **Write integration behind an interface** in `lib/integrations/oliphron.ts`
  when the time comes. Do not let CRM concerns leak into the repositories.
- Oliphron writes are **live production with no undo**. Anything ASCPlatform
  pushes there must be idempotent and must never bulk-write without an explicit
  trigger.

## Going to production

1. `ASC_DEMO_MODE=false` — real credentials required; simulated calls refuse.
2. Implement real adapters in `lib/integrations/` for Parallel Markets, the KYC
   vendor, Plaid, Modern Treasury and Anvil.
3. Swap the datasource in `prisma/schema.prisma` to `postgresql` and the adapter
   in `lib/db.ts`. Repository call sites do not change.
4. Replace `lib/auth.ts` sessions with the chosen IdP.
5. Move expiry sweeping to a scheduled job.
6. Real tokenization for taxpayer IDs, replacing the `tinToken` stand-in.

## Known housekeeping

`npm audit` reports advisories in dev-only transitive dependencies (the eslint
chain and postcss). They are not in the runtime path. Clearing them forces an
eslint major upgrade — worth doing deliberately, not as a side effect.
