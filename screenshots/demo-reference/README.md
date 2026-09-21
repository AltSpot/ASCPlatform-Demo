# Demo reference screenshots

Every page of the platform, plus the panels and states a page alone does not show, in all three themes. Taken 2026-09-21 from the production build with return scenarios on, straight after `npm run db:reset`, so every screen shows the demo story the product film uses.

- `ember/` the default theme
- `ice/`
- `daylight/`

The file names are the same in each folder. `NAME-1600x1000.png` is what is on screen on arrival. `NAME-full.png` is the whole page, top to bottom, at 1600 wide (pages only; a panel or a state is one shot). The login page is a single shot: it fits one screen.

Dates on screen are relative to the day the screenshots were taken. Every company, term and figure is invented demo data.

To retake them: `node scripts/make-reference-plans.mjs`, then `bash scripts/shoot-reference.sh` (all three) or `bash scripts/shoot-reference.sh ice` (one). Run `npm run db:reset` afterwards, because the sweep mints one account per shot and their seeded votes inflate the Radar's totals.


## Before the portal

| File | Screen | Full page |
|---|---|---|
| `01-login` | login |  |
| `02-setup-step-1` | setup step 1 | yes |
| `03-setup-step-2` | setup step 2 | yes |
| `04-setup-step-3` | setup step 3 | yes |
| `05-setup-step-4` | setup step 4 | yes |
| `06-setup-step-5` | setup step 5 | yes |
| `07-marketplace-before-approval` | marketplace before approval | yes |
| `08-dashboard-new-member-no-book` | dashboard new member no book | yes |

## The portal, as the seeded demo member

| File | Screen | Full page |
|---|---|---|
| `10-dashboard` | dashboard | yes |
| `11-marketplace-shelf` | marketplace shelf | yes |
| `12-marketplace-radar` | marketplace radar |  |
| `13-deal-calder` | deal calder | yes |
| `14-deal-aurelia-already-in-escrow` | deal aurelia already in escrow | yes |
| `15-deal-kestrel-partner-led` | deal kestrel partner led | yes |
| `16-checkout-1-amount` | checkout 1 amount | yes |
| `17-checkout-2-read-and-sign` | checkout 2 read and sign | yes |
| `18-checkout-4-allocation-reserved` | checkout 4 allocation reserved | yes |
| `19-portfolio` | portfolio | yes |
| `20-portfolio-statement` | portfolio statement | yes |
| `21-watchlist` | watchlist | yes |
| `22-terminal` | terminal | yes |
| `23-terminal-article` | terminal article | yes |
| `24-terminal-report` | terminal report | yes |
| `25-terminal-podcast` | terminal podcast | yes |
| `26-docs` | docs | yes |
| `27-profiles` | profiles | yes |
| `28-preferences` | preferences | yes |
| `29-settings` | settings | yes |
| `30-disclosures` | disclosures | yes |
| `31-member-register-internal` | member register internal | yes |

## Panels and states

| File | Screen | Full page |
|---|---|---|
| `40-bell-panel` | bell panel |  |
| `41-dashboard-steps-ten-day-clock` | dashboard steps ten day clock |  |
| `42-your-votes-adjust-all` | your votes adjust all |  |
| `43-your-votes-company-overview` | your votes company overview |  |
| `44-quick-look-not-joined` | quick look not joined |  |
| `45-quick-look-in-escrow` | quick look in escrow |  |
| `46-quick-look-signed-not-sent` | quick look signed not sent |  |
| `47-radar-details-panel` | radar details panel |  |
| `48-radar-vote-scale` | radar vote scale |  |
| `49-how-it-works-panel` | how it works panel |  |
| `50-spot-answers-with-a-picture` | spot answers with a picture |  |
| `51-spot-declines-advice` | spot declines advice |  |
| `52-first-run-walkthrough` | first run walkthrough |  |
| `53-portfolio-position-chart-dollars` | portfolio position chart dollars |  |
| `54-deal-scenarios` | deal scenarios |  |
| `55-deal-what-it-costs` | deal what it costs |  |
