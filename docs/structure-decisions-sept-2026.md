# AltSpot Ventures: model and mechanics changes (Sept 2026, v3)

Context brief for any conversation working on the platform build or the product demo video. This reflects decisions made by Tyler and Ryan in structuring sessions with counsel (Ben). Where something is still pending Ben's sign-off, it says so. Use this as the source of truth over any earlier description of the platform. v2 (Sept 14) folded in Tyler and Ryan's answers to the six demo decisions (section 13). v3 (Sept 16) records the four points Tyler and Ryan aligned on and sent to Ben (section 14): 5% fee with a $15K minimum, 506(b) SPVs, uniform partner carry split, and the 15/5 carry split. Pending Ben's green light.

## 1. What changed, in one paragraph

AltSpot Ventures launches as a curated SPV marketplace, not a lender. There is no warehouse loan and no anchor fund at launch. Every deal is raised on the platform into escrow and closes once the SPV is fully funded, typically 30 to 60 days. AltSpot's Manager LLC is the organizer and adviser of record on every SPV, including deals led by syndicate partners. The fee is a one-time 5% management fee on capital raised with a $15,000 minimum per SPV (the minimum governs below a $300K raise). Carry is 20% on AltSpot-led deals: 15 points to the GP LLC Tyler and Ryan own, 5 points to the Manager LLC the Inc. owns. Partner-led deals: the lead keeps all 20 if the deal is not listed on the marketplace; if listed, 15 to the lead and 5 to AltSpot across the whole SPV. No annual fees, no capital calls. SPVs are 506(b) behind login, with the platform establishing the pre-existing relationship before an investor sees deals. LP membership tiers are a separate, optional subscription. SAFE investors get one security, the SAFE, and participate in fees and the Manager's carry share through the company. The alignment story ("we commit our own capital first") stays in the narrative; the mechanics of how are not shown or explained.

## 2. Entities and who does what

| Entity | Role | Owns / earns |
|---|---|---|
| AltSpot Ventures, Inc. (Delaware C-corp) | Software, marketplace, brand. Raises the SAFE. | Owns Manager LLC 100%. Holds no portfolio positions, ever. |
| Manager LLC (wholly owned by the Inc.) | Organizer and adviser of record on every SPV. Files as an exempt reporting adviser. | One-time 5% fee, $15K minimum. 5 of 20 carry points on AltSpot-led deals; 5 points on marketplace-listed partner deals. |
| GP / Carry LLC (Tyler, Ryan) | Holds the founders' carry. | 15 of 20 carry points on AltSpot-led deals. |
| Deal SPV (Delaware LLC, one per deal) | Buys new shares in one company. 506(b) behind login, fully funded through escrow, built to the VC fund definition. | Pays the 5% fee ($15K minimum) and carry. |
| Syndicate partner | "Deal lead" with a non-voting profits interest under a deal lead agreement. Never the organizer or a co-GP. | 20 points if not listed on the marketplace, 15 if listed (5 to AltSpot). Must report to investors on schedule or forfeit part of carry. |
| AltSpot fund (later, not at launch) | LP fund that invests alongside SPVs at the same closing. | Not built yet. Do not show it as a product or a mechanic in launch materials. |

## 3. Removed from the model (delete anywhere it still appears)

- Warehouse loan / warehouse line from the Inc. to SPVs. Gone. Deals are not pre-funded by AltSpot.
- Anchor fund / sponsor co-invest fund at launch. Gone. Comes later as "the AltSpot fund."
- "Stapled carry units" for SAFE investors. Gone.
- The 5/5/5 fee framework (5% management, 5% origination, 5% reserve). Gone. The fee is a single 5% with a $15K minimum.
- The flat headcount-tiered fee from v1 and v2. Gone. Superseded by 5% with a $15K minimum.
- 506(c) language for SPVs. SPVs are 506(b). (v1 and v2 said the opposite; v3 controls.)
- Any copy saying SAFE investors "own the portfolio." They own the company; the company earns fees and a share of carry.
- Any copy implying AltSpot funds a founder's round on day one, or any dollar figure for an AltSpot position on a deal page. (The alignment narrative itself stays; see section 13.)

## 4. Deal lifecycle the product must support

