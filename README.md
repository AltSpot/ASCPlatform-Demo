# ASCPlatform

The AltSpot Capital investor platform. A fully clickable walkthrough of
the whole investor journey, backed by a real database and a real REST API:
login, accreditation and KYC setup, marketplace, deal, subscription
document signing, ACH funding, then documents, profiles and settings.

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 · SQLite

---

## This is a demo. Read this before anything else.

Nothing in this application is real.

- **Logins accept anything.** Any email and any password signs you in. An
  unknown email mints a new investor on the spot. A URL is the only
  credential there is.
- **All money is fake.** No payment provider is contacted, no transfer is
  initiated, and funding settles synchronously because a function returns.
- **Every third party is simulated.** Accreditation review, KYC/AML/OFAC
  screening, Plaid, ACH and e-signature are all stubs. Nobody is
  screened. No bank is linked. Nothing is legally executed.
- **New accounts are handed a position they never bought.** Every first
  sign-in silently receives an accepted $25,000 holding in a fictional
  deal, marked up, dated seven months ago, with a countersigned agreement
  filed in Docs. See `seedOpeningPosition` in
  `lib/repositories/investor.ts`.
- **Every company is fictional.** Synthera AI, Aurora, Meridian and
  Summit are invented. So are their numbers.

**Never point this at real data.** Not real investors, not real taxpayer
IDs, not a production database, not live third-party credentials. It has
no authentication worth the name, and demo mode is on unless
`ASC_DEMO_MODE` is exactly `"false"`.

This is not an offer of securities.

### It is not throwaway code

Demo behaviour is confined to clearly marked seams. Everything else is
written to production standard: server-side enforcement of every rule the
UI shows, an append-only audit trail, integer-dollar money, a single
source for fee math, and a repository layer that makes the Postgres
migration a datasource swap.

Every simulated path carries a `DEMO SEAM` comment naming what is faked,
what the production contract is, and what replaces it. To see all of
them:

```bash
grep -rn "DEMO SEAM" app lib components
```

---

## Quickstart

Requires Node 22 or newer (see `.nvmrc`). No database server, no
containers, no accounts.

```bash
git clone https://github.com/AltSpot/ASCPlatform-Demo.git
cd ASCPlatform-Demo
cp .env.example .env      # the defaults work as-is
npm install               # postinstall generates the Prisma client
npm run db:reset          # create the SQLite file and seed the four deals
npm run serve             # http://localhost:4000
```

Then open <http://localhost:4000> and sign in with any email and any
password.

`npm install` runs `prisma generate` for you through the postinstall
hook. The generated client lands in `lib/generated/` and is not
committed, because it is build output.

### Why port 4000

Not 3000, which is in use by another project on the maintainer's machine,
and not a port below 1024, which needs root on macOS and breaks
unattended start. Override with `PORT` in `.env`.

`npm run serve` starts the app detached through a small supervisor
(`scripts/dev-server.mjs`). It survives closing the terminal and restarts
itself if Next crashes. `npm run dev` is the plain foreground Next dev
server if you would rather watch it.

### Commands

