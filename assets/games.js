import { $, esc, ls } from './util.js';

// Salle d'arcade : 4 mini-jeux en canvas, records sur cet appareil (localStorage ryan_arcade).
// Commandes communes : flèches / ZQSD / WASD, Espace = action, P = pause, Échap = fermer.
// Mobile : glisser sur le jeu, toucher = action, ou la manette sous le jeu.

const W = 360, H = 520;
const C = { night: '#1a0a2c', plum: '#2c1242', pink: '#ff5fa2', orange: '#ffa24c', gold: '#ffd45c', teal: '#45e3cf', green: '#7dffb0', purple: '#c77dff', blue: '#5fa8ff', ink: '#fff4f9', shadow: '#12051f', skin: '#d49a76', hair: '#2b1a12' };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

let api = {};
const best = (() => { try { return JSON.parse(ls.get('ryan_arcade') || '{}'); } catch (e) { return {}; } })();
const saveBest = () => ls.set('ryan_arcade', JSON.stringify(best));

/* ---------- Dessins partagés ---------- */
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fill(); }
// Tête de Ryan vue de face (cheveux longs, gros nez), centrée sur x, y.
function head(c, x, y, s) {
  c.fillStyle = C.hair; c.beginPath(); c.ellipse(x, y - s * 0.05, s * 0.62, s * 0.66, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(x - s * 0.62, y, s * 1.24, s * 0.55);
  c.fillStyle = C.skin; c.beginPath(); c.ellipse(x, y + s * 0.08, s * 0.44, s * 0.52, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = C.hair; c.beginPath(); c.ellipse(x, y - s * 0.4, s * 0.48, s * 0.2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff'; c.fillRect(x - s * 0.25, y - s * 0.02, s * 0.16, s * 0.12); c.fillRect(x + s * 0.09, y - s * 0.02, s * 0.16, s * 0.12);
  c.fillStyle = '#3b2216'; c.fillRect(x - s * 0.2, y, s * 0.08, s * 0.1); c.fillRect(x + s * 0.13, y, s * 0.08, s * 0.1);
  c.fillStyle = '#b97758'; c.beginPath(); c.ellipse(x, y + s * 0.2, s * 0.13, s * 0.15, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#7a3a3a'; c.fillRect(x - s * 0.12, y + s * 0.38, s * 0.24, s * 0.05);
}
function brain(c, x, y, r, col = C.pink) {
  c.fillStyle = col;
  for (const [dx, dy] of [[-0.45, -0.2], [0.45, -0.2], [-0.35, 0.3], [0.35, 0.3], [0, -0.45], [0, 0.15]]) { c.beginPath(); c.arc(x + dx * r, y + dy * r, r * 0.52, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = '#a3305f'; c.lineWidth = Math.max(1, r * 0.12); c.beginPath(); c.moveTo(x, y - r * 0.8); c.lineTo(x, y + r * 0.7); c.stroke();
}
function car(c, x, y, w, h, col, dir) {
  c.fillStyle = col; rr(c, x, y + h * 0.25, w, h * 0.55, 6);
  c.fillStyle = '#ffffffcc'; rr(c, x + w * (dir > 0 ? 0.35 : 0.2), y + h * 0.08, w * 0.45, h * 0.35, 5);
  c.fillStyle = C.shadow; c.beginPath(); c.arc(x + w * 0.22, y + h * 0.82, h * 0.15, 0, 7); c.arc(x + w * 0.78, y + h * 0.82, h * 0.15, 0, 7); c.fill();
  c.fillStyle = C.gold; c.fillRect(dir > 0 ? x + w - 4 : x, y + h * 0.4, 4, h * 0.15);
}
function croco(c, x, y, w, h, dir) {
  c.save(); if (dir < 0) { c.translate(x * 2 + w, 0); c.scale(-1, 1); }
  c.fillStyle = '#3f9e5a'; rr(c, x, y + h * 0.35, w * 0.8, h * 0.4, 8); rr(c, x + w * 0.7, y + h * 0.45, w * 0.3, h * 0.25, 5);
  c.fillStyle = '#2b7a44'; for (let i = 0; i < 4; i++) c.fillRect(x + w * (0.1 + i * 0.15), y + h * 0.3, w * 0.07, h * 0.08);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x + w * 0.72, y + h * 0.38, h * 0.08, 0, 7); c.fill();
  c.fillStyle = C.shadow; c.fillRect(x + w * 0.1, y + h * 0.72, w * 0.08, h * 0.15); c.fillRect(x + w * 0.55, y + h * 0.72, w * 0.08, h * 0.15);
  c.restore();
}
function palm(c, x, y, s) {
  c.strokeStyle = '#7a4a2a'; c.lineWidth = s * 0.12; c.beginPath(); c.moveTo(x, y + s * 0.5); c.quadraticCurveTo(x + s * 0.15, y, x, y - s * 0.2); c.stroke();
  c.fillStyle = '#2fa36b';
  for (const a of [-2.6, -2, -1.1, -0.5, 0.2]) { c.beginPath(); c.ellipse(x + Math.cos(a) * s * 0.3, y - s * 0.2 + Math.sin(a) * s * 0.18, s * 0.34, s * 0.09, a, 0, 7); c.fill(); }
}
function sunset(c) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2c1242'); g.addColorStop(0.55, '#c2457e'); g.addColorStop(0.8, '#ffa24c'); g.addColorStop(1, '#ffd45c');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

/* ---------- 1. Traversée de Vice (façon Crossy Road) ---------- */
function crossy() {
  const S = 40, COLS = 9;
  const rows = new Map();
  const cars = [C.pink, C.teal, C.orange, C.purple, C.blue, '#fff4f9'];
  function gen(i) {
    if (rows.has(i)) return rows.get(i);
    let r;
    if (i < 3) r = { type: 'grass', trees: new Set(i === 0 ? [] : [0, 8]) };
    else {
      const prev = rows.get(i - 1);
      const t = Math.random();
      const lvl = Math.min(1, i / 120);
      const type = prev && prev.type === 'grass' && t < 0.7 ? (Math.random() < 0.6 ? 'road' : 'water') : t < 0.3 ? 'grass' : t < 0.75 ? 'road' : 'water';
      const dir = Math.random() < 0.5 ? 1 : -1;
      if (type === 'grass') {
        const trees = new Set(); for (let k = 0; k < COLS; k++) if (Math.random() < 0.18) trees.add(k);
        trees.delete(4); r = { type, trees };
      } else if (type === 'road') {
        const kind = Math.random() < 0.18 ? 'croco' : 'car';
        const speed = kind === 'croco' ? rnd(40, 70) : rnd(70, 130) * (1 + lvl);
        const L = W + 160, n = Math.random() < 0.5 ? 2 : 3, items = [];
        for (let k = 0; k < n; k++) items.push({ x: (L / n) * k + rnd(0, 40), w: kind === 'croco' ? 2 : Math.random() < 0.3 ? 2 : 1, col: pick(cars) });
        r = { type, kind, dir, speed, L, items };
      } else {
        const speed = rnd(40, 80) * (1 + lvl * 0.6), L = W + 200, n = 3, items = [];
        for (let k = 0; k < n; k++) items.push({ x: (L / n) * k, w: Math.random() < 0.5 ? 2 : 3, ski: Math.random() < 0.2 });
        r = { type, dir, speed, L, items };
      }
    }
    rows.set(i, r);
    return r;
  }
  const span = (r, it) => { const x = it.x - 100; return [x, x + it.w * S]; };
  const P = { row: 0, x: 4 * S + S / 2, max: 0, dead: '' };
  let cam = 0, idle = 0;
  const game = {
    score: 0, over: false,
    help: 'Fais traverser Ryan jusqu\'à la plage. Flèches ou glisser. Évite les voitures et les crocos, saute sur les rondins.',
    input(k) {
      if (game.over) return;
      const dc = k === 'left' ? -1 : k === 'right' ? 1 : 0, dr = k === 'up' || k === 'act' ? 1 : k === 'down' ? -1 : 0;
      if (!dc && !dr) return;
      const nr = P.row + dr, nx = P.x + dc * S;
      if (nr < 0 || nx < S / 2 - 1 || nx > W - S / 2 + 1) return;
      const r = gen(nr), col = Math.round((nx - S / 2) / S);
      if (r.type === 'grass' && r.trees.has(col)) return;
      P.row = nr; P.x = r.type === 'water' ? nx : col * S + S / 2;
      if (P.row > P.max) { P.max = P.row; game.score = P.max; api.sfx.play('tick'); }
      idle = 0;
    },
    step(dt) {
      for (let i = Math.floor(cam) - 1; i < cam + 16; i++) {
        const r = gen(i);
        if (r.items) for (const it of r.items) it.x = (it.x + r.dir * r.speed * dt + r.L) % r.L;
      }
      cam += ((P.row - 3) - cam) * Math.min(1, dt * 4);
      cam = Math.max(0, cam);
      idle += dt;
      const r = gen(P.row);
      if (r.type === 'road') {
        for (const it of r.items) { const [a, b] = span(r, it); if (P.x + 12 > a && P.x - 12 < b) P.dead = r.kind === 'croco' ? 'Croqué par Leonida Man.' : 'Renversé par une décapotable.'; }
      } else if (r.type === 'water') {
        const on = r.items.find(it => { const [a, b] = span(r, it); return P.x > a + 4 && P.x < b - 4; });
        if (!on) P.dead = 'Plouf. Ryan ne sait pas nager non plus.';
        else P.x += r.dir * r.speed * dt;
        if (P.x < 0 || P.x > W) P.dead = 'Emporté au large.';
      }
      if (idle > 9) P.dead = 'Trop lent : la police l\'a rattrapé.';
      if (P.dead) { game.over = true; game.why = P.dead; }
    },
    draw(c) {
      for (let s = -1; s < 15; s++) {
        const i = Math.floor(cam) + s, r = gen(i), y = H - (i - cam + 1) * S;
        if (r.type === 'grass') {
          c.fillStyle = i % 2 ? '#3a8f5e' : '#41a067'; c.fillRect(0, y, W, S);
          for (const k of r.trees) palm(c, k * S + S / 2, y + S / 2 - 4, 34);
        } else if (r.type === 'road') {
          c.fillStyle = '#3b2f48'; c.fillRect(0, y, W, S);
          c.fillStyle = '#ffffff44'; for (let x = 0; x < W; x += 30) c.fillRect(x, y + S - 2, 16, 2);
          for (const it of r.items) { const [a] = span(r, it); r.kind === 'croco' ? croco(c, a, y, it.w * S, S, r.dir) : car(c, a + 2, y + 2, it.w * S - 4, S - 4, it.col, r.dir); }
        } else {
          c.fillStyle = '#2a7fb8'; c.fillRect(0, y, W, S);
          c.fillStyle = '#ffffff22'; for (let x = (i * 37) % 40; x < W; x += 40) c.fillRect(x, y + 12, 14, 2);
          for (const it of r.items) {
            const [a, b] = span(r, it);
            if (it.ski) { c.fillStyle = C.gold; rr(c, a + 2, y + 8, b - a - 4, S - 16, 12); c.fillStyle = C.pink; c.fillRect(a + 10, y + 14, 8, 12); }
            else { c.fillStyle = '#8a5a34'; rr(c, a + 2, y + 7, b - a - 4, S - 14, 8); c.fillStyle = '#6b4325'; c.fillRect(a + 8, y + 14, b - a - 16, 3); }
          }
        }
      }
      const py = H - (P.row - cam + 1) * S;
      c.fillStyle = '#00000044'; c.beginPath(); c.ellipse(P.x, py + S - 6, 13, 4, 0, 0, 7); c.fill();
      head(c, P.x, py + S / 2 - 2, 30);
      if (idle > 6 && !game.over) { c.fillStyle = (Date.now() / 200 | 0) % 2 ? '#ff2a4d' : C.blue; c.fillRect(0, 0, W, 6); }
    }
  };
  for (let i = 0; i < 16; i++) gen(i);
  return game;
}

/* ---------- 2. Tétris des neurones ---------- */
function tetris() {
  const COLS = 10, ROWS = 20, S = 24, OX = 12, OY = 20;
  const SH = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]]
  };
  const COL = { I: C.teal, O: C.gold, T: C.purple, S: C.green, Z: C.pink, J: C.blue, L: C.orange };
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let bag = [];
  const next = () => { if (!bag.length) bag = Object.keys(SH).sort(() => Math.random() - 0.5); return bag.pop(); };
  let p, nxt = next(), fall = 0, lines = 0, flash = 0;
  const cells = q => q.b.map(([x, y]) => [q.x + x, q.y + y]);
  const fits = q => cells(q).every(([x, y]) => x >= 0 && x < COLS && y < ROWS && (y < 0 || !grid[y][x]));
  function spawn() { p = { k: nxt, b: SH[nxt].map(a => [...a]), x: 3, y: -1 }; nxt = next(); if (!fits(p)) { game.over = true; game.why = 'Le cerveau déborde. Plus de place pour un seul neurone.'; } }
  function rotate() {
    if (p.k === 'O') return;
    const n = p.k === 'I' ? 3 : 2;
    const q = { ...p, b: p.b.map(([x, y]) => [n - y, x]) };
    for (const kick of [0, -1, 1, -2, 2]) { const t = { ...q, x: q.x + kick }; if (fits(t)) { p = t; api.sfx.play('tap'); return; } }
  }
  function lock() {
    for (const [x, y] of cells(p)) if (y >= 0) grid[y][x] = COL[p.k];
    if (cells(p).some(([, y]) => y < 0)) { game.over = true; game.why = 'Le cerveau déborde. Plus de place pour un seul neurone.'; return; }
    let n = 0;
    for (let y = ROWS - 1; y >= 0; y--) if (grid[y].every(Boolean)) { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); n++; y++; }
    if (n) { lines += n; game.score += [0, 100, 300, 500, 800][n] * level(); flash = 0.3; api.sfx.play(n === 4 ? 'up' : 'tick'); }
    spawn();
  }
  const level = () => 1 + Math.floor(lines / 8);
  const move = (dx, dy) => { const q = { ...p, x: p.x + dx, y: p.y + dy }; if (fits(q)) { p = q; return true; } return false; };
  const game = {
    score: 0, over: false,
    help: 'Range ses neurones avant que ça déborde. Gauche / droite, haut = tourner, bas = descendre, Espace = lâcher.',
    input(k) {
      if (game.over) return;
      if (k === 'left') move(-1, 0); else if (k === 'right') move(1, 0);
      else if (k === 'up') rotate();
      else if (k === 'down') { if (move(0, 1)) game.score += 1; else lock(); fall = 0; }
      else if (k === 'act') { let d = 0; while (move(0, 1)) d++; game.score += d * 2; lock(); fall = 0; }
    },
    step(dt) {
      flash = Math.max(0, flash - dt);
      fall += dt;
      const sp = Math.max(0.08, 0.7 - (level() - 1) * 0.07);
      if (fall >= sp) { fall = 0; if (!move(0, 1)) lock(); }
    },
    draw(c) {
      c.fillStyle = C.night; c.fillRect(0, 0, W, H);
      c.fillStyle = flash ? '#ffffff22' : C.plum; c.fillRect(OX - 2, OY - 2, COLS * S + 4, ROWS * S + 4);
      c.strokeStyle = '#ffffff10'; c.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) { c.beginPath(); c.moveTo(OX + x * S, OY); c.lineTo(OX + x * S, OY + ROWS * S); c.stroke(); }
      const block = (x, y, col) => {
        c.fillStyle = col; rr(c, OX + x * S + 1, OY + y * S + 1, S - 2, S - 2, 4);
        c.fillStyle = '#ffffff55'; c.fillRect(OX + x * S + 4, OY + y * S + 4, S - 12, 3);
        c.strokeStyle = '#00000033'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(OX + x * S + S / 2, OY + y * S + 8); c.quadraticCurveTo(OX + x * S + 7, OY + y * S + 14, OX + x * S + S / 2, OY + y * S + S - 5); c.stroke();
      };
      grid.forEach((row, y) => row.forEach((col, x) => col && block(x, y, col)));
      if (p && !game.over) {
        const g = { ...p }; while (fits({ ...g, y: g.y + 1 })) g.y++;
        c.globalAlpha = 0.25; for (const [x, y] of cells(g)) if (y >= 0) block(x, y, COL[p.k]); c.globalAlpha = 1;
        for (const [x, y] of cells(p)) if (y >= 0) block(x, y, COL[p.k]);
      }
      const px = OX + COLS * S + 16;
      c.fillStyle = C.muted || '#d4b6d8'; c.font = '600 12px Archivo, sans-serif';
      c.fillText('SUIVANT', px, OY + 12);
      for (const [x, y] of SH[nxt]) { c.fillStyle = COL[nxt]; rr(c, px + x * 18, OY + 24 + y * 18, 16, 16, 3); }
      c.fillStyle = '#d4b6d8'; c.fillText('NIVEAU', px, OY + 110); c.fillText('LIGNES', px, OY + 170);
      c.fillStyle = C.ink; c.font = '28px Anton, Impact, sans-serif';
      c.fillText(level(), px, OY + 142); c.fillText(lines, px, OY + 202);
      head(c, px + 34, OY + 300, 44);
      c.fillStyle = '#d4b6d8'; c.font = '600 11px Archivo, sans-serif';
      c.fillText(lines >= 8 ? 'Il réfléchit.' : 'Il cherche.', px + 4, OY + 350);
    }
  };
  spawn();
  return game;
}