1. Deal is listed on the gated marketplace with an "up to" allocation, a minimum close amount, and a closing date 30 to 60 days out.
2. Investors (accredited by self-certification questionnaire with reasonable belief, $10K minimum) subscribe. Money goes into escrow, not to the SPV or the company. Under 506(b) an investor can only subscribe to deals that went live after the platform established a relationship with them.
3. Admission cut-off is 24 hours before the scheduled wire. Everyone admitted by then is on the member register with locked percentages. This is what preserves QSBS for investors.
4. If the minimum is met, the SPV closes and buys new shares directly from the company. If not, escrow refunds.
5. Post-close: K-1s, reporting, distributions at exit, carry waterfall.

Product implications: escrow-first flow, per-SPV investor cap enforcement, verification workflow, admission cut-off timer, member register with percentage lock, refund path.

## 5. Fees and carry (final)

- One-time 5% management fee on capital raised, $15,000 minimum per SPV, charged by the SPV to Manager LLC. The minimum governs up to a $300K raise; 5% governs above it ($400K raise = $20K, $600K = $30K, $1M = $50K). No annual fees. No capital calls.
- LP membership tiers are a separate, optional subscription to the platform (upgrade plans). They are not deal fees and should never be described as such.
- Partner-led deals: same fee, charged by the SPV. Ryan asked Ben whether the 5% applies or a flat $15K; pending. Partners toggle whether their deal is listed on the marketplace.
- No one, internal or external, is ever paid per investor or per dollar they bring in. This is the broker-dealer line and it is absolute.
- Carry: 20% on AltSpot-led deals. 15 points to GP / Carry LLC (Tyler, Ryan), 5 points to Manager LLC (the Inc.). Partner-led deals: lead keeps 20 if not listed on the marketplace; 15 to the lead and 5 to AltSpot across the whole SPV if listed. Never split by investor source. The demo stays silent on carry numbers.
- SAFE investor perks: fee-free and carry-free access to deals for life (as a disclosed side letter), plus first allocation rights in the future AltSpot fund.

## 6. Guardrails to build into the platform

- Investor count per SPV: hard cap. 100 by default; 250 allowed only for SPVs at $12M or less that qualify as venture capital funds. Make the cap a per-SPV setting.
- Accreditation under 506(b): a self-certification questionnaire that supports a reasonable belief, with records kept. No third-party verification required.
- Relationship gate (Citizen VC process): gated sign-up, investor questionnaire on sophistication and accreditation, a cooling-off period, then deal access. Record the relationship-established date per investor. An investor may subscribe only to deals launched after that date. Partner referral links land on the same gate.
- No deal specifics on any public page. Live deals, Radar names, and deal emails are behind login only. Deal emails go only to members whose relationship predates the deal.
- IRA and retirement money tracked per SPV and capped below 25% of each SPV.
- Transfer restrictions on SPV interests. No secondary trading feature at launch. The liquidity window is Phase 2 content and may be described with the approved line only.
- Every SPV that closes at launch: primary shares only, no borrowing, no redemption rights, management rights letter from the company. Listing a secondary SPV is a Phase 2 decision with counsel, because one non-venture fund moves the adviser off the VC exemption. Radar may show secondaries as sourcing intelligence and "Secondaries · Soon" stays on screen; that is a roadmap signal, not a listing.
- Form D and state notice filings per SPV; bad-actor checks on leads and principals.
- Per-deal tracking log: acquisition date, admitted members and percentages at that date, QSBS certificate from the company, share issuance date (before or after July 4, 2025 matters for QSBS tier).

## 7. Positioning and copy rules

- The Inc. is a technology and marketplace company. Never describe it as an investor, a fund, or a portfolio holder.
- Marketplace positioning: curated, premium, "less adverse selection." Say what AltSpot checks (diligence scorecard, partner vetting, reporting enforcement), never guarantee outcomes.
- "Michelin star" is fine as a metaphor internally; in public copy describe the curation process, not a quality promise.
- QSBS: can be mentioned as available where the company qualifies and the investor is admitted before close. Never guaranteed. California does not conform.
- 506(b): never name a live deal publicly, in ads, on social, or in Terminal. Platform and brand marketing is fine. Deal-specific emails go through Postmark to members only.
- Liquidity: no liquidity window at launch. In Phase 2 sections, use the approved line only: "Select positions may become eligible for an organized annual liquidity window; participation and execution are not guaranteed."
- Alignment: "We commit our own capital first" and "we go in first" stay in narration as the alignment story. Never explain the mechanics, never name the entity that invests, never show a dollar figure for an AltSpot or sponsor position. Sponsors (Tyler and Ryan personally, or an AltSpot entity, and later the fund) will invest alongside members in some form; the how is not part of the product.
- Positioning: keep the transaction rails and the engine (finding, diligencing, and investing in private markets). Headline: "The new standard for private market ownership." Curation and organizer-of-record are how it works, not a replacement headline.
- Speed-to-founder is not the pitch. The pitch is a clean, fully funded close and a premium LP experience.