| Command | What it does |
| --- | --- |
| `npm run serve` | Start on :4000, detached, auto-restarting |
| `npm run serve:restart` | Restart it |
| `npm run serve:stop` | Stop it |
| `npm run serve:status` | Is it up? |
| `npm run serve:logs` | Tail the log |
| `npm run dev` | Foreground Next dev server on :4000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm test` | Run the test suite |
| `npm run test:watch` | Re-run the suite as files change |
| `npm run db:reset` | Drop the database, re-migrate, re-seed the four deals |
| `npm run db:generate` | Regenerate the Prisma client after a schema change |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Re-run the seed without dropping anything |
| `npm run db:studio` | Prisma Studio |
| `npm run setup` | generate + migrate + seed, without dropping the file |
| `npm run deploy` | Trigger a Render deploy and follow it (needs `RENDER_API_KEY`) |
| `npm run deploy:status` / `:logs` / `:env` / `:wake` | Render inspection |

`node scripts/autostart.mjs install` additionally starts the server at
macOS login. `uninstall` removes it.

### The walkthrough

1. **Login**, then first-time setup.
2. **Setup**, five steps: accreditation letter (downloaded, signed,
   uploaded, reviewed in-house, valid five years), W-9 into the Vault,
   KYC (ID upload plus a live camera capture), investment profile, bank
   link through a stand-in for Plaid Link. The last two are skippable.
3. **Dashboard**: portfolio value, positions, pending-funding countdowns.
4. **Marketplace**: four deals, allocation bars, AltSpot's own committed
   capital on every card.
5. **Deal**: one scrollable page. Committed capital, the numbers, the
   story, the thesis, the trend, risk, terms, fees, data room.
6. **Invest**: profile and amount, then a split-screen subscription
   agreement that fills itself in as you confirm each section. One typed
   signature executes everything.
7. **Payment**: fund by ACH now, or hold the spot for ten days.
8. **Docs / Profiles / Settings**: filed agreements, the Vault, demo
   reset.

**SpotBot** rides along in a dock that knows which page you are on. It
explains and never advises, and the refusal gate runs server-side before
any answer is produced.

To see the expiry state, sign a commitment and leave it unfunded past its
deadline. **Settings → Reset demo data** wipes your investor and starts
over.

---

## Architecture

```
app/
  page.tsx                  login
  wizard/                   5-step setup, its own rail layout
  (portal)/                 everything behind auth; the layout enforces it
    dashboard/  marketplace/  deals/[id]/  invest/[dealId]/
    payment/[id]/  docs/  profiles/  settings/
  api/                      the REST surface, including /api/spotbot
  globals.css               the design system, single source of visual truth

components/                 presentational components + client islands
  deal/  invest/  spotbot/  wizard/

lib/
  config.ts                 DEMO_MODE and every production/demo switch
  domain.ts                 types, the subscription state machine, the invest gate
  fees.ts                   fee math (pure, isomorphic)
  format.ts                 money/date/mask helpers (pure, isomorphic)
  subscription-sections.ts  the subscription document, defined once
  auth.ts                   sessions + credentials (server-only)
  audit.ts                  append-only audit trail
  http.ts                   route handler wrapper + validation helpers
  db.ts                     Prisma singleton
  repositories/             the ONLY place that touches domain tables
  integrations/             where the real third-party adapters go (empty today)
  client/api.ts             the ONLY place the browser calls fetch
  spotbot/                  gate, knowledge, page contexts, answer engine

