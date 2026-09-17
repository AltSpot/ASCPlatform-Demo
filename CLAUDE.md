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
  in `lib/auth.ts`, the simulated third-party calls, and the seeded onboarding
  in `lib/repositories/investor.ts` that back-dates a questionnaire approval so
  a seeded member is past the 506(b) cooling-off period. `components/wizard/
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
  funding page can never disagree. Performance math lives in
  `lib/portfolio-metrics.ts` for the same reason.
- **The dashboard order is the same for every member.** Greeting, the
  strip of things that need them (`components/NeedsYou.tsx`), then Most
  popular (three open deals ranked by `lib/popularity.ts`: 45% money
  committed, 35% members watching, 20% Radar votes for the company
  behind the deal, ties to the soonest close), then Watchlist, then Your
  votes as rows (`components/RadarRows.tsx`), then Your investments (the
  hero figure, the value curve, two quiet figures and the positions
  table, one card: the hero totals the book and the table itemises it),
  then Learn (the wire's headlines and the door to the Terminal). Things
  that need you before things that describe you (Tyler, 2026-09-16).
  Most popular is `components/PopularCarousel.tsx`: a scrolling row of
  small floating tiles, six deals interleaved two-to-one with the six
  loudest Radar names not already on the shelf, each tile one figure and
  one line and the whole tile the link. Watchlist and Your votes sit side
  by side (`.pair`) so a member reads both when deciding where to act.
  Nothing reorders: a dashboard whose first screen differs for every
  member cannot be walked through on a call. Sections fold through
  `components/CollapsibleSection.tsx`, and the folded state is a
  per-device preference in localStorage via `useSyncExternalStore`, never
  a column.
- **A page never totals positions on its own.** `ledgerBook` in
  `lib/portfolio-metrics.ts` is the one place a book is summed, and both
  the dashboard and Portfolio read it; `tests/portfolio-metrics.test.ts`
  fails if either page grows a `reduce` of its own. The dashboard speaks
  the member's words ("You put in", "Worth today", "Cash paid back to
  you") over the same figures Portfolio labels in LP terms.
- **One deal card.** `components/marketplace/DealCard.tsx` is the card on
  the shelf and in the dashboard's Open now. `PositionsTable` takes
  `compact` for the dashboard's four columns; the views, the sort and
  the timeline stay on Portfolio.
- **Everything for this product lives in this repo.** Components, assets, pages,
  documents and experiments are created here, never in outside folders. The old
  `altspot-portal` static demo is retired and deleted; the running app is its
  own visual reference.
- **No real companies on the platform until legal approves** (Tyler,
  2026-09-16). Every deal on the shelf and every name on the Radar is
  invented. The real-company entries that were live (OpenAI and Databricks
  secondaries; OpenAI, SpaceX, Anthropic and Databricks on the Radar) are
  kept verbatim in `prisma/archive/real-companies.seed.txt` and
  `lib/terminal/radar.archive.txt`, with their marks in `private/marks/`,
  so they paste back when approval lands. Their stand-ins are `aurelia`
  and `tessellate`. Calder Grid leads; the shelf holds ten open deals
  across seed to Series C venture, growth equity and late-stage
  secondaries, and the Radar tracks twenty. Every term shown is demo
  data, the marketplace disclaimer says so, and an invented company
  carries no news links. Still no claims about named real competitors in
  editorial copy.

## Running it

```bash
npm run serve          # start in dev on http://localhost:4000 (detached, auto-restarts)
npm run serve:demo     # build, then serve that build. USE THIS TO RECORD.
npm run serve:built    # serve the existing build, no rebuild (low memory: stop, next build, then this)
npm run serve:restart  # restart, in whichever mode is running
npm run serve:stop     # stop
npm run serve:status   # is it up, and in which mode?
npm run serve:logs     # tail the log
npm run db:reset       # wipe the database and re-seed the four deals
npm run typecheck      # tsc --noEmit
```

### Never demo the dev server

`next dev` compiles a route the first time it is visited and ships React
unminified. That is not a tuning detail, it is the difference between two
different products. Measured on this machine, same pages, same data:

| | `npm run serve` (dev) | `npm run serve:demo` (prod) |
|---|---|---|
| Server render | 200-800ms warm, 3-4s on first visit to a route | **9-29ms** |
| Client navigation | visibly delayed | **23-76ms** |
| Scroll | 60fps once warm, but a **1771ms** frozen frame the first time a scroll crossed not-yet-loaded code | **60fps, zero dropped frames**, first pass included |
| Restart after a crash | recompiles on demand | **500ms** |

The platform is not slow. Watching it through `next dev` is. Anything
anyone else sees, a recording, a walkthrough on a call, a screen share,
runs `serve:demo`. `serve` is for writing code.

`serve:demo` builds in the foreground so the build output is visible, and
only then hands the finished build to the supervisor. A failed build
leaves whatever is currently serving alone rather than taking the site
down. Crash-restarts re-serve the existing build instead of rebuilding
under someone mid-sentence, and `serve:restart` comes back in the mode
that was running so a restart mid-demo cannot silently drop to dev.

**`serve:demo` does not touch the database.** It builds and starts;
seeded books, radar votes and watchlists survive it. Use `db:reset`
deliberately when you want a clean shelf.

Port **4000** — not 3000 (in use by another project) and not 1000 (ports below
1024 require root on macOS, which breaks unattended start).

The server survives closing the terminal and restarts itself if Next crashes.
`node scripts/autostart.mjs install` additionally starts it at login;
`uninstall` removes it.

Sign in with **any email and any password**. An unknown email mints an eligible
investor holding the seeded book, with an approved questionnaire back-dated
three years, because an account with funded positions has by definition passed
the invest gate: a setup banner over a live portfolio contradicts itself. **An
address containing `+new` mints a genuinely empty, un-onboarded account**, which
is how the empty states, the questionnaire and the relationship gate are reached.
A `+new` account that submits the questionnaire waits out the real cooling-off
period (`ASC_COOLING_OFF_DAYS`, default 30) before any offering appears. **An
address containing `+recent` mints a member who joined 40 days ago**: eligible,
no book, and the three deals that opened before then (Halyard, Aurelia,
Kestrel) are view-only. `/reshoot?as=recent&to=/marketplace` lands there.

## Architecture

```
app/
  page.tsx                  login (redirects if already signed in)
  wizard/                   5-step setup — own rail layout, outside the portal shell
  (portal)/                 everything behind auth; the layout enforces it
    dashboard/  marketplace/  deals/[id]/  invest/[dealId]/
    payment/[id]/  docs/  profiles/  settings/  portfolio/
    terminal/  terminal/[slug]/   the library, and the reader every piece opens in
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
renders it in a fixed order so deals compare like for like: hero, the stat
band, the story chapters, the thesis, the trend
chart, risk, terms, the two fees, the data room, the ask. Every section returns
`null` when its content is missing, because the deals behind the lead carry far
thinner editorial than Calder. `/deals/[id]/deck` is a permanent redirect
kept only so old links land somewhere sensible.

