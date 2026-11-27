import { FIREBASE_URL } from './config.js';
import { ls } from './util.js';

// Données Firebase (inchangées depuis la v1, ne pas renommer) :
//   votes/<id>        { d: 1|-1, t: timestamp serveur, u: id navigateur, n?: pseudo, c?: commentaire }
//   last/<u>          timestamp du dernier vote de ce navigateur (anti-spam 10 s côté serveur)
//   reactions/<id>/<u> true | 'respect'|'mdr'|'wanted'|'croco'|'cash'|'confiance'
//                      (true = ancienne réaction « Appuyé », lue comme 'respect')
export function createStore(uid) {
  return FIREBASE_URL ? firebaseStore(FIREBASE_URL.replace(/\/+$/, ''), uid) : demoStore(uid);
}

function applyPath(root, path, data) {
  const seg = String(path).split('/').filter(Boolean);
  if (!seg.length) return data && typeof data === 'object' ? data : {};
  const out = { ...(root || {}) };
  let cur = out;
  for (let i = 0; i < seg.length - 1; i++) {
    const k = seg[i];
    cur[k] = cur[k] && typeof cur[k] === 'object' ? { ...cur[k] } : {};
    cur = cur[k];
  }
  const last = seg[seg.length - 1];
  if (data === null) delete cur[last]; else cur[last] = data;
  return out;
}

function firebaseStore(base, uid) {
  const state = { votes: {}, reactions: {} };
  const emitters = {};
  let cb = {};

  async function fetchOnce(key) {
    const r = await fetch(`${base}/${key}.json`, { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    state[key] = (await r.json()) || {};
    emitters[key]();
  }

  // Temps réel via le streaming REST de Firebase (EventSource). Repli en polling si le flux échoue.
  function stream(key) {
    let fails = 0, poll = 0;
    const startPoll = () => {
      if (poll) return;
      const run = () => fetchOnce(key).then(() => cb.onStatus?.('poll'), () => cb.onStatus?.('offline'));
      run();
      poll = setInterval(() => { if (!document.hidden) run(); }, 5000);
    };
    if (typeof EventSource === 'undefined') return startPoll();
    const es = new EventSource(`${base}/${key}.json`);
    const handle = merge => ev => {
      let m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m || typeof m.path !== 'string') return;
      if (merge) {
        for (const [k, v] of Object.entries(m.data || {})) state[key] = applyPath(state[key], m.path.replace(/\/$/, '') + '/' + k, v);
      } else {
        state[key] = applyPath(state[key], m.path, m.data);
      }
      fails = 0;
      emitters[key]();
      cb.onStatus?.('live');
    };
    es.addEventListener('put', handle(false));
    es.addEventListener('patch', handle(true));
    es.addEventListener('cancel', () => { es.close(); startPoll(); });
    // Une coupure brève du flux est normale (reconnexion auto) : on n'affiche « hors ligne » qu'après 6 s sans données.
    let offTimer = 0;
    es.addEventListener('put', () => clearTimeout(offTimer));
    es.addEventListener('patch', () => clearTimeout(offTimer));
    es.onerror = () => {
      fails++;
      if (fails >= 4) { es.close(); startPoll(); return; }
      clearTimeout(offTimer);
      offTimer = setTimeout(() => cb.onStatus?.('offline'), 6000);
    };
  }

  return {
    live: true,
    subscribe(c) {
      cb = c;
      emitters.votes = () => cb.onVotes?.(state.votes);
      emitters.reactions = () => cb.onReactions?.(state.reactions);
      stream('votes');
      stream('reactions');
    },
    async addVote(v) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const body = { ['votes/' + id]: { ...v, t: { '.sv': 'timestamp' } }, ['last/' + uid]: { '.sv': 'timestamp' } };
      const r = await fetch(base + '/.json', { method: 'PATCH', body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.status === 401 ? 'cooldown' : 'net');
      fetchOnce('votes').catch(() => {});
    },
    // type = id de réaction, ou null pour retirer la sienne. 'respect' reste stocké en true (compatible anciennes règles).
    async react(id, type) {
      const val = type === 'respect' ? true : type || null;
      const before = state.reactions;
      state.reactions = applyPath(state.reactions, `${id}/${uid}`, val);
      emitters.reactions();
      const url = `${base}/reactions/${encodeURIComponent(id)}/${encodeURIComponent(uid)}.json`;
      const r = await fetch(url, val ? { method: 'PUT', body: JSON.stringify(val) } : { method: 'DELETE' }).catch(() => null);
      if (!r || !r.ok) { state.reactions = before; emitters.reactions(); throw new Error('react'); }
    }
  };
}

function demoStore(uid) {
  let cb = {};
  const read = (k, d) => { try { return JSON.parse(ls.get(k) || 'null') ?? d; } catch (e) { return d; } };
  const list = () => { const raw = read('ryan_demo', []); return Array.isArray(raw) ? raw : Object.values(raw); };
  const votes = () => Object.fromEntries(list().map(v => [v.id || String(v.t), v]));
  return {
    live: false,
    subscribe(c) {
      cb = c;
      setTimeout(() => { cb.onStatus?.('demo'); cb.onVotes?.(votes()); cb.onReactions?.(read('ryan_demo_react', {})); }, 0);
    },
    async addVote(v) {
      const arr = list();
      arr.push({ ...v, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now() });
      ls.set('ryan_demo', JSON.stringify(arr));
      cb.onVotes?.(votes());
    },
    async react(id, type) {
      const r = read('ryan_demo_react', {});
      r[id] = { ...(r[id] || {}) };
      if (type) r[id][uid] = type === 'respect' ? true : type; else delete r[id][uid];
      ls.set('ryan_demo_react', JSON.stringify(r));
      cb.onReactions?.(r);
    }
  };
}
