import { START, COOLDOWN } from './config.js';
import { $, esc, fmt, sfmt, ls, dayStart, weekStart, reduced, voterName, ago } from './util.js';
import { createStore } from './store.js';
import { computeAll, trophyIcon, TIER } from './trophies.js';
import { ryanSVG, stageOf } from './ryan.js';
import { createChart } from './chart.js';
import * as sfx from './audio.js';
import { buildCard } from './share.js';

const uid = ls.get('ryan_uid') || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
ls.set('ryan_uid', uid);

const store = createStore(uid);
const chart = createChart($('#chart svg'), $('#ctip'));
let votesMap = null, reactMap = {}, D = null, raf = 0;
let period = ls.get('ryan_period') || '30';
let busy = false, dir = 1, lastFocus = null, shownLog = 40;
let lastVote = +(ls.get('ryan_last') || 0);
let curStage = null, tkKey = '';

const THUMB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H3V10zM7 10l4-7c2 0 3 1 3 3l-1 4h6c1.5 0 2.5 1.4 2 2.8l-2.5 7c-.3.7-1 1.2-1.8 1.2H7"/></svg>';
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
    }
    if (old.s >= 50 && D.s < 50) { banner('CERVEAU K.O.', stageOf(D.s).n, 'Ryan vient de passer sous la moyenne.', 'ko'); sfx.play('ko'); }
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
    ${top ? `<blockquote>« ${esc(top.c)} »<small>${esc(voterName(top.u, top.n))}${top.reacts ? ` · appuyé ${top.reacts} fois` : ''}</small></blockquote>` : (cur.length ? '' : '<p>Semaine calme. Trop calme.</p>')}`;
}

function renderDays() {
  const days = [], now = dayStart(Date.now());
  for (let i = 13; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); days.push({ t: d.getTime(), up: 0, dn: 0 }); }
  for (const v of D.v) { const d = days.find(o => v.t >= o.t && v.t < o.t + 864e5); if (d) (v.d > 0 ? d.up++ : d.dn++); }
  const mx = Math.max(1, ...days.map(d => Math.max(d.up, d.dn)));
  const lab = t => new Date(t).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  $('#days').innerHTML = days.map(d => `<div class="day"><b>${esc(lab(d.t))}</b><div class="dn" title="${d.dn} votes −"><i style="width:${d.dn / mx * 100}%"></i></div><div class="up" title="${d.up} votes +"><i style="width:${d.up / mx * 100}%"></i></div></div>`).join('');
}

function renderTrophies() {
  const got = D.trophies.filter(t => t.got).length, total = D.trophies.length;
  $('#tro-n').textContent = `${got} sur ${total} débloqués`;
  $('#tro-bar').style.transform = `scaleX(${got / total})`;
  $('#medals').innerHTML = D.trophies.map(t => {
    const hide = t.secret && !t.got;
    const when = t.got && t.at && t.at.t ? ` · ${new Date(t.at.t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : '';
    return `<div class="medal tier-${t.tier} ${t.got ? '' : 'locked'}">${trophyIcon(t, t.got)}<div><h3>${esc(hide ? '???' : t.n)}</h3><p><span class="tier">${TIER[t.tier].n}${t.secret ? ' · secret' : ''}${when}</span><br>${esc(hide ? 'Trophée secret. Continuez à voter.' : t.d)}</p></div></div>`;
  }).join('');
}

