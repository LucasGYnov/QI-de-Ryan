import { $, esc, ls, reduced } from './util.js';

// Easter eggs : suivi local (cet appareil), carte de Neuronida, et les gros effets (police, prison, tour radio, ovni…).
// x, y = position du repère sur la carte (viewBox 600 × 760). Ne pas renommer les ids : ils sont mémorisés.
export const EGGS = [
  { id: 'wanted', n: 'Avis de recherche', x: 300, y: 150, hint: 'Le titre déteste qu\'on clique dessus. Vraiment beaucoup.' },
  { id: 'dossier', n: 'Dossier confidentiel', x: 215, y: 205, hint: 'Son 8 auto-déclaré cache un dossier. Insiste.' },
  { id: 'soleil', n: 'Soleil à lunettes', x: 390, y: 195, hint: 'Le soleil tape fort. Il lui faut une protection.' },
  { id: 'coco', n: 'Noix de coco', x: 150, y: 300, hint: 'Secoue un palmier.' },
  { id: 'spam', n: 'Distributeur', x: 262, y: 285, hint: 'Martèle un bouton de vote pendant la recharge.' },
  { id: 'onglet', n: 'Abandon de poste', x: 362, y: 292, hint: 'Va voir ailleurs, puis reviens.' },
  { id: 'konami', n: 'Code légendaire', x: 452, y: 335, hint: 'Haut, haut, bas, bas… au clavier, ou en toutes lettres dans le téléphone à codes.' },
  { id: 'hesoyam', n: 'Cheat santé', x: 180, y: 392, hint: 'Le code de santé le plus célèbre de la série.' },
  { id: 'ryan', n: 'Appel à témoins', x: 252, y: 370, hint: 'Tape son prénom.' },
  { id: 'leonida', n: 'Carte postale', x: 352, y: 382, hint: 'Tape le nom de l\'État.' },
  { id: 'lucia', n: 'La partenaire', x: 420, y: 425, hint: 'Tape le prénom de l\'héroïne.' },
  { id: 'jason', n: 'Le complice', x: 130, y: 462, hint: 'Tape le prénom du héros.' },
  { id: 'vice', n: 'Vice', x: 440, y: 505, hint: 'Tape la grande ville, en quatre lettres.' },
  { id: 'flamant', n: 'Flamant rose', x: 210, y: 472, hint: 'Tape le nom de l\'oiseau rose.' },
  { id: 'croco', n: 'Leonida Man', x: 272, y: 522, hint: 'Tape le nom du reptile de la supérette.' },
  { id: 'police', n: 'Contrôle routier', x: 350, y: 470, hint: 'Les étoiles de recherche n\'aiment pas qu\'on insiste. Ou tape « police ».' },
  { id: 'prison', n: 'Au trou', x: 170, y: 560, hint: 'Frappe trois fois sur le titre du casier. Ou tape « prison ».' },
  { id: 'oeuf', n: 'Œuf de la tour', x: 330, y: 562, hint: 'Grimpe la tour radio jusqu\'au nid, puis lance un œuf jauge pleine.' },
  { id: 'voiture', n: 'Confiance ?', x: 402, y: 592, hint: 'Une vieille américaine est garée sur le front de mer.' },
  { id: 'affiche', n: 'Affiche officielle', x: 200, y: 600, hint: 'Ryan adore poser. Clique-le trois fois.' },
  { id: 'ovni', n: 'La vérité est ailleurs', x: 300, y: 668, hint: 'Ces oiseaux ne sont pas des oiseaux. Ou tape 2314.' },
  { id: 'chien', n: 'Chien cool', x: 540, y: 560, hint: 'Quelqu\'un fait du jet-ski. Touche la mer.' },
  // Bonus : affichés sur la carte, mais pas nécessaires pour le trophée « Chasseur d'œufs ».
  { id: 'coeurs', bonus: true, n: 'Love sur la page', x: 60, y: 330, hint: 'Tape le surnom d\'un pote : ju, matmat, gabou, lulu, vivi, ethan.' },
  { id: 'krav', bonus: true, n: 'Krav-maga', x: 555, y: 300, hint: 'Tape « krav » ou « maga ».' },
  { id: 'vroum', bonus: true, n: 'Grand Prix', x: 560, y: 425, hint: 'Fais le bruit du moteur.' },
  { id: 'csgo', bonus: true, n: 'Caisse ouverte', x: 60, y: 450, hint: 'Une caisse traîne sur le front de mer. Ou tape « csgo ».' },
  { id: 'morgane', bonus: true, n: 'Nuage de fumée', x: 70, y: 545, hint: 'Tape « morgane ».' },
  { id: 'radar', bonus: true, n: 'Excès de vitesse', x: 565, y: 100, hint: 'Fais défiler la page beaucoup trop vite.' },
  { id: 'dixtrois', bonus: true, n: '10 h 03', x: 160, y: 742, hint: 'Vote à 10 h 03, comme sa date d\'anniversaire.' }
];
const REQ = EGGS.filter(e => !e.bonus);
const BY = Object.fromEntries(EGGS.map(e => [e.id, e]));
const cell = e => 'ABCDEFGH'[Math.min(7, Math.floor(e.y / 95))] + (Math.floor(e.x / 100) + 1);

let api = {};
const found = new Set((() => { try { return JSON.parse(ls.get('ryan_eggs') || '[]'); } catch (e) { return []; } })().filter(id => BY[id]));
let brain = ls.get('ryan_brain') === '1';

export const progress = () => { const n = REQ.filter(e => found.has(e.id)).length; return { n, total: REQ.length, all: n === REQ.length, brain }; };

export const localTrophies = () => [
  { id: 'chasseur', n: 'Chasseur d\'œufs', d: `Trouver tous les easter eggs (${progress().n}/${REQ.length}). La carte garde la trace.`, tier: 'o', ic: 'egg', got: progress().all, local: true },
  { id: 'neurone', n: 'Neurone retrouvé', d: 'Retrouver le cerveau de Ryan sur la carte de Neuronida.', tier: 'p', ic: 'brain', secret: true, got: brain, local: true }
];

