// Réactions aux commentaires du casier, façon autocollants d'affiche (dessins originaux).
// Les ids sont stockés en base : ne jamais les renommer. `true` (ancienne réaction « Appuyé ») = 'respect'.
// Toute nouvelle réaction doit aussi être ajoutée dans database.rules.json.
export const REACTS = [
  { id: 'respect', n: 'Respect', c: '#ffd45c', ic: '<path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V10M11 10V5.5a1.5 1.5 0 0 1 3 0V10M14 10V6.5a1.5 1.5 0 0 1 3 0V11M17 11v-1a1.5 1.5 0 0 1 3 0v4.5c0 4-3 6.5-6.5 6.5H12c-3 0-4.6-1.6-5.8-3.6L4.4 14.3a1.6 1.6 0 0 1 2.7-1.7L8 14"/>' },
  { id: 'mdr', n: 'Mort de rire', c: '#ff8fc4', ic: '<path d="M12 3a8 8 0 0 0-8 8c0 2.8 1.4 4.8 3.5 6v3h9v-3c2.1-1.2 3.5-3.2 3.5-6a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.8"/><circle cx="15" cy="11" r="1.8"/><path d="M11 15.5h2M10 20v-2.5M14 20v-2.5"/>' },
  { id: 'wanted', n: 'Recherché', c: '#ff6b7f', ic: '<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6L12 16.4 6.6 19.3l1.3-6-4.5-4 6-.7z"/><path d="M12 9v3.5M12 14.6v.4"/>' },
  { id: 'croco', n: 'Leonida Man', c: '#7ee0a0', ic: '<path d="M2 14.5c2.5-4 6.5-5.5 10.5-5.5H18c2.2 0 4 1.2 4 3s-1.8 3-4 3H9.5C6.5 15 4 15.3 2 14.5z"/><path d="M12 15l1 1.8 1-1.8 1 1.8 1-1.8 1 1.8 1-1.8"/><circle cx="10" cy="11.5" r="1"/><path d="M8 9l1-2 2 1.5"/>' },
  { id: 'cash', n: 'Braquage', c: '#c9f27a', ic: '<path d="M9 3.5h6l-1.8 3h-2.4zM8.5 7.5h7C18.6 9.6 20 13.4 20 16.5 20 18.6 18 20 16 20H8c-2 0-4-1.4-4-3.5 0-3.1 1.4-6.9 4.5-9z"/><path d="M14 11.6c-.5-.6-1.2-.9-2-.9-1.2 0-2 .6-2 1.5s.8 1.3 2 1.5 2 .6 2 1.5-.8 1.6-2 1.6c-.8 0-1.6-.3-2-.9M12 9.5v1.2M12 16.8V18"/>' },
  { id: 'confiance', n: 'Confiance ?', c: '#9fd8ff', ic: '<path d="M2 10.5L6 7l4 1.8L13 7l4 .8 5 3.2"/><path d="M2 10.5l6.8 6.8a1.6 1.6 0 0 0 2.3 0M8.2 13l3 3M10.4 11l3.6 3.6M13 8.8l4.4 4.4 1.6-1.6"/>' }
];
export const REACT_BY = Object.fromEntries(REACTS.map(r => [r.id, r]));

// Normalise une valeur stockée : true → 'respect', id connu → id, sinon null (ignorée).
export const rType = v => (v === true ? 'respect' : typeof v === 'string' && REACT_BY[v] ? v : null);

// Pastille d'icône (tuile colorée bordée, style autocollant).
export function reactIcon(r, size = 22) {
  return `<svg class="rx-ic" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="6" fill="${r.c}" stroke="#12051f" stroke-width="2"/><g transform="translate(3.6 3.6) scale(.7)" fill="none" stroke="#170622" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${r.ic}</g></svg>`;
}