/* ---------- 3. Croco Snake ---------- */
function snake() {
  const S = 20, CX = W / S, CY = H / S;
  let body = [[8, 13], [7, 13], [6, 13]], dir = [1, 0], want = [1, 0], acc = 0, food, gold = null, goldT = 0;
  const free = () => { let f; do f = [Math.floor(Math.random() * CX), Math.floor(Math.random() * CY)]; while (body.some(b => b[0] === f[0] && b[1] === f[1])); return f; };
  food = free();
  const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const game = {
    score: 0, over: false,
    help: 'Leonida Man a faim de neurones. Flèches ou glisser. Ne mords pas ta queue, ne touche pas les bords.',
    input(k) { const d = D[k]; if (d && (d[0] !== -dir[0] || d[1] !== -dir[1])) want = d; },
    step(dt) {
      acc += dt;
      const sp = Math.max(0.055, 0.14 - game.score * 0.002);
      if (gold) { goldT -= dt; if (goldT <= 0) gold = null; }
      while (acc >= sp) {
        acc -= sp; dir = want;
        const h = [body[0][0] + dir[0], body[0][1] + dir[1]];
        if (h[0] < 0 || h[1] < 0 || h[0] >= CX || h[1] >= CY) { game.over = true; game.why = 'Bang, dans le mur de la supérette.'; return; }
        if (body.some(b => b[0] === h[0] && b[1] === h[1])) { game.over = true; game.why = 'Il s\'est mordu la queue. Classique.'; return; }
        body.unshift(h);
        if (h[0] === food[0] && h[1] === food[1]) { game.score++; food = free(); api.sfx.play('tick'); if (!gold && Math.random() < 0.2) { gold = free(); goldT = 6; } }
        else if (gold && h[0] === gold[0] && h[1] === gold[1]) { game.score += 5; gold = null; api.sfx.play('up'); body.push([...body[body.length - 1]]); }
        else body.pop();
      }
    },
    draw(c) {
      c.fillStyle = '#3b2f48'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffffff08'; for (let y = 0; y < CY; y++) for (let x = (y % 2); x < CX; x += 2) c.fillRect(x * S, y * S, S, S);
      brain(c, food[0] * S + S / 2, food[1] * S + S / 2, 8);
      if (gold) { c.fillStyle = C.gold; c.font = '20px Anton, Impact, sans-serif'; c.textAlign = 'center'; c.fillText('8', gold[0] * S + S / 2, gold[1] * S + S - 2); c.textAlign = 'left'; }
      body.forEach(([x, y], i) => {
        c.fillStyle = i === 0 ? '#4fbf6e' : i % 2 ? '#3f9e5a' : '#378f50';
        rr(c, x * S + 1, y * S + 1, S - 2, S - 2, i === 0 ? 7 : 4);
        if (i && i % 3 === 0) { c.fillStyle = '#2b7a44'; c.fillRect(x * S + 7, y * S + 7, 6, 6); }
      });
      const [hx, hy] = body[0];
      c.fillStyle = '#fff'; c.beginPath();
      c.arc(hx * S + S / 2 + dir[1] * 5 + dir[0] * 3, hy * S + S / 2 - dir[0] * 5 + dir[1] * 3, 3, 0, 7);
      c.arc(hx * S + S / 2 - dir[1] * 5 + dir[0] * 3, hy * S + S / 2 + dir[0] * 5 + dir[1] * 3, 3, 0, 7); c.fill();
    }
  };
  return game;
}