let popTimer;
function pop(txt) {
  const el = $('#eggpop');
  el.querySelector('span').textContent = txt;
  el.classList.add('show');
  clearTimeout(popTimer);
  popTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// Remet à zéro tous les easter eggs (ids vide) ou seulement ceux listés. Le cerveau repart avec « all ».
export function reset(ids) {
  const list = ids && ids.length ? ids.filter(id => found.has(id)) : null;
  if (list && !list.length) { api.toast('Easter egg inconnu ou pas encore trouvé.'); return; }
  const what = list ? list.map(id => BY[id].n).join(', ') : 'tous les easter eggs et le cerveau';
  if (!confirm(`Réinitialiser ${what} sur cet appareil ?`)) return;
  if (list) list.forEach(id => found.delete(id));
  else { found.clear(); brain = false; ls.set('ryan_brain', '0'); }
  ls.set('ryan_eggs', JSON.stringify([...found]));
  api.toast(list ? `Réinitialisé : ${what}.` : 'Easter eggs remis à zéro.');
  api.onChange?.();
  if (mapOpen) paintMap();
}

export function hit(id) {
  if (!BY[id] || found.has(id)) return;
  found.add(id);
  ls.set('ryan_eggs', JSON.stringify([...found]));
  const p = progress();
  pop(BY[id].bonus ? `Easter egg bonus : ${BY[id].n}` : `Easter egg ${p.n}/${p.total} : ${BY[id].n}`);
  api.onChange?.();
  if (mapOpen) paintMap();
  if (!BY[id].bonus && p.all) setTimeout(() => {
    api.banner('CHASSEUR D\'ŒUFS', 'Tous les easter eggs trouvés', 'Nouvelle piste sur la carte : le cerveau de Ryan a été aperçu sur l\'île.');
    api.sfx.play('trophy');
  }, 3800);
}

/* ---------- Police ---------- */
const COP = `<svg viewBox="0 0 270 110" width="270" height="110" aria-hidden="true">
  <path d="M14 80l6-20 52-6 24-24h86l28 24 44 6 4 20z" fill="#f4f0ff" stroke="#12051f" stroke-width="4" stroke-linejoin="round"/>
  <path d="M12 74h250v14H12z" fill="#12051f"/><path d="M14 62h58l26-28M182 34l26 26" fill="none" stroke="#12051f" stroke-width="3"/>
  <path d="M104 36h34v22h-48zM146 36h32l22 22h-54z" fill="#3b2a5c"/><path d="M110 40l8 0-10 12" stroke="#9fd8ff" stroke-width="3"/>
  <text x="135" y="72" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="14" fill="#12051f">POLICE DU QI</text>
  <rect class="gyro r" x="112" y="20" width="22" height="10" rx="3" fill="#ff2a4d" stroke="#12051f" stroke-width="2"/><rect class="gyro b" x="136" y="20" width="22" height="10" rx="3" fill="#2a6bff" stroke="#12051f" stroke-width="2"/>
  <circle cx="64" cy="88" r="17" fill="#12051f"/><circle cx="64" cy="88" r="7" fill="#b9a9d6"/><circle cx="212" cy="88" r="17" fill="#12051f"/><circle cx="212" cy="88" r="7" fill="#b9a9d6"/>
  <rect x="8" y="66" width="10" height="6" rx="2" fill="#ffe27a"/></svg>`;
let copBusy = false;
export function police() {
  hit('police');
  api.toast('Contrôle d\'intelligence. Souffle dans le neurone, s\'il te plaît.');
  api.sfx.play('siren');
  if (copBusy || reduced()) return;
  copBusy = true;
  const w = innerWidth, stop = w / 2 - 135;
  const el = Object.assign(document.createElement('div'), { className: 'cop', innerHTML: COP });
  const skid = Object.assign(document.createElement('div'), { className: 'skid' });
  skid.style.left = (stop + 40) + 'px';
  document.body.append(skid, el);
  const a = el.animate([
    { transform: `translateX(${w + 20}px)` },
    { transform: `translateX(${stop + 60}px) rotate(-9deg)`, offset: 0.3 },
    { transform: `translateX(${stop - 10}px) rotate(5deg)`, offset: 0.4 },
    { transform: `translateX(${stop}px) rotate(0deg)`, offset: 0.46 },
    { transform: `translateX(${stop}px) rotate(0deg)`, offset: 0.78 },
    { transform: 'translateX(-320px) rotate(0deg)' }
  ], { duration: 5600, easing: 'ease-in-out', fill: 'forwards' });
  setTimeout(() => skid.classList.add('on'), 1700);
  setTimeout(() => skid.classList.remove('on'), 4600);
  a.onfinish = () => { el.remove(); skid.remove(); copBusy = false; };
}

/* ---------- Prison ---------- */
let barsBusy = false;
export function prison() {
  hit('prison');
  api.banner('AU TROU', 'Détention provisoire', 'Motif : 8/10 autodéclaré sans la moindre preuve.', 'ko');
  api.sfx.play('bars');
  if (barsBusy) return;
  barsBusy = true;
  const el = Object.assign(document.createElement('div'), { className: 'bars' });
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = Array.from({ length: 11 }, () => '<i></i>').join('') + '<b style="top:18%"></b><b style="top:78%"></b>';
  document.body.append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  setTimeout(() => el.classList.remove('on'), 3000);
  setTimeout(() => { el.remove(); barsBusy = false; }, 3400);
}

/* ---------- Ovni (code 2314) ---------- */
let ufoBusy = false;
export function ufo() {
  hit('ovni');
  api.toast('Scan extraterrestre de Ryan terminé : aucune forme de vie intelligente détectée.');
  if (ufoBusy || reduced()) return;
  ufoBusy = true;
  const art = $('#ryan');
  if (art.getBoundingClientRect().top < 60) art.scrollIntoView({ block: 'center' });
  const r = art.getBoundingClientRect();
  const el = Object.assign(document.createElement('div'), { className: 'ufo' });
  el.innerHTML = `<div class="beam"></div><svg viewBox="0 0 160 80" width="160" height="80" aria-hidden="true"><path d="M52 34c4-18 52-18 56 0" fill="#9fd8ff" stroke="#12051f" stroke-width="4"/><ellipse cx="80" cy="44" rx="74" ry="18" fill="#c9bfe0" stroke="#12051f" stroke-width="4"/><circle cx="36" cy="46" r="5" fill="#ffd45c"/><circle cx="80" cy="50" r="5" fill="#ff5fa2"/><circle cx="124" cy="46" r="5" fill="#7dffb0"/></svg>`;
  el.style.left = (r.left + r.width / 2 - 80) + 'px';
  document.body.append(el);
  const top = Math.max(8, r.top - 96);
  const a = el.animate([
    { transform: 'translateY(-220px)' }, { transform: `translateY(${top + 220}px)`, offset: 0.25 },
    { transform: `translateY(${top + 220}px)`, offset: 0.75 }, { transform: 'translateY(-220px)' }
  ], { duration: 4200, easing: 'ease-in-out', fill: 'forwards' });
  el.style.top = '-220px';
  setTimeout(() => { el.classList.add('scan'); $('#ryan').classList.add('scanned'); }, 1100);
  setTimeout(() => { el.classList.remove('scan'); $('#ryan').classList.remove('scanned'); }, 3100);
  a.onfinish = () => { el.remove(); ufoBusy = false; };
}

/* ---------- Chien en jet-ski ---------- */
let dogBusy = false;
export function dog() {
  hit('chien');
  api.toast('Un chien en jet-ski, lunettes de soleil. Plus cool que Ryan, et de loin.');
  if (dogBusy || reduced()) return;
  dogBusy = true;
  const hero = $('.hero'), hr = hero.getBoundingClientRect(), sr = $('#sea').getBoundingClientRect();
  const el = Object.assign(document.createElement('div'), { className: 'dog' });
  el.innerHTML = `<svg viewBox="0 0 150 80" width="150" height="80" aria-hidden="true"><path d="M8 58c20 10 100 12 132 0l-8-12H20z" fill="#ff5fa2" stroke="#12051f" stroke-width="4" stroke-linejoin="round"/><path d="M40 46l10-14h40l12 14" fill="#45e3cf" stroke="#12051f" stroke-width="4"/><circle cx="82" cy="24" r="14" fill="#e2b07a" stroke="#12051f" stroke-width="4"/><path d="M90 14l10-10 2 16" fill="#b57a4a" stroke="#12051f" stroke-width="3"/><path d="M92 28c8 0 12 2 14 5" stroke="#12051f" stroke-width="3" fill="none"/><rect x="74" y="18" width="24" height="7" rx="3" fill="#12051f"/><path d="M2 64c6-2 10-2 14 0M140 60c4-6 8-6 10-4" stroke="#fff" stroke-width="3" fill="none"/></svg>`;
  el.style.top = Math.max(0, sr.top - hr.top + 14) + 'px';
  hero.append(el);
  const a = el.animate([{ transform: 'translateX(-170px)' }, { transform: `translateX(${hr.width + 20}px)` }], { duration: 6500, easing: 'linear' });
  a.onfinish = () => { el.remove(); dogBusy = false; };
}

/* ---------- Voiture des années 80 ---------- */
export function car() {
  hit('voiture');
  api.banner('— CONFIANCE ?', '— Confiance.', 'Sac de sport plein de billets dans le coffre, bracelet électronique à la cheville. Ryan conduit quand même.');
  api.sfx.play('tap');
}

/* ---------- Anniversaire (10 mars) ---------- */
export function birthday(force) {
  const d = new Date();
  if (!force && !(d.getMonth() === 2 && d.getDate() === 10)) return false;
  document.body.classList.add('bday');
  api.banner('JOYEUX ANNIVERSAIRE', 'Ryan prend un an', 'Toujours pas un neurone de plus. On souffle la bougie quand même.');
  api.sfx.play('trophy');
  confetti();
  return true;
}
export function confetti() {
  if (reduced()) return;
  const cols = ['#ffd45c', '#ff5fa2', '#45e3cf', '#ffa24c', '#9b4dff', '#7dffb0'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    document.body.append(c);
    const a = c.animate([{ transform: `translateY(-20px) rotate(0deg)` }, { transform: `translate(${(Math.random() - 0.5) * 160}px, ${innerHeight + 40}px) rotate(${Math.random() * 720}deg)` }], { duration: 2200 + Math.random() * 2000, delay: Math.random() * 600, easing: 'ease-in' });
    a.onfinish = () => c.remove();
  }
}

/* ---------- Affiche officielle ---------- */
const FLAMANT = '<svg viewBox="0 0 120 140" aria-hidden="true"><path d="M50 86l-4 22 6 22M64 86v44" stroke="#ff7fb0" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="58" cy="72" rx="30" ry="17" fill="#ff7fb0" stroke="#12051f" stroke-width="3"/><path d="M82 66C98 50 84 32 94 20" fill="none" stroke="#ff7fb0" stroke-width="8" stroke-linecap="round"/><circle cx="96" cy="18" r="8" fill="#ff7fb0" stroke="#12051f" stroke-width="3"/><path d="M102 14l14 6-12 5z" fill="#fff" stroke="#12051f" stroke-width="2"/></svg>';
const CROCO = '<svg viewBox="0 0 200 70" aria-hidden="true"><path d="M6 40Q40 18 90 26L150 28Q192 30 196 42Q190 50 150 48L90 50Q40 58 6 40Z" fill="#3fa46a" stroke="#12051f" stroke-width="3"/><path d="M150 40l5-4 5 4 5-4 5 4 5-4 5 4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="60" cy="28" r="4" fill="#2f7d50"/><circle cx="80" cy="26" r="4" fill="#2f7d50"/><rect x="146" y="22" width="20" height="8" rx="3" fill="#12051f"/></svg>';
const BAG = '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M30 30c0-18 60-18 60 0" fill="none" stroke="#12051f" stroke-width="6"/><rect x="10" y="30" width="100" height="52" rx="16" fill="#2e2350" stroke="#12051f" stroke-width="4"/><path d="M10 50h100" stroke="#6a4f9e" stroke-width="4"/><rect x="34" y="18" width="40" height="18" rx="3" fill="#c9f27a" stroke="#12051f" stroke-width="3" transform="rotate(-12 54 27)"/><rect x="54" y="20" width="40" height="18" rx="3" fill="#a6e05a" stroke="#12051f" stroke-width="3" transform="rotate(9 74 29)"/></svg>';
const TOWER = '<svg viewBox="0 0 100 160" aria-hidden="true"><path d="M30 156L50 20 70 156M38 100h24M34 128h32M43 64h14" fill="none" stroke="#12051f" stroke-width="5"/><ellipse cx="50" cy="20" rx="18" ry="8" fill="#a5743f" stroke="#12051f" stroke-width="3"/><ellipse cx="44" cy="13" rx="5" ry="7" fill="#9fd8ff" stroke="#12051f" stroke-width="2"/><ellipse cx="55" cy="12" rx="5" ry="7" fill="#ff8fc4" stroke="#12051f" stroke-width="2"/><circle cx="50" cy="4" r="4" fill="#ff2a4d"/></svg>';
let posterBuilt = false, posterFocus = null;
export function poster() {
  hit('affiche');
  const dlg = $('#posterdlg');
  if (!posterBuilt) {
    posterBuilt = true;
    const R = (s, k) => api.ryanSVG(s, { uid: 'pst' + k });
    const panels = [
      ['p-a', 'Génie incompris', R(95, 1)], ['p-b', 'Contrôle routier', COP], ['p-c', 'Leonida Man', CROCO],
      ['p-d', 'Entonnoir de compétition', R(10, 2)], ['p-logo', '', '<div class="pl-txt"><b>Le QI</b><em>de Ryan</em></div>'], ['p-e', 'Le magot', BAG],
      ['p-f', 'Faune locale', FLAMANT], ['p-g', 'Sûr de lui', R(80, 3)], ['p-h', 'La tour', TOWER]
    ];
    $('#poster-grid').innerHTML = panels.map(([c, t, svg]) => `<div class="pp ${c}">${svg}${t ? `<span>${esc(t)}</span>` : ''}</div>`).join('');
  }
  posterFocus = document.activeElement;
  dlg.classList.add('open');
  setTimeout(() => $('#poster-close').focus(), 50);
}
function closePoster() { $('#posterdlg').classList.remove('open'); posterFocus?.focus(); }

/* ---------- Tour radio, nid et lancer d'œuf ---------- */
const CLIMB = 10;
let climb = 0, throwing = false, charging = 0, power = 0, raf = 0, ov = null;
function climbTower() {
  if (throwing) return;
  if (climb < CLIMB) {
    climb++;
    $('#climber').setAttribute('cy', String(462 - climb * 27));
    $('#climber').setAttribute('opacity', '1');
    api.sfx.play('tap');
    api.toast(climb === 1 ? 'Une échelle qui monte vers un nid. Continue à grimper.' : climb < CLIMB ? `Échelle ${climb}/${CLIMB}. Ne regarde pas en bas.` : 'Au sommet : un nid plein d\'œufs colorés. Tu en prends un.');
    if (climb < CLIMB) return;
  }
  startThrow();
}
function startThrow() {
  throwing = true;
  ov = Object.assign(document.createElement('div'), { className: 'throw' });
  ov.innerHTML = `<div class="gauge" role="dialog" aria-label="Lancer d'œuf"><b>Lancer d'œuf</b><div class="bar"><i id="pw"></i></div><p>Maintiens le clic (ou la touche E), relâche quand la jauge est pleine.</p><button class="btn" type="button" id="throw-cancel">Ranger l'œuf</button></div>`;
  document.body.append(ov);
  ov.addEventListener('pointerdown', e => { if (!e.target.closest('button')) { e.preventDefault(); begin(); } });
  $('#throw-cancel').addEventListener('click', endThrow);
  $('#throw-cancel').focus();
}
function begin() {
  if (charging) return;
  charging = performance.now();
  const loop = now => {
    const k = ((now - charging) / 900) % 2;
    power = k < 1 ? k : 2 - k;
    const bar = $('#pw');
    if (bar) { bar.style.transform = `scaleX(${power})`; bar.classList.toggle('full', power >= 0.9); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}
function release() {
  if (!charging || !throwing) return;
  cancelAnimationFrame(raf); charging = 0;
  if (power >= 0.9) launch(); else flop();
}
function endThrow() { cancelAnimationFrame(raf); charging = 0; throwing = false; ov?.remove(); ov = null; }
function eggEl(x, y) {
  const e = Object.assign(document.createElement('div'), { className: 'egg' });
  e.style.left = x + 'px'; e.style.top = y + 'px';
  document.body.append(e);
  return e;
}
function flop() {
  api.toast('Lancer trop mou. Jauge pleine, sinon rien.');
  if (reduced()) return;
  const n = $('#nest').getBoundingClientRect();
  const e = eggEl(n.left + n.width / 2, n.top);
  e.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(240px)', opacity: 0 }], { duration: 900, easing: 'ease-in' }).onfinish = () => e.remove();
}
function launch() {
  endThrow();
  const n = $('#nest').getBoundingClientRect(), r = $('#ryan').getBoundingClientRect();
  const x0 = n.left + n.width / 2, y0 = n.top, x1 = r.left + r.width / 2, y1 = r.top + r.height * 0.3;
  const done = () => {
    api.sfx.play('splat');
    const sp = Object.assign(document.createElement('div'), { className: 'splat' });
    sp.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 18c8 0 10 10 18 8s14 8 8 16 6 14-2 20-6 16-16 12-12 10-20 4-16-2-14-12-12-8-6-16-2-14 8-14 12-18 20-18z" fill="#fff8e6" stroke="#12051f" stroke-width="3"/><circle cx="50" cy="52" r="15" fill="#ffc83d" stroke="#12051f" stroke-width="3"/></svg>';
    $('.ryan').append(sp);
    setTimeout(() => sp.remove(), 7000);
    cutscene('Lancer parfait. L\'œuf atterrit sur Ryan, qui croit à un soin pour cheveux longs.');
    hit('oeuf');
  };
  if (reduced()) return done();
  const e = eggEl(x0, y0), top = Math.min(y0, y1) - 160, kf = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, x = (x1 - x0) * t, y = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * (top - y0) + t * t * (y1 - y0);
    kf.push({ transform: `translate(${x}px, ${y}px) rotate(${t * 720}deg)` });
  }
  e.animate(kf, { duration: 1100, easing: 'linear', fill: 'forwards' }).onfinish = () => { e.remove(); done(); };
}
function cutscene(txt) {
  const c = Object.assign(document.createElement('div'), { className: 'cine' });
  c.innerHTML = `<i></i><i></i><p></p>`;
  c.querySelector('p').textContent = txt;
  document.body.append(c);
  requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('on')));
  setTimeout(() => c.classList.remove('on'), 3800);
  setTimeout(() => c.remove(), 4200);
}

