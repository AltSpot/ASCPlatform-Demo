/* ============================================================
   ASC store.js — local state layer (the demo's "backend")
   All data lives in localStorage under the "asc." namespace.
   When this migrates to the real build, this file is replaced
   by API calls; the data shapes map onto the Supabase schema
   (InvestorProfile · InvestmentProfile · Subscription · Deal).
   Subscription state machine:
   started → docs_signed → funded → accepted → closed
   exits: expired (10-day window lapses) · refunded · cut_back
   ============================================================ */
window.ASC = (function () {
  const NS = 'asc.';
  const DAY = 86400000;

  function get(key, def) {
    try {
      const v = localStorage.getItem(NS + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }
  function set(key, val) { localStorage.setItem(NS + key, JSON.stringify(val)); return val; }
  function del(key) { localStorage.removeItem(NS + key); }
  function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); }

  /* ---------- auth ---------- */
  function user() { return get('user', null); }
  function login(email) {
    const existing = user();
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const u = existing && existing.email === email ? existing : { email, name, joined: Date.now() };
    set('user', u);
    if (!get('seeded', false)) seed();
    return u;
  }
  function logout() { del('user'); location.href = 'index.html'; }
  function requireAuth() {
    if (!user()) { location.href = 'index.html'; return null; }
    expireSweep();
    return user();
  }

  /* ---------- wizard / verification state ---------- */
  function wizard() {
    return get('wizard', {
      accreditation: { status: 'not_started', method: null, verifiedAt: null, expiresAt: null },
      info: { complete: false },
      kyc: { idUploaded: false, selfieCaptured: false, complete: false },
      profileDone: false,
      bankDone: false,
      complete: false
    });
  }
  function saveWizard(w) { return set('wizard', w); }
  function wizardComplete() { return wizard().complete === true; }

  /* Required to invest: accreditation + info + KYC. Profile can be created at checkout; bank at funding. */
  function canInvest() {
    const w = wizard();
    const missing = [];
    if (w.accreditation.status !== 'verified') missing.push({ step: 1, label: 'Accreditation verification' });
    if (!w.info.complete) missing.push({ step: 2, label: 'Your information (W-9)' });
    if (!w.kyc.complete) missing.push({ step: 3, label: 'Identity verification' });
    /* accreditation staleness re-check — valid 5 years */
    if (w.accreditation.expiresAt && Date.now() > w.accreditation.expiresAt)
      missing.push({ step: 1, label: 'Accreditation re-verification (expired)' });
    return { ok: missing.length === 0, missing };
  }

  /* ---------- saved info (W-9) ---------- */
  function savedInfo() { return get('savedInfo', {}); }
  function saveInfo(obj) { return set('savedInfo', Object.assign(savedInfo(), obj)); }

  /* ---------- investment profiles ---------- */
  function profiles() { return get('profiles', []); }
  function addProfile(p) {
    const list = profiles();
    p.id = uid('prof'); p.createdAt = Date.now();
    list.push(p); set('profiles', list); return p;
  }
  function updateProfile(id, patch) {
    const list = profiles().map(p => p.id === id ? Object.assign(p, patch) : p);
    set('profiles', list);
  }
  function profileById(id) { return profiles().find(p => p.id === id) || null; }

  /* ---------- bank ---------- */
  function bank() { return get('bank', null); }
  function linkBank(b) { return set('bank', Object.assign({ linkedAt: Date.now() }, b)); }

  /* ---------- investments (subscriptions) ---------- */
  const STATES = {
    STARTED: 'started', SIGNED: 'docs_signed', FUNDED: 'funded',
    ACCEPTED: 'accepted', CLOSED: 'closed', EXPIRED: 'expired', REFUNDED: 'refunded'
  };
  function investments() { return get('investments', []); }
  function saveInvestments(list) { return set('investments', list); }
  function investmentById(id) { return investments().find(i => i.id === id) || null; }
  function activeFor(dealId) {
    /* resume an in-progress subscription for a deal */
    return investments().find(i => i.dealId === dealId &&
      (i.state === STATES.STARTED || i.state === STATES.SIGNED)) || null;
  }
  function startInvestment(dealId, profileId, amount) {
    const list = investments();
    const inv = {
      id: uid('inv'), dealId, profileId, amount,
      state: STATES.STARTED, answers: {}, createdAt: Date.now(), updatedAt: Date.now()
    };
    list.push(inv); saveInvestments(list); return inv;
  }
  function updateInvestment(id, patch) {
    const list = investments().map(i => {
      if (i.id === id) { Object.assign(i, patch); i.updatedAt = Date.now(); }
      return i;
    });
    saveInvestments(list);
    return investmentById(id);
  }
  function signInvestment(id, signature) {
    return updateInvestment(id, {
      state: STATES.SIGNED, signature, signedAt: Date.now(),
      fundingDeadline: Date.now() + 10 * DAY
    });
  }
  function fundInvestment(id, method) {
    return updateInvestment(id, { state: STATES.FUNDED, fundedAt: Date.now(), fundingMethod: method || 'ACH' });
  }
  function cancelInvestment(id) {
    saveInvestments(investments().filter(i => i.id !== id));
  }
  function expireSweep() {
    let changed = false;
    const list = investments().map(i => {
      if (i.state === STATES.SIGNED && i.fundingDeadline && Date.now() > i.fundingDeadline) {
        i.state = STATES.EXPIRED; changed = true;
      }
      return i;
    });
    if (changed) saveInvestments(list);
  }
  function daysLeft(deadline) {
    return Math.max(0, Math.ceil((deadline - Date.now()) / DAY));
  }

  /* ---------- docs ---------- */
  function docs() { return get('docs', []); }
  function addDoc(d) {
    const list = docs();
    d.id = uid('doc'); d.savedAt = Date.now();
    list.unshift(d); set('docs', list); return d;
  }

  /* ---------- portfolio seed (so first login feels alive) ---------- */
  function seed() {
    set('seeded', true);
    /* one closed position so the dashboard has a chart + a holding */
    const inv = {
      id: uid('inv'), dealId: 'meridian', profileId: null, amount: 25000,
      state: STATES.ACCEPTED, seeded: true,
      signedAt: Date.now() - 210 * DAY, fundedAt: Date.now() - 208 * DAY,
      acceptedAt: Date.now() - 205 * DAY, createdAt: Date.now() - 210 * DAY,
      updatedAt: Date.now(), currentValue: 29600
    };
    saveInvestments(investments().concat([inv]));
    addDoc({
      name: 'Subscription Agreement — Meridian Health AI SPV', dealId: 'meridian',
      type: 'agreement', note: 'Countersigned · closed'
    });
  }
  function resetAll() {
    Object.keys(localStorage).filter(k => k.indexOf(NS) === 0)
      .forEach(k => localStorage.removeItem(k));
    location.href = 'index.html';
  }

  /* ---------- format helpers ---------- */
  function money(n, dec) {
    if (n == null || isNaN(n)) return '—';
    return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: dec || 0 });
  }
  function dateStr(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }

  return {
    get, set, uid, user, login, logout, requireAuth,
    wizard, saveWizard, wizardComplete, canInvest,
    savedInfo, saveInfo,
    profiles, addProfile, updateProfile, profileById,
    bank, linkBank,
    STATES, investments, investmentById, activeFor, startInvestment, updateInvestment,
    signInvestment, fundInvestment, cancelInvestment, expireSweep, daysLeft,
    docs, addDoc, resetAll, money, dateStr, qs
  };
})();
