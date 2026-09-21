#!/usr/bin/env node
/**
 * Writes the capture plans for the full reference sweep: every page, and
 * the panels and states a page alone does not show, in all three themes.
 *
 *   node scripts/make-reference-plans.mjs
 *   node scripts/shoot.mjs screenshots/demo-reference/ember.plan.json
 *   node scripts/shoot.mjs screenshots/demo-reference/ice.plan.json
 *   node scripts/shoot.mjs screenshots/demo-reference/daylight.plan.json
 *
 * One size (1600x1000). A page is taken twice: what is on screen on
 * arrival, and the whole page top to bottom ("-full"). A panel or a state
 * is taken once. Every shot starts from /reshoot, so every shot is the
 * seeded demo member and no shot depends on the one before it. Run
 * `npm run db:reset` afterwards: the sweep mints an account per shot, and
 * their seeded votes would otherwise inflate the Radar's totals.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = path.join(root, 'screenshots', 'demo-reference');
fs.mkdirSync(outRoot, { recursive: true });

const THEMES = {
  ember: "localStorage.setItem('asc.theme','dark'); document.documentElement.removeAttribute('data-theme')",
  ice: "localStorage.setItem('asc.theme','ice'); document.documentElement.setAttribute('data-theme','ice')",
  daylight: "localStorage.setItem('asc.theme','light'); document.documentElement.setAttribute('data-theme','light')",
};

const w = (ms) => ({ wait: ms });
const js = (code) => ({ eval: code });
const section = (title) =>
  `[...document.querySelectorAll('h2')].find(x => x.textContent.trim().startsWith(${JSON.stringify(title)})).closest('section')`;
const openSteps = js(
  "(() => { const row = [...document.querySelectorAll('tr')].find(r => /Tessellate/.test(r.textContent)); const b = [...row.querySelectorAll('button')].find(x => /^Steps$/.test(x.textContent.trim())); b.click(); row.scrollIntoView({ block: 'center', behavior: 'instant' }); })()",
);
const card = (name) =>
  `[...document.querySelectorAll('.deal-card')].find(c => c.querySelector('h3') && c.querySelector('h3').textContent.includes(${JSON.stringify(name)}))`;

/** [name, path after /reshoot?, steps after the theme is set, full page?] */
const SHOTS = [
  // ---- before the portal ----
  ['01-login', null, [], false], // one screen; a full-length capture of it crashes headless Edge in Ice and Daylight
  ['02-setup-step-1', 'as=new', [], true],
  ['03-setup-step-2', 'as=new', [js("location.href = '/wizard?step=2'"), w(1800)], true],
  ['04-setup-step-3', 'as=new', [js("location.href = '/wizard?step=3'"), w(1800)], true],
  ['05-setup-step-4', 'as=new', [js("location.href = '/wizard?step=4'"), w(1800)], true],
  ['06-setup-step-5', 'as=new', [js("location.href = '/wizard?step=5'"), w(1800)], true],
  ['07-marketplace-before-approval', 'as=new&to=/marketplace', [], true],
  ['08-dashboard-new-member-no-book', 'as=recent&to=/dashboard', [], true],

  // ---- the portal, as the seeded demo member ----
  ['10-dashboard', 'to=/dashboard', [], true],
  ['11-marketplace-shelf', 'to=/marketplace', [], true],
  ['12-marketplace-radar', 'to=/marketplace%3Fview%3Dradar', [w(900)], false],
  ['13-deal-calder', 'to=/deals/calder', [], true],
  ['14-deal-aurelia-already-in-escrow', 'to=/deals/aurelia', [], true],
  ['15-deal-kestrel-partner-led', 'to=/deals/kestrel', [], true],
  ['16-checkout-1-amount', 'to=/invest/calder', [w(500)], true],
  [
    '17-checkout-2-read-and-sign',
    'to=/invest/calder',
    [w(500), js("(() => { const b = [...document.querySelectorAll('button')].find(x => /continue to documents/i.test(x.textContent)); if (!b) throw new Error('no Continue to documents'); b.click(); })()"), w(2600)],
    true,
  ],
  [
    '18-checkout-4-allocation-reserved',
    'to=/dashboard',
    [openSteps, w(600), js("(() => { const a = document.querySelector('a[href^=\"/payment/\"]'); location.href = a.getAttribute('href'); })()"), w(2400)],
    true,
  ],
  ['19-portfolio', 'to=/portfolio', [], true],
  ['20-portfolio-statement', 'to=/portfolio/statement', [], true],
  ['21-watchlist', 'to=/watchlist', [], true],
  ['22-terminal', 'to=/terminal', [], true],
  ['23-terminal-article', 'to=/terminal/how-altspot-is-paid', [], true],
  ['24-terminal-report', 'to=/terminal/private-markets-q3-2026', [], true],
  ['25-terminal-podcast', 'to=/terminal/inside-a-data-room', [], true],
  ['26-docs', 'to=/docs', [], true],
  ['27-profiles', 'to=/profiles', [], true],
  ['28-preferences', 'to=/preferences', [], true],
  ['29-settings', 'to=/settings', [], true],
  ['30-disclosures', 'to=/disclosures', [], true],
  ['31-member-register-internal', 'to=/ops/register/calder', [], true],

  // ---- panels and states ----
  ['40-bell-panel', 'to=/dashboard', [js("document.querySelector('[data-tour=\"bell\"]').click()"), w(900)], false],
  ['41-dashboard-steps-ten-day-clock', 'to=/dashboard', [openSteps, w(800)], false],
  [
    '42-your-votes-adjust-all',
    'to=/dashboard',
    [js(`(() => { const s = ${section('Your votes')}; s.scrollIntoView({ block: 'start', behavior: 'instant' }); [...s.querySelectorAll('button')].find(b => /adjust all/i.test(b.textContent)).click(); })()`), w(800)],
    false,
  ],
  [
    '43-your-votes-company-overview',
    'to=/dashboard',
    [js(`(() => { const s = ${section('Your votes')}; s.scrollIntoView({ block: 'start', behavior: 'instant' }); s.querySelector('button[aria-label$="open the overview"]').click(); })()`), w(1000)],
    false,
  ],
  [
    '44-quick-look-not-joined',
    'to=/marketplace',
    [js(`(() => { const c = ${card('Calder')}; c.scrollIntoView({ block: 'center', behavior: 'instant' }); c.querySelector('button[aria-label^="Quick look"]').click(); })()`), w(1000)],
    false,
  ],
  [
    '45-quick-look-in-escrow',
    'to=/marketplace',
    [js(`(() => { const c = ${card('Aurelia')}; c.scrollIntoView({ block: 'center', behavior: 'instant' }); c.querySelector('button[aria-label^="Quick look"]').click(); })()`), w(1000)],
    false,
  ],
  [
    '46-quick-look-signed-not-sent',
    'to=/marketplace',
    [js(`(() => { const c = ${card('Tessellate')}; c.scrollIntoView({ block: 'center', behavior: 'instant' }); c.querySelector('button[aria-label^="Quick look"]').click(); })()`), w(1000)],
    false,
  ],
  [
    '47-radar-details-panel',
    'to=/marketplace%3Fview%3Dradar',
    [w(900), js("(() => { const a = [...document.querySelectorAll('article')].find(x => /Orrery/.test(x.textContent)); a.scrollIntoView({ block: 'center', behavior: 'instant' }); [...a.querySelectorAll('button')].find(b => /details/i.test(b.textContent)).click(); })()"), w(1000)],
    false,
  ],
  [
    '48-radar-vote-scale',
    'to=/marketplace%3Fview%3Dradar',
    [w(900), js("(() => { const a = [...document.querySelectorAll('article')].find(x => /Pellucid/.test(x.textContent)); a.scrollIntoView({ block: 'center', behavior: 'instant' }); [...a.querySelectorAll('button')].find(b => /^vote$/i.test(b.textContent.trim())).click(); })()"), w(800)],
    false,
  ],
  [
    '49-how-it-works-panel',
    'to=/marketplace',
    [js("(() => { [...document.querySelectorAll('button')].find(b => /how it works/i.test(b.textContent)).click(); })()"), w(1000)],
    false,
  ],
  [
    '50-spot-answers-with-a-picture',
    'to=/deals/calder',
    [js("window.dispatchEvent(new CustomEvent('asc:spot', { detail: { question: 'What are the fees?' } }))"), w(2600)],
    false,
  ],
  [
    '51-spot-declines-advice',
    'to=/deals/calder',
    [js("window.dispatchEvent(new CustomEvent('asc:spot', { detail: { question: 'How much should I invest in this deal?' } }))"), w(2600)],
    false,
  ],
  ['52-first-run-walkthrough', 'to=%2Fdashboard%3Ftour%3D1', [w(1200)], false],
  [
    '53-portfolio-position-chart-dollars',
    'to=/portfolio',
    [js("(() => { const el = document.getElementById('p-drivers'); el.scrollIntoView({ block: 'start', behavior: 'instant' }); [...el.querySelectorAll('button')].find(b => /^dollars$/i.test(b.textContent.trim())).click(); })()"), w(900)],
    false,
  ],
  [
    '54-deal-scenarios',
    'to=/deals/calder',
    [js("(() => { const h = [...document.querySelectorAll('h2, h3')].find(x => /illustrative scenarios/i.test(x.textContent)); if (h) h.scrollIntoView({ block: 'start', behavior: 'instant' }); })()"), w(900)],
    false,
  ],
  [
    '55-deal-what-it-costs',
    'to=/deals/calder',
    [js("(() => { const h = [...document.querySelectorAll('h2, h3')].find(x => /what it costs/i.test(x.textContent)); if (h) h.scrollIntoView({ block: 'start', behavior: 'instant' }); })()"), w(900)],
    false,
  ],
];

for (const [theme, setTheme] of Object.entries(THEMES)) {
  const shots = SHOTS.map(([name, query, steps, full]) => ({
    name,
    full,
    steps: [
      { go: query === null ? '/' : `/reshoot?${query}` },
      js(setTheme),
      w(1700),
      ...steps,
    ],
  }));
  const file = path.join(outRoot, `${theme}.plan.json`);
  fs.writeFileSync(
    file,
    JSON.stringify({ out: `screenshots/demo-reference/${theme}`, sizes: [[1600, 1000]], keepGoing: true, shots }, null, 2),
  );
  console.log(`wrote ${path.relative(root, file)} (${shots.length} shots)`);
}