function renderLog() {
  const focusId = document.activeElement?.classList.contains('react') ? document.activeElement.dataset.id : null;
  const list = [...D.v].reverse();
  $('#log').innerHTML = list.length ? list.slice(0, shownLog).map(v => {
    const mine = reactMap?.[v.id]?.[uid] === true;
    return `<li><span class="sign ${v.d > 0 ? 'p' : 'm'}">${v.d > 0 ? '+' : '−'}</span><div>${v.c ? `<q>${esc(v.c)}</q>` : '<span class="nc">Sans commentaire</span>'}<small>${esc(voterName(v.u, v.n))} · ${esc(ago(v.t))}</small>${v.c ? `<button class="react" type="button" data-id="${esc(v.id)}" aria-pressed="${mine}" aria-label="Appuyer ce commentaire, ${v.reacts} appui${v.reacts > 1 ? 's' : ''}">${THUMB}<span>Appuyé</span><b>${v.reacts}</b></button>` : ''}</div><span class="after">${fmt(v.after)}</span></li>`;
  }).join('') : '<li class="empty-li">Casier vierge. Pour l\'instant.</li>';
  $('#more').hidden = list.length <= shownLog;
  if (focusId) [...document.querySelectorAll('.react')].find(b => b.dataset.id === focusId)?.focus();
}

function renderBoard() {
  const m = new Map();
  for (const x of D.v) {
    const k = x.u || x.id;
    const o = m.get(k) || { u: k, n: '', p: 0, m: 0, c: 0 };
    if (x.n) o.n = x.n;
    x.d > 0 ? o.p++ : o.m++;
    if (x.c) o.c++;
    m.set(k, o);
  }
  const rows = [...m.values()].sort((a, b) => (b.p + b.m) - (a.p + a.m));
  const top = f => rows.reduce((best, r) => (!best || f(r) > f(best) ? r : best), null);
  const name = r => voterName(r.u, r.n) + (r.u === uid ? ' (toi)' : '');
  const badges = [
    [top(r => r.m), r => r.m, 'Procureur en chef', 'votes −', 'var(--pink)', '−'],
    [top(r => r.p), r => r.p, 'Avocat de la défense', 'votes +', 'var(--teal)', '+'],
    [top(r => r.c), r => r.c, 'Grande gueule', 'commentaires', 'var(--gold)', '«']
  ].filter(([r, f]) => r && f(r) > 0);
  $('#lbbadges').innerHTML = badges.length ? badges.map(([r, f, title, unit, col, sym]) => `<div class="lb-badge"><i style="background:${col}">${sym}</i><span><b>${title}</b> : ${esc(name(r))} (${f(r)} ${unit})</span></div>`).join('') : '<p class="muted">Personne n\'a encore voté.</p>';
  $('#lb tbody').innerHTML = rows.slice(0, 10).map((r, i) => `<tr><td data-l="#">${i + 1}</td><td data-l="Votant" class="${r.u === uid ? 'me' : ''}">${esc(name(r))}</td><td data-l="Votes">${r.p + r.m}</td><td data-l="+">${r.p}</td><td data-l="−">${r.m}</td><td data-l="Impact">${sfmt(r.p - r.m)}</td></tr>`).join('');
}

function renderTicker() {
  const items = D.v.filter(x => x.c).slice(-12).reverse();
  const key = items.map(x => x.id + ':' + x.reacts).join();
  if (key === tkKey && $('#tk').childElementCount) return;
  tkKey = key;
  const html = items.length
    ? items.map(x => `<span><em>${x.d > 0 ? '+0,1' : '−0,1'}</em> « ${esc(x.c)} » <em>— ${esc(voterName(x.u, x.n))}</em></span>`).join('')
    : '<span>Flash info : pas encore de scandale. Restez à l\'écoute.</span><span>Ryan affirme être à 8/10. La rédaction vérifie.</span>';
  const chars = items.reduce((n, x) => n + x.c.length + 20, 0) || 120;
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
    if (spam.length >= 5) { spam = []; toast('Calme-toi, Ryan n\'est pas un distributeur.'); }
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
    if (Math.random() < 1 / 50) setTimeout(() => critter(Math.random() < 0.5 ? 'flamant' : 'croco'), 800);
  } catch (err) {
    $('#f-err').textContent = err.message === 'cooldown' ? 'Vote refusé : la recharge de 10 s n\'est pas finie.' : 'Le vote n\'est pas passé (connexion). Réessaie.';
  } finally {
    clearTimeout(spin); busy = false;
    ok.disabled = false; ok.removeAttribute('aria-busy'); ok.classList.remove('is-loading');
    tick();
  }
});