/* ---------- 4. Ryan Run (façon dinosaure de Chrome) ---------- */
function run() {
  const G = 430, X = 64;
  let y = 0, vy = 0, t = 0, speed = 240, gap = 1.2, dist = 0, obs = [], night = 0;
  const TYPES = [
    { k: 'cone', w: 22, h: 34 }, { k: 'croco', w: 64, h: 26 }, { k: 'flamant', w: 30, h: 58 },
    { k: 'borne', w: 22, h: 40 }, { k: 'police', w: 84, h: 40, min: 600 }
  ];
  const jump = () => { if (y === 0 && !game.over) { vy = 640; api.sfx.play('tap'); } };
  const game = {
    score: 0, over: false,
    help: 'Ryan fuit la brigade du QI sur le front de mer. Espace, haut ou toucher pour sauter.',
    input(k) { if (k === 'up' || k === 'act') jump(); if (k === 'down' && y > 0) vy = Math.min(vy, -500); },
    step(dt) {
      t += dt; speed += dt * 7; dist += speed * dt;
      const sc = Math.floor(dist / 25);
      if (Math.floor(sc / 100) > Math.floor(game.score / 100)) api.sfx.play('tick');
      game.score = sc;
      if (y > 0 || vy > 0) { vy -= 1900 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0; }
      gap -= dt;
      if (gap <= 0) {
        const pool = TYPES.filter(o => !o.min || game.score >= o.min);
        obs.push({ ...pick(pool), x: W + 20 });
        gap = rnd(0.75, 1.6) * Math.max(0.6, 280 / speed) + (Math.random() < 0.15 ? -0.3 : 0);
        gap = Math.max(0.45, gap);
      }
      for (const o of obs) o.x -= speed * dt * (o.k === 'police' ? 1.25 : 1);
      obs = obs.filter(o => o.x + o.w > -20);
      const ry = G - y;
      for (const o of obs) if (X + 14 > o.x + 4 && X - 14 < o.x + o.w - 4 && ry > G - o.h + 4) {
        game.over = true;
        game.why = { cone: 'Pris dans un plot. Le génie du quartier.', croco: 'Croqué par Leonida Man.', flamant: 'Percuté un flamant. Il réclame des dommages.', borne: 'Une borne à incendie. Splash.', police: 'Arrêté par la brigade du QI.' }[o.k];
      }
      night = (Math.sin(game.score / 500) + 1) / 2;
    },
    draw(c) {
      sunset(c);
      if (night > 0.6) { c.fillStyle = `rgba(20,6,40,${(night - 0.6) * 1.6})`; c.fillRect(0, 0, W, H); }
      c.fillStyle = C.gold; c.beginPath(); c.arc(260, 300, 46, 0, 7); c.fill();
      c.fillStyle = '#2a7fb8'; c.fillRect(0, 330, W, 70);
      c.fillStyle = '#ffffff33'; for (let x = -(dist * 0.2) % 60; x < W; x += 60) c.fillRect(x, 350, 26, 2);
      for (let x = -(dist * 0.5) % 140; x < W + 40; x += 140) palm(c, x + 20, 392, 60);
      c.fillStyle = '#f2c98a'; c.fillRect(0, G, W, H - G);
      c.fillStyle = '#d9a866'; for (let x = -dist % 40; x < W; x += 40) c.fillRect(x, G + 14, 12, 3);
      for (const o of obs) {
        const oy = G - o.h;
        if (o.k === 'cone') { c.fillStyle = C.orange; c.beginPath(); c.moveTo(o.x, G); c.lineTo(o.x + o.w / 2, oy); c.lineTo(o.x + o.w, G); c.fill(); c.fillStyle = '#fff'; c.fillRect(o.x + 5, oy + 16, o.w - 10, 5); }
        else if (o.k === 'croco') croco(c, o.x, oy - 10, o.w, o.h + 10, -1);
        else if (o.k === 'flamant') {
          c.strokeStyle = C.pink; c.lineWidth = 3; c.beginPath(); c.moveTo(o.x + 15, G); c.lineTo(o.x + 15, oy + 30); c.stroke();
          c.fillStyle = C.pink; c.beginPath(); c.ellipse(o.x + 15, oy + 26, 15, 9, 0, 0, 7); c.fill();
          c.beginPath(); c.moveTo(o.x + 22, oy + 22); c.quadraticCurveTo(o.x + 34, oy, o.x + 24, oy + 2); c.lineWidth = 4; c.stroke();
        } else if (o.k === 'borne') { c.fillStyle = '#e8313f'; rr(c, o.x + 3, oy + 6, o.w - 6, o.h - 6, 5); rr(c, o.x, oy + 14, o.w, 6, 3); c.fillStyle = C.gold; rr(c, o.x + 6, oy, o.w - 12, 8, 4); }
        else {
          car(c, o.x, oy, o.w, o.h, '#f4f4f8', -1);
          c.fillStyle = C.shadow; c.fillRect(o.x + 10, oy + o.h * 0.5, o.w - 20, 5);
          c.fillStyle = (t * 6 | 0) % 2 ? '#ff2a4d' : C.blue; c.fillRect(o.x + o.w * 0.4, oy + 2, 14, 5);
        }
      }
      const ry = G - y, leg = y > 0 ? 0 : Math.sin(t * 22) * 6;
      c.strokeStyle = '#3b4a7a'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(X - 4, ry - 22); c.lineTo(X - 6 + leg, ry - 2); c.moveTo(X + 4, ry - 22); c.lineTo(X + 6 - leg, ry - 2); c.stroke();
      c.fillStyle = C.pink; rr(c, X - 11, ry - 46, 22, 26, 6);
      c.strokeStyle = C.skin; c.beginPath(); c.moveTo(X - 9, ry - 40); c.lineTo(X - 16 - leg / 2, ry - 28); c.moveTo(X + 9, ry - 40); c.lineTo(X + 16 + leg / 2, ry - 28); c.stroke();
      head(c, X, ry - 60, 26);
    }
  };
  return game;
}

