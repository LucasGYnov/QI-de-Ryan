import { fmt, voterName } from './util.js';

// Courbe adaptative : l'axe Y se cale sur les données visibles (±0,3, fenêtre de 1,0 minimum)
// pour qu'un seul vote de 0,1 reste lisible.
export function createChart(svg, tip) {
  let pts = [], marks = new Map(), geo = null, lastEvt = null;

  function draw() {
    const W = svg.clientWidth, H = svg.clientHeight;
    if (!W || !pts.length) return;
    const small = W < 520, l = small ? 34 : 42, r = 14, t = 26, b = 24;
    const ss = pts.map(p => p.s);
    let lo = Math.min(...ss) - 3, hi = Math.max(...ss) + 3;
    if (hi - lo < 10) { const m = (hi + lo) / 2; lo = m - 5; hi = m + 5; }
    if (lo < 0) { hi -= lo; lo = 0; }
    if (hi > 100) { lo -= hi - 100; hi = 100; }
    lo = Math.max(0, Math.floor(lo)); hi = Math.min(100, Math.ceil(hi));
    const span = Math.max(hi - lo, 1);
    const step = [1, 2, 5, 10, 20].find(s => span / s <= 6) || 20;
    const n = pts.length;
    const x = k => (n < 2 ? (l + W - r) / 2 : l + (W - l - r) * k / (n - 1));
    const y = v => t + (H - t - b) * (1 - (v - lo) / span);
    let g = '<defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5fa2" stop-opacity=".45"/><stop offset="1" stop-color="#ff5fa2" stop-opacity="0"/></linearGradient></defs>';
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      g += `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" stroke="#ffffff14"/><text x="${l - 8}" y="${y(v) + 4}" fill="#d4b6d8" font-size="12" text-anchor="end">${fmt(v)}</text>`;
    }
    if (lo <= 80 && hi >= 80) {
      g += `<line x1="${l}" x2="${W - r}" y1="${y(80)}" y2="${y(80)}" stroke="#ffd45c" stroke-width="2" stroke-dasharray="6 5"/>`;
      g += `<text x="${l + 6}" y="${y(80) - 8}" fill="#ffd45c" font-size="12" font-weight="600">${small ? '8 déclaré' : '« Je suis à 8 » — Ryan'}</text>`;
    } else {
      const up = 80 > hi;
      g += `<text x="${W - r}" y="${up ? 14 : H - 6}" fill="#ffd45c" font-size="12" font-weight="600" text-anchor="end">${up ? '8 déclaré : plus haut ↑' : '8 déclaré : plus bas ↓'}</text>`;
    }
    if (n > 1) {
      const line = pts.map((p, k) => `${x(k)},${y(p.s)}`).join(' ');
      g += `<polygon points="${x(0)},${H - b} ${line} ${x(n - 1)},${H - b}" fill="url(#ar)"/>`;
      g += `<polyline points="${line}" fill="none" stroke="#ff5fa2" stroke-width="2.5" stroke-linejoin="round"/>`;
    }
    if (n <= 160) {
      const rad = n > 80 ? 2.2 : n > 40 ? 3 : 4.5;
      pts.forEach((p, k) => { if (p.v) g += `<circle cx="${x(k)}" cy="${y(p.s)}" r="${rad}" fill="${p.v.d > 0 ? '#45e3cf' : '#ff5fa2'}" stroke="#12051f" stroke-width="1.5"/>`; });
    }
    pts.forEach((p, k) => {
      if (marks.has(p.i) && p.i > 0) g += `<path d="M${x(k)} 4l6 7-6 7-6-7z" fill="#ffd45c" stroke="#12051f" stroke-width="1.5"/>`;
    });
    const last = pts[n - 1];
    g += `<circle cx="${x(n - 1)}" cy="${y(last.s)}" r="6" fill="#7dffb0" stroke="#12051f" stroke-width="2"/>`;
    if (n < 2) g += `<text x="${W / 2}" y="${H / 2}" fill="#d4b6d8" font-size="14" text-anchor="middle">Aucun vote sur cette période.</text>`;
    g += `<line class="guide" x1="0" x2="0" y1="${t}" y2="${H - b}" stroke="#ffffff66" stroke-dasharray="3 3" display="none"/><circle class="hl" r="7" fill="none" stroke="#fff" stroke-width="2" display="none"/>`;
    svg.innerHTML = g;
    geo = { x, y, n, l, r, W, H, lo, hi };
  }

  function hide() {
    lastEvt = null;
    tip.classList.remove('show');
    svg.querySelector('.guide')?.setAttribute('display', 'none');
    svg.querySelector('.hl')?.setAttribute('display', 'none');
  }

  function hover(e) {
    if (!geo || pts.length < 2) return;
    lastEvt = { clientX: e.clientX };
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const k = Math.max(0, Math.min(geo.n - 1, Math.round((px - geo.l) / (geo.W - geo.l - geo.r) * (geo.n - 1))));
    const p = pts[k], X = geo.x(k), Y = geo.y(p.s);
    const gl = svg.querySelector('.guide'), hl = svg.querySelector('.hl');
    gl.setAttribute('x1', X); gl.setAttribute('x2', X); gl.setAttribute('display', 'inline');
    hl.setAttribute('cx', X); hl.setAttribute('cy', Y); hl.setAttribute('display', 'inline');
    const rows = [];
    const add = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; rows.push(el); };
    if (p.v) {
      add('b', `${p.v.d > 0 ? '+0,1' : '−0,1'} → ${fmt(p.s)}/10`);
      if (p.v.c) add('q', p.v.c);
      add('small', `${voterName(p.v.u, p.v.n)} · ${new Date(p.v.t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`);
    } else add('b', `Départ : ${fmt(p.s)}/10`);
    for (const name of marks.get(p.i) || []) add('span', 'Trophée : ' + name, 'tt');
    tip.replaceChildren(...rows);
    tip.classList.add('show');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.transform = `translate(${Math.max(0, Math.min(geo.W - tw, X - tw / 2))}px, ${Y - th - 14 < 0 ? Y + 14 : Y - th - 14}px)`;
  }

  svg.addEventListener('pointermove', hover);
  svg.addEventListener('pointerdown', hover);
  svg.addEventListener('pointerleave', hide);
  const ro = new ResizeObserver(draw);
  ro.observe(svg);

  return {
    update(p, m) { pts = p; marks = m; const keep = lastEvt; draw(); if (keep) hover(keep); else hide(); },
    range() { return geo ? { lo: geo.lo, hi: geo.hi } : null; }
  };
}
