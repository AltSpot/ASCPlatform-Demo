/* ============================================================
   ASC deals.js — seeded marketplace inventory (demo data)
   Fee model per deal: 5% platform fee · up to 2% admin reserve
   (itemized; unused remainder returned to investors at close) ·
   10% carry, 20% when AltSpot leads.
   All companies fictional.
   ============================================================ */
window.DEALS = [
  {
    id: 'aurora',
    name: 'Aurora Robotics',
    entity: 'ASC Aurora SPV, LLC',
    tag: 'AltSpot-led · Series A',
    kind: 'led',
    sector: 'Industrial AI · Robotics',
    stage: 'Series A',
    art: 'linear-gradient(135deg,#3B2E12 0%,#8F6B25 55%,#C9A14A 100%)',
    blurb: 'Autonomous picking systems for mid-market warehouses — 14 paid deployments, 3.1x net revenue retention, and a lead order book into 2027.',
    thesis: [
      'Mid-market logistics operators are priced out of enterprise robotics. Aurora sells a contained, per-lane system that pays back in under 14 months, with deployments live across 14 facilities.',
      'Revenue has compounded 3.1x year over year on retention-led expansion; existing customers account for 68% of new lane orders.',
      'AltSpot led this round after a full Oliphron diligence cycle: customer reference calls across 9 accounts, unit-economics rebuild from invoice data, and independent technical review of the perception stack.'
    ],
    risks: 'Early-stage venture risk applies: customer concentration in 3PL operators, hardware supply-chain exposure, and competition from enterprise incumbents moving down-market. Total loss of capital is possible. See the investment memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 1500000,
    allocationRemaining: 570000,
    targetClose: 'Aug 21, 2026',
    altspotCommitted: 400000,
    committedNote: 'AltSpot led this round and holds its position permanently.',
    fees: { platform: 5, adminMax: 2, carry: 20, carryNote: 'AltSpot-led opportunity' },
    media: { type: 'metric', label: 'Net revenue retention', series: [100, 122, 149, 171, 204, 231, 262, 310], caption: 'Indexed NRR by quarter, Q3 2024 – Q2 2026 (company data, AltSpot memo)' },
    docs: ['Investment Memo — Aurora Robotics (AltSpot)', 'Subscription Agreement — ASC Aurora SPV', 'Series A Term Summary', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'What exactly am I buying?', a: 'Based on the AltSpot memo, you are subscribing for membership interests in ASC Aurora SPV, LLC — a special purpose vehicle formed by AltSpot to invest in Aurora Robotics\u2019 Series A preferred stock. You own interests in the SPV, not shares of Aurora directly. Subject to AltSpot review, required documents, and final acceptance. Not legal, tax, or investment advice.' },
      { q: 'How is AltSpot paid on this deal?', a: 'Per the offering materials: a 5% platform fee and an admin reserve of up to 2%, both collected once at closing and itemized in your subscription documents — any unused admin reserve is returned to investors at close. AltSpot leads this deal and receives 20% carried interest on profits at exit. There are no annual fees and no capital calls, ever. Not legal, tax, or investment advice.' },
      { q: 'What are the biggest risks?', a: 'Based on the AltSpot memo: early-stage loss risk, customer concentration among 3PL operators, hardware supply-chain exposure, and long illiquidity — there is no established path to sell your position. AltSpot\u2019s own $400,000 position carries these same risks. Please read the full Risk Factors document before subscribing.' }
    ],
    deck: [
      { kicker: 'Aurora Robotics · Series A', title: 'Warehouse automation the mid-market can actually buy.', body: ['Enterprise robotics starts at seven figures and eighteen-month integrations. Aurora ships a contained, per-lane picking system that installs in a weekend and pays back in under 14 months.'], stats: [{ k: 'Paid deployments', v: '14' }, { k: 'Payback period', v: '<14 mo' }, { k: 'Net revenue retention', v: '3.1x' }] },
      { kicker: 'The problem', title: 'Labor is the largest line item nobody can staff.', body: ['Mid-market warehouses run 30–80 pick lanes with turnover above 60% a year. They cannot underwrite enterprise automation, and they cannot hire their way out.', 'The segment is 41,000 facilities in North America alone — effectively unserved.'] },
      { kicker: 'The product', title: 'One lane. One weekend. One invoice.', body: ['A self-contained cell — arm, perception stack, and conveyor interface — priced per lane per month. No systems integrator, no facility redesign.', 'Customers start with two lanes and expand: 68% of new lane orders come from existing accounts.'] },
      { kicker: 'Traction', title: 'Retention is doing the selling.', body: ['Revenue has compounded 3.1x year over year. The current order book extends into 2027, led by three national 3PL operators.'], stats: [{ k: 'YoY revenue growth', v: '3.1x' }, { k: 'Expansion share of orders', v: '68%' }, { k: 'Order book', v: 'into 2027' }] },
      { kicker: 'The round', title: 'AltSpot led this round.', body: ['AltSpot underwrote the Series A through a full Oliphron diligence cycle — nine customer reference calls, a unit-economics rebuild from invoice data, and an independent technical review.', 'Our warehouse committed the full check at close. We retain our position permanently and offer participation through ASC Aurora SPV at a $10,000 minimum.'], stats: [{ k: 'AltSpot committed', v: '$400K' }, { k: 'SPV allocation', v: '$1.5M' }, { k: 'Minimum', v: '$10K' }] }
    ]
  },
  {
    id: 'meridian',
    name: 'Meridian Health AI',
    entity: 'ASC Meridian SPV, LLC',
    tag: 'Co-investment · Series B',
    kind: 'coinvest',
    sector: 'Healthcare · Clinical AI',
    stage: 'Series B',
    art: 'linear-gradient(135deg,#101B18 0%,#1E4A3C 55%,#6FA97C 115%)',
    blurb: 'Clinical documentation AI deployed across 90+ hospital systems. AltSpot co-invests alongside the round\u2019s tier-1 lead on identical terms.',
    thesis: [
      'Meridian\u2019s ambient documentation platform is live in more than 90 hospital systems, cutting physician documentation time by an average of 54% in published deployments.',
      'The Series B is led by a tier-1 healthcare investor; AltSpot secured a co-investment allocation on identical terms and underwrote the company independently through Oliphron.',
      'Contracted ARR has doubled in the trailing twelve months with net revenue churn below 2%.'
    ],
    risks: 'Growth-stage venture risk applies: reimbursement and regulatory shifts in clinical AI, competition from EHR incumbents, and long illiquidity. Total loss of capital is possible. See the investment memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 2000000,
    allocationRemaining: 240000,
    targetClose: 'Aug 8, 2026',
    altspotCommitted: 250000,
    committedNote: 'AltSpot invests alongside the community on identical terms.',
    fees: { platform: 5, adminMax: 2, carry: 10, carryNote: 'Standard co-investment' },
    media: { type: 'metric', label: 'Contracted ARR', series: [100, 118, 131, 152, 168, 187, 199, 212], caption: 'Indexed contracted ARR by quarter, Q3 2024 – Q2 2026 (company data, AltSpot memo)' },
    docs: ['Investment Memo — Meridian Health AI (AltSpot)', 'Subscription Agreement — ASC Meridian SPV', 'Series B Term Summary', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'Who leads this round?', a: 'Based on the AltSpot memo, the Series B is led by a tier-1 healthcare investor; AltSpot holds an approved co-investment allocation on identical terms and conducted its own independent diligence. The lead\u2019s identity is disclosed in the deal data room, available to approved members. Not legal, tax, or investment advice.' },
      { q: 'How is AltSpot paid on this deal?', a: 'Per the offering materials: a 5% platform fee and an admin reserve of up to 2%, collected once at closing and itemized in your documents — any unused admin reserve is returned to investors at close. As a standard co-investment, AltSpot receives 10% carried interest on profits at exit. No annual fees, no capital calls, ever. Not legal, tax, or investment advice.' },
      { q: 'When could I see liquidity?', a: 'Private positions are long-term and illiquid, and no exit timeline is promised. Distribution occurs only on a realization event such as an acquisition or public offering, subject to the SPV\u2019s terms. Please treat capital committed here as untouchable for many years.' }
    ],
    deck: [
      { kicker: 'Meridian Health AI · Series B', title: 'The scribe every physician gets to keep.', body: ['Ambient clinical documentation deployed across 90+ hospital systems, cutting documentation time by 54% in published results.'], stats: [{ k: 'Hospital systems', v: '90+' }, { k: 'Documentation time saved', v: '54%' }, { k: 'Net revenue churn', v: '<2%' }] },
      { kicker: 'Traction', title: 'ARR doubled in twelve months.', body: ['Contracted ARR is up 2.1x trailing-twelve-months, driven by system-wide expansions in existing accounts.'], stats: [{ k: 'TTM ARR growth', v: '2.1x' }, { k: 'Expansion-led', v: 'Yes' }] },
      { kicker: 'The round', title: 'Tier-1 led. Independently underwritten.', body: ['A tier-1 healthcare investor leads the Series B. AltSpot secured a co-investment allocation on identical terms — and underwrote the company independently before committing $250,000 of its own capital.'], stats: [{ k: 'AltSpot committed', v: '$250K' }, { k: 'SPV allocation', v: '$2.0M' }, { k: 'Minimum', v: '$10K' }] }
    ]
  },
  {
    id: 'summit',
    name: 'Summit Aerospace — Secondary',
    entity: 'ASC Summit SPV, LLC',
    tag: 'Late-stage secondary',
    kind: 'secondary',
    sector: 'Aerospace · Defense',
    stage: 'Late stage · issuer-approved',
    art: 'linear-gradient(135deg,#12141E 0%,#2A3352 60%,#7C8BC0 120%)',
    blurb: 'Issuer-approved secondary interest in a late-stage launch-services company, acquired as principal at a 22% discount to the last primary round.',
    thesis: [
      'AltSpot acquired this position as principal directly from an early employee block, with issuer approval and full transfer documentation — no forward contracts, no synthetic exposure.',
      'The block was purchased at a 22% discount to the company\u2019s most recent primary round price.',
      'Late-stage secondaries give investors exposure to established, revenue-scaled private companies at a $10,000 minimum — names ordinarily reserved for institutions.'
    ],
    risks: 'Late-stage does not mean low-risk: valuation marks can fall, IPO windows can stay shut, and secondary interests remain illiquid until a realization event. Total loss of capital is possible. See the memo for the full risk review.',
    minInvestment: 10000,
    allocationTotal: 1000000,
    allocationRemaining: 815000,
    targetClose: 'Sep 4, 2026',
    altspotCommitted: 150000,
    committedNote: 'Acquired as principal; AltSpot retains its position permanently.',
    fees: { platform: 5, adminMax: 2, carry: 10, carryNote: 'Standard secondary' },
    media: { type: 'metric', label: 'Entry vs. last round', series: [78, 100], caption: 'AltSpot entry price indexed against last primary round (100). Source: transfer documentation, AltSpot memo.' },
    docs: ['Investment Memo — Summit Secondary (AltSpot)', 'Subscription Agreement — ASC Summit SPV', 'Transfer & Issuer Approval Summary', 'Risk Factors & Disclosures'],
    spotbot: [
      { q: 'What makes this "issuer-approved"?', a: 'Based on the AltSpot memo, the company approved this transfer under its right-of-first-refusal process, and AltSpot holds clean, documented title to the shares inside the SPV. Issuer approval matters because unapproved secondaries can be voided or blocked. Not legal, tax, or investment advice.' },
      { q: 'Why is there a discount?', a: 'Per the memo, the selling employee block was purchased at a 22% discount to the last primary round price, reflecting the illiquidity and size of the block. A discount at entry is not a guarantee of profit — the company\u2019s value can change in either direction. Not legal, tax, or investment advice.' },
      { q: 'How is AltSpot paid on this deal?', a: 'Per the offering materials: a 5% platform fee and an admin reserve of up to 2%, collected once at closing and itemized — unused admin reserve is returned to investors at close — plus 10% carried interest on profits at exit. No annual fees, no capital calls, ever. Not legal, tax, or investment advice.' }
    ],
    deck: [
      { kicker: 'Summit Aerospace · Secondary', title: 'Institutional access, issuer-approved.', body: ['A documented, issuer-approved secondary interest in a late-stage launch-services company — acquired by AltSpot as principal and offered through a clean SPV at a $10,000 minimum.'], stats: [{ k: 'Entry discount', v: '22%' }, { k: 'AltSpot committed', v: '$150K' }, { k: 'Minimum', v: '$10K' }] },
      { kicker: 'The structure', title: 'Real shares. Clean title. One vehicle.', body: ['The company approved the transfer under its ROFR process. AltSpot holds the shares inside ASC Summit SPV with full transfer documentation — no forwards, no synthetics.'] }
    ]
  }
];

window.dealById = function (id) {
  return window.DEALS.find(function (d) { return d.id === id; }) || null;
};