/* ---------- Réactions, période, plus ---------- */
$('#log').addEventListener('click', async e => {
  const b = e.target.closest('.react');
  if (!b || b.disabled) return;
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.disabled = true;
  try { await store.react(b.dataset.id, on); if (on) { sfx.play('tap'); toast('Appuyé. Respect +'); } }
  catch (err) { toast('La réaction n\'est pas passée. Réessaie.'); }
  finally { b.disabled = false; }
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
}

const CRITTERS = {
  flamant: { w: 120, svg: '<svg viewBox="0 0 120 140" width="120" height="140"><path d="M50 86l-4 22 6 22M64 86v44" stroke="#ff7fb0" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="58" cy="72" rx="30" ry="17" fill="#ff7fb0" stroke="#12051f" stroke-width="3"/><path d="M40 68q14-12 34 0" fill="none" stroke="#e0488f" stroke-width="4"/><path d="M82 66C98 50 84 32 94 20" fill="none" stroke="#ff7fb0" stroke-width="8" stroke-linecap="round"/><circle cx="96" cy="18" r="8" fill="#ff7fb0" stroke="#12051f" stroke-width="3"/><path d="M102 14l14 6-12 5z" fill="#fff" stroke="#12051f" stroke-width="2"/><rect x="90" y="12" width="12" height="6" rx="2" fill="#12051f"/></svg>', msg: 'Un flamant rose est passé. Il a voté +0,1 dans sa tête.' },
  croco: { w: 200, svg: '<svg viewBox="0 0 200 70" width="200" height="70"><path d="M40 52l-6 14M70 54l-4 12M120 54l4 12M150 52l6 14" stroke="#2f7d50" stroke-width="6" stroke-linecap="round"/><path d="M6 40Q40 18 90 26L150 28Q192 30 196 42Q190 50 150 48L90 50Q40 58 6 40Z" fill="#3fa46a" stroke="#12051f" stroke-width="3"/><path d="M150 40l5-4 5 4 5-4 5 4 5-4 5 4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="60" cy="28" r="4" fill="#2f7d50"/><circle cx="80" cy="26" r="4" fill="#2f7d50"/><rect x="146" y="22" width="20" height="8" rx="3" fill="#12051f"/></svg>', msg: 'Un alligator a traversé. Il a un meilleur QI que Ryan, mais chut.' }
};
function critter(kind) {
  const c = CRITTERS[kind];
  if (!c || reduced()) { if (c) toast(c.msg); return; }
  const el = document.createElement('div');
  el.className = 'critter';
  el.innerHTML = c.svg;
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove());
  toast(c.msg);
}

let titleClicks = 0, titleTimer;
$('#title').addEventListener('click', () => {
  titleClicks++;
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => { titleClicks = 0; }, 2000);
  if (titleClicks >= 7) { titleClicks = 0; wanted(); }
});

let refClicks = 0;
$('#ref').addEventListener('click', () => {
  refClicks++;
  if (refClicks === 5) { refClicks = 0; banner('DOSSIER CONFIDENTIEL', 'Sûr de lui depuis toujours', 'Le 8, c\'est lui qui l\'a dit. Personne ne l\'a jamais vérifié.'); }
  else toast('Ryan s\'est attribué 8/10. Clique encore…');
});

$('#sun').addEventListener('click', () => {
  const sh = $('#shades'), on = sh.getAttribute('display') === 'none';
  sh.setAttribute('display', on ? 'inline' : 'none');
  toast(on ? 'Le soleil a mis ses lunettes. Ryan brille trop.' : 'Le soleil a retiré ses lunettes.');
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
}));