## 8. Back office

- Sydecar as the SPV back office under AltSpot's organizer account (Sydecar vehicles are self-advised, so the organizer is the adviser and manager). AltSpot's own front end sits on top for the LP experience.
- Still to confirm with Sydecar: escrow / fund-up-front close support, API access for a white-labeled experience, whether SPV documents can allocate a deal lead's carry directly to the lead's entity.
- Sydecar cost reference: 2% of capital raised between $2,500 and $12,500, plus a $2,000 regulatory fee. A $1M SPV is about $14,500 of cost against a $25K top-tier fee.

## 9. Demo video: what to show and what not to show

Show:
- Radar with a mix of everything AltSpot is looking at allocating toward: secondaries in late-stage names and early-stage primaries from pre-seed to Series C. Narration stays zoomed out ("what we are looking at"), not focused on secondary markets. "Secondaries · Soon" stays on screen.
- A curated deal page with allocation, minimum, closing date, and the diligence summary.
- Investor onboarding with accreditation verification.
- Subscribe into escrow, with the admission cut-off visible.
- A partner's deal with the marketplace toggle.
- Post-close reporting and the bi-annual reporting requirement for partners.

Do not show:
- A warehouse line, bridge loan, or AltSpot "funding the round."
- The mechanics of how AltSpot or its sponsors commit capital, or any dollar figure for that position. The alignment line is narration only.
- An anchor fund as a product or mechanic at launch.
- Carry numbers, carry units, portfolio ownership for SAFE investors, or any percentage-of-capital fee.
- A secondary trading screen or a liquidity window as a launch feature. Liquidity lives in the Phase 2 section with the verbatim line.
- A broker as the destination for Radar demand.

## 10. Open items pending counsel

- Organizer / adviser-of-record structure keeps the platform out of broker-dealer territory (expected yes; this is the AngelList model).
- Headcount-tiered fee with lead-sourced waiver reads as a fund fee.
- VC adviser exemption holds across all SPVs; treatment of existing AltSpot Capital LLC vehicles.
- Deal lead agreement terms: indemnities, reporting covenant with carry forfeit, E&O coverage.
- 5 carry points in Manager LLC does not weaken the Inc.'s operating-company status.
- Broker-dealer and secondary market roadmap for year two to three.

## 11. Longer-term roadmap (not launch scope)

- Raise the AltSpot fund; it invests alongside SPVs at the same closing.
- Broker-dealer affiliate (own registration or acquisition), then a secondary market for SPV interests, likely with an ATS partner first.
- Open the marketplace to other asset classes once the adviser is SEC-registered or the exemption question is settled.

## 12. Conflicts with existing ASC Platform project docs (resolve in the demo and deck)

These project docs were written under the earlier "principal model" (AltSpot funds the round first, then syndicates). That model is retired. Specific lines to change:

| Where | Currently says | Now |
|---|---|---|
| hero-demo-production-doc, 0:40 VC line | "We commit our own capital first, on every position we bring you." | Keep, as narration. Do not add how, who, or how much. |
| hero-demo-production-doc, investor ad line | "Every position on the shelf already has our own money in it." | Keep if Tyler and Ryan confirm it is literally true at launch; otherwise soften to "we invest alongside you." No mechanics. |
| hero-demo, P3 "committed position line" (called the most important frame) | AltSpot's committed position on the deal page, with a dollar figure | Replace with the funding-progress component (raised so far, minimum to close, closing date, escrow status) plus a small alignment chip with no number, e.g. `SPONSORS INVEST ALONGSIDE MEMBERS`. The dollar figure goes. |
| positioning-report, lean #1 | "Certainty of close, and one clean line on the cap table" | Keep "one clean line on the cap table." Reframe certainty as "minimum-funded close through escrow, no wire chasing," not "we fund it." |
| positioning-report, "30-day close" | 30 days | 30 to 60 days, closes when the minimum is met. |
| vc-deck v9 onward, "AltSpot Fund" (renamed from Warehouse) | An active engine | Later phase only. Move out of launch sections. |
| deck, competitive scan, product screenshots | 5% management (one time) + 0.5% admin + 10% carry | One flat fee per SPV, one time, tiered by investor count. No annual fees, no capital calls. Carry is market standard and set per deal; the demo stays silent on it. No fee or carry number on screen. |
| positioning-report risks #1, #2, #4 | Warehouse-to-SPV transfer pricing, 40% test exposure from a rotating warehouse, warehouse recycle velocity | Largely retired with the warehouse. The 40% test still matters for the Inc., but with no loans and no positions it is a much smaller issue. |
| positioning-report, "we take positions, we don't place listings" | Principal framing | Soften, don't cut. Alignment stays as narrative ("we go in first"); "we don't place listings" goes, because the marketplace does list AltSpot-led and partner-led deals. |
| Liquidity Engine slide, T-45 to T+5 auction | A launch mechanic | Phase 2, after a broker-dealer or ATS partner. Keep it in the Phase 2 deck section. In the film, the verbatim liquidity line only. |

