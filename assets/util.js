export const $ = (s, r = document) => r.querySelector(s);

// Toute donnée venant de la base (noms, commentaires, ids) passe par esc() avant d'entrer dans du HTML.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Les notes sont stockées en dixièmes (80 = 8,0).
export const fmt = v => (v / 10).toFixed(1).replace('.', ',');
export const sfmt = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v));

export const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
};

export const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const weekStart = t => { const d = new Date(dayStart(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const voterName = (u, n) => n || ('Anonyme #' + String(u || '????').slice(-4));

export const ago = t => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return 'il y a ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'il y a ' + Math.floor(s / 3600) + ' h';
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