### The offering binder

`lib/documents/generated/*.json` is counsel's export of **one worked example**:
a subscription into ASC Synthera II, LLC holding shares of Synthera AI, Inc.
Those names are not placeholders in the source, so rendered as delivered every
deal showed another company's name on every page.

`lib/documents/personalize.ts` binds the binder to the deal at render time:
vehicle and portfolio-company names only, never clause text, numbering or
order. It runs in **both** paths, the on-screen pane and `renderBinder`, so the
executed record names what the member read. It is one pass over a combined
alternation, not a rule at a time, because sequential replacement re-scans its
own output. `tests/personalize.test.ts` asserts no specimen name survives in
any instrument.

The same substitution covers the confirmation panels, which are our copy and
were written against the lead deal. On Calder every rule is a no-op.

**It does not fix the memorandum's business description**, which is still the
specimen's. Substituting names there would describe the wrong business under
the right name, so the pane carries a specimen notice instead. The real fix is
a tokenised template from counsel.

### The subscription document

`lib/subscription-sections.ts` defines the agreement once. The confirmation
panels, the live document pane, `/api/subscriptions/[id]/confirm` validation and
the sign endpoint's completeness check all read it, so a section cannot exist in
the UI and be missing from the executed text. Two of the six sections are
selections of fact (accredited investor category, benefit plan status) and
record *which* option was chosen, not merely that the panel was seen. `covers`
names the clauses each panel discharges so counsel can audit the mapping without
reading a component.

### Terminal

**Terminal content is hosted in the portal.** Articles, reports and podcasts
all live in `lib/terminal/library.ts` and are read at `/terminal/<slug>` in the
portal shell. Nothing links a member out to the newsletter site, and no card
carries an outward arrow, because there is nowhere outward to go. The Terminal
is the reason a member opens the portal on a day they are not investing, and a
link that lands them on beehiiv has ended the session.

`lib/terminal/journal.ts` reads the publication's public feed and is **not
wired to any page**. It is the one-time importer for the newsletter back
catalogue. Run it at launch, migrate the archive into the library, delete it.

The wire (`lib/terminal/news.ts`) is different: those are other people's
stories, and a wire item with a `url` links to its own source. That is correct
and is not the thing being brought in-house.

