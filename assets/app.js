import { START, COOLDOWN } from './config.js';
import { $, esc, fmt, sfmt, ls, dayStart, weekStart, reduced, voterName, ago, nameKey, plural } from './util.js';
import { createStore } from './store.js';
import { computeAll, trophyIcon, TIER } from './trophies.js';
import { ryanSVG, stageOf } from './ryan.js';
import { createChart } from './chart.js';
import * as sfx from './audio.js';
import { buildCard } from './share.js';
import { REACTS, REACT_BY, rType, reactIcon } from './reactions.js';
import * as eggs from './eggs.js';

const uid = ls.get('ryan_uid') || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
ls.set('ryan_uid', uid);

const store = createStore(uid);
const chart = createChart($('#chart svg'), $('#ctip'));
let votesMap = null, reactMap = {}, D = null, raf = 0;
let period = ls.get('ryan_period') || '30';
let busy = false, dir = 1, lastFocus = null, shownLog = 40;
let lastVote = +(ls.get('ryan_last') || 0);
let curStage = null, tkKey = '';

const SOUND_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6"/></svg>';

/* ---------- Données ---------- */
const loadTimer = setTimeout(() => { if (!D) $('#delta').textContent = 'Impossible de joindre la base pour l\'instant. Nouvelle tentative en cours…'; }, 10000);

store.subscribe({
  onVotes(m) { votesMap = m || {}; schedule(); },
  onReactions(m) { reactMap = m || {}; if (votesMap) schedule(); },
  onStatus(s) {
    const txt = { live: 'Note partagée en direct', poll: 'Note partagée (actualisation toutes les 5 s)', offline: 'Connexion perdue, nouvelle tentative…', demo: 'Mode démo : votes enregistrés sur cet appareil seulement' }[s];
    $('#mode').innerHTML = `<span class="dot ${s === 'live' || s === 'poll' ? 'live' : ''}"></span>`;
    $('#mode').append(txt);
  }
});

function schedule() {
  if (raf) return;
  raf = requestAnimationFrame(() => { raf = 0; update(); });
}

function update() {
  const next = computeAll(votesMap, reactMap, START);
  next.ids = new Set(next.v.map(x => x.id));
  const mine = next.v.filter(x => x.u === uid).map(x => x.t);
  if (mine.length) lastVote = Math.max(lastVote, ...mine);
  const old = D;
  D = next;
  clearTimeout(loadTimer);
  render();
  if (old) {
    const fresh = D.v.filter(x => !old.ids.has(x.id) && x.u !== uid);
    if (fresh.length) {
      const x = fresh[fresh.length - 1];
      sfx.play(x.d > 0 ? 'up' : 'down');
      toast(`Nouveau vote : ${x.d > 0 ? '+0,1' : '−0,1'}${x.n ? ' de ' + x.n : ''}`);
      if (eggs.isTenOhThree(x.t)) setTimeout(eggs.tenOhThree, 600);
    }
    if (old.s >= 50 && D.s < 50) { banner('CERVEAU K.O.', stageOf(D.s).n, 'Ryan vient de passer sous la moyenne.', 'ko'); sfx.play('ko'); setTimeout(eggs.police, 1200); }
  } else onFirstData();
  checkTrophies();
}

// Trophées déjà vus : clé v2. Au premier passage, on mémorise l'existant sans bannière (pas de rafale).
let seen = null;
function checkTrophies() {
  const got = D.trophies.filter(t => t.got);
  if (!seen) {
    const prev = JSON.parse(ls.get('ryan_seen2') || 'null');
    seen = new Set(prev || got.map(t => t.id));
  }
  const fresh = got.filter(t => !seen.has(t.id));
  fresh.forEach(t => seen.add(t.id));
  ls.set('ryan_seen2', JSON.stringify([...seen]));
  if (fresh.length) {
    const t = fresh[fresh.length - 1];
    banner(t.tier === 'p' ? 'PLATINE DÉBLOQUÉ' : 'TROPHÉE DÉBLOQUÉ', t.n, `${TIER[t.tier].n}${fresh.length > 1 ? ` · +${fresh.length - 1} autre(s)` : ''} · ${t.d}`);
    sfx.play('trophy');
  }
}

/* ---------- Rendu ---------- */
const level = s => (s >= 80 ? 0 : s >= 70 ? 1 : s >= 55 ? 2 : s >= 40 ? 3 : s >= 20 ? 4 : 5);
const star = cls => `<svg viewBox="0 0 24 24" class="${cls}"><path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8z"/></svg>`;

function render() {
  renderHud(); renderRyan(); renderChart(); renderWeek(); renderDays();
  renderTrophies(); renderLog(); renderBoard(); renderTicker(); tick();
  if (!document.hidden) document.title = `${fmt(D.s)}/10 · Le QI de Ryan`;
}