New things the docs do not cover yet: the syndicate partner model (deal leads, marketplace toggle, bi-annual reporting with carry forfeit), the escrow-first close with admission cut-off, and Sydecar as back office.

## 13. Tyler and Ryan's answers to the six demo decisions (Sept 14, 2026)

1. **Fee and carry numbers.** Flat fee, low minimums. Carry is market standard and set per deal (roughly 5% to 20%). The demo stays silent on carry; it can say "one flat fee per SPV, never a percentage of what you invest."
2. **Radar.** Keep `SECONDARIES · SOON`. Keep the liquidity window in Phase 2. Radar shows a mix: secondaries AltSpot has listed as interest, plus early-stage companies from pre-seed to Series C. Narration is zoomed out (everything AltSpot is looking at allocating toward), not a secondary-markets pitch, and no broker line.
3. **Closing line.** Neither of the two offered. Placeholder for something better; fix later.
4. **Alignment.** "We commit our own capital first" stays for narration. Mechanically it is still being worked out (personal sponsor checks, AltSpot entity capital, later the fund). Do not explain how, do not show a figure.
5. **Annual fees.** None on SPVs or investments. No capital calls. The flat fee is one-time. Membership fees exist as optional LP plan upgrades and are a different thing.
6. **Positioning.** Keep the transaction rails and the engine for finding, diligencing, and investing in private markets. "The new standard for private market ownership." Organizer-of-record and curation describe how it works; they do not replace the rails headline.

Compliance note on item 4: the alignment line is a factual claim under the anti-fraud rules even when the mechanics are unstated. It should be true on day one in some form (a sponsor check in each deal is enough). Ben should see the exact wording before it runs as paid.

## 14. Aligned with Ryan and sent to Ben (Sept 16, 2026), pending green light

1. **Fee:** 5% one-time management fee on capital raised, $15,000 minimum per SPV. Minimum governs to $300K; 5% above.
2. **Exemption:** 506(b) for every SPV, behind login, with the platform establishing the relationship first (questionnaire, cooling-off period). Accreditation by self-certification with reasonable belief. Asked Ben to confirm a referral program works under 506(b) with that process.
3. **Partner deals:** deal lead with a non-voting profits interest, never co-GP. Lead keeps 20 if not listed on the marketplace; 15 to lead and 5 to AltSpot across the whole SPV if listed. Never split by investor source. Same structure as AngelList.
4. **AltSpot carry:** Ben's Option 3. 15 points to the GP LLC (Tyler, Ryan), 5 points to the Manager LLC (Inc.). SAFE investors get the fee stream and 5 points on every deal through the company.

Soft commitments may begin. Fee and carry numbers may appear in the product once Ben confirms; keep them config-gated until then.

## 15. Counsel's response and Tyler's product answers (Sept 16, 2026, v4 addendum)

Ben replied to the section 14 package on Sept 16. Where this section conflicts with sections 1 to 14, this section controls. Items marked PENDING TYLER need a product decision before they are built.

### What counsel confirmed