const GAMES = {
  crossy: { n: 'Traversée de Vice', d: 'Façon Crossy Road. Traverse routes et canaux sans finir sur un capot.', make: crossy, pad: 'dirs' },
  tetris: { n: 'Tétris des neurones', d: 'Range ses neurones en lignes avant que le cerveau déborde.', make: tetris, pad: 'tetris' },
  snake: { n: 'Croco Snake', d: 'Leonida Man mange des neurones et grandit. Évite ta queue.', make: snake, pad: 'dirs' },
  run: { n: 'Ryan Run', d: 'Façon dinosaure de Chrome. Saute les plots, les crocos et la police.', make: run, pad: 'jump' }
};
const UNITS = { crossy: ['case', 'cases'], tetris: ['point', 'points'], snake: ['neurone', 'neurones'], run: ['m', 'm'] };
const UNIT = new Proxy({}, { get: (_, id) => UNITS[id][1] });
const unit = (id, n) => UNITS[id][n > 1 ? 1 : 0];

/* ---------- Moteur ---------- */
let cur = null, curId = '', raf = 0, last = 0, paused = false, ended = false, cv, ctx, lastFocus = null;

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function hud() {
  $('#arc-score').textContent = `${cur.score} ${unit(curId, cur.score)}`;
  $('#arc-best').textContent = best[curId] ? `Record : ${best[curId]}` : 'Pas encore de record';
}
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
  if (!paused && !cur.over) cur.step(dt);
  ctx.save(); cur.draw(ctx); ctx.restore();
  if (paused && !cur.over) { ctx.fillStyle = '#1a0a2caa'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = C.ink; ctx.font = '40px Anton, Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PAUSE', W / 2, H / 2); ctx.textAlign = 'left'; }
  hud();
  if (cur.over && !ended) gameOver();
  raf = requestAnimationFrame(frame);
}
function gameOver() {
  ended = true;
  api.sfx.play('ko');
  const rec = cur.score > (best[curId] || 0);
  if (rec) { best[curId] = cur.score; saveBest(); renderGrid(); }
  api.hit?.('arcade');
  const ov = $('#arc-over');
  ov.querySelector('b').textContent = rec && cur.score ? 'NOUVEAU RECORD' : 'WASTED';
  ov.querySelector('span').textContent = `${cur.why || ''} Score : ${cur.score} ${unit(curId, cur.score)}.`;
  ov.hidden = false;
  $('#arc-again').focus({ preventScroll: true });
}
function start(id) {
  curId = id; cur = GAMES[id].make(); ended = false; paused = false;
  $('#arc-t').textContent = GAMES[id].n;
  $('#arc-help').textContent = cur.help;
  $('#arc-over').hidden = true;
  $('#arcpad').dataset.pad = GAMES[id].pad;
  $('#arcpad .act').textContent = id === 'tetris' ? 'Lâcher' : id === 'run' ? 'Saut' : 'Avancer';
  $('#arc-pause').setAttribute('aria-pressed', 'false');
  cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame);
}
export function open(id = 'crossy') {
  lastFocus = document.activeElement;
  const dlg = $('#arcdlg');
  dlg.classList.add('open');
  document.body.style.overflow = 'hidden';
  fitCanvas();
  start(id);
  cv.focus({ preventScroll: true });
}
function close() {
  cancelAnimationFrame(raf); cur = null;
  $('#arcdlg').classList.remove('open');
  document.body.style.overflow = '';
  lastFocus?.focus?.({ preventScroll: true });
}
export const isOpen = () => !!cur;

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', z: 'up', w: 'up', s: 'down', q: 'left', a: 'left', d: 'right', ' ': 'act', Enter: 'act' };
function send(k) {
  if (!cur) return;
  if (cur.over) { if (k === 'act') start(curId); return; }
  if (paused) return;
  cur.input(k);
}
function togglePause() { if (!cur || cur.over) return; paused = !paused; $('#arc-pause').setAttribute('aria-pressed', String(paused)); }