function renderHud() {
  $('.hud').classList.remove('loading');
  $('#score').textContent = fmt(D.s);
  const d = D.s - START, lv = level(D.s);
  $('#delta').textContent = d === 0 ? 'Pile sur son 8 autoproclamé.' : `${sfmt(d)} ${d > 0 ? 'au-dessus de son 8. Ça reste à prouver.' : 'sous son 8 autoproclamé.'}`;
  $('#stars').innerHTML = [0, 1, 2, 3, 4].map(i => star(i < lv ? 'on' : 'off')).join('');
  $('#stars').setAttribute('aria-label', `${lv} étoile${lv > 1 ? 's' : ''} sur 5`);
}

function renderRyan() {
  const st = stageOf(D.s);
  if (st.id === curStage) return;
  const first = curStage === null;
  curStage = st.id;
  const el = $('#ryan');
  const put = () => { el.innerHTML = ryanSVG(D.s, { uid: 'hud' }); $('#stage').textContent = 'État : ' + st.n; el.classList.remove('swap'); };
  if (first || reduced()) return put();
  el.classList.add('swap');
  setTimeout(put, 150);
}

function windowPts() {
  const all = D.points;
  if (period === '30') return all.slice(-31);
  if (period === 'all') return all;
  const from = Date.now() - (period === '24h' ? 864e5 : 7 * 864e5);
  const k = all.findIndex(p => p.v && p.v.t >= from);
  return k < 0 ? all.slice(-1) : all.slice(Math.max(0, k - 1));
}

function renderChart() {
  const pts = windowPts();
  const marks = new Map();
  for (const t of D.trophies) if (t.got && t.at && t.at.i > 0) marks.set(t.at.i, [...(marks.get(t.at.i) || []), t.n]);
  chart.update(pts, marks);
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === period)));
  const ss = pts.map(p => p.s);
  $('#chartsub').textContent = pts.length < 2 ? 'Aucun vote sur cette période.'
    : `${pts.length - 1} vote${pts.length > 2 ? 's' : ''} affiché${pts.length > 2 ? 's' : ''}, de ${fmt(Math.min(...ss))} à ${fmt(Math.max(...ss))}. Le zoom s'adapte.`;
}

function renderWeek() {
  const ws = weekStart(Date.now()), prevWs = weekStart(ws - 3 * 864e5);
  const nets = new Map();
  for (const x of D.v) { const k = weekStart(x.t); nets.set(k, (nets.get(k) || 0) + x.d); }
  const cur = D.v.filter(x => x.t >= ws);
  const net = nets.get(ws) || 0, prev = nets.get(prevWs) || 0;
  let rec = '';
  if (cur.length && nets.size > 1) {
    const all = [...nets.values()];
    if (net < 0 && net === Math.min(...all)) rec = 'Pire semaine de la saison';
    else if (net > 0 && net === Math.max(...all)) rec = 'Meilleure semaine de la saison';
  }
  const byDay = new Map();
  for (const x of cur) { const k = dayStart(x.t); byDay.set(k, (byDay.get(k) || 0) + x.d); }
  const dn = t => new Date(t).toLocaleDateString('fr-FR', { weekday: 'long' });
  const days = [...byDay.entries()];
  const best = days.length ? days.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;
  const worst = days.length ? days.reduce((a, b) => (b[1] < a[1] ? b : a)) : null;
  const top = cur.filter(x => x.c).sort((a, b) => b.reacts - a.reacts || b.t - a.t)[0];
  $('#weekbody').innerHTML = `
    <div class="big ${net > 0 ? 'up' : net < 0 ? 'dn' : ''}">${sfmt(net)}</div>
    <p>${cur.length} vote${cur.length > 1 ? 's' : ''} depuis lundi · semaine dernière : ${sfmt(prev)}</p>
    ${best && best[1] > 0 ? `<p>Meilleur jour : ${esc(dn(best[0]))} (${sfmt(best[1])})</p>` : ''}
    ${worst && worst[1] < 0 ? `<p>Pire jour : ${esc(dn(worst[0]))} (${sfmt(worst[1])})</p>` : ''}
    ${rec ? `<p class="rec">${rec}</p>` : ''}
    ${top ? `<blockquote>« ${esc(top.c)} »<small>${esc(voterName(top.u, top.n))}${top.reacts ? ` · ${plural(top.reacts, 'réaction')}` : ''}</small></blockquote>` : (cur.length ? '' : '<p>Semaine calme. Trop calme.</p>')}`;
}

function renderDays() {
  const days = [], now = dayStart(Date.now());
  for (let i = 13; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); days.push({ t: d.getTime(), up: 0, dn: 0 }); }
  for (const v of D.v) { const d = days.find(o => v.t >= o.t && v.t < o.t + 864e5); if (d) (v.d > 0 ? d.up++ : d.dn++); }
  const mx = Math.max(1, ...days.map(d => Math.max(d.up, d.dn)));
  const lab = t => new Date(t).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  $('#days').innerHTML = days.map(d => `<div class="day"><b>${esc(lab(d.t))}</b><div class="dn" title="${d.dn} votes −"><i style="width:${d.dn / mx * 100}%"></i></div><div class="up" title="${d.up} votes +"><i style="width:${d.up / mx * 100}%"></i></div></div>`).join('');
}

