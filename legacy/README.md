# AltSpot Capital — Investor Portal (Functional Demo)

A fully clickable, front-end-only demo of the AltSpot investor marketplace, from login through funded investment. No backend — all state lives in the browser's localStorage, so the flow persists across pages and sessions on the same machine.

## Run it

1. Unzip the folder.
2. Open `index.html` in Chrome, Edge, or Safari. (Double-clicking the file works; no server needed.)
3. Click **"Use demo investor"** on the login screen, or sign in with any email + password.

First login routes into the 5-step setup wizard; after that, every login lands on the dashboard.

> The camera step (KYC) requests webcam access. Some browsers block camera on `file://` pages — the **"Camera blocked? Simulate"** link covers that case. If you want the real webcam, serve the folder (`python3 -m http.server`) and open `http://localhost:8000`.

## The demo flow (for walkthroughs)

1. **Login** → first-time setup wizard
2. **Wizard**: accreditation letter download (Parallel Markets handoff, valid 5 years) → W-9 info → KYC (ID upload + live capture) → investment profile → bank link (both skippable)
3. **Dashboard**: portfolio value chart, positions, pending-funding countdowns (a seeded Meridian position makes it feel lived-in)
4. **Marketplace**: three curated deals, allocation-remaining bars, AltSpot's committed capital on every card
5. **Deal page**: thesis, metric chart, risk, itemized fees, data room, SpotBot stub, committed-position block
6. **Invest**: profile + amount → split-screen subscription agreement that fills itself as you confirm three grouped questions → fee transparency → one typed signature signs everything
7. **Payment**: ACH now (linked bank or manual demo fields) or hold the spot 10 days
8. **Docs / Profiles / Settings**: auto-saved agreements, the Vault, reset-demo control

To demo the 10-day expiry state or re-run the flow, use **Settings → Reset demo data**.

## Economics shown in the product

- 5% platform fee
- Up to 2% admin reserve — itemized per deal (SPV formation & legal, fund administration, tax prep & K-1s, banking/escrow/compliance); **unused remainder returned to investors at close**
- 10% carry standard · 20% carry on AltSpot-led deals
- Collected once at closing. No annual fees. No capital calls, ever.

## Notes for the real build

- `assets/store.js` is the demo's "backend." It implements the subscription state machine (`started → docs_signed → funded → accepted → closed`, exits `expired`/`refunded`) and data shapes that map onto the production Supabase schema — replace this file with API calls and the pages carry over.
- Deliberately excluded: liquidity/secondaries surfaces (legally gated pending BD partner + counsel on PTP safe harbor — nav shows a disabled "Secondaries · Soon" only), SPAN (discontinued), the public site and application flow (out of scope; demo starts at login).
- All companies are fictional. Demo warns against entering real SSNs or bank details.

— AltSpot Capital · internal demo · not an offer of securities