Every library piece carries a `sourceNote`, for the same reason every Spot
answer carries a provenance line. No piece names a return, projects one, or
recommends an action, and deal writing belongs on the deal page where the
disclosures are.

### The performance vocabulary

**`lib/portfolio-metrics.ts` defines every metric once, and the words are an
LP capital account's, not a brokerage's.**

| Term | Means |
|---|---|
| Invested | Capital contributed. Cost basis. **Not** "paid in": paid-in capital implies drawdowns against a commitment and AltSpot never calls capital. |
| Fair value | Latest reported mark on what is still held. Zero once a position exits. |
| Realized | Cash distributed back, operating and exit together. |
| Total value | Fair value plus realized. |
| Unrealized | Fair value minus cost still at work. |
| MOIC | Total value over invested, for one position. |
| TVPI / DPI / RVPI | The same ratio across a book, and its realized and unrealized halves. DPI + RVPI = TVPI, always. |
| Net IRR | Money-weighted, annualized, with today's fair value as the closing flow. Bisection, not Newton, which diverges on the flat-then-one-big-distribution shape a private book actually produces. Null rather than a number on under a month of history. |

**A multiple counts distributions.** The dashboard used to compute mark over
cost while Portfolio counted distributions, so one position carried two
different multiples on two pages. Everything reads this file now, and
`tests/portfolio-metrics.test.ts` pins it.

Venture is the first-class case. Real assets and funds use the same figures
because they are the same arithmetic; anything asset-class specific (cap rates,
occupancy) does not exist yet and should not be faked into these columns.

### Portfolio

**The page is chart-led.** The value curve (`components/portfolio/ValueCurve`),
the driver bars (`Drivers`), the two-bar allocation (`AllocationBreakdown`) and
the cash-flow chart (`CashFlow`) all read the same figures the ledger table
does, so a chart and a number on this page cannot disagree.

`PositionMark` is the history behind the curves. Marks arrive per reporting
period and do not move between them, so `buildPortfolioSeries` in
`lib/portfolio-series.ts` carries each mark forward to the next one and never
interpolates. It is pure, it takes `now` rather than reading a clock, and it is
covered in `tests/portfolio-series.test.ts`. **The dashboard chart and the
Portfolio curve both call it**, which is what stops the two pages telling
different stories about the same quarter. `Subscription.currentValue` is the
latest mark, denormalised so list reads need no join.

`realizedAt` on a subscription, not a state, is what says a position exited.
`closed` is the healthy terminal state of the *subscription* (the deal closed
and the investor is in it), so it can never mean the investment is over.
`isLivePosition` in `lib/domain.ts` is held-and-not-realised and is what
anything totalling current exposure must use. Paid in counts realised
positions, because DPI and TVPI are ratios against contributions; value and
allocation count only what is still held.

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

`app/globals.css` is the single source of visual truth, and it now holds
**two themes**: the ember canvas in `:root` and Daylight in
`html[data-theme='light']`. AltSpot Capital Brand Identity **V18** (Aug 2026),
ported from the design-system handoff.
Canonical token names are `--as-*`; the older short names (`--bg`, `--ink`,
`--orange`, `--r`, `--fd`) survive as aliases retargeted onto them, so
existing markup keeps resolving. Prefer `--as-*` in new code.

- **Borna** (`--font-display`) for display type. **Figtree**
  (`--font-sans`) for body and UI, 300 is the body default on dark.
  **JetBrains Mono** (`--font-mono`, pointing at `--font-mono-jetbrains`;
  on trial against Figtree, Manrope and Onest Tabular in
  `components/TypeLab.tsx`, see below) for every eyebrow, label, table
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

### The primitives

Buttons, cards and eyebrows are the global classes in `app/globals.css`:
`.btn` (`.btn-gold`, `.btn-ghost`, `.btn-sm`), `.card` and `.eyebrow`
(`.muted`, `.signal`). Every surface uses them, so a control built from
them inherits pill geometry, the type ladder and accent discipline for
free. Reach for these before writing a new one-off control. The only
component primitive is `Orb` in `components/ui/`; the component versions
of the other three duplicated the globals at different sizes and were
deleted.

**The rhythm is generous** (2026-09-16). The page has 48px of air on top
and 56px at the sides (`--main-pad-x`), sections open 48px after the one
before (`components/CollapsibleSection.module.css`), cards carry 26px of
padding and sit 22px apart, table rows are 16px tall inside, and the
marketplace lanes are 80px apart. Nothing on the platform should feel
crowded to a first-time member: when a new surface looks tight, give it
the shared spacing rather than a local number, and when in doubt add
space rather than take it away.