function medal(t, extra = '') {
  const hide = t.secret && !t.got;
  const when = t.got && t.at && t.at.t ? ` · ${new Date(t.at.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : '';
  return `<div class="medal tier-${t.tier} ${t.got ? '' : 'locked'}">${trophyIcon(t, t.got)}<div><h3>${esc(hide ? '???' : t.n)}</h3><p><span class="tier">${TIER[t.tier].n}${t.secret ? ' · secret' : ''}${extra}${when}</span><br>${esc(hide ? (t.local ? 'Trophée secret. Il paraît qu\'une carte existe.' : 'Trophée secret. Continuez à voter.') : t.d)}</p></div></div>`;
}

function renderTrophies() {
  const got = D.trophies.filter(t => t.got).length, total = D.trophies.length;
  $('#tro-n').textContent = `${got} sur ${total} débloqués`;
  $('#tro-bar').style.transform = `scaleX(${got / total})`;
  // Trophées « perso » : easter eggs trouvés sur cet appareil, hors compteur partagé.
  $('#medals').innerHTML = D.trophies.map(t => medal(t)).join('') + eggs.localTrophies().map(t => medal(t, ' · perso')).join('');
}

const myReact = id => rType(reactMap?.[id]?.[uid]);

function reactUI(v) {
  const mine = myReact(v.id), r = REACT_BY[mine || 'respect'];
  const chips = REACTS.filter(x => v.rx?.[x.id]).map(x => `<span class="rx-chip">${reactIcon(x, 18)}<b>${v.rx[x.id]}</b><span class="sr-only">${esc(x.n)}</span></span>`).join('');
  const tip = 'tip-rx-' + v.id;
  return `<div class="rx">
    <button class="react rx-main" type="button" data-id="${esc(v.id)}" aria-pressed="${!!mine}" aria-label="${esc(mine ? `Retirer ta réaction ${r.n}` : 'Réagir : Respect (maintenir pour choisir)')}">${reactIcon(r, 20)}<span>${esc(r.n)}</span></button>
    <span class="icon-wrap"><button class="react rx-more" type="button" data-id="${esc(v.id)}" aria-label="Choisir une réaction" aria-haspopup="menu" aria-expanded="false" aria-describedby="${esc(tip)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button><span class="tip" id="${esc(tip)}" role="tooltip">Choisir une réaction</span></span>
    ${chips ? `<span class="rx-sum">${chips}</span>` : ''}
  </div>`;
}

function renderLog() {
  const a = document.activeElement;
  const focus = a?.classList.contains('react') ? { id: a.dataset.id, more: a.classList.contains('rx-more') } : null;
  const list = [...D.v].reverse();
  $('#log').innerHTML = list.length ? list.slice(0, shownLog).map(v => `<li><span class="sign ${v.d > 0 ? 'p' : 'm'}">${v.d > 0 ? '+' : '−'}</span><div>${v.c ? `<q>${esc(v.c)}</q>` : '<span class="nc">Sans commentaire</span>'}<small>${esc(voterName(v.u, v.n))} · ${esc(ago(v.t))}</small>${v.c ? reactUI(v) : ''}</div><span class="after">${fmt(v.after)}</span></li>`).join('') : '<li class="empty-li">Casier vierge. Pour l\'instant.</li>';
  $('#more').hidden = list.length <= shownLog;
  $('#more').textContent = `Afficher ${plural(Math.min(40, list.length - shownLog), 'vote', 'votes')} de plus`;
  if (focus) [...document.querySelectorAll(focus.more ? '.rx-more' : '.rx-main')].find(b => b.dataset.id === focus.id)?.focus();
}

// Regroupe par pseudo normalisé (accents, casse, espaces) : un même pote sur deux appareils = une ligne.
function renderBoard() {
  const m = new Map();
  for (const x of D.v) {
    const nk = nameKey(x.n);
    const k = nk ? 'n:' + nk : 'u:' + (x.u || x.id);
    const o = m.get(k) || { u: x.u || x.id, n: '', sp: new Map(), us: new Set(), p: 0, m: 0, c: 0 };
    // Orthographe affichée : la plus utilisée pour ce pseudo.
    if (x.n && x.n.trim()) { const t = x.n.trim(), c = (o.sp.get(t) || 0) + 1; o.sp.set(t, c); if (c >= (o.sp.get(o.n) || 0)) o.n = t; }
    o.us.add(x.u);
    x.d > 0 ? o.p++ : o.m++;
    if (x.c) o.c++;
    m.set(k, o);
  }
  const rows = [...m.values()].sort((a, b) => (b.p + b.m) - (a.p + a.m));
  const me = r => r.us.has(uid);
  const top = f => rows.reduce((best, r) => (!best || f(r) > f(best) ? r : best), null);
  const name = r => voterName(r.u, r.n) + (me(r) ? ' (toi)' : '');
  const badges = [
    [top(r => r.m), r => plural(r.m, 'vote −', 'votes −'), r => r.m, 'Procureur en chef', 'var(--pink)', '−'],
    [top(r => r.p), r => plural(r.p, 'vote +', 'votes +'), r => r.p, 'Avocat de la défense', 'var(--teal)', '+'],
    [top(r => r.c), r => plural(r.c, 'commentaire'), r => r.c, 'Grande gueule', 'var(--gold)', '«']
  ].filter(([r, , f]) => r && f(r) > 0);
  $('#lbbadges').innerHTML = badges.length ? badges.map(([r, lab, , title, col, sym]) => `<div class="lb-badge"><i style="background:${col}">${sym}</i><span><b>${title}</b> : ${esc(name(r))} (${lab(r)})</span></div>`).join('') : '<p class="muted">Personne n\'a encore voté.</p>';
  $('#lb tbody').innerHTML = rows.slice(0, 10).map((r, i) => `<tr><td data-l="#">${i + 1}</td><td data-l="Votant" class="${me(r) ? 'me' : ''}">${esc(name(r))}</td><td data-l="Votes">${r.p + r.m}</td><td data-l="+">${r.p}</td><td data-l="−">${r.m}</td><td data-l="Impact">${sfmt(r.p - r.m)}</td></tr>`).join('');
  const names = [...new Set(rows.map(r => r.n).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  $('#names').innerHTML = names.map(n => `<option value="${esc(n)}"></option>`).join('');
}

// Pubs et flashs détournés façon radio de Leonida (marques inventées).
const ADS = [
  ['NEURONE NEWS', 'Le cerveau de Ryan, prévu pour 2025, finalement livré fin 2026. Peut-être.'],
  ['PUB', 'eQola, le soda qui ne rend pas plus intelligent. Mais il pétille.'],
  ['MÉTÉO LEONIDA', 'Risque d\'alligator en supérette en fin de journée.'],
  ['PUB', 'Pfiouwasser, la bière officielle des 8/10 autoproclamés.'],
  ['DIRECT', '— Confiance ? — Confiance.'],
  ['PUB', 'QIvader : partage ta note avec des inconnus. Ils s\'en fichent.']
];

function renderTicker() {
  const items = D.v.filter(x => x.c).slice(-12).reverse();
  const key = items.map(x => x.id + ':' + x.reacts).join();
  if (key === tkKey && $('#tk').childElementCount) return;
  tkKey = key;
  const ad = i => { const [t, x] = ADS[i % ADS.length]; return `<span class="ad"><strong>${t}</strong> ${x}</span>`; };
  let html = '', k = 0;
  items.forEach((x, i) => {
    html += `<span><em>${x.d > 0 ? '+0,1' : '−0,1'}</em> « ${esc(x.c)} » <em>— ${esc(voterName(x.u, x.n))}</em></span>`;
    if (i % 2 === 1) html += ad(k++);
  });
  if (!items.length) { html = '<span>Flash info : pas encore de scandale. Restez à l\'écoute.</span>' + ADS.map((_, i) => ad(i)).join(''); k = ADS.length; }
  else if (k < 2) html += ad(k++) + ad(k++);
  const chars = items.reduce((n, x) => n + x.c.length + 20, 0) + k * 70;
  const tk = $('#tk');
  tk.style.setProperty('--tk', Math.max(25, Math.round(chars * 0.22)) + 's');
  tk.innerHTML = `<div class="tk-set">${html}</div><div class="tk-set" aria-hidden="true">${html}</div>`;
}

/* ---------- Vote ---------- */
const left = () => Math.max(0, COOLDOWN - (Date.now() - lastVote));
const cooling = () => !D || busy || left() > 0;

function tick() {
  const l = left(), off = cooling();
  $('#vminus').setAttribute('aria-disabled', String(off));
  $('#vplus').setAttribute('aria-disabled', String(off));
  $('#cooltxt').textContent = !D ? 'Chargement…' : l > 0 ? `Recharge : ${Math.ceil(l / 1000)} s` : 'Prêt à voter';
  $('#coolbar').style.transform = `scaleX(${l / COOLDOWN})`;
}
setInterval(tick, 250);

let spam = [];
for (const [sel, d] of [['#vminus', -1], ['#vplus', 1]]) {
  $(sel).addEventListener('click', () => {
    if (!cooling()) return openModal(d);
    if (!D) return;
    const now = Date.now();
    spam = [...spam.filter(t => now - t < 3000), now];
    if (spam.length >= 5) { spam = []; toast('Calme-toi, Ryan n\'est pas un distributeur.'); eggs.hit('spam'); }
    else toast(`Recharge en cours : encore ${Math.ceil(left() / 1000)} s.`);
  });
}

const scrim = $('#scrim');
function openModal(d) {
  dir = d; lastFocus = document.activeElement;
  const lbl = (d > 0 ? '+' : '−') + '0,1';
  $('#m-t').textContent = 'Voter ' + lbl;
  $('#f-ok').textContent = 'Voter ' + lbl;
  $('#m-sub').textContent = d > 0 ? 'Qu\'a-t-il fait de brillant ? Facultatif, mais ça nourrit la légende.' : 'Qu\'a-t-il dit ? Facultatif, mais c\'est mieux pour le casier.';
  $('#f-name').value = ls.get('ryan_name') || '';
  $('#f-com').value = '';
  $('#f-count').textContent = '0/140';
  $('#f-err').textContent = '';
  scrim.classList.add('open');
  setTimeout(() => $('#f-com').focus(), 50);
}
function closeModal() { scrim.classList.remove('open'); lastFocus?.focus(); }
$('#f-cancel').addEventListener('click', closeModal);
scrim.addEventListener('click', e => { if (e.target === scrim && !busy) closeModal(); });
$('#f-com').addEventListener('input', e => { $('#f-count').textContent = e.target.value.length + '/140'; });
scrim.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !busy) closeModal();
  if (e.key === 'Tab') {
    const f = [...scrim.querySelectorAll('input,textarea,button')];
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }
});

$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  if (busy) return;
  if (left() > 0) { $('#f-err').textContent = 'Encore un peu de recharge, attends la fin du compteur.'; return; }
  busy = true;
  const ok = $('#f-ok');
  ok.disabled = true; ok.setAttribute('aria-busy', 'true');
  const spin = setTimeout(() => ok.classList.add('is-loading'), 100);
  const name = $('#f-name').value.trim().slice(0, 24), com = $('#f-com').value.trim().slice(0, 140);
  ls.set('ryan_name', name);
  const v = { d: dir, u: uid };
  if (name) v.n = name;
  if (com) v.c = com;
  try {
    await store.addVote(v);
    lastVote = Date.now();
    ls.set('ryan_last', String(lastVote));
    closeModal();
    sfx.play(dir > 0 ? 'up' : 'down');
    toast(dir > 0 ? '+0,1 : respect gagné.' : '−0,1 : un neurone vient de quitter le groupe.');
    if (eggs.isTenOhThree(Date.now())) setTimeout(eggs.tenOhThree, 600);
    else if (Math.random() < 1 / 50) setTimeout(() => critter(Math.random() < 0.5 ? 'flamant' : 'croco'), 800);
  } catch (err) {
    $('#f-err').textContent = err.message === 'cooldown' ? 'Vote refusé : la recharge de 10 s n\'est pas finie.' : 'Le vote n\'est pas passé (connexion). Réessaie.';
  } finally {
    clearTimeout(spin); busy = false;
    ok.disabled = false; ok.removeAttribute('aria-busy'); ok.classList.remove('is-loading');
    tick();
  }
});

/* ---------- Réactions, période, plus ---------- */
const RX_TOAST = {
  respect: 'Respect +', mdr: 'Mort de rire. Ryan ne voit pas ce qui est drôle.', wanted: 'Une étoile de plus sur son avis de recherche.',
  croco: 'Classé fait divers de Leonida.', cash: 'Ce commentaire vaut un braquage.', confiance: '— Confiance ? — Confiance.'
};
async function setReact(id, type) {
  try {
    await store.react(id, type);
    if (type) { sfx.play('tap'); toast(RX_TOAST[type]); }
  } catch (err) { toast('La réaction n\'est pas passée. Réessaie.'); }
}

// Sélecteur de réactions : bouton + ou appui long sur le bouton principal.
const pick = $('#rxpick');
let pickFor = null, pickAnchor = null, pickY = 0;
function openPicker(btn) {
  pickFor = btn.dataset.id; pickAnchor = btn; pickY = scrollY;
  const mine = myReact(pickFor);
  pick.innerHTML = REACTS.map(r => `<button type="button" role="menuitemradio" aria-checked="${mine === r.id}" data-t="${r.id}">${reactIcon(r, 30)}<span>${esc(r.n)}</span></button>`).join('');
  pick.hidden = false;
  const a = btn.getBoundingClientRect(), w = pick.offsetWidth, h = pick.offsetHeight;
  pick.style.left = Math.max(8, Math.min(innerWidth - w - 8, a.left)) + 'px';
  pick.style.top = (a.top > h + 16 ? a.top - h - 8 : a.bottom + 8) + 'px';
  document.querySelectorAll('.rx-more').forEach(b => b.setAttribute('aria-expanded', String(b.dataset.id === pickFor)));
  (pick.querySelector('[aria-checked="true"]') || pick.querySelector('button')).focus({ preventScroll: true });
}
function closePicker(refocus) {
  if (pick.hidden) return;
  pick.hidden = true;
  document.querySelectorAll('.rx-more').forEach(b => b.setAttribute('aria-expanded', 'false'));
  if (refocus) ([...document.querySelectorAll('.rx-more')].find(b => b.dataset.id === pickFor) || pickAnchor)?.focus();
  pickFor = null;
}
pick.addEventListener('click', e => {
  const b = e.target.closest('button[data-t]');
  if (!b || !pickFor) return;
  const id = pickFor, t = b.dataset.t;
  closePicker(true);
  setReact(id, myReact(id) === t ? null : t);
});
pick.addEventListener('keydown', e => {
  const bs = [...pick.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
  if (e.key === 'Escape') { e.preventDefault(); closePicker(true); }
  else if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
  else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
  else if (e.key === 'Tab') closePicker(false);
});
document.addEventListener('pointerdown', e => { if (!pick.hidden && !e.target.closest('#rxpick,.rx-more,.rx-main')) closePicker(false); });
addEventListener('scroll', () => { if (Math.abs(scrollY - pickY) > 40) closePicker(false); }, { passive: true });

let lpTimer = 0, lpFired = false;
$('#log').addEventListener('pointerdown', e => {
  const b = e.target.closest('.rx-main');
  if (!b) return;
  lpFired = false;
  clearTimeout(lpTimer);
  lpTimer = setTimeout(() => { lpFired = true; openPicker(b); }, 450);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => $('#log').addEventListener(t, () => clearTimeout(lpTimer)));
$('#log').addEventListener('contextmenu', e => { if (e.target.closest('.rx-main')) e.preventDefault(); });
$('#log').addEventListener('click', e => {
  const more = e.target.closest('.rx-more');
  if (more) return pickFor === more.dataset.id && !pick.hidden ? closePicker(true) : openPicker(more);
  const b = e.target.closest('.rx-main');
  if (!b) return;
  if (lpFired) { lpFired = false; return; }
  const id = b.dataset.id;
  setReact(id, myReact(id) ? null : 'respect');
});
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => { period = b.dataset.p; ls.set('ryan_period', period); if (D) renderChart(); }));
$('#more').addEventListener('click', () => { shownLog += 40; renderLog(); });

/* ---------- Sons, partage ---------- */
function paintSound() {
  const on = sfx.enabled(), b = $('#sound'), label = on ? 'Couper les sons' : 'Activer les sons';
  b.innerHTML = on ? SOUND_ON : SOUND_OFF;
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', label);
  $('#tip-sound').textContent = label;
}
paintSound();
$('#sound').addEventListener('click', () => { sfx.toggle(); paintSound(); sfx.play('tap'); });

$('#share').addEventListener('click', async () => {
  if (!D) return;
  const btn = $('#share');
  if (btn.getAttribute('aria-busy') === 'true') return;
  btn.setAttribute('aria-busy', 'true');
  try {
    const ws = weekStart(Date.now());
    const net = D.v.filter(x => x.t >= ws).reduce((n, x) => n + x.d, 0);
    const blob = await buildCard({
      s: D.s, stageName: stageOf(D.s).n, level: level(D.s),
      avatar: ryanSVG(D.s, { uid: 'card' }),
      weekLine: `Cette semaine : ${sfmt(net)} · ${D.v.length} votes au total`,
      url: location.host + location.pathname
    });
    const file = new File([blob], 'qi-de-ryan.png', { type: 'image/png' });
    const text = `Le QI de Ryan : ${fmt(D.s)}/10. Viens voter : ${location.href}`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text }); return; } catch (err) { if (err.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'qi-de-ryan.png';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Carte téléchargée. Balance-la sur le groupe.');
  } catch (err) {
    toast('La carte n\'a pas pu être créée. Réessaie.');
  } finally { btn.removeAttribute('aria-busy'); }
});

/* ---------- Bannières, toasts ---------- */
let bTimer, tTimer;
function banner(t, s, d, variant) {
  const b = $('#banner');
  $('#b-t').textContent = t; $('#b-s').textContent = s; $('#b-d').textContent = d || '';
  b.classList.toggle('ko', variant === 'ko');
  b.classList.add('show');
  clearTimeout(bTimer);
  bTimer = setTimeout(() => b.classList.remove('show'), 3400);
}
function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(tTimer);
  tTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Easter eggs ---------- */
function wanted() {
  const w = $('#wanted'), s = $('#stars');
  w.classList.add('on'); s.classList.add('flash');
  banner('AVIS DE RECHERCHE', 'Ryan, recherché pour excès de confiance', 'Signalement : 1,65 m, cheveux longs, gros nez, se dit à 8/10. Récompense : un neurone.', 'ko');
  sfx.play('ko');
  setTimeout(() => { w.classList.remove('on'); s.classList.remove('flash'); }, 3600);
  eggs.hit('wanted');
}

const CRITTERS = {
  flamant: { w: 120, svg: '<svg viewBox="0 0 120 140" width="120" height="140"><path d="M50 86l-4 22 6 22M64 86v44" stroke="#ff7fb0" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="58" cy="72" rx="30" ry="17" fill="#ff7fb0" stroke="#12051f" stroke-width="3"/><path d="M40 68q14-12 34 0" fill="none" stroke="#e0488f" stroke-width="4"/><path d="M82 66C98 50 84 32 94 20" fill="none" stroke="#ff7fb0" stroke-width="8" stroke-linecap="round"/><circle cx="96" cy="18" r="8" fill="#ff7fb0" stroke="#12051f" stroke-width="3"/><path d="M102 14l14 6-12 5z" fill="#fff" stroke="#12051f" stroke-width="2"/><rect x="90" y="12" width="12" height="6" rx="2" fill="#12051f"/></svg>', msg: 'Un flamant rose est passé. Il a voté +0,1 dans sa tête.' },
  croco: { w: 200, svg: '<svg viewBox="0 0 200 70" width="200" height="70"><path d="M40 52l-6 14M70 54l-4 12M120 54l4 12M150 52l6 14" stroke="#2f7d50" stroke-width="6" stroke-linecap="round"/><path d="M6 40Q40 18 90 26L150 28Q192 30 196 42Q190 50 150 48L90 50Q40 58 6 40Z" fill="#3fa46a" stroke="#12051f" stroke-width="3"/><path d="M150 40l5-4 5 4 5-4 5 4 5-4 5 4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="60" cy="28" r="4" fill="#2f7d50"/><circle cx="80" cy="26" r="4" fill="#2f7d50"/><rect x="146" y="22" width="20" height="8" rx="3" fill="#12051f"/></svg>', msg: 'Un alligator est entré dans la supérette. Il est ressorti avec des chips. Plus malin que Ryan.' }
};
function critter(kind) {
  const c = CRITTERS[kind];
  eggs.hit(kind);
  if (!c || reduced()) { if (c) toast(c.msg); return; }
  const el = document.createElement('div');
  el.className = 'critter';
  el.innerHTML = c.svg;
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove());
  toast(c.msg);
}

let titleClicks = 0, titleTimer, titleLP = 0, titleLPFired = false;
// Appui long sur le titre (pratique sur mobile) : ouvre le téléphone à codes.
$('#title').addEventListener('pointerdown', () => { titleLPFired = false; clearTimeout(titleLP); titleLP = setTimeout(() => { titleLPFired = true; openCheat(); }, 600); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => $('#title').addEventListener(t, () => clearTimeout(titleLP)));
$('#title').addEventListener('contextmenu', e => e.preventDefault());
$('#title').addEventListener('click', () => {
  if (titleLPFired) { titleLPFired = false; return; }
  titleClicks++;
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => { titleClicks = 0; }, 2000);
  if (titleClicks >= 7) { titleClicks = 0; wanted(); }
});

let refClicks = 0;
$('#ref').addEventListener('click', () => {
  refClicks++;
  if (refClicks === 5) { refClicks = 0; eggs.hit('dossier'); banner('DOSSIER CONFIDENTIEL', 'Sûr de lui depuis toujours', 'Le 8, c\'est lui qui l\'a dit. Personne ne l\'a jamais vérifié.'); }
  else toast('Ryan s\'est attribué 8/10. Clique encore…');
});

$('#sun').addEventListener('click', () => {
  const sh = $('#shades'), on = sh.getAttribute('display') === 'none';
  sh.setAttribute('display', on ? 'inline' : 'none');
  toast(on ? 'Le soleil a mis ses lunettes. Ryan brille trop.' : 'Le soleil a retiré ses lunettes.');
  eggs.hit('soleil');
});

document.querySelectorAll('.palm').forEach(p => p.addEventListener('click', e => {
  const c = document.createElement('div');
  c.className = 'coco';
  c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
  document.body.append(c);
  const fall = Math.max(60, $('.hero').getBoundingClientRect().bottom - e.clientY - 20);
  requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transform = `translateY(${fall}px)`; }));
  setTimeout(() => { c.style.opacity = '0'; }, 400);
  setTimeout(() => c.remove(), 800);
  toast('Une noix de coco. Plus solide que son raisonnement.');
  eggs.hit('coco');
}));

const CODES = {
  hesoyam: () => banner('CHEAT ACTIVÉ', 'Santé, armure, 250 000 $', '…mais toujours aucun neurone en plus.'),
  ryan: () => { const s = $('#stars'); s.classList.add('flash'); toast('Avis de recherche lancé.'); setTimeout(() => s.classList.remove('flash'), 1500); },
  leonida: () => banner('BIENVENUE À LEONIDA', 'Population : 1 neurone', 'Celui de Ryan. Il est en vacances.'),
  lucia: () => banner('LUCIA A VU LA NOTE', 'Elle cherche un autre partenaire', 'Elle demande au moins 9/10 pour un braquage.'),
  jason: () => banner('JASON A PASSÉ LE TEST', 'Il a eu 8/10 aussi', 'Ryan conteste. Il veut un recomptage.'),
  vice: () => banner('VICE DÉTECTÉ', 'Excès de confiance', 'Pénalité : −0,0. On est sympas.'),
  flamant: () => critter('flamant'),
  croco: () => critter('croco'),
  police: () => eggs.police(),
  prison: () => eggs.prison(),
  2314: () => eggs.ufo(),
  affiche: () => eggs.poster(),
  gateau: () => eggs.birthday(true),
  ju: () => eggs.hearts('Ju'), matmat: () => eggs.hearts('Matmat'), gabou: () => eggs.hearts('Gabou'),
  lulu: () => eggs.hearts('Lulu'), vivi: () => eggs.hearts('Vivi'), ethan: () => eggs.hearts('Ethan'),
  krav: () => eggs.punch(), maga: () => eggs.punch(),
  vroum: () => eggs.f1(),
  csgo: () => eggs.crate(), karambit: () => eggs.crate(), awp: () => eggs.crate(), dragonlore: () => eggs.crate(),
  morgane: () => eggs.smoke(),
  reset: () => eggs.reset()
};
const KONAMI_TXT = ['hauthautbasbasgauchedroitegauchedroiteba', 'uuddlrlrba', 'konami'];
const konami = () => { eggs.hit('konami'); banner('CODE DE TRICHE ACTIVÉ', 'Score inchangé', 'La triche, c\'est pour les 2/10.'); };
// Codes simples comptés comme easter eggs (les autres ont leur propre suivi dans eggs.js).
const COUNTED = new Set(['hesoyam', 'ryan', 'leonida', 'lucia', 'jason', 'vice']);
function runCode(code, fn) { if (COUNTED.has(code)) eggs.hit(code); fn(); }
function tryCode(raw) {
  const c = nameKey(raw).replace(/[^a-z0-9]/g, '');
  if (KONAMI_TXT.includes(c)) { konami(); return true; }
  if (CODES[c]) { runCode(c, CODES[c]); return true; }
  if (c.startsWith('reset')) { eggs.reset([c.slice(5)]); return true; }
  return false;
}
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let keys = [], typed = '';
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea') || eggs.isThrowing()) return;
  keys = [...keys, e.key].slice(-10);
  typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-12);
  if (keys.join() === KONAMI.join()) { keys = []; konami(); return; }
  for (const [code, fn] of Object.entries(CODES)) if (typed.endsWith(code)) { typed = ''; runCode(code, fn); break; }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) eggs.hit('onglet');
  document.title = document.hidden ? 'Reviens, Ryan réfléchit…' : D ? `${fmt(D.s)}/10 · Le QI de Ryan` : 'Le QI de Ryan';
});

function onFirstData() {
  const d = new Date();
  if (eggs.birthday()) return;
  if (d.getHours() === 3 && d.getMinutes() === 14) banner('3 H 14', 'L\'heure de π', 'Ryan pense que c\'est une tarte.');
  else if (d.getDate() === 13 && d.getDay() === 5) banner('VENDREDI 13', 'Jour de malchance', 'Les votes − ne comptent pas double. On n\'est pas des monstres.');
}

console.log('%cLE QI DE RYAN', 'font:28px Anton,Impact,sans-serif;color:#ffd45c;background:#1a0a2c;padding:6px 12px');
console.log('%cTu fouilles le code ? Ryan, lui, fouille encore ses neurones.\nCodes à taper sur la page (ou dans le téléphone en bas de page) : hesoyam, ryan, leonida, lucia, jason, vice, flamant, croco, police, prison, 2314, vroum, krav, csgo, morgane, des surnoms de potes… et un grand classique avec les flèches. La carte garde la trace.', 'color:#ff5fa2');

/* ---------- Décor ---------- */
const stripes = $('#stripes');
for (let i = 0; i < 7; i++) stripes.insertAdjacentHTML('beforeend', `<rect x="0" y="${400 + i * 16}" width="1200" height="${3 + i * 1.4}"/>`);
const city = [[300, 40, 120], [345, 28, 170], [378, 52, 95], [436, 34, 200], [476, 46, 140], [528, 30, 110], [690, 60, 80], [752, 38, 160], [800, 26, 215], [832, 48, 130], [890, 36, 90], [960, 44, 150], [1010, 30, 190], [1046, 56, 120], [1108, 40, 170]];
$('#city').innerHTML = city.map(([x, w, h]) => `<rect x="${x}" y="${470 - h}" width="${w}" height="${h}"/>`).join('');
$('#waves').innerHTML = [500, 522, 548, 578].map((yy, i) => `<line x1="${560 + i * 20}" x2="${1080 - i * 20}" y1="${yy}" y2="${yy}" stroke-dasharray="${40 - i * 6} ${18 + i * 6}"/>`).join('');
$('#crown').innerHTML = [-170, -140, -110, -70, -40, -10, 20].map(a => `<use href="#leaf" transform="rotate(${a})"/>`).join('');
$('#ryan').innerHTML = ryanSVG(START, { uid: 'hud' });

/* ---------- Téléphone à codes (utile sur mobile) et easter eggs ---------- */
const cheat = $('#cheatdlg');
let cheatFocus = null;
function closeCheat() { cheat.classList.remove('open'); cheatFocus?.focus(); }
function openCheat() {
  cheatFocus = document.activeElement;
  $('#c-in').value = ''; $('#c-err').textContent = '';
  cheat.classList.add('open');
  setTimeout(() => { if (cheat.classList.contains('open')) $('#c-in').focus(); }, 50);
}
$('#cheat-open').addEventListener('click', openCheat);
$('#c-cancel').addEventListener('click', closeCheat);
cheat.addEventListener('click', e => { if (e.target === cheat) closeCheat(); });
cheat.addEventListener('keydown', e => { if (e.key === 'Escape') closeCheat(); });
$('#cheatform').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('#c-in').value;
  if (!v.trim()) { $('#c-err').textContent = 'Compose un code avant d\'appeler.'; return; }
  closeCheat();
  if (!tryCode(v)) toast('Code inconnu. Ryan non plus ne le connaissait pas.');
});

eggs.init({ banner, toast, sfx, ryanSVG, onChange: () => { if (D) renderTrophies(); } });