/* ---------- Carte de Neuronida et recherche du cerveau ---------- */
const BRAIN_SPOTS = [[195, 250], [410, 262], [300, 330], [160, 420], [380, 540], [262, 585], [432, 452], [318, 440]];
let mapOpen = false, mapFocus = null, marks = [];
const uidHash = () => [...(ls.get('ryan_uid') || 'x')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const brainAt = () => BRAIN_SPOTS[uidHash() % BRAIN_SPOTS.length];

function islandPath(cx, cy, rx, ry, seed, bumps) {
  const pts = [];
  for (let i = 0; i < 140; i++) {
    const a = (i / 140) * Math.PI * 2;
    const k = 1 + 0.045 * Math.sin(bumps * a + seed) + 0.03 * Math.sin(13 * a + seed * 2) + 0.018 * Math.sin(23 * a);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
}

function mapSVG() {
  const island = islandPath(300, 390, 212, 298, 0.6, 7);
  const keys = [[78, 210, 26, 14], [520, 250, 18, 30], [540, 470, 14, 22], [90, 620, 30, 12], [230, 735, 40, 10], [470, 700, 22, 12]]
    .map(([x, y, a, b], i) => `<path d="${islandPath(x, y, a, b, i, 5)}"/>`).join('');
  let grid = '';
  for (let c = 1; c < 6; c++) grid += `<line x1="${c * 100}" y1="0" x2="${c * 100}" y2="760"/>`;
  for (let r = 1; r < 8; r++) grid += `<line x1="0" y1="${r * 95}" x2="600" y2="${r * 95}"/>`;
  let labs = '';
  for (let c = 0; c < 6; c++) labs += `<text x="${c * 100 + 50}" y="14">${c + 1}</text>`;
  for (let r = 0; r < 8; r++) labs += `<text x="9" y="${r * 95 + 52}">${'ABCDEFGH'[r]}</text><text x="591" y="${r * 95 + 52}">${'ABCDEFGH'[r]}</text>`;
  let gyri = '';
  for (let k = 0; k < 11; k++) {
    const y = 130 + k * 52;
    let d = `M80 ${y}`;
    for (let x = 80; x <= 520; x += 22) d += ` Q${x + 11} ${y + (k % 2 ? 14 : -14) * Math.sin(x / 40)} ${x + 22} ${y}`;
    gyri += `<path d="${d}"/>`;
  }
  let river = 'M300 84';
  for (let y = 84; y <= 700; y += 40) river += ` Q${300 + (y / 40 % 2 ? 22 : -22)} ${y + 20} 300 ${y + 40}`;
  const county = (x, y, t, s = 22) => `<text class="cty" x="${x}" y="${y}" font-size="${s}">${t}</text>`;
  const town = (x, y, t) => `<text class="town" x="${x}" y="${y}">${t}</text>`;
  return `<svg id="mapsvg" viewBox="0 0 600 760" role="img" aria-label="Carte de Neuronida">
  <defs><clipPath id="isl"><path d="${island}"/></clipPath>
  <linearGradient id="sea-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fb3d2"/><stop offset="1" stop-color="#3a8db3"/></linearGradient>
  <radialGradient id="land-g" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#6fa982"/><stop offset="1" stop-color="#4b8566"/></radialGradient></defs>
  <rect width="600" height="760" fill="url(#sea-g)"/>
  <g stroke="#ffffff" stroke-opacity=".22" stroke-width="1">${grid}</g>
  <g class="maplab">${labs}</g>
  <g fill="#e3c88f" stroke="#e3c88f" stroke-width="10" stroke-linejoin="round"><path d="${island}"/>${keys}</g>
  <g fill="#5c9874">${keys}</g>
  <path d="${island}" fill="url(#land-g)"/>
  <g clip-path="url(#isl)">
    <g fill="none" stroke="#8cc29c" stroke-opacity=".55" stroke-width="2">${gyri}</g>
    <ellipse cx="408" cy="300" rx="44" ry="30" fill="#4fb3d2" stroke="#e3c88f" stroke-width="3"/>
    <path d="${river}" fill="none" stroke="#4fb3d2" stroke-width="9" stroke-linecap="round"/>
    <rect x="400" y="470" width="90" height="70" rx="10" fill="#c9bfd6" opacity=".7"/>
    <rect x="110" y="250" width="60" height="44" rx="8" fill="#c9bfd6" opacity=".7"/>
    <g fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".9"><path d="M140 272C220 300 260 360 300 380S420 420 445 505"/><path d="M300 120C320 220 260 300 300 380S260 560 300 680"/><path d="M445 505C380 600 300 620 240 640"/></g>
  </g>
  <g class="shield"><path d="M286 362h28v14c0 8-14 12-14 12s-14-4-14-12z"/><text x="300" y="379">8</text></g>
  <g class="shield"><path d="M368 450h28v14c0 8-14 12-14 12s-14-4-14-12z"/><text x="382" y="467">80</text></g>
  ${county(300, 240, 'LOBE FRONTAL COUNTY', 24)}${county(185, 350, 'PARIÉTAL', 20)}${county(452, 364, 'TEMPORAL', 20)}${county(300, 614, 'OCCIPITAL COUNTY', 18)}${county(260, 730, 'CERVELET KEYS', 16)}
  ${town(445, 534, 'Vice Synapse')}${town(140, 245, 'Port Neurone')}${town(408, 304, 'Lac Lacune')}${town(205, 520, 'Matière Grise Swamp')}${town(360, 650, 'Hippocampe')}
  <text class="seaname" x="70" y="520">Golfe du Doute</text><text class="seaname" x="480" y="160">Océan de Certitude</text><text class="seaname" x="300" y="712">Détroit du 8/10</text>
  <g class="legend"><rect x="30" y="34" width="150" height="104" fill="#4fb3d2" stroke="#fff" stroke-width="2"/><text x="105" y="62" class="lg1">VISITE</text><text x="105" y="88" class="lg2">NEURONIDA</text><path d="M46 112h118" stroke="#fff" stroke-width="2"/><rect x="46" y="108" width="59" height="8" fill="#fff"/><text x="105" y="130" class="lg3">1 cm = 1 neurone</text></g>
  <g class="compass" transform="translate(72 670)"><path d="M0-34L7 0 0 34-7 0zM-34 0L0 7 34 0 0-7z" fill="#24406a" stroke="#fff" stroke-width="1.5"/><text y="-40">N</text></g>
  <g class="seal" transform="translate(505 692)"><circle r="44" fill="none" stroke="#fff" stroke-width="3"/><circle r="36" fill="none" stroke="#fff" stroke-width="1.5"/><g transform="translate(-14 -14) scale(1.15)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M11 5.5A3 3 0 0 0 5.5 7 3 3 0 0 0 4 12a3 3 0 0 0 2 5 3 3 0 0 0 5 1.5zM13 5.5A3 3 0 0 1 18.5 7 3 3 0 0 1 20 12a3 3 0 0 1-2 5 3 3 0 0 1-5 1.5z"/></g><text y="60">LE GRAND ÉTAT</text></g>
  <g id="marks"></g><g id="pins"></g><g id="brainfound"></g>
</svg>`;
}

const PIN = '<path d="M0 0C-9-12-13-17-13-23a13 13 0 0 1 26 0c0 6-4 11-13 23z"/>';
function paintMap() {
  const p = progress();
  $('#map-sub').textContent = p.all
    ? (brain ? 'Cerveau retrouvé. Ryan ne s\'en sert toujours pas.' : 'Tous les easter eggs trouvés. Le cerveau de Ryan est caché sur l\'île : touche la carte pour fouiller.')
    : `Easter eggs trouvés : ${p.n} sur ${p.total}. Trouve-les tous pour lancer la recherche du cerveau.`;
  $('#pins').innerHTML = EGGS.map((e, i) => {
    const ok = found.has(e.id);
    return `<g class="pin ${ok ? 'ok' : ''} ${e.bonus ? 'bonus' : ''}" data-id="${e.id}" transform="translate(${e.x} ${e.y})" tabindex="0" role="button" aria-label="${esc(ok ? e.n + ', trouvé' : 'Easter egg ' + (i + 1) + ', indice')}">${PIN}<text y="-18">${ok ? '✓' : '?'}</text></g>`;
  }).join('');
  $('#egglist').innerHTML = EGGS.map(e => {
    const ok = found.has(e.id);
    return `${e.id === 'coeurs' ? '<li class="egg-h">Bonus (hors trophée)</li>' : ''}<li class="${ok ? 'ok' : ''} ${e.bonus ? 'bonus' : ''}"><b>${cell(e)}</b><span>${ok ? esc(e.n) : '???'}<small>${ok ? 'Trouvé' : esc(e.hint)}</small></span></li>`;
  }).join('');
  if (brain) {
    const [bx, by] = brainAt();
    $('#brainfound').innerHTML = `<g transform="translate(${bx - 22} ${by - 22}) scale(1.8)" fill="#ff8fc4" stroke="#12051f" stroke-width="1.6"><path d="M11 5.5A3 3 0 0 0 5.5 7 3 3 0 0 0 4 12a3 3 0 0 0 2 5 3 3 0 0 0 5 1.5zM13 5.5A3 3 0 0 1 18.5 7 3 3 0 0 1 20 12a3 3 0 0 1-2 5 3 3 0 0 1-5 1.5z"/></g>`;
  }
}
function caption(t) { $('#map-cap').textContent = t; }
function pinInfo(id) {
  const e = BY[id];
  caption(found.has(id) ? `${cell(e)} · ${e.n} : trouvé.` : `${cell(e)} · Indice : ${e.hint}`);
}
function search(evt) {
  const svg = $('#mapsvg');
  const pt = new DOMPoint(evt.clientX, evt.clientY).matrixTransform(svg.getScreenCTM().inverse());
  const p = progress();
  if (!p.all) return caption(`Impossible de chercher le cerveau sans indices. Easter eggs : ${p.n}/${p.total}.`);
  if (brain) return caption('Le cerveau est déjà retrouvé. Ryan l\'a reposé quelque part, évidemment.');
  const [bx, by] = brainAt(), dist = Math.hypot(pt.x - bx, pt.y - by);
  marks = [...marks, [pt.x, pt.y]].slice(-6);
  $('#marks').innerHTML = marks.map(([x, y]) => `<path d="M${x - 7} ${y - 7}l14 14M${x + 7} ${y - 7}l-14 14" stroke="#ff2a4d" stroke-width="4" stroke-linecap="round"/>`).join('');
  if (dist < 32) {
    brain = true; ls.set('ryan_brain', '1');
    paintMap(); api.onChange?.();
    caption('TROUVÉ ! Le cerveau de Ryan était là, en parfait état. Jamais servi.');
    api.banner('CERVEAU RETROUVÉ', 'Neurone retrouvé', 'Il était sur l\'île depuis le début. État : neuf, jamais servi.');
    api.sfx.play('trophy');
    return;
  }
  caption(dist < 70 ? 'Brûlant ! Il est tout près.' : dist < 130 ? 'Chaud. Tu te rapproches.' : dist < 220 ? 'Tiède. Ça pourrait être pire.' : 'Glacial. Même Ryan chercherait mieux.');
}
export function openMap() {
  mapFocus = document.activeElement;
  const dlg = $('#mapdlg');
  if (!$('#mapsvg')) {
    $('#mapfig').insertAdjacentHTML('afterbegin', mapSVG());
    $('#mapsvg').addEventListener('click', e => {
      const pin = e.target.closest('.pin');
      if (pin) return pinInfo(pin.dataset.id);
      search(e);
    });
    $('#mapsvg').addEventListener('keydown', e => {
      const pin = e.target.closest('.pin');
      if (pin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pinInfo(pin.dataset.id); }
    });
  }
  paintMap();
  caption(progress().all && !brain ? 'Touche la carte pour fouiller.' : 'Touche un repère pour lire son indice.');
  mapOpen = true;
  dlg.classList.add('open');
  setTimeout(() => $('#map-close').focus(), 50);
}
function closeMap() { mapOpen = false; $('#mapdlg').classList.remove('open'); mapFocus?.focus(); }

/* ---------- Mise en place ---------- */
function trap(dlg, close) {
  dlg.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = [...dlg.querySelectorAll('button,[tabindex="0"],input')].filter(x => x.offsetParent !== null || x.closest('svg'));
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
}

function multi(el, n, fn) {
  let c = 0, t;
  el.addEventListener('click', () => {
    c++; clearTimeout(t);
    t = setTimeout(() => { c = 0; }, 1500);
    if (c >= n) { c = 0; fn(); }
  });
}

export function init(a) {
  api = a;
  $('#map-open').addEventListener('click', openMap);
  $('#map-close').addEventListener('click', closeMap);
  trap($('#mapdlg'), closeMap);
  $('#poster-close').addEventListener('click', closePoster);
  trap($('#posterdlg'), closePoster);
  $('#tower').addEventListener('click', climbTower);
  $('#car').addEventListener('click', car);
  $('#car-m').addEventListener('click', car);
  document.querySelectorAll('.crate').forEach(c => c.addEventListener('click', crate));
  watchSpeed();
  $('#birds').addEventListener('click', ufo);
  $('#sea').addEventListener('click', dog);
  multi($('#stars'), 3, police);
  multi($('#casier-t'), 3, prison);
  multi($('#ryan'), 3, poster);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  document.addEventListener('keydown', e => {
    if (!throwing) return;
    if (e.key === 'Escape') { endThrow(); return; }
    if ((e.key === 'e' || e.key === 'E') && !e.repeat) { e.preventDefault(); begin(); }
  });
  document.addEventListener('keyup', e => { if (throwing && (e.key === 'e' || e.key === 'E')) release(); });
}
export const isThrowing = () => throwing;

/* ---------- v4 : cœurs, krav-maga, F1, fumée, caisse CS, radar, 10 h 03 ---------- */
const HEART = '<path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2.1 0 3.7 1.2 5 3 1.3-1.8 2.9-3 5-3 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"/>';
let heartsBusy = false;
export function hearts(who) {
  hit('coeurs');
  api.toast(`${who} envoie de l'amour. Ryan ne sait pas quoi en faire.`);
  api.sfx.play('heart');
  if (heartsBusy || reduced()) return;
  heartsBusy = true;
  const cols = ['#ff5fa2', '#ff8fc4', '#ff2a4d', '#ffd45c', '#c77dff'];
  const box = Object.assign(document.createElement('div'), { className: 'hearts' });
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = Array.from({ length: 40 }, (_, i) => {
    const sz = 18 + Math.random() * 42;
    return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" style="left:${Math.random() * 96}vw;top:${Math.random() * 92}vh;animation-delay:${Math.round(Math.random() * 400)}ms" fill="${cols[i % cols.length]}" stroke="#12051f" stroke-width="1.5">${HEART}</svg>`;
  }).join('');
  document.body.append(box);
  setTimeout(() => { box.remove(); heartsBusy = false; }, 2000);
}

const FIST = `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M40 70c0-14 10-22 22-22s20 6 22 14c2-10 10-16 21-16s20 8 21 18c3-8 10-12 19-12 12 0 20 9 20 22v58c0 32-26 56-60 56H90c-32 0-50-22-50-52z" fill="#e2a77d" stroke="#12051f" stroke-width="7" stroke-linejoin="round"/><path d="M84 62v40M126 64v38M166 78v26" stroke="#12051f" stroke-width="6" stroke-linecap="round"/><path d="M40 118c18-10 52-12 74-2 10 5 10 18-2 20-20 3-44 2-62 10" fill="#d4936a" stroke="#12051f" stroke-width="7" stroke-linejoin="round"/><path d="M56 56c6-4 14-4 18 0M98 50c6-4 14-4 18 0M142 60c6-4 12-4 16 0" stroke="#f6c8a0" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;
function crackSVG() {
  let d = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
    let x = 0, y = 0;
    d += 'M0 0';
    for (let k = 1; k <= 4; k++) { const r = k * (60 + Math.random() * 50); x = Math.cos(a + (Math.random() - 0.5) * 0.25) * r; y = Math.sin(a + (Math.random() - 0.5) * 0.25) * r; d += `L${x.toFixed(0)} ${y.toFixed(0)}`; }
  }
  for (let k = 1; k <= 2; k++) { const r = 40 * k + 10; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, b = a + 0.38; d += `M${(Math.cos(a) * r).toFixed(0)} ${(Math.sin(a) * r).toFixed(0)}L${(Math.cos(b) * (r + 8)).toFixed(0)} ${(Math.sin(b) * (r + 8)).toFixed(0)}`; } }
  return `<svg viewBox="-450 -450 900 900" aria-hidden="true"><path d="${d}" fill="none" stroke="#12051f" stroke-width="7" stroke-opacity=".5" transform="translate(3 3)"/><path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="bevel"/><circle r="22" fill="#ffffff22" stroke="#fff" stroke-width="3"/></svg>`;
}
let punchBusy = false;
export function punch() {
  hit('krav');
  api.sfx.play('punch');
  api.toast('Coup de poing de krav-maga. L\'écran a perdu. Ryan aussi.');
  if (punchBusy) return;
  punchBusy = true;
  const crack = Object.assign(document.createElement('div'), { className: 'crack', innerHTML: crackSVG() });
  const impact = () => {
    document.body.append(crack);
    if (!reduced()) document.querySelectorAll('body > header, body > .ticker, body > main, body > footer').forEach(el => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); });
    setTimeout(() => crack.classList.add('out'), 1800);
    setTimeout(() => { crack.remove(); punchBusy = false; }, 2200);
  };
  if (reduced()) return impact();
  const f = Object.assign(document.createElement('div'), { className: 'fist', innerHTML: FIST });
  document.body.append(f);
  f.animate([{ transform: 'translate(-50%, 60vh) scale(.25)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.7,0,.84,0)', fill: 'forwards' })
    .onfinish = () => {
      impact();
      f.animate([{ transform: 'translate(-50%, -50%) scale(1.5)', opacity: 1 }, { transform: 'translate(-50%, 40vh) scale(.6)', opacity: 0 }], { duration: 300, easing: 'ease-in', delay: 150, fill: 'forwards' }).onfinish = () => f.remove();
    };
}

const F1CAR = `<svg viewBox="0 0 300 90" width="300" height="90" aria-hidden="true"><path d="M2 40h10l4 26M14 40h-6" stroke="#12051f" stroke-width="6" fill="none"/><rect x="0" y="30" width="26" height="12" rx="2" fill="#45e3cf" stroke="#12051f" stroke-width="3"/><path d="M30 64l12-20 44-6 30-14h50l20 16 70 12 34 6v8l-40 6H40z" fill="#ff5fa2" stroke="#12051f" stroke-width="4" stroke-linejoin="round"/><path d="M120 46h70l-6 12h-60z" fill="#45e3cf" stroke="#12051f" stroke-width="3"/><circle cx="148" cy="34" r="12" fill="#ffd45c" stroke="#12051f" stroke-width="3"/><path d="M146 30h14v6h-14z" fill="#12051f"/><text x="212" y="66" font-family="Anton,Impact,sans-serif" font-size="18" fill="#fff" stroke="#12051f" stroke-width="3" paint-order="stroke">8</text><path d="M262 70h36l-4 8h-34z" fill="#45e3cf" stroke="#12051f" stroke-width="3"/><circle cx="70" cy="70" r="18" fill="#12051f"/><circle cx="70" cy="70" r="7" fill="#ffd45c"/><circle cx="244" cy="72" r="16" fill="#12051f"/><circle cx="244" cy="72" r="6" fill="#ffd45c"/></svg>`;
let f1Busy = false;
export function f1() {
  hit('vroum');
  api.sfx.play('engine');
  api.toast('Un pilote de F1 vient de doubler Ryan. Ryan était à l\'arrêt.');
  if (f1Busy || reduced()) return;
  f1Busy = true;
  const el = Object.assign(document.createElement('div'), { className: 'f1car', innerHTML: '<i></i><i></i><i></i>' + F1CAR });
  document.body.append(el);
  el.animate([{ transform: 'translateX(-340px)' }, { transform: `translateX(${innerWidth + 40}px)` }], { duration: 1500, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = () => { el.remove(); f1Busy = false; };
}

const JOINT = `<svg viewBox="0 0 160 40" aria-hidden="true"><path d="M4 17l118-9v24L4 23z" fill="#fbf7ee" stroke="#12051f" stroke-width="3" stroke-linejoin="round"/><path d="M4 17l14-1v8l-14-1z" fill="#c9a26b" stroke="#12051f" stroke-width="2"/><path d="M40 14l2 13M70 12l2 17M100 10l2 20" stroke="#e6ddc9" stroke-width="2"/><ellipse cx="124" cy="20" rx="6" ry="12" fill="#ff7a3d" stroke="#12051f" stroke-width="3"/><circle cx="128" cy="20" r="10" fill="#ffb347" opacity=".45"/></svg>`;
let smokeBusy = false;
export function smoke() {
  hit('morgane');
  api.toast('Morgane est passée. Ryan voit des neurones partout.');
  if (smokeBusy) return;
  smokeBusy = true;
  const box = Object.assign(document.createElement('div'), { className: 'smoke' });
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = `<div class="joint l">${JOINT}</div><div class="joint r">${JOINT}</div>`;
  document.body.append(box);
  if (!reduced()) for (let i = 0; i < 30; i++) {
    const left = i % 2 === 0, puff = document.createElement('i');
    puff.style.left = left ? '150px' : `calc(100vw - 150px)`;
    box.append(puff);
    const dx = (left ? 1 : -1) * (80 + Math.random() * innerWidth * 0.4), dy = -(60 + Math.random() * innerHeight * 0.45);
    puff.animate([{ transform: 'translate(-50%, -50%) scale(.4)', opacity: 0 }, { opacity: 0.75, offset: 0.2 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${3 + Math.random() * 3})`, opacity: 0 }], { duration: 2400 + Math.random() * 1600, delay: Math.random() * 1200, easing: 'ease-out', fill: 'both' });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('on')));
  setTimeout(() => box.classList.remove('on'), 4200);
  setTimeout(() => { box.remove(); smokeBusy = false; }, 4600);
}