- Full funding before each SPV acquires its position means no leverage, so each SPV qualifies as a venture capital fund and the Section 203(l) exempt reporting adviser route works. No warehouse lines keeps the parent's Investment Company Act analysis simple. Full pre-funding admits every investor before acquisition, so QSBS timing is satisfied automatically.
- Structure: parent Delaware corporation; wholly owned manager subsidiary filing as an ERA under 203(l), holding the GP seat and earning fees; SPVs as venture capital funds; deal leads participate vehicle by vehicle.
- Carry: 20% stays. The Inc.'s 5 points sit in the manager subsidiary. The deal team's 15 points sit outside the corporate chain in a pass-through carry LLC owned by Tyler and Ryan. No separate carry entity is needed for the Inc.'s points.
- 506(b) behind login: confirmed. Public site stays generic (no live deals, no deal terms, no track-record touting). A prospect registers, completes an accreditation and sophistication questionnaire, the platform substantively evaluates it, and only then sees offerings, ideally only offerings that open after the relationship was established. Partner-sourced investors can qualify through the lead's own pre-existing substantive relationship, but each lead must certify that relationship per investor at referral.
- Reporting and forfeiture: quarterly company updates are a contractual duty of the lead in each vehicle's documents, with a cure period. Persistently delinquent leads forfeit unvested carry, reallocated to that SPV's investors. (Supersedes "bi-annual" in section 9.)
- Escrow: subscription funds move by ACH into a segregated account in the SPV's own name or a bank escrow / FBO account, never through an AltSpot operating account. Escrowed funds sit in an interest-bearing deposit or government money market fund. The subscription agreement defines the contingency (minimum raise, outside date, what "does not close" means) and provides automatic return of principal plus each investor's pro rata share of interest if it fails. AltSpot does not keep the float; it may be used to pay pass-through third-party expenses.

### What counsel changed

- **Management fee (supersedes section 5 and section 14 item 1).** Compensation calculated from capital raised is what triggers broker-dealer registration under the FundersClub and AngelList no-action line. A one-time 5% of capital raised is out. Two compliant options: (a) a flat fee per SPV (the $15,000), or (b) an annualized management fee computed on committed capital over the vehicle's life, funded up front at closing as a fee reserve (rate times assumed term), drawn down periodically as earned, with unearned amounts refunded to investors, optionally paired with reimbursement of SPV-level expenses. DECIDED (Tyler, Sept 16): both. A flat $10,000 fee per SPV, plus an annualized management fee of 1% per year of committed capital for an assumed five-year term, funded at closing as a fee reserve (5% of each subscription), drawn down as earned, with unearned amounts refunded to investors. The 5% of capital raised is retired. SHOW_FEE_TERMS still gates the numbers until Ben signs off on the wording.
- **Partner carry (supersedes section 14 item 3).** Splitting carry by investor source inside one SPV makes both the lead and AltSpot look like unregistered brokers. Counsel's only workable answer: two SPVs per partner-led deal. Partner-sourced investors go into the partner SPV, where the partner takes all 20 points. AltSpot-sourced investors go into the AltSpot SPV, where the partner gets 5 points and the AltSpot carry vehicle takes 15. AltSpot is the manager of both and earns its management fee on both. DEFERRED (Tyler, Sept 16): the partner structure is being reworked. Phase 2 item 14 (partner console) is on hold. Referral source is still recorded for reporting only.
- **Secondaries (supersedes the Radar secondaries note in section 6 and the seeded "Late-stage secondary" deals).** Facilitating third-party sales for a fee is core broker-dealer activity, and an SPV formed to buy a secondary position holds a non-qualifying investment that would kill the 203(l) exemption for the entire adviser. On hold entirely. DECIDED (Tyler, Sept 16): the demo keeps its two invented late-stage secondary deals and the SECONDARIES · SOON chip as a picture of what the platform will do later, not what launches. No trading or liquidity UI is built.

### Tyler's product answers (Sept 16)

1. Fee on the subscription panel was to be additive on top of the subscription amount. Moot until the fee option above is chosen; if (b), the investor funds subscription plus fee reserve, which is additive by construction.
2. Real companies (OpenAI, Databricks, and the Radar names) are removed from the platform and archived in the repo until legal approves.
3. The AltSpot Growth Fund deal stays on the shelf for now. Its dollar figure for the GP commitment, its 10% carry copy and "same terms" language still fall under the section 3 and section 7 rules and come out.
4. Calder Grid's seed-round position language is removed entirely.
5. 506(b) confirmed; the 506(c) five-year letter model goes.
6. No capital calls, confirmed. The Operating Agreement section 2.5 capital-call mechanism is a counsel item.
7. The legal binder JSON is counsel's; it is regenerated from revised documents, not hand-edited.

### Not yet in product scope

Founder scoring disclosure (counsel item 9) and founder intake data terms (counsel item 10) apply to the founder intake, which this codebase does not have yet. Investor-facing diligence copy must describe process without implied endorsement: "cleared our screening criteria and human review" is the ceiling.
