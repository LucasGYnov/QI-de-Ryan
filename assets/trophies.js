import { dayStart } from './util.js';

export const TIER = {
  b: { n: 'Bronze', c: '#d38b52' },
  a: { n: 'Argent', c: '#c9d1dc' },
  o: { n: 'Or', c: '#ffd45c' },
  p: { n: 'Platine', c: '#a8f0ff' }
};

// Icônes 24×24 en trait (currentColor).
const I = {
  anchor: '<path d="M12 5v15M8 9h8M5 14c0 4 3 6 7 6s7-2 7-6"/><circle cx="12" cy="4" r="1.6"/>',
  tow: '<path d="M2 17h11l3-6h3l3 3v3h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M4 17V8l7-4v4"/>',
  run: '<circle cx="16" cy="12" r="3"/><path d="M2 9h8M4 12h7M2 15h8"/>',
  half: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  siren: '<path d="M6 18v-5a6 6 0 0 1 12 0v5"/><path d="M4 18h16v3H4z"/><path d="M12 2v2M4 5l1.5 1.5M20 5l-1.5 1.5"/>',
  eight: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="2.4"/><circle cx="12" cy="15" r="2.8"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  down: '<path d="M7 3v15M3 14l4 4 4-4M17 3v15M13 14l4 4 4-4"/>',
  up: '<path d="M7 21V6M3 10l4-4 4 4M17 21V6M13 10l4-4 4 4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bars: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M12 3v18M16 3v18"/>',
  wave: '<path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/>',
  err: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10l3 3M10 10l-3 3M14 15h4"/>',
  pi: '<path d="M4 7h16M9 7v12M15 7v9c0 2 1 3 3 3"/>',
  sevens: '<path d="M4 6h6l-4 12M14 6h6l-4 12"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14c2 3 6 3 8 0"/><path d="M8 9h1M15 9h1"/>',
  planet: '<circle cx="12" cy="12" r="5"/><path d="M2 16c4-2 16-10 20-8"/>',
  hair: '<path d="M6 20c2-6 2-12 6-16M12 20c0-6 2-10 6-14"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  chute: '<path d="M4 10a8 8 0 0 1 16 0M4 10l8 8 8-8M12 10v8"/>',
  rocket: '<path d="M12 3c4 3 5 8 3 13H9C7 11 8 6 12 3z"/><path d="M9 16l-3 4M15 16l3 4"/><circle cx="12" cy="10" r="1.6"/>',
  cuffs: '<circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><path d="M10 11c1-2 3-2 4 0"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/><path d="M3 11h18"/>',
  tv: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 3l4 4 4-4"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6L12 16.4 6.6 19.3l1.3-6-4.5-4 6-.7z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  book: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6"/>',
  cat: '<path d="M6 20v-8L4 5l4 3h8l4-3-2 7v8z"/><path d="M10 13h.5M14 13h.5"/>',
  gavel: '<path d="M13 3l8 8-3 3-8-8zM10 9l-7 7 3 3 7-7M3 21h10"/>',
  cup: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 20h8"/>',
  rain: '<path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 18 9a3 3 0 0 1 0 6z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  crowd: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M10 20c0-4 3-6 6-6s6 2 6 6"/>',
  quote: '<path d="M5 17c0-5 2-8 5-9M14 17c0-5 2-8 5-9M5 17h4v-4H5zM14 17h4v-4h-4z"/>',
  diamond: '<path d="M6 4h12l4 6-10 11L2 10z"/><path d="M2 10h20M9 4l3 17 3-17"/>'
};