const CODES = {
  hesoyam: () => banner('CHEAT ACTIVÉ', 'Santé, armure, 250 000 $', '…mais toujours aucun neurone en plus.'),
  ryan: () => { const s = $('#stars'); s.classList.add('flash'); toast('Avis de recherche lancé.'); setTimeout(() => s.classList.remove('flash'), 1500); },
  leonida: () => banner('BIENVENUE À LEONIDA', 'Population : 1 neurone', 'Celui de Ryan. Il est en vacances.'),
  lucia: () => banner('LUCIA A VU LA NOTE', 'Elle cherche un autre partenaire', 'Elle demande au moins 9/10 pour un braquage.'),
  jason: () => banner('JASON A PASSÉ LE TEST', 'Il a eu 8/10 aussi', 'Ryan conteste. Il veut un recomptage.'),
  vice: () => banner('VICE DÉTECTÉ', 'Excès de confiance', 'Pénalité : −0,0. On est sympas.'),
  flamant: () => critter('flamant'),
  croco: () => critter('croco')
};
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let keys = [], typed = '';
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea')) return;
  keys = [...keys, e.key].slice(-10);
  typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : '')).slice(-12);
  if (keys.join() === KONAMI.join()) { keys = []; banner('CODE DE TRICHE ACTIVÉ', 'Score inchangé', 'La triche, c\'est pour les 2/10.'); return; }
  for (const [code, fn] of Object.entries(CODES)) if (typed.endsWith(code)) { typed = ''; fn(); break; }
});

document.addEventListener('visibilitychange', () => {
  document.title = document.hidden ? 'Reviens, Ryan réfléchit…' : D ? `${fmt(D.s)}/10 · Le QI de Ryan` : 'Le QI de Ryan';
});

function onFirstData() {
  const d = new Date();
  if (d.getHours() === 3 && d.getMinutes() === 14) banner('3 H 14', 'L\'heure de π', 'Ryan pense que c\'est une tarte.');
  else if (d.getDate() === 13 && d.getDay() === 5) banner('VENDREDI 13', 'Jour de malchance', 'Les votes − ne comptent pas double. On n\'est pas des monstres.');
}

console.log('%cLE QI DE RYAN', 'font:28px Anton,Impact,sans-serif;color:#ffd45c;background:#1a0a2c;padding:6px 12px');
console.log('%cTu fouilles le code ? Ryan, lui, fouille encore ses neurones.\nCodes à taper sur la page : hesoyam, ryan, leonida, lucia, jason, vice, flamant, croco… et un grand classique avec les flèches.', 'color:#ff5fa2');

/* ---------- Décor ---------- */
const stripes = $('#stripes');
for (let i = 0; i < 7; i++) stripes.insertAdjacentHTML('beforeend', `<rect x="0" y="${400 + i * 16}" width="1200" height="${3 + i * 1.4}"/>`);
const city = [[300, 40, 120], [345, 28, 170], [378, 52, 95], [436, 34, 200], [476, 46, 140], [528, 30, 110], [690, 60, 80], [752, 38, 160], [800, 26, 215], [832, 48, 130], [890, 36, 90], [960, 44, 150], [1010, 30, 190], [1046, 56, 120], [1108, 40, 170]];
$('#city').innerHTML = city.map(([x, w, h]) => `<rect x="${x}" y="${470 - h}" width="${w}" height="${h}"/>`).join('');
$('#waves').innerHTML = [500, 522, 548, 578].map((yy, i) => `<line x1="${560 + i * 20}" x2="${1080 - i * 20}" y1="${yy}" y2="${yy}" stroke-dasharray="${40 - i * 6} ${18 + i * 6}"/>`).join('');
$('#crown').innerHTML = [-170, -140, -110, -70, -40, -10, 20].map(a => `<use href="#leaf" transform="rotate(${a})"/>`).join('');
$('#ryan').innerHTML = ryanSVG(START, { uid: 'hud' });