function renderGrid() {
  const g = $('#arcgrid'); if (!g) return;
  g.innerHTML = Object.entries(GAMES).map(([id, x]) => `<button class="arccard" type="button" data-g="${id}">
    <canvas width="${W}" height="200" aria-hidden="true" data-prev="${id}"></canvas>
    <b>${esc(x.n)}</b><span>${esc(x.d)}</span>
    <small>${best[id] ? `Record : ${best[id]} ${unit(id, best[id])}` : 'Pas encore de record'}</small></button>`).join('');
  g.querySelectorAll('canvas[data-prev]').forEach(p => {
    const c = p.getContext('2d'), gm = GAMES[p.dataset.prev].make();
    c.save(); c.scale(1, 1); c.translate(0, -(H - 200) / 2);
    if (p.dataset.prev === 'run') c.translate(0, -110); if (p.dataset.prev === 'crossy') c.translate(0, 80);
    gm.draw(c); c.restore();
  });
}

export function init(a) {
  api = a;
  document.body.insertAdjacentHTML('beforeend', `<div class="scrim" id="arcdlg">
  <div class="arcbox" role="dialog" aria-modal="true" aria-labelledby="arc-t">
    <div class="archead"><h2 id="arc-t">Arcade</h2>
      <div class="archbtn">
        <button class="icon-btn" type="button" id="arc-pause" aria-label="Mettre en pause" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg></button>
        <button class="btn" type="button" id="arc-close">Fermer</button>
      </div></div>
    <p class="muted arc-help" id="arc-help"></p>
    <div class="arcstage"><canvas id="arc-cv" tabindex="0" aria-label="Zone de jeu"></canvas>
      <div class="arcover" id="arc-over" hidden><b>WASTED</b><span></span><button class="btn primary" type="button" id="arc-again">Rejouer</button></div></div>
    <div class="arcbar"><span id="arc-score">0</span><span id="arc-best"></span></div>
    <div class="arcpad" id="arcpad">
      <button type="button" data-k="left" aria-label="Gauche"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button type="button" data-k="up" aria-label="Haut"><svg viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg></button>
      <button type="button" data-k="down" aria-label="Bas"><svg viewBox="0 0 24 24"><path d="M5 9l7 7 7-7"/></svg></button>
      <button type="button" data-k="right" aria-label="Droite"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      <button type="button" data-k="act" class="act" aria-label="Action">Saut</button>
    </div>
  </div></div>`);
  cv = $('#arc-cv'); ctx = cv.getContext('2d');
  renderGrid();
  $('#arcgrid')?.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) open(b.dataset.g); });
  $('#arc-close').addEventListener('click', close);
  $('#arc-again').addEventListener('click', () => { start(curId); cv.focus({ preventScroll: true }); });
  $('#arc-pause').addEventListener('click', togglePause);
  $('#arcdlg').addEventListener('click', e => { if (e.target.id === 'arcdlg') close(); });
  // Manette tactile : un appui = une action, maintien = répétition (sauf saut).
  $('#arcpad').querySelectorAll('button').forEach(b => {
    let rep = 0;
    const stop = () => { clearInterval(rep); rep = 0; };
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); send(b.dataset.k);
      if (b.dataset.k !== 'act' && curId !== 'crossy') { stop(); rep = setInterval(() => send(b.dataset.k), 120); }
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, stop));
  });
  // Glisser sur le jeu = direction, toucher = action (tourner au Tétris).
  let sx = 0, sy = 0, st = 0;
  cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
  cv.addEventListener('pointerup', e => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) send(curId === 'tetris' ? 'up' : 'act');
    else if (Math.abs(dx) > Math.abs(dy)) send(dx > 0 ? 'right' : 'left');
    else send(dy > 0 ? (curId === 'tetris' && Date.now() - st < 250 && dy > 60 ? 'act' : 'down') : 'up');
  });
  cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('keydown', e => {
    if (!cur) return;
    e.stopPropagation(); // pas de codes de triche pendant une partie
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
    if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
    const k = KEYS[e.key] || KEYS[e.key.toLowerCase?.()];
    if (k) { e.preventDefault(); send(k); }
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden && cur && !cur.over) { paused = true; $('#arc-pause').setAttribute('aria-pressed', 'true'); } });
}