prisma/schema.prisma        production-shaped; SQLite today, Postgres later
prisma/seed.ts              four fictional deals
scripts/                    dev-server supervisor, db reset, Render control
```

### Server components and client islands

Pages are **server components** that read through repositories, so the
numbers are correct on first paint with no spinner. Interactivity lives
in **client islands** that mutate through `lib/client/api.ts`. Both paths
exist deliberately: the REST API under `app/api/` is complete and
inspectable on its own, and the UI is a consumer of it rather than a
privileged path around it.

### The API surface

This is the contract. Every endpoint is a route handler under `app/api/`,
wrapped by `route()` from `lib/http.ts`, and every one of them except the
auth and session routes calls `requireUser()` first. Errors come back as
`{ error: { code, message } }` with `unauthorized` 401, `invalid_request`
400, `not_found` 404, `invalid_state` 409, and a generic
`internal_error` 500 that never leaks a stack trace.

| Endpoint | Methods | Purpose |
|---|---|---|
| `auth/login`, `auth/logout` | POST | Credentials in, session cookie out |
| `auth/demo-login` | POST | Demo only. Mints a pre-onboarded persona |
| `session` | GET | Current user, setup status, invest gate |
| `wizard`, `wizard/complete` | GET, POST | Setup progress |
| `accreditation/letter`, `/upload`, `/verify` | POST | Certification letter, upload, reviewer confirmation |
| `kyc/id`, `kyc/selfie`, `kyc/submit` | POST | Identity capture and submission |
| `vault` | GET, PUT | Taxpayer info, captured once, reused everywhere |
| `profiles`, `profiles/[id]/default` | GET, POST | Investing entities |
| `bank` | GET, POST | Linked funding accounts |
| `deals`, `deals/[id]` | GET | The shelf and a single deal |
| `subscriptions` | GET, POST | List, and start a commitment (invest gate enforced here) |
| `subscriptions/resumable` | GET | Unfinished commitment for a deal |
| `subscriptions/[id]` | GET, PATCH, DELETE | Read, change amount, cancel |
| `subscriptions/[id]/confirm` | POST | Confirm one section of the agreement |
| `subscriptions/[id]/sign` | POST | Execute. Decrements allocation |
| `subscriptions/[id]/fund` | POST | Funding instruction |
| `documents`, `documents/[id]/download` | GET | Filed documents |
| `radar` | GET | The AltSpot Radar board, with this member's own indications |
| `radar/interest` | POST | Indicate interest in a Radar name. Demand signal, not a commitment |
| `spotbot` | POST | Explainer answers, gated before generation |
| `demo/reset` | POST | Demo only. Wipes the caller's account |

Ownership is enforced by scoping every read to the session user
(`findFirst({ where: { id, userId } })`), so another user's id returns
404 rather than 403. The invest gate, the state machine, and every
ownership rule are re-checked server side. The UI versions are
courtesies, not controls.

### `lib/repositories/` is the only database boundary

Route handlers and pages never call `prisma` directly for domain data.
Everything goes through `lib/repositories/*`, which is what makes moving
to Postgres a datasource swap in `prisma/schema.prisma` plus an adapter
swap in `lib/db.ts`, with no call site changes. `lib/auth.ts` owns
sessions and credentials and is the one other module that touches the
client directly.

### `lib/domain.ts` holds the state machine

```
started -> docs_signed -> funded -> accepted -> closed
exits:   expired (10-day funding window lapsed) | refunded | cut_back
```

`assertTransition` enforces it, called from
`lib/repositories/subscriptions.ts`. An illegal transition returns HTTP
409. Two behaviours that are easy to get wrong:

- **Allocation is decremented at signature, not at funding.** Signing is
  the moment the spot is actually reserved. It is returned on expiry and
  on cancel.
- **Expiry is swept on read**, not by a scheduler. Any authenticated read
  of a user's subscriptions lapses overdue commitments first. In
  production this moves to a job, with the read-side sweep kept as a
  backstop.

`lib/domain.ts` also holds the invest gate, the set of conditions an
investor must satisfy before a subscription can be started. The UI
version of that gate is a courtesy; the route handler re-checks it.

### `lib/fees.ts` is the only place fee math lives

Pure functions, no I/O, so the same code runs on the server when a
document is generated and in the browser as the amount field changes.
The deal page, the checkout summary, the subscription agreement and the
funding page therefore cannot disagree. Money is **integer dollars**
everywhere, including in the database. No floats.

The economics the product commits to:

- **One 5% management fee, charged once at closing.** Not annual.
- **10% carried interest on profits at exit**, on every deal.
- Nothing else. No annual fees, no capital calls, no admin reserve.

### The subscription document

`lib/subscription-sections.ts` defines the agreement once. The
confirmation panels, the live document pane, the confirm endpoint's
validation and the sign endpoint's completeness check all read it, so a
section cannot exist in the UI and be missing from the executed text.
`covers` names the clauses each panel discharges, so the mapping can be
audited without reading a component.

### `app/globals.css` is the design system

Single source of visual truth. Components consume its tokens and classes
and do not invent their own colours, radii or type scales. A component
that genuinely needs new rules gets a CSS Module beside it, never a new
global. New values go in `:root` first.

---

## What is simulated and what is real

Real means it actually works and is written the way production would want
it: it is not a mock.

| Area | Status | Where |
| --- | --- | --- |
| Login and passwords | **Simulated.** Any password passes; an unknown email creates an investor. Hashing (scrypt) and the session store are real. | `lib/auth.ts` (`authenticate`) |
| "Existing investor" button | **Simulated.** Mints a pre-onboarded persona with nothing verified. | `app/api/auth/demo-login/route.ts`, `provisionDemoPersona` |
| Opening position on a new account | **Fabricated.** An accepted $25,000 holding nobody bought. | `seedOpeningPosition` in `lib/repositories/investor.ts` |
| Accreditation review | **Simulated.** Upload collapses the reviewer step. The letter is never stored. | `app/api/accreditation/upload/route.ts` |
| KYC / AML / OFAC | **Simulated.** Cleared in the same write as submitted. Nobody is screened. | `app/api/kyc/submit/route.ts` |
| ID and selfie capture | **Simulated.** Only the fact is recorded; images never leave the browser. A "Simulate" button bypasses the camera. | `app/api/kyc/id/route.ts`, `app/api/kyc/selfie/route.ts`, `components/wizard/StepKyc.tsx` |
| Plaid bank linking | **Simulated.** Fixtures in a stand-in modal; the server takes the account list on trust. | `components/wizard/PlaidDemoModal.tsx`, `app/api/bank/route.ts` |
| ACH funding | **Simulated.** Settles synchronously. No provider, no money. | `app/api/subscriptions/[id]/fund/route.ts` |
| E-signature | **Simulated.** A typed name. No signer verification, no seal, no certificate. | `app/api/subscriptions/[id]/sign/route.ts` |
| Taxpayer ID tokenization | **Simulated.** `tinToken` is last-4 with a prefix, not a token. The full ID is correctly never stored. | `saveVault` in `lib/repositories/investor.ts` |
| SpotBot answers | **Simulated.** Retrieval from a fixed local corpus, not a model. | `generateAnswer` in `lib/spotbot/engine.ts` |
| Deal allocation remaining | **Per-visitor.** Reduced only by your own commitments, so a shared link never looks picked over. | `reservedByUser` in `lib/repositories/deals.ts`, `ISOLATED_ALLOCATION` |
| Demo reset and account sweeping | **Demo only.** Deletes an investor outright; refuses outside demo mode. | `app/api/demo/reset/route.ts`, `lib/repositories/demo.ts` |
| The database and schema | **Real.** Production-shaped Prisma schema, real migrations. | `prisma/schema.prisma` |
| The REST API | **Real.** Authenticated, validated, ownership-checked, complete. | `app/api/`, `lib/http.ts` |
| The state machine | **Real.** Enforced server-side; illegal transitions 409. | `lib/domain.ts`, `lib/repositories/subscriptions.ts` |
| Fee math and money | **Real.** Integer dollars, one source of truth. | `lib/fees.ts` |
| The audit trail | **Real.** Append-only, written on every state change. | `lib/audit.ts` |
| Document rendering | **Real.** Rendered server-side and version-pinned, so what was signed is reproducible. | `lib/documents/`, `lib/subscription-sections.ts` |
| The SpotBot refusal gate | **Real.** Classifies and refuses server-side, before any answer is produced. | `lib/spotbot/gate.ts` |
| Sessions | **Real.** Opaque random tokens, httpOnly SameSite=Lax cookie, swept on read. 30 days, not extended on use. | `lib/auth.ts`, `lib/config.ts` |

`lib/integrations/` is where the real adapters go. It is empty today and
has [its own README](./lib/integrations/README.md) listing what each one
replaces.

---

## Environment

`.env.example` documents every variable with safe defaults. Copy it to
`.env`, which is gitignored and is the only file that ever holds a
credential.

| Variable | Read by | Default |
| --- | --- | --- |
| `DATABASE_URL` | `lib/db.ts`, `prisma.config.ts`, `prisma/seed.ts` | `file:./ascplatform.db` |
| `ASC_DEMO_MODE` | `lib/config.ts` | `true` (anything but the string `"false"` is on) |
| `ASC_EPHEMERAL` | `lib/config.ts` | `true`. Sweeps demo accounts and isolates allocation per visitor |
| `ASC_DEMO_TTL_HOURS` | `lib/config.ts` | `6`. How long a demo account survives |
| `PORT` | the serve scripts, `npm start` | `4000` |
| `RENDER_API_KEY` | `scripts/render.mjs` only | unset. A real secret; needed only to deploy |
| `RENDER_SERVICE_ID` | `scripts/render.mjs` only | the demo service id. An identifier, not a secret |

The application never reads the `RENDER_*` pair.

## Tests

```bash
npm test          # the whole suite, about a second
npm run test:watch
```

The runner is Node's built-in test runner driven through `tsx`, which the
repo already depends on for seeding. No test framework, no config file and
no new dependency.

The suite covers the pure, isomorphic core, which is where the rules that
matter live. It needs no database and no server, so it is fast enough to
run on every save.

| File | What it defends |
| --- | --- |
| `tests/domain.test.ts` | The subscription state machine, checked over every ordered pair of states, and the invest gate including the verified-but-expired boundary |
| `tests/fees.test.ts` | The fee model: 5% once at closing, 10% carry at exit, and the shape assertions that make a third fee impossible to add quietly |
| `tests/format.test.ts` | Taxpayer ID masking, the UTC pinning that prevents hydration mismatches, and the `EMPTY` placeholder |
| `tests/subscription-sections.test.ts` | That the agreement is internally coherent, that confirmation codes and answer keys stay stable, and that the document states the same fee model `lib/fees.ts` computes |
| `tests/spotbot-gate.test.ts` | That advice-seeking questions are refused with the right reason, that mechanics questions are not, and that the gate runs before the answer engine |

Two things the suite deliberately does not do. It does not test the
repository layer or the route handlers, because those need a database and
would be testing Prisma more than testing this codebase. And it does not
assert anything the type system already guarantees.

Each file opens with a comment saying which invariant it protects and why
that invariant is worth protecting. A few tests document current behaviour
rather than asserting the ideal, and every one of those says so in place.

## CI

`.github/workflows/ci.yml` runs typecheck, lint, test and build on every
pull request and on pushes to `main`. Node comes from `.nvmrc`, which is
the single source of the version and matches `NODE_VERSION` in
`render.yaml` and `netlify.toml`.

## Deploying

The demo runs on **Render** from `main` (`render.yaml`). Render is one
long-lived Node process with a real filesystem, which is why SQLite works
there untouched and no database service is needed. The disk is ephemeral,
so a redeploy wipes and reseeds, which is the behaviour the demo wants.

`netlify.toml` exists as an alternative, but Netlify runs the server
routes as serverless functions with no persistent writable disk, so
`DATABASE_URL` there must point at a hosted Postgres. It cannot use the
SQLite file.

## Going to production

Summarised from [CLAUDE.md](./CLAUDE.md), which is the authoritative
document for this codebase's conventions:

1. Set `ASC_DEMO_MODE=false`. Real credentials become required and the
   simulated calls refuse.
2. Implement real adapters in `lib/integrations/` for the KYC vendor,
   Plaid, Modern Treasury and Anvil. Accreditation stays in-house, so
   there is no verification vendor to wire.
3. Swap `components/wizard/PlaidDemoModal.tsx` for Plaid Link, then
   delete it and its stylesheet.
4. Swap the datasource in `prisma/schema.prisma` to `postgresql` and the
   adapter in `lib/db.ts`. Repository call sites do not change.
5. Replace the sessions in `lib/auth.ts` with the chosen IdP.
6. Move expiry sweeping to a scheduled job.
7. Real tokenization for taxpayer IDs, replacing the `tinToken` stand-in.
8. Replace the body of `generateAnswer` in `lib/spotbot/engine.ts` with
   the model call. Do not move the gate.

Delete `seedOpeningPosition` and the demo-only routes
(`/api/demo/reset`, `/api/auth/demo-login`) on the way.

## Conventions

[CLAUDE.md](./CLAUDE.md) is the deep document: the standing rule about
demo seams, the never-trust-the-client rule, the never-store-real-PII
rule, the repository layer, the audit requirement, the design system and
the product invariants. Read it before changing anything.