**Caps are for kickers, not labels** (2026-09-16). Uppercase with
`--ls-label` tracking stays on eyebrows, section kickers, chips and tags,
table headers, segmented controls, source lines, live pills and the legal
document's headings. Every other mono label (fact keys, figure keys,
axis labels, form labels, nav links, vote copy, backers) is sentence case
with `--ls-text` (0.02em). Two tracking tokens, never a third: the caps
amount on sentence case is what made every face in the type lab read as
crowded.

**One chip, filled, no line** (2026-09-16). Every chip, tag and filter pill
on the platform is a filled pill with a transparent border: `.chip` in
gold tint, `.chip.neutral` in `--surface-2`, `.chip.good` and `.chip.warn`
in their fills. Module tags (kind, badge, class, filter chips, the
industry menu button) follow the same rule. Outlined pills read as holes
on glass, and three chip styles on one page read as three products.
Category tints stay off chips; the watchlist's class chip is neutral like
the Radar's. Daylight's text accents are one antique-bronze family at
four depths (`--accent`, `--accent-quiet`, `--accent-soft`,
`--accent-hot`).

**No burnt orange as type, on either canvas** (Tyler, 2026-09-17). Small
type on a light ground cannot wear the brand orange (`#F39807` is 2:1 on
dust), and the amber-browns that replaced it (`#9F510A`, `#9A5A1A`,
`#A8540C`, `#B4470C`) read as burnt orange beside the gold CTAs. Daylight's
small accents are antique bronze (`--accent #7A5B1E` and its family, all
above 4.5:1 on dust); Ember's `--accent-soft` is a warm gold rather than
`--as-ember-soft`. Large figures (24px and up) still wear `--figure-hot`. Ember's `--warn` (work owed: setup chips, the rail's Setup incomplete) is warm gold `#E6C77A`, not `#E5661A`; the dot beside it carries the heat as paint.
A member's own number (a vote, an amount) is page ink with a gold glyph
beside it, not an accent colour.

**Gold means invest, green means vote, and green is rationed.** On a Radar
card green is one small mark, the glyph on the quiet Vote button; the
demand bar is gold paint. `.btn-vote` (`--vote-gradient`) is kept for the
scale's confirm, where the vote is actually cast. It is never used for
anything that moves money.

**Green is two tokens.** `--good` is type (gains, approved, live labels) and
clears 4.5:1 on both canvases; `--good-paint` is the brighter green for
dots, bars, fills and the vote slider, and is never type. Same split as
gold: the colour that pops is the one you cannot read a word in.

**The type floor.** `--fs-label` 12px (with `--ls-label` 0.10em) is the
smallest text in the product, for eyebrows, table headers, chips and
source lines. `--fs-meta` 13px is for secondary lines and legal copy.
`--fs-figure` 14.5px is for tabular figures. `--as-text-faint` is
permitted at 13px and above only; below that use `--as-text-muted`.
Disabled and quiet states are colour tokens, never `opacity` on text.
Nothing at rest moves.

**Add tokens to `:root` before introducing one-off values.** Components consume
these classes; they do not invent their own colours, radii or type scales. Inline
`style` is for layout one-offs only, never for colour or type. A component that
genuinely needs new rules gets a CSS Module beside it (`components/deal/`,
`components/spotbot/` and `components/invest/` all do), never a new global.

### The type lab (temporary)