/* Caisse façon CS : défilement d'objets, toujours un objet rare à la fin. */
const RAR = { b: ['#4b69ff', 'Qualité militaire'], v: ['#8847ff', 'Restreint'], p: ['#d32ce6', 'Classifié'], r: ['#eb4b4b', 'Couvert'], g: ['#e4ae39', '★ Objet rare spécial'] };
const GUN = {
  pistol: '<path d="M22 20h58l6 6h12v8H62l-4 4H46l-6 16H26l6-16h-10z"/>',
  smg: '<path d="M10 22h64l6-4h14v8h10v6H80l-4 4H60l-4 14H46l4-14H34l-4 6H16l4-6h-10z"/>',
  rifle: '<path d="M4 26h72l6-6h20v6h14v6H96l-6 4H66l-8 14H46l6-14H30l-6 8H10l4-8H4z"/>',
  awp: '<path d="M2 30h20l4-6h44v-4h30v4h18l2 6v6H64l-6 6H44l-6 14H28l4-14H2z"/><rect x="50" y="10" width="34" height="8" rx="3"/>',
  kara: '<circle cx="24" cy="42" r="9" fill="none" stroke-width="6"/><path d="M30 34C60 30 92 40 114 12 104 44 72 54 34 48z"/>'
};
const SKINS = [
  { n: 'P250 | Neurone grillé', r: 'b', ic: 'pistol', c: ['#9fd8ff', '#4b69ff'] },
  { n: 'Glock | Flamant rose', r: 'b', ic: 'pistol', c: ['#ffb0d3', '#ff5fa2'] },
  { n: 'MP9 | Coucher de soleil', r: 'v', ic: 'smg', c: ['#ffd38a', '#ff5f9e'] },
  { n: 'AK | Nuits de Leonida', r: 'v', ic: 'rifle', c: ['#c77dff', '#24093f'] },
  { n: 'M4 | Vice Synapse', r: 'p', ic: 'rifle', c: ['#45e3cf', '#8847ff'] },
  { n: 'Deagle | 8 sur 10', r: 'p', ic: 'pistol', c: ['#ffd45c', '#ff7a73'] },
  { n: 'AWP | Dragon Lore', r: 'r', ic: 'awp', c: ['#e8c45a', '#3f7d4e'] },
  { n: '★ Karambit | Fondu', r: 'g', ic: 'kara', c: ['#ffd45c', '#ff5fa2', '#8a4dff'] }
];
function skinSVG(sk, k) {
  const g = `sk-${k}-${sk.ic}`;
  const stops = sk.c.map((c, i) => `<stop offset="${i / (sk.c.length - 1)}" stop-color="${c}"/>`).join('');
  const deco = sk.ic === 'awp' ? '<path d="M30 34c8-8 16 0 24-6s14 2 22-4M34 40c6-3 10 2 16-1" fill="none" stroke="#2a4d2f" stroke-width="2"/>' : '';
  return `<svg viewBox="0 0 120 60" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><g fill="url(#${g})" stroke="#12051f" stroke-width="2.5" stroke-linejoin="round">${GUN[sk.ic]}</g>${deco}</svg>`;
}
let crateOpen = false, crateFocus = null;
export function crate() {
  hit('csgo');
  if (crateOpen) return;
  crateOpen = true; crateFocus = document.activeElement;
  const win = SKINS[Math.random() < 0.5 ? 6 : 7];
  const items = Array.from({ length: 44 }, (_, i) => i === 36 ? win : SKINS[Math.floor(Math.random() * 6)]);
  const dlg = Object.assign(document.createElement('div'), { className: 'scrim open crate-dlg' });
  dlg.innerHTML = `<div class="cratebox" role="dialog" aria-modal="true" aria-label="Ouverture de caisse"><b class="crate-t">Caisse du QI · Opération Neurone</b><div class="reel"><div class="strip">${items.map((sk, i) => `<div class="sk" style="--r:${RAR[sk.r][0]}">${skinSVG(sk, i)}</div>`).join('')}</div><i class="needle"></i></div><div class="won" aria-live="polite"></div><button class="btn primary" type="button">Ranger dans l'inventaire</button></div>`;
  document.body.append(dlg);
  const btn = dlg.querySelector('button');
  const onKey = e => { if (e.key === 'Escape') close(); if (e.key === 'Tab') { e.preventDefault(); btn.focus(); } };
  const close = () => { dlg.remove(); crateOpen = false; document.removeEventListener('keydown', onKey); crateFocus?.focus(); };
  btn.addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  document.addEventListener('keydown', onKey);
  btn.focus();
  const reveal = () => {
    dlg.querySelector('.won').innerHTML = `<div class="sk big" style="--r:${RAR[win.r][0]}">${skinSVG(win, 'won')}</div><strong style="color:${RAR[win.r][0]}">${esc(win.n)}</strong><small>${RAR[win.r][1]} · Valeur estimée : plus que le QI de Ryan.</small>`;
    api.sfx.play('trophy');
  };
  if (reduced()) return reveal();
  const reel = dlg.querySelector('.reel'), strip = dlg.querySelector('.strip');
  const cw = strip.firstElementChild.offsetWidth + 6;
  const target = 36 * cw - (reel.clientWidth / 2 - cw / 2) + (Math.random() - 0.5) * (cw - 30);
  const a = strip.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-target}px)` }], { duration: 4200, easing: 'cubic-bezier(.08,.6,.12,1)', fill: 'forwards' });
  let last = 0;
  const tick = () => {
    if (!crateOpen) return;
    const t = a.currentTime || 0, m = new DOMMatrix(getComputedStyle(strip).transform), idx = Math.floor(-m.m41 / cw);
    if (idx !== last) { last = idx; api.sfx.play('tick'); }
    if (t < 4200) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  a.onfinish = () => { if (crateOpen) reveal(); };
}

/* Radar : défilement trop rapide. */
let radarCool = 0;
export function radar(v) {
  hit('radar');
  api.sfx.play('flash');
  const fl = Object.assign(document.createElement('div'), { className: 'flash' });
  const tk = Object.assign(document.createElement('div'), { className: 'ticket' });
  tk.setAttribute('role', 'status');
  tk.innerHTML = `<b>AVIS DE CONTRAVENTION</b><span>Radar automatique de Leonida</span><dl><dt>Vitesse mesurée</dt><dd>${v.toLocaleString('fr-FR')} px/s</dd><dt>Vitesse autorisée</dt><dd>3 000 px/s</dd><dt>Sanction</dt><dd>retrait d'un neurone. Il en reste… aucun.</dd></dl><small>Ralentis, la page n'est pas une autoroute.</small>`;
  document.body.append(fl, tk);
  requestAnimationFrame(() => requestAnimationFrame(() => { fl.classList.add('off'); tk.classList.add('show'); }));
  setTimeout(() => fl.remove(), 600);
  setTimeout(() => tk.classList.remove('show'), 4800);
  setTimeout(() => tk.remove(), 5200);
}
function watchSpeed() {
  let y = scrollY, t = performance.now(), fast = 0;
  addEventListener('scroll', () => {
    const now = performance.now(), dt = now - t;
    if (dt < 16) return;
    const v = Math.abs(scrollY - y) / dt * 1000;
    y = scrollY; t = now;
    if (dt > 200 || v < 5000) { fast = 0; return; }
    fast += dt;
    if (fast > 100 && now > radarCool) { radarCool = now + 45000; fast = 0; radar(Math.round(v / 10) * 10); }
  }, { passive: true });
}

/* Vote à 10 h 03 (sa date d'anniversaire en heure). */
export function tenOhThree() {
  hit('dixtrois');
  api.banner('10 H 03', 'Vote à l\'heure de son anniversaire', '10/03 : confettis offerts par la maison.');
  api.sfx.play('trophy');
  confetti();
}
export const isTenOhThree = t => { const d = new Date(t); return d.getHours() === 10 && d.getMinutes() === 3; };