// Ne jamais renommer un id : il est mémorisé dans le navigateur des visiteurs (trophées déjà vus).
// ok(S) reçoit les stats cumulées au moment de chaque vote (voir computeAll).
export const TROPHIES = [
  { id: 'premier', n: 'Premier délit', d: 'Le tout premier vote du dossier.', tier: 'b', ic: 'cuffs', ok: S => S.total >= 1 },
  { id: 'temoin', n: 'Témoin oculaire', d: 'Premier vote avec un commentaire.', tier: 'b', ic: 'eye', ok: S => S.comments >= 1 },
  { id: 'brigade', n: 'Repéré par la brigade du QI', d: 'Passé sous 7/10. Les gyrophares s\'allument.', tier: 'b', ic: 'siren', ok: S => S.min < 70 },
  { id: 'poursuite', n: 'Course-poursuite', d: '5 votes négatifs d\'affilée.', tier: 'b', ic: 'down', ok: S => S.maxDown >= 5 },
  { id: 'remontee', n: 'Remontée fantastique', d: '5 votes positifs d\'affilée.', tier: 'b', ic: 'up', ok: S => S.maxUp >= 5 },
  { id: 'yoyo', n: 'Montagnes russes', d: '6 votes alternés + / − à la suite.', tier: 'b', ic: 'wave', ok: S => S.maxAlt >= 6 },
  { id: 'retour8', n: 'Retour à la case 8', d: 'Remonté à 8 après être passé sous 7. La rédemption existe.', tier: 'b', ic: 'eight', ok: S => S.back8 },
  { id: 'pilepoil', n: 'Pile poil', d: 'Revenu à 8,0 pile après s\'en être éloigné d\'au moins 0,5.', tier: 'b', ic: 'target', ok: S => S.pile },
  { id: 'dimanche', n: 'Même le dimanche', d: 'Un vote un dimanche. Aucun jour de repos.', tier: 'b', ic: 'sun', ok: S => S.sunday },
  { id: 'dossier', n: 'Dossier épais', d: '50 votes au total.', tier: 'b', ic: 'folder', ok: S => S.total >= 50 },
  { id: 'nice', n: 'Nice', d: 'Note pile à 6,9.', tier: 'b', ic: 'smile', secret: true, ok: S => S.hits.has(69) },
  { id: 'jackpot', n: 'Jackpot', d: 'Note pile à 7,7. Les machines à sous approuvent.', tier: 'b', ic: 'sevens', secret: true, ok: S => S.hits.has(77) },
  { id: 'insomniaque', n: 'Insomniaque', d: 'Un vote entre 2 h et 5 h du matin.', tier: 'b', ic: 'moon', secret: true, ok: S => S.insom },
  { id: 'moyenne', n: 'Passable, au rattrapage', d: 'Tombé à 5/10. La moyenne, de justesse.', tier: 'a', ic: 'half', ok: S => S.min <= 50 },
  { id: 'err404', n: 'Erreur 404 : neurone introuvable', d: 'Note pile à 4,0.', tier: 'a', ic: 'err', ok: S => S.hits.has(40) },
  { id: 'presquepi', n: 'Presque π', d: 'Note pile à 3,1. Il manque les décimales, comme d\'habitude.', tier: 'a', ic: 'pi', secret: true, ok: S => S.hits.has(31) },
  { id: 'vie', n: 'La réponse à la vie', d: 'Note pile à 4,2. Il ne connaît toujours pas la question.', tier: 'a', ic: 'planet', secret: true, ok: S => S.hits.has(42) },
  { id: 'genie', n: 'Génie du quartier', d: 'Atteint 9/10. Les voisins lui demandent conseil.', tier: 'a', ic: 'bulb', ok: S => S.max >= 90 },
  { id: 'chute', n: 'Chute libre', d: '10 votes négatifs d\'affilée.', tier: 'a', ic: 'chute', ok: S => S.maxDown >= 10 },
  { id: 'ascension', n: 'Ascension', d: '10 votes positifs d\'affilée.', tier: 'a', ic: 'rocket', ok: S => S.maxUp >= 10 },
  { id: 'casier', n: 'Casier bien rempli', d: '25 votes négatifs au total.', tier: 'a', ic: 'bars', ok: S => S.downs >= 25 },
  { id: 'cent', n: 'Affaire jamais classée', d: '100 votes au total.', tier: 'a', ic: 'tv', ok: S => S.total >= 100 },
  { id: 'reporter', n: 'Envoyé spécial', d: '10 votes commentés.', tier: 'a', ic: 'mic', ok: S => S.comments >= 10 },
  { id: 'tribunal', n: 'Tribunal populaire', d: '3 votants différents en moins d\'une heure.', tier: 'a', ic: 'gavel', ok: S => S.tribunal },
  { id: 'foule', n: 'Affaire publique', d: '10 votants différents au total.', tier: 'a', ic: 'crowd', ok: S => S.voters.size >= 10 },
  { id: 'culte', n: 'Phrase culte', d: 'Un commentaire appuyé 5 fois.', tier: 'a', ic: 'quote', ok: S => S.maxReact >= 5 },
  { id: 'vendredi13', n: 'Vendredi 13', d: 'Un vote un vendredi 13. Le chat noir était déjà là.', tier: 'a', ic: 'cat', secret: true, ok: S => S.f13 },
  { id: 'neurone', n: 'Neurone en cavale', d: 'Tombé à 3/10. Le dernier a pris la fuite.', tier: 'o', ic: 'run', ok: S => S.min <= 30 },
  { id: 'fourriere', n: 'Cerveau à la fourrière', d: 'Tombé à 1/10. Récupérable contre 150 € et une pièce d\'identité.', tier: 'o', ic: 'tow', ok: S => S.min <= 10 },
  { id: 'fond', n: 'Tu as touché le fond', d: '0/10. Plus bas, c\'est le noyau terrestre.', tier: 'o', ic: 'anchor', ok: S => S.min <= 0 },
  { id: 'cheveu', n: 'À un cheveu du génie', d: 'Note pile à 9,9. Si près, si loin.', tier: 'o', ic: 'hair', ok: S => S.hits.has(99) },
  { id: 'cinq', n: 'Cerveau 5 étoiles', d: 'Atteint 10/10. Suspect. Très suspect.', tier: 'o', ic: 'crown', ok: S => S.max >= 100 },
  { id: 'feuilleton', n: 'Feuilleton national', d: '500 votes au total.', tier: 'o', ic: 'star', ok: S => S.total >= 500 },
  { id: 'biographe', n: 'Biographe officiel', d: '50 votes commentés.', tier: 'o', ic: 'book', ok: S => S.comments >= 50 },
  { id: 'gloire', n: 'Jour de gloire', d: '+1,0 en une seule journée.', tier: 'o', ic: 'cup', ok: S => S.bestDay >= 10 },
  { id: 'noire', n: 'Journée noire', d: '−1,0 en une seule journée.', tier: 'o', ic: 'rain', ok: S => S.worstDay <= -10 },
  { id: 'minuit', n: 'Douze coups de minuit', d: 'Un vote à minuit pile.', tier: 'o', ic: 'clock', secret: true, ok: S => S.midnight },
  { id: 'platine', n: 'Légende vivante', d: 'Tous les autres trophées débloqués.', tier: 'p', ic: 'diamond', ok: () => false }
];

