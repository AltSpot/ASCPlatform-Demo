# AltSpot product demo: brief update

**Prepared 2026-09-21 from the platform's own commit history and current product rules. Hand this whole document to the chat that owns the demo brief, narration and scene list.**

## 0. How to use this

You (the chat holding the demo brief) wrote the brief, narration and scenes against the platform as it stood around September 14 to 16. Since then the platform has had roughly 110 commits across three working days. Not everything changed, but a lot did, and a few things in the old brief are now **wrong**, not just out of date.

Work through this document in order:

1. **Section 1** lists what in the old brief is now incorrect. Fix those first. Several are compliance points, so they are not optional.
2. **Section 2** is the rails: what the film may show and say, and what it may not.
3. **Section 3** is the demo account's story: the cast, the numbers and the dates that appear on screen.
4. **Section 4** is everything new, screen by screen, each with what the viewer sees, why it matters, and an angle for narration.
5. **Section 5** is design language, for visual direction.
6. **Section 6** is a suggested scene spine with click paths.
7. **Section 7** is the recording checklist and **Section 8** is what is still pending counsel.

Then rebuild the brief, the narration and the scene list. Keep what still holds. Where this document and the old brief disagree, this document wins. Where this document and `docs/structure-decisions-sept-2026.md` disagree on legal structure, that file wins.

House rules for any copy you write: no em dashes (use commas, periods, colons), short sentences, specific about process and structure, never about returns. The guide is called **Spot**. The voice is candid, operator-first, convicted, never promotional.

---

## 1. What the old brief gets wrong now