`components/TypeLab.tsx` is a bottom-centre switcher on every page that
repoints `--font-mono` at one of four faces through `html[data-mono]`,
written before first paint like the theme and kept per device in
`localStorage` (`asc.mono`). The monospace candidates (Red Hat, Geist
Mono, IBM Plex, DM Mono) were tried and dropped, as were Inter, Geist,
Plus Jakarta, Instrument, Mona, Public Sans and Schibsted. The
`*-tabular-latin.woff2` files in `public/fonts/` are the variable latin builds with the `tnum` digits
baked into the default glyphs, so they are tabular wherever the data
face is read and nowhere else. It is a decision tool: when the face is
chosen, delete the component, its mount and the candidate faces in
`app/layout.tsx`, the `html[data-mono]` block at the foot of
`globals.css` and the losing font files, then point `--font-mono` at the
winner. The sans candidates set capitals wider than a mono does, so
check tight spots (the rail's SOON badge truncates "Secondaries").

### Two themes: Ember and Daylight

**Ember is the product. Daylight is a preference, and it is opt in.** `:root`
is the ember canvas; `html[data-theme='light']` restates the token layer and
nothing else. There is no `prefers-color-scheme` rule anywhere, deliberately: a
portal that opened in a different skin depending on whose laptop it was on
could not be walked through on a call, which is the same reason the dashboard
order is fixed for every member.

The switch is `components/ThemeToggle.tsx`, on the rail foot and on the login
page (the rail is behind auth, and the login page is where a walkthrough
starts). The choice is per device in `localStorage`, like the rail width and
the folded sections, and the blocking script in `app/layout.tsx` writes
`data-theme` before first paint so Daylight never flashes the ember canvas.
**The attribute is the truth**, not storage and not React state.

A theme is a redefinition of tokens, so it only works while every surface
reads from tokens. Four rules carry it, and `tests/theme.test.ts` fails if any
of them is broken:

- **The depth ladder, not literals.** `--surface-1/2/3` are raised steps,
  `--surface-well` and `--surface-sunk` are recesses, `--track` is the unfilled
  half of a meter, `--edge-top` is the lit top edge. Pick the step by what the
  element *is*. `rgba(255,255,255,.04)` is a correct card fill on ember and
  meaningless on any other canvas.
- **Gold as type and gold as paint are different colours.** `#C79A4B` is 6.2:1
  on ember and 2.3:1 on cream, and every eyebrow, label and source line in the
  product is gold at 12px. Type reads `--accent`, `--accent-hot`,
  `--accent-quiet`, `--accent-soft`, which carry a contrast guarantee on both
  canvases. Gradients, bar fills, glyph strokes and the orb keep `--as-gold`
  and friends, which never change.
- **What does not invert.** The orb, always gold. `--fg-on-gold`, which is dark
  ink on a gold CTA whatever the page is doing, and specifically must not alias
  `--as-ink`. The mark tiles on the rail and the marketplace tabs, because the
  Marketplace and Terminal marks arrive as gold artwork and take no
  `currentColor`. And anything sitting on deal artwork: banners are supplied
  images, so `--scrim-media*` and `--on-media` stay dark and light respectively
  in both themes.
- **The plot palette lives in `globals.css`, not in `lib/taxonomy.ts`.** A tint
  is handed to React as an inline style and inline styles do not cascade, so a
  hex there is a colour no theme can reach. `ASSET_CLASSES[].tint`,
  `INDUSTRY_TINTS` and the vintage ramp all name `--as-cat-*`, `--as-ind-*` and
  `--as-vintage-*`. The module stays pure: a tint is still just a string.

**Glass needs `backdrop-filter` written alone.** A rule carrying both
`backdrop-filter` and `-webkit-backdrop-filter` with a `var()` value
compiles to neither, which is how every pane on the platform shipped with
no blur at all until 2026-09-16. `tests/theme.test.ts` now fails on the
prefixed form.

**Surfaces are Liquid Glass** (revised 2026-09-16, after Apple's
material). The rules, all in tokens, so every page inherits them:

- **The tint is almost nothing.** A Daylight pane is `rgba(255,255,255,.20)`
  over `blur(22px) saturate(128%)`. What separates it from the page is what
  it does to the light behind it, not white paint.
- **Edges are light, not lines.** `--card-edge` is transparent. `--card-lift`
  carries a specular highlight on the top and left, a dimmer refraction on
  the bottom and right, a glow falling into the glass and a two-layer cast
  shadow. Hover brightens the light (`--shadow-card-hover`); it never draws a
  gold outline.
- **Thickness follows job.** Four tiers, and a new surface picks one:
  content glass (`.card`, `--fill-card`); warm glass for surfaces asking
  something of the member (`.card.gold`, the dashboard hero, the Needs you
  strip, the deal gate, commitment, risk and close, the Terminal lead), made
  by layering `--glass-tint-gold` or `--glass-tint-ember` as
  `background-image` over the same pane; floating glass for anything over
  other content (Spot's dock, toasts, the type lab, popovers:
  `--glass` / `--glass-solid`, thicker for legibility); and no glass at all
  for rows, wells and tracks inside a pane, because glass on glass is fog.
- **Never set the `background` shorthand on a pane.** It drops the fill;
  set `background-image` for a tint.
- **Selection and status keep their borders** (wizard choices, a confirmed
  panel): there the line is information, not decoration.

**Daylight's ground is the whole viewport**: dust into pale apricot with
gold top of centre, bottom left and bottom centre, orange top right,
ember held back bottom right and apricot pools either side of the middle,
so no corner carries it alone. Text colours were measured against the
hottest pane of the earlier, stronger cut (about `#F7B87E`) and only have
more room now. The paragraphs below describe the first Daylight and its
reasoning, which still holds; the values are superseded by the tokens.

**What makes Daylight look like ice rather than white boxes.** Glass is only
legible as glass against variation: a pane over a flat tint is a lighter
rectangle however translucent it is. So the canvas is a cool off-white
`#EFECE6`, not `--as-paper` and not a tan, and the fixed atmosphere layer over
it carries real light and shade: a gold bloom, a champagne pool, a near-white
gleam and a warm-grey shade. A pane crossing the gleam goes brighter than the
page; crossing the shade it goes cooler and dimmer, so the same card is two
colours at two scroll positions. Cards are `rgba(255,255,255,.36)` over
`blur(26px) saturate(150%)` with a bright white rim (`--card-edge`) and a lit
top edge. The rim is the single thing that separates glass from a cream
sticker: every reference for this look has one, and none has a brown border.
On ember `--card-edge` is the ordinary hairline, so the token costs dark
nothing.

Three things hold it up and all three are load bearing. **The ground has
mid-tones**, or there is nothing for a white pane to be lighter than. **Not
everything is glass**: cards are, and the rows, tracks and wells inside them
are flat tints, because glass on glass reads as fog. **Shadows are warm brown,
never black**, which on cream reads as dirt. Contrast was measured against the
canvas for every text value and the ratio is written beside it in the light
block.

### Less is more

The sweep of 2026-09-14 set the bar every surface is held to: a control or
a mark earns its place by changing what a member can do or understand, and
otherwise it goes. What that removed, so it is not quietly put back:

- **Filters are one quiet line.** `components/filters/TaxonomyFilters` shows
  only the classes present, as neutral chips with the word and nothing else,
  one lit when chosen, with the industry menu on the same line. No icons, no
  counts, no per-class colour, no count line beneath. The same row serves the
  shelf, Radar and both Terminal filter rows.
- **Category colour means a slice, nothing else.** The `--as-cat-*` tints
  appear on the Portfolio exposure legend and its bars, where a colour is a
  key. They are not on chips, tags or filters. `components/filters/classes.ts`
  is gone with them.
- **A figure appears once per screen.** The deal-specific strip under the
  eight standard indicators drops any value already on a card.
- **Wire stories carry a neutral tag sized to its word**, not a coloured bar.
  The lead keeps gold because it is the one story the page is pointing at.
- **Editorial art is warm.** Library tiles use the bronze, ember and warm-grey
  ramps; no navy, teal or violet tiles.
- **Nothing is said twice.** Radar cards lost their rank numerals and the
  slogan under the lede; the Held elsewhere card lost its inner title;
  Settings lost the Session card, because the rail signs out on every page.

### The marketplace is the engine, then two lanes

**The engine is the loop, and the page is built to run it.** Members vote
on the Radar; AltSpot sources what the votes point at; the deal lands on
the shelf; because demand was counted first, it fills in days. The shelf
is front and centre (money moves there), and the page sends members to the
Radar as a matter of course, because the shelf only stays full if they
keep voting. Concretely (`components/marketplace/MarketplaceLanes.tsx`,
2026-09-16):

- **The engine strip opens the page**: one sentence and four figures, all
  computed: open deals, names on the Radar, dollars voted, and *sourced
  from votes*, which is the count of open deals whose Radar company carries
  their `dealId`. That number is the proof of the mechanic, never claimed.
- **A sticky bar** carries two jump pills, Open now and Radar, lit by
  whichever lane is on screen (IntersectionObserver), with the one filter
  row beside them. The Radar is one press away from anywhere on the page.
- **The engine strip's four figures** are doors, not decoration: Open
  now, Closing soon (inside 14 days), On the Radar and Members voting, each
  a button that jumps to its lane. All counted, none claimed. The lane
  headers are pills: a pulsing green "Live now" on Invest (`.live-pill`,
  the one pulse for anything happening right now), a gold "Vote" on the
  Radar. No lede under Invest.
- **Cards are compact, four across**, so two rows of ten fit a viewport.
  A shelf card carries the art band (mark, tag, and a gold Radar glyph
  when the deal came off the member's Radar), the name, the headline at
  two lines, the bar with its percentage, and the button. **No minimum,
  closing date, amount left or co-investor on the card** (Tyler,
  2026-09-17): those are on the deal page, whose hero and overview carry
  the backer. **A Radar card is the vote**: plate, name, an info icon for
  the detail, demand (ink figure, gold bar) with the asset class as a
  tinted glyph beside a voter-count icon, and a quiet Vote button (the
  scale opens on press). Labels become icons wherever an icon carries the
  meaning; the words stay for screen readers and on hover. Everything
  else, the description, the three prices as tiles, who led the last
  round, the two cases and the news, is in the detail dialog, which is
  portalled to `<body>` so opening it never moves the page.
- **Backers.** `lib/backers.ts` holds the other firms at the table, ALL
  INVENTED, with roles `led` (they set the terms, AltSpot co-invests),
  `co-invest` (alongside a round AltSpot leads) and `prior` (led the last
  round, on the Radar). `Deal.backingJson` and `RadarCompany.backing` name
  them; `components/BackerMark.tsx` draws the mark inline in currentColor
  so it reads on artwork and on glass in both themes. The shelf card, the
  Radar card, the deal hero and the deal Overview all print it from the
  same data. When real syndicate partners are named, the list and the
  glyph are replaced and nothing else changes.


Open now (**Invest**) and the Radar (**Vote**) sit on one scroll in
`components/marketplace/MarketplaceLanes.tsx`, under one filter row, told
apart by the verb in each lane's eyebrow and by what the cards carry: a price,
a close and "View deal" on the shelf; demand, your vote and "Cast your vote" on
the board. Nothing is behind a tab. The last card on the shelf is the bridge to
the Radar, and a deal the member voted for before it opened wears "Was on your
Radar" (`fromRadar`, set from `RadarCompany.dealId` and the member's vote) on
the shelf and on the dashboard's Open now, because that is the mechanic proven
rather than sloganed. `?view=radar` scrolls to the board so old links and
Spot's page context keep working. The dashboard's rows are titled **Your
votes** so the verb is the same at both zoom levels.

**Yours, and the Watchlist page** (Tyler, 2026-09-17). A deal the member
saved or voted for before it opened, and a Radar card they voted on, wear a
gold inset rim on the marketplace, and a **Yours** pill on the sticky bar
filters both lanes to them, its count live as stars and votes change. The
Radar lane's **How it works** button opens a right-hand panel
(`components/radar/RadarHowItWorks.tsx`): four steps, one sentence each, and
the vote disclosure. `/watchlist` (rail order: Dashboard, Marketplace,
Watchlist, Portfolio, Terminal) is **not a second marketplace**: one search
box that saves a deal or casts a vote with three quick amounts, then two
row lists, Saved deals and Your votes, and an empty state that sends the
member to Explore investments. No cards, filters or demand figures there.
Every write is the marketplace's own API call.

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
- **AltSpot's own committed capital is stored on every deal but not shown.**
  `altspotCommitted` stays in the schema, the seed and `DealSummary`; no card,
  hero, stat band or Spot answer prints it. Removed from every surface by
  Tyler's direction (2026-09-14). Do not reintroduce an "AltSpot in $X"
  figure anywhere without asking first
- Signed documents file themselves into Docs automatically
- The Vault is captured once and pre-fills every document thereafter
- The funding window is **10 days**
- **`docs/structure-decisions-sept-2026.md` is the source of truth for the
  model** (506(b), fees, carry, escrow, what may be shown). Where an invariant in
  this file disagrees with it, that document wins and this file is stale.
- **No offering is shown before the 506(b) relationship gate opens** (Sept 16,
  2026). A member registers, completes the investor questionnaire
  (`lib/relationship.ts`: accreditation basis, experience, sophistication),
  AltSpot evaluates it, and the approval date is stored as
  `User.relationshipEstablishedAt`. Offerings open after the cooling-off period.
  Before that, `lib/repositories/deals.ts` sends **no deal at all**, not a
  teaser: no name, sector, line or artwork, an empty list from `/api/deals`, and
  the same 403 for every id from `/api/deals/:id` so ids cannot be probed. The
  Radar stays open but withholds which name became a deal. Accreditation is a
  self-certification with no letter, no reviewer of documents and no expiry;
  the answers and timestamps are the record. `canViewDealDetail` in
  `lib/domain.ts` is the rule, and it turns on the relationship alone: the W-9
  and KYC gate investing, not seeing
- **A member may subscribe only to deals launched after their relationship date**
  (`Deal.launchedAt` against `User.relationshipEstablishedAt`, strictly after).
  An earlier deal is shown in full but view-only: every place the page would ask
  for money shows "Opened before you joined. You are eligible for deals that open
  after [date]." instead, and the shelf card carries an eye glyph.
  `canSubscribeToDeal` in `lib/relationship.ts` is the rule; `DealView.subscribable`
  defaults to false and only the viewer-aware reads in `lib/repositories/deals.ts`
  set it. `POST /api/subscriptions` refuses with a 403 and the invest page
  redirects to the deal, so the UI is the explanation, not the control
- **Referral links are a way to the gate, never past it** (work order screen 3).
  A partner or member shares `/r/<code>` (`app/r/[code]/route.ts`). It sets a
  short-lived cookie and lands on Create account, whatever else is on the URL;
  a signed-in member goes to their dashboard. The code is written to
  `User.referralCode` / `referralKind` when the account is created, for
  reporting only. **Nothing in fee, carry or eligibility logic may read it**, and
  `tests/referral.test.ts` reads those modules as text and fails if one does.
  Partner codes are seeded (`northlight`, `ashgrove`, both invented); a member's
  own link is created the first time they open Settings. Counsel's per-investor
  relationship certification by a lead is part of the partner flow and is not
  built yet
- **Nothing logged out names an offering** (work order screen 4). Company marks
  are not in `public/`: they live in `private/marks/` and are served by
  `/api/marks/<name>.svg`, signed in only, and a mark named after a deal only to a
  member past the relationship gate. Anything the viewer may not see is the same
  404 as a missing file. Site-wide metadata (tab title, link previews, social
  cards) is the platform line only. `tests/public-surfaces.test.ts` reads the
  deal and Radar names from source and fails if any appears in `public/`, the
  login page or the root metadata. **Deal emails** go only to
  `listDealEmailAudience` (eligible, relationship before launch: the same rule as
  joining); the Postmark send in `lib/integrations/postmark.ts` is a DEMO SEAM
  with no trigger until a back office exists
- SpotBot **explains, never advises** — every answer cites its provenance
- Secondaries is visible but disabled, pending a BD partner and counsel

### Holdings held elsewhere

`ExternalPosition` is a holding a member has somewhere else: a syndicate, a
fund, shares held direct. AltSpot wants to be where they read their whole
private book, and a portfolio showing only what they bought here is one they
check once.

**Every figure on those rows is self-reported and is never laundered into an
AltSpot total.** There is no administrator behind them and no mark AltSpot can
stand behind. They carry a tag on every row, the section says it in words, the
closing note repeats it, and they are excluded from Invested, Fair value,
Realized, TVPI and Net IRR. Quietly folding unverified numbers into a
platform's own performance figures is the most dishonest thing this page could
do.

### Bars that compare two amounts

Invested is drawn in `--as-bar-base`, a warm neutral, and never in a second
gold. Two golds a step apart in lightness are indistinguishable at 8px on a
dark card, which is what these were. With a neutral base every coloured pixel
means one thing: **gold is gain, ember is shortfall, grey is the money that
went in.** `--as-bar-divide` draws a hard edge at the boundary so the split
survives any display and any colour vision.

## Demo data, and why it is shaped this way

`ensureInvestorRecords` seeds every new investor. All of it is behind DEMO
SEAM comments in `lib/repositories/investor.ts` and deletes together.

- Six positions with quarterly `PositionMark` history and distributions, one
  marked below cost and one realized. A book of one line says nothing.
- A signed-but-unfunded Calder commitment **with its agreement filed in
  Docs**, because the dashboard timeline says the documents were signed and
  the two surfaces have to agree.
- Three Radar votes and a two-deal watchlist. Both sections have correct empty
  states and both were empty on every fresh account, which left the two most
  interactive surfaces on the dashboard showing nothing.
- A K-1 per position per **completed** tax year. The Tax Center used to be a
  hardcoded empty state that could never fill.

Open deals set `closesInDays` in `prisma/seed.ts` rather than a fixed
`targetClose` string, so a database seeded in August is not offering a deal
that closed in August when it is opened in October. Closed deals keep their
historical dates.

`devIndicators: false` in `next.config.ts`: the dev badge sits exactly where
the sidebar account chip is and appears in every screen recording.

## Deliberately out of scope

Liquidity/secondaries surfaces (legally gated) and the public marketing site
and application flow. The product starts at login.

## Going to production

1. `ASC_DEMO_MODE=false` — real credentials required; simulated calls refuse.
2. Implement real adapters in `lib/integrations/` for the KYC vendor, Plaid,
   Modern Treasury and Anvil. Accreditation stays in-house: under 506(b) it is a
   self-certification questionnaire AltSpot evaluates, so there is no
   verification vendor to wire. A questionnaire referred for review
   (`under_review`) needs a back-office decision screen; none exists yet.
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
9. Move `lib/terminal/library.ts` onto the content store, keeping the
   `LibraryItem` shape and the three read functions. Import the newsletter back
   catalogue with `lib/terminal/journal.ts`, then delete that file and the two
   `ASC_JOURNAL_*` variables. Attach `audioUrl` to podcast items and swap the
   stand-in clock in `components/terminal/PodcastPlayer.tsx` for an `<audio>`
   element; the chapter list and the layout do not change.

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
`lib/subscription-sections.ts` and `lib/spotbot/gate.ts`. It also reads the
stylesheets as text: `tests/theme.test.ts` pins the two themes, catching a
hardcoded surface, a paint token used as type, a token that Daylight forgot to
restate, and any `var()` naming a property nothing defines. CI runs the suite
alongside typecheck, lint and build.

Deliberately uncovered: the repository layer and the route handlers, which
need a database. Anything new that is pure and enforces a rule belongs in
`tests/`. A change to fee math, the state machine or the product invariants
should fail the suite before it fails review.

`lib/integrations/` is empty. It carries a README so the path referenced
throughout the codebase exists in a clone.