export function trophyIcon(T, got) {
  const tier = TIER[T.tier];
  const fill = !got ? '#3a2a46' : T.tier === 'p' ? `url(#pl-${T.id})` : tier.c;
  const defs = T.tier === 'p' ? `<defs><linearGradient id="pl-${T.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#a8f0ff"/><stop offset="1" stop-color="#ff9ad5"/></linearGradient></defs>` : '';
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${defs}<polygon class="hex" points="32,3 58,18 58,46 32,61 6,46 6,18" fill="${fill}" stroke="#12051f" stroke-width="3"/><g transform="translate(18 18) scale(1.17)" fill="none" stroke="${got ? '#170622' : '#8f7a9c'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${got || !T.secret ? I[T.ic] : '<path d="M9 9a3 3 0 1 1 4 3c-1 .5-1 1.5-1 2.5M12 18v.5"/>'}</g></svg>`;
}

// Rejoue tout l'historique dans l'ordre chronologique. Les votes v1 ({d,t,u,n?,c?}) sont lus tels quels.
export function computeAll(votesMap, reactMap, START) {
  const v = Object.entries(votesMap || {})
    .map(([id, x]) => (x && typeof x === 'object' ? { id, ...x } : null))
    .filter(x => x && (x.d === 1 || x.d === -1) && typeof x.t === 'number')
    .sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1));
  const countReacts = id => {
    const r = reactMap && reactMap[id];
    return r && typeof r === 'object' ? Object.values(r).filter(x => x === true).length : 0;
  };
  const S = {
    s: START, min: START, max: START, hits: new Set(), up: 0, dn: 0, maxUp: 0, maxDown: 0, alt: 0, maxAlt: 0, prev: 0,
    below: false, back8: false, far: false, pile: false, total: 0, ups: 0, downs: 0, comments: 0,
    insom: false, sunday: false, midnight: false, f13: false, tribunal: false,
    days: new Map(), bestDay: 0, worstDay: 0, voters: new Set(), maxReact: 0
  };
  const points = [{ s: START, v: null, i: 0 }];
  const unlock = {};
  const recent = [];
  v.forEach((x, k) => {
    x.reacts = countReacts(x.id);
    S.s = Math.max(0, Math.min(100, S.s + x.d));
    x.after = S.s; x.i = k + 1;
    S.hits.add(S.s); S.min = Math.min(S.min, S.s); S.max = Math.max(S.max, S.s); S.total++;
    if (x.d > 0) { S.ups++; S.up++; S.dn = 0; } else { S.downs++; S.dn++; S.up = 0; }
    S.maxUp = Math.max(S.maxUp, S.up); S.maxDown = Math.max(S.maxDown, S.dn);
    S.alt = S.prev && S.prev !== x.d ? S.alt + 1 : 1; S.maxAlt = Math.max(S.maxAlt, S.alt); S.prev = x.d;
    if (S.s < 70) S.below = true;
    if (S.below && S.s >= 80) S.back8 = true;
    if (Math.abs(S.s - 80) >= 5) S.far = true;
    if (S.far && S.s === 80) S.pile = true;
    if (x.c) S.comments++;
    S.voters.add(x.u || x.id);
    const d = new Date(x.t), h = d.getHours();
    if (h >= 2 && h < 5) S.insom = true;
    if (d.getDay() === 0) S.sunday = true;
    if (h === 0 && d.getMinutes() === 0) S.midnight = true;
    if (d.getDate() === 13 && d.getDay() === 5) S.f13 = true;
    recent.push(x);
    while (recent.length && recent[0].t < x.t - 3600e3) recent.shift();
    if (new Set(recent.map(r => r.u || r.id)).size >= 3) S.tribunal = true;
    const dk = dayStart(x.t), net = (S.days.get(dk) || 0) + x.d;
    S.days.set(dk, net); S.bestDay = Math.max(S.bestDay, net); S.worstDay = Math.min(S.worstDay, net);
    if (x.c) S.maxReact = Math.max(S.maxReact, x.reacts);
    points.push({ s: S.s, v: x, i: k + 1 });
    for (const T of TROPHIES) if (!unlock[T.id] && T.ok(S)) unlock[T.id] = { i: k + 1, t: x.t };
  });
  if (TROPHIES.filter(T => T.id !== 'platine').every(T => unlock[T.id])) unlock.platine = { i: v.length, t: v[v.length - 1].t };
  return {
    v, points, s: S.s, S, unlock,
    trophies: TROPHIES.map(T => ({ ...T, got: !!unlock[T.id], at: unlock[T.id] }))
  };
}
