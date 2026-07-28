/* ============================================================
   ASC app.js — shared shell (sidebar, toast, chart, fee math)
   ============================================================ */
window.ASCUI = (function () {

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', ico: 'M3 13h6V3H3v10zm0 8h6v-6H3v6zm8 0h10V11H11v10zm0-18v6h10V3H11z' },
    { id: 'marketplace', label: 'Marketplace', href: 'marketplace.html', ico: 'M4 7l8-4 8 4v2H4V7zm1 4h14v8h-4v-5H9v5H5v-8z' },
    { id: 'docs', label: 'Docs', href: 'docs.html', ico: 'M6 2h9l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 12h8v1.6H8V12zm0 4h8v1.6H8V16z' },
    { id: 'profiles', label: 'Profiles', href: 'profiles.html', ico: 'M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm-8 9a8 8 0 0116 0H4z' },
    { id: 'settings', label: 'Settings', href: 'settings.html', ico: 'M12 8a4 4 0 110 8 4 4 0 010-8zm9 4l-2.1-.7.3-2.2-1.9-1.1-1.7 1.4-2-.9L13 6h-2l-.6 2.5-2 .9-1.7-1.4-1.9 1.1.3 2.2L3 12l2.1.7-.3 2.2 1.9 1.1 1.7-1.4 2 .9L11 18h2l.6-2.5 2-.9 1.7 1.4 1.9-1.1-.3-2.2L21 12z' }
  ];

  function icon(d) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
  }
  function initials(name) {
    return (name || 'AI').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  /* Build the sidebar into #sidebar */
  function shell(active) {
    const u = ASC.user() || { name: 'Investor', email: '' };
    const el = document.getElementById('sidebar');
    if (!el) return;
    let items = NAV.map(function (n) {
      return '<a class="nav-item' + (n.id === active ? ' active' : '') + '" href="' + n.href + '">' + icon(n.ico) + n.label + '</a>';
    }).join('');
    items += '<div class="nav-item soon" title="Secondary liquidity — in design">' +
      icon('M7 17l4-6 3 3 4-7') + 'Secondaries<span class="badge-soon">Soon</span></div>';
    el.innerHTML =
      '<div class="brand"><div class="orb"></div><div class="brand-name">Alt<span>Spot</span></div></div>' +
      '<div class="nav-label">Investor portal</div>' + items +
      '<div class="side-foot"><div class="user-chip"><div class="avatar">' + initials(u.name) + '</div>' +
      '<div class="who"><b>' + u.name + '</b><span>Approved member</span></div>' +
      '<button class="logout" onclick="ASC.logout()" title="Sign out">Exit</button></div></div>';
  }

  /* toast */
  let toastTimer = null;
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  /* tiny SVG line chart */
  function lineChart(series, opts) {
    opts = opts || {};
    const w = opts.w || 640, h = opts.h || 200, pad = 16;
    const min = Math.min.apply(null, series), max = Math.max.apply(null, series);
    const span = (max - min) || 1;
    const pts = series.map(function (v, i) {
      const x = pad + (i / (series.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    const line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + pts[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
    const last = pts[pts.length - 1];
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:auto;display:block">' +
      '<defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#C9A14A" stop-opacity=".28"/><stop offset="1" stop-color="#C9A14A" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#gfill)"/>' +
      '<path d="' + line + '" fill="none" stroke="#C9A14A" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" fill="#E8C97E"/>' +
      '</svg>';
  }

  /* fee math — 5% platform + up to 2% admin (itemized, remainder returned) */
  const ADMIN_ITEMS = [
    { label: 'SPV formation & legal', pct: 0.8 },
    { label: 'Fund administration', pct: 0.5 },
    { label: 'Tax preparation & K-1 delivery', pct: 0.4 },
    { label: 'Banking, escrow & compliance', pct: 0.3 }
  ];
  function feeBreakdown(deal, amount) {
    const platform = amount * deal.fees.platform / 100;
    const adminItems = ADMIN_ITEMS.map(function (it) {
      return { label: it.label, pct: it.pct, amt: amount * it.pct / 100 };
    });
    const adminTotal = amount * deal.fees.adminMax / 100;
    return {
      platform: platform, adminItems: adminItems, adminTotal: adminTotal,
      allIn: amount + platform + adminTotal, carry: deal.fees.carry
    };
  }

  /* allocation bar html */
  function allocBar(deal) {
    const sub = deal.allocationTotal - deal.allocationRemaining;
    const pct = Math.round(sub / deal.allocationTotal * 100);
    return '<div class="alloc"><div class="bar"><div class="fill" style="width:' + pct + '%"></div></div>' +
      '<div class="lab"><span>' + pct + '% subscribed</span><span>' + ASC.money(deal.allocationRemaining) + ' remaining</span></div></div>';
  }

  /* gate: route to wizard if verification incomplete */
  function gateInvest(dealId) {
    const gate = ASC.canInvest();
    if (gate.ok) { location.href = 'invest.html?deal=' + dealId; return; }
    const first = gate.missing[0];
    toast('Before investing, complete <b>' + first.label + '</b> — taking you there.');
    setTimeout(function () { location.href = 'wizard.html?step=' + first.step + '&then=' + dealId; }, 1400);
  }

  /* SpotBot stub */
  function spotbot(deal) {
    if (!deal.spotbot) return '';
    let qs = deal.spotbot.map(function (item, i) {
      return '<button class="spot-q" data-i="' + i + '">' + item.q + '</button>' +
        '<div class="spot-a" id="spot-a-' + i + '">' + item.a +
        '<span class="src">SpotBot · scoped to the approved AltSpot memo · logged for books &amp; records</span></div>';
    }).join('');
    return '<div class="card spotbot"><div class="eyebrow" style="margin-bottom:8px">Ask SpotBot</div>' +
      '<p class="small" style="margin-bottom:14px">Plain-language answers about this deal, drawn only from approved materials. SpotBot explains — it never advises.</p>' +
      qs + '<p class="tiny" style="margin-top:6px">Demo preview — canned responses. The production SpotBot answers live from the deal\u2019s approved data room.</p></div>';
  }
  function bindSpotbot(root) {
    (root || document).querySelectorAll('.spot-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const a = document.getElementById('spot-a-' + btn.dataset.i);
        a.style.display = a.style.display === 'block' ? 'none' : 'block';
      });
    });
  }

  return { shell, toast, lineChart, feeBreakdown, allocBar, gateInvest, spotbot, bindSpotbot };
})();
