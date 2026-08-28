# ASCPlatform — AltSpot Capital investor platform

## What this is

A high-fidelity, fully clickable investor portal for AltSpot Capital: login →
accreditation & KYC setup → marketplace → deal → subscription document signing →
ACH funding → docs, profiles, settings.

**Right now it is a demo.** Logins accept anything, all money is fake, and every
third party (accreditation review, KYC/AML/OFAC, Plaid, ACH, e-sign) is
simulated. SpotBot answers from a local knowledge base, not a model.

**It is not throwaway code.** This is the foundation of an enterprise-grade
platform that will handle real securities transactions, real investor PII, and
real money. Write every line as if it ships to production, because the intent is
that most of it does.

## The standing rule

> Demo behaviour is confined to clearly marked seams. Everything else is written
> to production standard.

Concretely:

- **Never** scatter `if (demo)` through business logic. Demo behaviour lives
  behind `DEMO_MODE` in `lib/config.ts` and the seams it guards: `authenticate`
  in `lib/auth.ts`, the simulated third-party calls, and the accreditation
  upload route that collapses the reviewer step. `components/wizard/
  PlaidDemoModal.tsx` is the one whole-file stand-in — it mimics Plaid Link and
  hands back the same contract the real Link callback provides, so it deletes
  cleanly. Every seam carries a `DEMO SEAM` comment.
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
- **Everything for this product lives in this repo.** Components, assets, pages,
  documents and experiments are created here, never in outside folders. The old
  `altspot-portal` static demo is retired and deleted; the running app is its
  own visual reference.