| # | The old brief may say | What is true now |
|---|---|---|
| 1 | The fee is a one-time 5% of capital raised, $15K minimum. | **Out, on counsel's advice.** Pay calculated from capital raised is what triggers broker-dealer registration. The fee is now a **flat $10,000 formation and administration fee per SPV** (the SPV pays it once, members bear it pro rata by capital committed, settled at close) **plus a management fee of 1% per year of committed capital, five years funded once at closing** as a reserve (5% of the subscription), drawn as earned. If the vehicle ends early the unused balance is returned; if it runs longer the fee continues to accrue and is paid from distributions. Never say or show "a percentage of capital raised". |
| 2 | Fees are hidden or config-gated. | **Fee figures now show by default.** Counsel confirmed them. Carry figures are still hidden. |
| 3 | There is a cooling-off or waiting period (30 days) after the questionnaire. | **Gone.** Offerings open the moment AltSpot approves the questionnaire. What matters legally is that the relationship exists before the offer, not a fixed wait. A member may still subscribe only to deals launched after their approval date. |
| 4 | "Investor onboarding with accreditation verification." | It is a **self-certification questionnaire that AltSpot evaluates**, under 506(b). No letters, no third-party verification, no document upload for accreditation. Do not say "verified accreditation". |
| 5 | "A partner's deal with the marketplace toggle" and partner reporting. | **Deferred.** The partner structure is being reworked. There is no partner console. Do not script it. Partner-led deals still appear on the shelf with a "Partner-led" label and a named co-investor, and that is all. |
| 6 | Deadline to fund is the admission cut-off. | A member now has **ten days from signing to send money to escrow** (or the admission cut-off if sooner). After that the subscription lapses, nothing is charged, and the spot goes to the next member. The deal's admissions date and the member's ten days are different dates and are shown as different dates. |
| 7 | Real company names (OpenAI, Databricks, SpaceX, Anthropic) on the shelf or Radar. | **All removed pending legal.** Every company on the platform is invented. See the cast in section 3. No real company, and no claim about a named competitor, anywhere in the film. |
| 8 | Minimum investment figures like $2,000. | The headline is **"from $5,000"**. $10,000 is standard, $5,000 on vehicles under $250,000, $25,000 on vehicles over $1,000,000, set per offering. |
| 9 | Secondaries as a working feature. | Still **"Secondaries · Soon"** on the rail, disabled. Two invented late-stage secondary deals stay on the shelf as a picture of later. No trading screen, no liquidity window, no broker. |
| 10 | The theme switch is on the side rail. | It moved to **Settings, Appearance**. Three themes: Ember (default), Ice, Daylight. |
| 11 | A position says "You invested" as soon as a subscription exists. | **Signing is not investing.** The platform now says Started, Signed and not yet sent, In escrow, or Invested (deal closed). Narration must follow the same words. |
| 12 | Portfolio's "invested" includes money in escrow. | **Fixed 2026-09-21.** Portfolio, the dashboard and the statement total only positions in deals that have closed ($143,000 across five). Money in escrow ($25,000, Aurelia) is shown beside the book as its own line, never inside it. |
| 13 | The escrow and bank screens name real companies (a payments provider, a custodian bank, a bank-link provider, the member's bank). | **Removed 2026-09-21.** Copy now says "an escrow account in the SPV's own name at a U.S. bank" and "verified through a secure bank link"; the member's bank shows as "National bank · Checking ····8021", and the setup step offers kinds of institution, not bank names. A test fails if a vendor or bank name appears in any component. |
| 14 | A Radar name's details show "Our target $X to $Y, Market $Z". | **Secondaries only, 2026-09-21.** A share price belongs to a secondary. A venture or growth name's details show **The round**: last round, post-money at the last round, and the round AltSpot would source ("Series B · $640M · Series C" for Orrery), with the class, the industry and who led the last round. |
| 15 | The approval gate mentions a cooling-off period. | **Removed.** It reads "Offerings open the moment your questionnaire is approved." |
| 16 | Spot suggests "How does carried interest actually work?" after a fee answer. | **Removed** while carry is switched off. Spot still answers it if asked directly. |
| 17 | The memorandum's cover says "Series Seed Preferred Stock Financing" and "Up to $588,235". | **Bound to the deal.** On Calder the cover and every reference now read **Series A** and **$2,000,000**. The body still carries the specimen's economics (share price, share count, the specimen's round size) under the specimen notice, so **frame the Read step on the right-hand confirmation panel**, not the document body. "Managed by AltSpot Capital, LLC" is unchanged: the manager subsidiary's legal name is counsel's to confirm (see section 8). |

---

## 2. The rails for the film

**Show freely**
- The loop: members vote on the Radar, AltSpot sources what the votes point at, the deal lands on the shelf, it fills because demand was counted first.
- A deal page: raised so far, minimum to close, closing date, escrow status, the story, the terms, what it costs, the SPV today.
- The questionnaire gate, then offerings.
- Subscribe into escrow: Amount, Read, Sign, Escrow.
- Portfolio, the statement, the Terminal, Spot, Settings.

**Never show or say**
- A percentage-of-capital-raised fee. Carry numbers or carry units. Any dollar figure for AltSpot's or the sponsors' own position, or how they commit capital. "We commit our own capital first" is narration only, with no how, who or how much.
- A warehouse line, a bridge loan, AltSpot "funding the round", an anchor fund as a launch product.
- A secondary trading screen, a liquidity window, a broker as the destination for Radar demand.
- Any real company. Any projected, expected or target return. Any probability of an outcome.
- "Verified" accreditation. A partner console.
- A deal name or Radar name on a logged-out screen. The login page and anything public stay generic.
- An invitation reward of any kind (see 4.11).

**Words that matter**
- Copy says **escrow**, never "funded", for a member's own money. A deal that has closed reads "Funded · closed".
- A vote **reserves nothing and moves no money**. Do not call the votes a fund, a balance or an allocation.
- Spot **explains, never advises**. It will refuse "how much should I invest".
- Illustrative scenarios are **illustrative**: labelled Scenario A, B, C, never base, target or expected. See 4.4 and section 8.

---

## 3. The demo account: cast, numbers, dates

Sign in with any email and any password. A fresh account is minted with one coherent book. The member is shown as **Hannah Smith** on a fresh `/reshoot` account; Tyler's own sign-in will show his name.

**All dates on screen are relative to the day of recording.** Do not write a calendar date into narration. Say "three days left", not "September 22".

**Held positions (all in SPVs that have closed), on Portfolio**
- Tidewater Industrial, $50,000 in, worth $64,400 (up 28.8%)
- Vantage Payments, $30,000 in, worth $24,900 (**down 17.0%**, shown on purpose)
- Solenne Health, $25,000 in, worth $29,600 (up 18.4%)
- Harborline Storage, $20,000 in, worth $23,200 (up 16.0%)
- Northwind Grid, $18,000 in, **exited**, paid back $43,200 (up 140%)
- Book: **invested $143,000, fair value $134,300, realized $51,000, total value $185,300, TVPI 1.30x, DPI 0.36x, net IRR about +25.9%, largest position 40%**, plus **$25,000 in escrow shown beside the book, never in it** (Aurelia, below). These are seeded and describe no real outcome. Treat them as UI, not claims. The dashboard hero reads "$185,300, up $42,300 (+29.6%) on $143,000 you put in", with "In escrow $25,000" as its own figure.

**In flight**
- **Aurelia Labs**: the loop closed. Voted $25,000 on the Radar, the deal opened, the same $25,000 is **in escrow** awaiting close.
- **Tessellate Data**: $50,000, **signed, not yet sent**. Signed seven days before recording, so **three days left of the ten**. This is the "Needs you" item and the Complete investment path.

**Votes (Your votes on the dashboard): $75,000 across two names**
- Ferrule Robotics, $50,000. It has opened on the shelf and the member has not joined yet, so it is the second Needs you item.
- Orrery Space, $25,000. Still only a Radar name.
- Aurelia was voted too, but because the member joined it, it has moved to the Watchlist.

**Watchlist**: Calder Grid and Meridel Bio (saved, not joined), plus Aurelia (In escrow).

**The shelf: 11 open deals. The Radar: 17 names. All invented.**
Lead deal is **Calder Grid** ("The intelligence layer for the electric grid", AltSpot-led, Series A, raised $1.36M against a $1M minimum, up to $2M). The full shelf: Calder Grid, AltSpot Growth Fund, Aurelia Labs, Tessellate Data, Ferrule Robotics, Loomline Health, Basalt Materials, Meridel Bio, Kestrel Autonomy (Partner-led, Series C), Northstar Compute, Halyard Freight. Radar names include Orrery Space, Pellucid Diagnostics, Harrow Labs, Cinder Silicon, Marrow Foods, Cairn Power, Quillon Security, Vireo Water, Greyloch.

---

## 4. What is new, screen by screen

Each item: **what the viewer sees**, *why it matters*, and a narration angle.

### 4.1 Dashboard

The order is fixed for every member: greeting, Needs you, Most popular, Watchlist beside Your votes, Your investments, Explore, Learn.

- **Needs you, and the bell.** A strip of what is waiting on the member ("Send $50,000 to escrow for Tessellate Data, 3 days left", "Ferrule Robotics, which you voted $50,000 for, is open now"). The same list sits behind a bell on the rail on every page and opens in a side panel. The bell now keeps itself current the moment the member signs, funds or votes. *Why: nothing with a deadline can be missed from any page.* Angle: "The platform tells you what needs you. You never go looking."
- **Most popular right now.** A carousel of small tiles, open deals mixed with the loudest Radar names, each wearing the company's own logo.
- **Your votes, as one pool.** New. The total leads ("You have voted $75,000"), a bar shows the spread across names, and hovering a colour names it and its share. The levers are closed by default: a pencil opens one name, **Adjust all** opens every name, minus and plus move a vote one step and **save on their own**. Remove vote asks once. Pressing a row opens that company's overview in a side panel. *Why: a member can rebalance what they have said they would back in seconds, without leaving the dashboard.* Angle: "Your votes are your voice. Move them as your conviction moves." Do not call it a fund or a budget.
- **Watchlist, with the real stage.** Saved deals, plus any voted name the member has since joined. Each joined deal shows its true stage: **Send by [date]** with a Complete investment button, or **In escrow** with Your position. *Why: honest about whether money has moved.*
- **Your investments.** Hero figure, the value curve, the positions table. **Steps** on an in-flight row opens the timeline with the ten-day clock.
- **Explore.** Quick-filter tiles (asset class, who leads, stage, industry) that open the marketplace already filtered.

### 4.2 Marketplace

- **The engine strip** opens the page: open now, closing soon, on the Radar, members voting. All counted live, each a button.
- **Company identities. New and very visible.** Every invented company now has its own logo in its own style: wordmarks in different typefaces (a serif *Loomline*, a monospace `tessellate_`, spaced capitals MERIDEL), symbol-plus-word lockups (calder, aurelia, FERRULE, KESTREL), letter marks, circles, squares, light and dark grounds, on flat deep brand colours. *Why: it reads as a market of real companies, not thirty skins of one icon.* This is a big visual upgrade from the last film.
- **The stage pill. New.** Under each name, the round sits on its own pill ("SERIES A", "SECONDARY", "FUND I") with a five-bar meter from seed to late stage. *Why: tell an early deal from a late one without reading.* It describes maturity only, never risk or return.
- **Card states.** One status per card: Just opened; **In escrow** for a deal the member has funded that has not closed (a quiet chip, and a band "$25,000 in escrow · until the deal closes" with a **Your position** button); **You invested** only once a deal has closed; Signed · complete it (with the orange **Complete investment →** button); View only; SPV full. Chips for Saved and "You voted $25K".
- **Quick look.** A side panel on any card: the raise, four facts, three reasons, who is behind it, the risk line, Ask Spot. It now opens on the member's own stage in that deal and its button is the next real step.
- **The Radar lane.** Sort by **Featured** (default), Most voted, Rising, New. Featured deliberately rotates quiet names to the top each day so nothing is stuck at the bottom. Each card: demand in dollars, voter count, **Details** panel, **Vote**. Once voted, a gold band "You voted $25K" with a pencil; **Remove vote** is in the edit control.
- **Yours** and **For you** filters on the sticky bar, plus class and industry filters.

Angle for the whole page: "Members vote. We source what the votes point at. By the time a deal opens, the demand is already counted."

### 4.3 Deal page

- **Hero** with the company's logo at size on its own colour, the headline, deal type chip, "Organized and advised by AltSpot".
- **The funding header**: Raised so far, Minimum to close, Closing date, Escrow status, a bar measured against the minimum with a labelled marker, admissions close date, members against the cap.
- **What it costs, as cards** (no sideways scroll): the management fee, the SPV fee and the member's share of it, what passes through at cost, and "No capital calls."
- **The minimum, explained** by the rule that set it.
- **The SPV today**: members against the investor cap, retirement money against the 20% and 25% marks, live.
- **Underlined terms open Spot** with that exact question.
- **If the member is already in**: a green band leads, "$25,000 in escrow · Waiting for the deal to close · Your position" (it says "You invested" only once the deal has closed), and the button becomes **Add to your position**. There is no gold Begin investment for someone already in.
- The only gold button on the page is **Begin investment**.

### 4.4 Illustrative scenarios (flagged, see section 8)

On each open deal with an entry valuation: three or more cases with the **total loss first**, labelled Scenario A, B, C, shown **in dollars on the minimum investment** as bars of what comes back, **net of the platform's own fees**, with dilution modelled, every input on screen, sources and dates on comparables, a methodology section, and counsel's disclaimer beside it. What each member saw is recorded. **The film build has this switched on while Ben's final sign-off is pending.** If it is not signed off by the edit, this scene must be cuttable. Narration must never call a scenario expected, likely, a target or a projection.

### 4.5 Checkout: Amount, Read, Sign, Escrow

- **Amount is one question**: "How much do you want to invest?", quick amounts, invest-as profile, and on the right **What you send** in three lines (investment, management fee reserve, total to escrow) with the member's share of the SPV fee as a range and "How the fees work" folded. Example on Calder: $25,000 + $1,250 reserve = **$26,250 to escrow**, share of the $10,000 SPV fee $125 to $250.
- **Read**: confirm each section; the page scrolls smoothly to the next part.
- **Sign**, then **Escrow**.
- **"Your allocation is reserved."** New design: **You signed [date] · Send by [date] · Days left 3 of 10**, a ten-segment bar, one sentence that the deal itself keeps admitting members until its own later date. Send to escrow by Same-Day ACH from the linked bank, or "I'll send later".

Angle: "Sign today, and your spot is held for ten days. Your money goes to escrow in the SPV's name, never to us, and comes back in full if the deal misses its minimum."

### 4.6 Portfolio (rebuilt)

- **One plain sentence first**: "You put in $143,000. It is worth $134,300 today and $51,000 has been paid back to you. Together that is 1.30 times what you put in. Another $25,000 is in escrow, waiting for its deal to close." Then an **as-of date** and "marks are reported quarterly and are unaudited". Under the capital account, one quiet row: "Aurelia Labs · $25,000 · In escrow, awaiting close". Your position on an escrowed deal lands on that row.
- **The capital account**: Invested, Fair value, Realized, TVPI, Net IRR, Largest position. The jargon labels **open Spot** with the definition.
- **A jump row** to every section.
- **Performance over time**: 1Y, 2Y, All; Invested and Paid back layers that switch on and off; guide lines; three figures for the window (Change in value, You put in, Paid back to you). Change in value excludes money the member added.
- **How each position is doing. New chart.** One bar per position from a zero line, **Percent or Dollars**, with what went in beside what it is now. The loss and the exit are shown, never hidden. A position in escrow reads "At cost, not yet marked".
- The ledger, Exposure, **Building the sleeve** (positions against twenty at equal weight, taught not prescribed), Distributions, Fees charged, Held elsewhere (self-reported, kept out of every AltSpot total).
- **Download statement. New.** A one-page dated **capital account statement** with a statement number, set as paper, saved as a PDF. *Why: an LP can hand it to their accountant.* This is a strong institutional beat.

### 4.7 Terminal ("AltSpot Terminal")

- **For you** at the top: three library pieces chosen from what the member voted for, holds and has in flight, **each with its reason in words** ("You have a subscription waiting to go to escrow"), beside wire stories in the categories they follow. Education only.
- A **live bar** dates the wire ("N stories filed today"). The library is titled **Media and content**, four cards across, with drawn thumbnails (sheets for articles, a chart for reports, a waveform for podcasts). Everything opens inside the portal.
- Honest note: the wire stories are seeded demo data, not a live feed. Do not claim live news.

### 4.8 Spot

- Opens from any underlined term, from "Still want to know more? Ask Spot" in panels, or the dock.
- **Answers with pictures**: fees as a sum, escrow and the 506(b) gate as paths, the funding bar and SPV limits as meters. Every figure comes from the same function the product uses.
- Every answer carries its source. It refuses sizing and advice questions. Good beat: ask it a fee question, then ask "how much should I put in" and show it decline.

### 4.9 Watchlist page

One search box that saves a deal or casts a vote with quick amounts, then two lists (Saved deals with stage, Your votes with edit and remove), View opens the quick look in place, Explore underneath.

### 4.10 First-run walkthrough

Nine cards with a spotlight, an agenda and a progress bar, offered once after approval, replayable from Settings. Useful as an opening device if the film wants a guided tour feel.

### 4.11 Settings

- **Appearance**: three tiles drawn in each theme's own colours. Ember is the default for every new member.
- **Invite: "Bring someone into the room."** Second on the page. The benefit shown is the platform's own mechanic: more members voting means wanted names are sourced sooner. It states plainly that **nobody is paid or rewarded for an introduction**, that invitees go through the same questionnaire, and that the link is for people the member knows, sent directly, never posted. **Do not script any referral reward, discount or priority.** Under 506(b) that is the line.
- Deal preferences, the walkthrough, notifications.

### 4.12 The trust layer (new)

- A **footer on every signed-in page**: AltSpot Capital, Rule 506(b), accredited investors, the illiquidity line, links to Disclosures and Documents.
- **/disclosures**: risk, fees, escrow, valuations, the Radar, Spot and the Terminal, conflicts. It says on screen that counsel has not yet reviewed it. Show it briefly or not at all; do not linger.
- The **statement** (4.6).

---

## 5. Design language, for visual direction

- **Three themes.** **Ember** (default): near-black and warm, tight gold and orange light in two corners, no brown. **Ice**: rebuilt, a cold steel-blue canvas with blue glass panes and one gold spark. **Daylight**: a light apricot canvas where controls are ink, not white. Record the film in **Ember**. A three-second theme change in Settings is a nice flourish.
- **Buttons are flat and ranked.** No 3D, no glow, no shine sweep. **Gold appears only where money moves**: Begin investment, Invest, Sign, Send to escrow, at most one per screen and never on a card in a grid. The main non-money action is a **paper-white pill ending in a small gold orb** (the same orb that ends the AltSpot wordmark); on hover the orb stretches into a bar. Secondary buttons are neutral glass. **Complete investment** is the orange heat ramp with an ink arrow and a slow ring. Votes are green.
- **Liquid glass panes**, generous spacing, Borna for display, Figtree for body, Manrope Tabular for every number and label.
- **The live dot** is green and pulsing wherever something is open right now.
- Green is rationed: gains, live, in escrow, votes. Gold means invest.

---

## 6. A suggested scene spine

Adjust to the target length. Click paths are exact.

1. **Cold open, the loop (Marketplace).** Land on `/marketplace`. The engine strip, then the shelf: logos, stage pills, "Just opened", "You voted $50K". Scroll to the Radar. Sort Featured to Rising. Open **Details** on Orrery Space.
2. **Vote.** On a Radar card press Vote, drag the scale, cast. The band reads "You voted". (Optional: pencil, Remove vote.)
3. **The vote became a deal (Dashboard).** `/dashboard`. Needs you: "Ferrule Robotics, which you voted $50,000 for, is open now." Press the bell on the rail to show it follows you.
4. **Your votes as a pool.** Adjust all, plus on Orrery, watch the total, the bar and "Saved". Done. Press a row to open the company overview.
5. **A deal page (Calder Grid).** Hero, funding header, What it costs, the minimum, the SPV today. Press an underlined term, Spot answers with a picture.
6. **Scenarios** (only if signed off). Scenario A first.
7. **Invest.** Begin investment: Amount ($25,000, $26,250 to escrow), Read (auto-scroll), Sign, then **Your allocation is reserved** with the ten-day clock. Send to escrow.
8. **Finish one that is waiting.** Back on the dashboard, Tessellate Data: Steps, "3 of 10", Complete investment.
9. **Portfolio.** The plain sentence, the capital account, 1Y on the curve, Percent to Dollars on the position chart (let the loss be seen), then **Download statement** and the paper page.
10. **Terminal.** For you with its reasons, Media and content, open one piece.
11. **Close on trust.** The footer line, Settings Appearance (Ember to Ice to Daylight and back), the invite card.

Beats worth a line of narration each: counted demand before sourcing; escrow in the SPV's name, returned in full if the minimum is missed; no capital calls; the fee in plain numbers; losses shown; Spot explains and never advises; signing is not investing; one page for your accountant.

---

## 7. Recording checklist

- **Record from the production build only**, never the dev server. The build currently running was made with `ASC_SHOW_RETURN_SCENARIOS=true`. Do **not** run `npm run serve:demo`: it rebuilds without that flag and the scenarios vanish. To restart without rebuilding use `npm run serve:built`. URL: `http://localhost:4000`.
- Theme: **Ember**. It is the default on a fresh browser profile.
- A clean account: sign in with any new email, or open `/reshoot?to=/dashboard`. An address containing `+new` gives an empty, un-onboarded account for the questionnaire scene.
- Captures so far were made at 1600x1000, 1440x780 and 1280x720.
- Reference stills for every screen above are in `screenshots/phase2/`, folders `15` through `23`. The most useful: `17-company-identities`, `18-buttons`, `21-vote-pool-opt-in`, `22-three-themes`, `23-stage-pill`, `16-escrow-clock-and-polish`, `15-portfolio-terminal-radar`.
- If the database is ever reset, run `npm run db:seed`, because card artwork is stored with each deal.

---

## 8. Still pending counsel (Ben). Keep these cuttable.

1. **Illustrative return scenarios**: built to counsel's spec, on in the film build, final sign-off pending.
2. **The /disclosures page**: not yet reviewed as a whole.
3. **"Funded · closed"** as the word for a deal that has closed.
4. **The invite card's framing**, and whether any non-transaction-based thank-you is ever allowed. Today: nothing of value, to anyone.
5. **The ACA portfolio-construction figures** in the Terminal piece "Twenty positions, equal weight".
6. **The offering memorandum's business description** is still counsel's specimen text with the names swapped; the pane carries a specimen notice. Do not zoom into the document body.
7. Named counterparties (administrator, escrow agent, counsel) in deal terms: not built, waiting on legal.
8. **The manager entity's legal name.** Documents and the memorandum cover say "AltSpot Capital, LLC". The structure has a manager subsidiary whose legal name is not recorded anywhere in the platform. Counsel to confirm before any document is shown in close-up.

---

## 9. One-paragraph summary, if the brief needs an opening

AltSpot is a curated SPV marketplace for private markets where members vote on the companies they want, AltSpot sources what the votes point at, and each deal raises into escrow and closes when its minimum is met. Since the last demo the platform has grown a real institutional layer: the fee is stated in plain numbers as counsel confirmed it, a member has ten clear days to fund after signing, the platform never says "invested" before money has moved, Portfolio opens with one plain sentence and ends with a statement you can hand your accountant, the bell on every page tells you what needs you, your votes are one pool you can rebalance in seconds, every company on the shelf has its own identity and stage, and the whole thing runs in three themes with a calmer, flatter, more confident design.