- **Real companies appear only as clearly illustrative deals.** The lead deal,
  Calder Grid, is an invented company whose deal package mirrors the shape of a
  real one. Per Ryan's direction (2026-08-11), the shelf also carries the
  AltSpot Growth Fund and two real-company secondaries, OpenAI and Databricks,
  with their real logos. Every term shown for them (price, discount,
  allocation, AltSpot's position) is invented demo data, the marketplace
  disclaimer says so, and nothing may present those terms as actual offerings
  or actual positions. Still no claims about named real competitors in
  editorial copy.

## Running it

```bash
npm run serve          # start on http://localhost:4000 (detached, auto-restarts)
npm run serve:restart  # restart
npm run serve:stop     # stop
npm run serve:status   # is it up?
npm run serve:logs     # tail the log
npm run db:reset       # wipe the database and re-seed the four deals
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
    dashboard/  marketplace/  deals/[id]/  invest/[dealId]/
    payment/[id]/  docs/  profiles/  settings/
    deals/[id]/deck/        permanent redirect; the deck IS the deal page now
  api/                      the REST surface, including /api/spotbot
  globals.css               THE design system (V18), single source of visual truth

components/                 presentational components + client islands
  deal/                     the deal page sections + Deal.module.css
  invest/                   the split-screen subscription flow
  spotbot/                  the portal-wide SpotBot dock
  wizard/                   the 5 setup steps, including the Plaid stand-in
lib/
  config.ts                 DEMO_MODE, PARTNERS, and every production/demo switch
  domain.ts                 types, the subscription state machine, the invest gate
  fees.ts                   fee math (pure, isomorphic)
  format.ts                 money/date/mask helpers (pure, isomorphic)
  subscription-sections.ts  the subscription document, defined once
  spotbot/                  gate, knowledge, page contexts, answer engine
  auth.ts                   sessions + credentials (server-only)
  audit.ts                  append-only audit trail
  http.ts                   route handler wrapper + validation helpers
  db.ts                     Prisma singleton
  repositories/             the ONLY place that touches domain tables
  client/api.ts             the ONLY place the browser calls fetch
prisma/
  schema.prisma             production-shaped; SQLite today, Postgres later
  seed.ts                   four deals, Calder Grid leading
scripts/                    dev-server supervisor, db reset, optional autostart
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

### The deal page

One scrollable narrative, not an overview plus a deck. `components/deal/*`
renders it in a fixed order so deals compare like for like: hero, AltSpot's
committed capital, the stat band, the story chapters, the thesis, the trend
chart, risk, terms, the two fees, the data room, the ask. Every section returns
`null` when its content is missing, because the deals behind the lead carry far
thinner editorial than Calder. `/deals/[id]/deck` is a permanent redirect
kept only so old links land somewhere sensible.

### The subscription document

`lib/subscription-sections.ts` defines the agreement once. The confirmation
panels, the live document pane, `/api/subscriptions/[id]/confirm` validation and
the sign endpoint's completeness check all read it, so a section cannot exist in
the UI and be missing from the executed text. Two of the six sections are
selections of fact (accredited investor category, benefit plan status) and
record *which* option was chosen, not merely that the panel was seen. `covers`
names the clauses each panel discharges so counsel can audit the mapping without
reading a component.

### Spot

**The guide is called Spot in every surface a member reads.** The code keeps the
`SpotBot*` identifiers, the `components/spotbot/` and `lib/spotbot/` paths and
the `/api/spotbot` route: renaming them moves the API surface and the tests for
no user-visible gain, and `lib/spotbot/` is the seam a real model drops into.
When you add copy, it is Spot. When you add code, match the file you are in.

A portal-wide dock (`components/spotbot/`), mounted once in the portal shell so
the conversation survives client navigation. It reads the pathname, which is
what makes the greeting, the brief and the suggested questions match the page.

`lib/spotbot/gate.ts` is the part that matters: it classifies the question and
refuses **before** the answer engine is called, so the "explains, never advises"
line holds no matter what later produces the answers. `engine.ts` retrieves from
`knowledge.ts` today and is the single function to replace when a model goes in.
Every answer carries a `source`, and the API route is authenticated like
everything else. `components/SpotBot.tsx` is the separate per-deal Q&A card.

## Design system

`app/globals.css` is the single source of visual truth. AltSpot Capital
Brand Identity **V18** (Aug 2026), ported from the design-system handoff.
Canonical token names are `--as-*`; the older short names (`--bg`, `--ink`,
`--orange`, `--r`, `--fd`) survive as aliases retargeted onto them, so
existing markup keeps resolving. Prefer `--as-*` in new code.

- **Borna** (`--font-display`) for display type. **Figtree**
  (`--font-sans`) for body and UI, 300 is the body default on dark.
  **JetBrains Mono** (`--font-mono`) for every eyebrow, label, table
  header, source line and data figure, always uppercase and
  letter-spaced. If the eyebrow is not monospace, it is not AltSpot.
- **This product is the Capital line, so gold `--as-gold` #C79A4B leads.**
  V18 assigns one signal per product line and forbids mixing two in a
  composition: Terminal #F39807, Marketplace/Intelligence #E5661A,
  Capital #C79A4B. Signal orange stays **functional** (focus rings, live
  indicators) via `--accent-signal`; hot amber #FF9E2C is hover and key
  numerals via `--accent-hot`; champagne #E6C77A is the quiet layer.
  The orb stays gold, always. The CTA gradient is gold to signal.
- **Pill geometry.** Interactive controls (buttons, nav, chips, badges,
  segmented controls) are `--r-pill` 100px. Cards `--r-lg` 20px, system
  cards 22px, modals `--r-2xl` 24px, inputs `--r-md` 10px, media frames
  `--r-frame` 18px. **Nothing between 24px and pill.**
- **The wordmark period is the orb** (`--as-orb-period`), not a square.
- **Icons are Lucide**, 1.5px stroke, `currentColor`. No emoji, no unicode
  glyph icons. The → arrow in buttons and links is text, not an icon.
- **No em dashes in copy.** Commas, periods, or restructure. En dash is
  fine for numeric ranges. `EMPTY` in `lib/format.ts` is an en dash so a
  writer never has to reach for one, and tests enforce all of this.
- **No blue, green or purple** in brand chrome. The one exception is the
  asset-class taxonomy: `--as-cat-secondary`, `--as-cat-realasset`,
  `--as-cat-violet`, `--as-cat-info`, carried over from the V18 deck.
  Category tints only. Never CTAs, focus, or navigation.

### The four primitives

`components/ui/` holds Button, Card, Eyebrow and Orb, ported from the
handoff's `.d.ts` contracts. Import from `@/components/ui`. Anything built
from them inherits pill geometry, the type ladder and accent discipline
for free. Reach for these before writing a new one-off control.

**Add tokens to `:root` before introducing one-off values.** Components consume
these classes; they do not invent their own colours, radii or type scales. Inline
`style` is for layout one-offs only, never for colour or type. A component that
genuinely needs new rules gets a CSS Module beside it (`components/deal/`,
`components/spotbot/` and `components/invest/` all do), never a new global.

### Voice

Candid, not arrogant. Operator-first, not finance-first. Convicted, not
promotional. Short sentences. Specific about process and structure, **never**
about returns. **No em dashes in user-facing copy** — rewrite the sentence with a
period, a comma or a colon. (Code comments may use them; this paragraph is not
user-facing.) `EMPTY` in `lib/format.ts` is the placeholder glyph for a missing
value, so a dash never has to be typed into a string.

## Product invariants

These are the claims the product makes. Do not let a change quietly break them.

- **One 5% management fee, charged once at closing.** Not annual.
- **10% carried interest on profits at exit**, on every deal.
- Nothing else. No annual fees, **no capital calls, ever**, and no admin
  reserve — do not reintroduce either concept, including in document text.
- Every deal shows **AltSpot's own committed capital**
- Signed documents file themselves into Docs automatically
- The Vault is captured once and pre-fills every document thereafter
- Accreditation is valid **five years**; the funding window is **10 days**
- **Deal detail is for verified accredited investors only.** Everyone else gets
  the teaser: name, sector, the one line and the artwork. The redaction happens
  in `lib/repositories/deals.ts`, so the withheld fields are never sent to the
  browser and `/api/deals` returns exactly what the page shows. `canViewDealDetail`
  in `lib/domain.ts` is the rule, and it turns on accreditation alone: the W-9
  and KYC gate investing, not reading
- SpotBot **explains, never advises** — every answer cites its provenance
- Secondaries is visible but disabled, pending a BD partner and counsel

## Deliberately out of scope

Liquidity/secondaries surfaces (legally gated) and the public marketing site
and application flow. The product starts at login.

## Going to production

1. `ASC_DEMO_MODE=false` — real credentials required; simulated calls refuse.
2. Implement real adapters in `lib/integrations/` for the KYC vendor, Plaid,
   Modern Treasury and Anvil. Accreditation stays in-house: AltSpot reviews the
   certification letter itself, so there is no verification vendor to wire.
3. Swap `components/wizard/PlaidDemoModal.tsx` for Plaid Link, then delete it and
   its stylesheet.
4. Swap the datasource in `prisma/schema.prisma` to `postgresql` and the adapter
   in `lib/db.ts`. Repository call sites do not change. The migration history in
   `prisma/migrations/` is SQLite dialect and gets rebuilt; status columns and
   the `…Json` string columns should become native enums and `Json`.
5. Replace `lib/auth.ts` sessions with the chosen IdP.
6. Move expiry sweeping to a scheduled job.
7. Real tokenization for taxpayer IDs, replacing the `tinToken` stand-in.
8. Replace the body of `generateAnswer` in `lib/spotbot/engine.ts` with the model
   call. Do not move the gate.

## Known housekeeping

**`npm audit` reports 7 high advisories, and 5 of them ARE in the runtime path.**
Checked 2026-08-08; do not repeat the earlier claim that these are dev-only.

- `postcss` and `sharp` come in through `next` itself. `npm audit --omit=dev`
  still reports them, so they ship. The advertised fix is `npm audit fix
  --force`, which installs `next@16.3.0`, outside the stated range.
- `js-yaml` and `nanoid` are the dev-only two.

Nothing here is exploitable by a visitor to the demo: the postcss advisories
need attacker-controlled CSS at build time, and sharp is not on a path that
processes untrusted images. It is still a **next minor upgrade owed before
production**, done deliberately with the build verified, not as a side effect.

The test suite lives in `tests/` and runs with `npm test`. It uses Node's
built-in test runner through `tsx`, so there is no framework and no config
file. It covers the pure, isomorphic core: the state machine and the invest
gate in `lib/domain.ts`, `lib/fees.ts`, `lib/format.ts`,
`lib/subscription-sections.ts` and `lib/spotbot/gate.ts`. CI runs it
alongside typecheck, lint and build.

Deliberately uncovered: the repository layer and the route handlers, which
need a database. Anything new that is pure and enforces a rule belongs in
`tests/`. A change to fee math, the state machine or the product invariants
should fail the suite before it fails review.

`lib/integrations/` is empty. It carries a README so the path referenced
throughout the codebase exists in a clone.
