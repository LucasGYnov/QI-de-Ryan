import { RYAN_LOOK } from './config.js';

// Ryan, personnage original peint façon affiche de jeu au coucher de soleil :
// lumière chaude à droite, ombre violette à gauche, liseré lumineux sur les contours.
// Signalement : cheveux longs jusqu'aux épaules, yeux marron, barbe légère sur les côtés,
// pas de moustache, gros nez, 1,65 m. 5 états selon la note (en dixièmes).
export const STAGES = [
  { min: 90, id: 'genie', n: 'Génie incompris' },
  { min: 75, id: 'confiant', n: 'Sûr de lui' },
  { min: 55, id: 'perplexe', n: 'Ça mouline' },
  { min: 35, id: 'bug', n: 'Écran bleu' },
  { min: 0, id: 'entonnoir', n: 'Entonnoir de compétition' }
];
export const stageOf = s => STAGES.find(x => s >= x.min) || STAGES[STAGES.length - 1];

const LINE = '#2a1420';

export function ryanSVG(s, { uid = 'r', look = RYAN_LOOK, bg = true, clip = true } = {}) {
  const L = { ...RYAN_LOOK, ...look };
  const st = stageOf(s);
  const id = k => `${uid}-${k}`;
  const ln = (w = 1.2) => `stroke="${LINE}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  const defs = `
    <linearGradient id="${id('bg')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a1a6a"/><stop offset=".5" stop-color="#d0508f"/><stop offset="1" stop-color="#ffb066"/></linearGradient>
    <linearGradient id="${id('skin')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${L.skinShade}"/><stop offset=".45" stop-color="${L.skin}"/><stop offset="1" stop-color="${L.skinLight}"/></linearGradient>
    <linearGradient id="${id('neck')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.skinShade}"/><stop offset=".45" stop-color="${L.skin}"/></linearGradient>
    <linearGradient id="${id('hair')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L.hair}"/><stop offset=".7" stop-color="${L.hair}"/><stop offset="1" stop-color="${L.hairLight}"/></linearGradient>
    <linearGradient id="${id('shirt')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${L.shirt}"/><stop offset="1" stop-color="${L.shirtLight}"/></linearGradient>
    <linearGradient id="${id('tee')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9a9d6"/><stop offset="1" stop-color="${L.tee}"/></linearGradient>
    <radialGradient id="${id('iris')}"><stop offset="0" stop-color="${L.eyesLight}"/><stop offset="1" stop-color="${L.eyes}"/></radialGradient>
    <linearGradient id="${id('metal')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d6a8a"/><stop offset=".55" stop-color="#d9dbe6"/><stop offset="1" stop-color="#fff5e6"/></linearGradient>
    <pattern id="${id('stub')}" width="1.9" height="2.3" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx=".8" cy=".8" r=".55" fill="${L.hair}"/><circle cx="1.6" cy="1.9" r=".4" fill="${L.hair}"/></pattern>
    <clipPath id="${id('c')}"><circle cx="100" cy="110" r="96"/></clipPath>`;

  // Yeux : blanc en amande, iris marron, paupière supérieure.
  const eye = (x, { dx = 0, dy = 0, lid = 0 } = {}) => `
    <ellipse cx="${x}" cy="84" rx="9" ry="4" fill="${L.skinShade}" opacity=".35"/>
    <path d="M${x - 8} 87Q${x} ${81 + lid} ${x + 8} 87Q${x} 91 ${x - 8} 87Z" fill="#f4ece8"/>
    <circle cx="${x + dx}" cy="${87 + dy}" r="3.2" fill="url(#${id('iris')})"/>
    <circle cx="${x + dx}" cy="${87 + dy}" r="1.4" fill="#1a0c08"/>
    <circle cx="${x + dx + 1.1}" cy="${86 + dy}" r=".8" fill="#fff"/>
    <path d="M${x - 8.5} 87Q${x} ${80.5 + lid} ${x + 8.5} 87" fill="none" ${ln(1.8)}/>`;
  const spiral = x => `
    <ellipse cx="${x}" cy="87" rx="8.5" ry="6" fill="#f4ece8" ${ln(1.4)}/>
    <path d="M${x} 87m-1 0a1.1 1.1 0 1 1 2.2 0a2.2 2.2 0 1 1-4.4 0a3.3 3.3 0 1 1 6.6 0a4.4 4.4 0 1 1-8.8 0" fill="none" stroke="${LINE}" stroke-width="1.2"/>`;
  const brow = d => `<path d="${d}" fill="${L.hair}"/>`;
  const drool = (x, len) => `<path d="M${x} 131q2.5 ${len / 2} .5 ${len}" fill="none" stroke="#cfefff" stroke-width="3" stroke-linecap="round" opacity=".9"/><circle class="drip" cx="${x + .6}" cy="${133 + len}" r="2.8" fill="#cfefff" stroke="#7fb6cf" stroke-width=".8"/>`;
  const qmark = (x, y) => `<path transform="translate(${x} ${y})" d="M-7-6c0-9 15-9 15 0 0 6-8 6-8 12M0 13v1" fill="none" stroke="#ffd45c" stroke-width="5" stroke-linecap="round"/>`;

  // Bouches : lèvre sup., lèvre inf., variantes selon l'état.
  const lips = (dy = 1.5, tilt = 0) => `
    <path d="M90 ${128 + dy - tilt}C95 ${125.5 + dy} 98 ${126.5 + dy} 100 ${127 + dy}C102 ${126.5 + dy} 105 ${125.5 + dy} 110 ${128 + dy + tilt}C105 ${129 + dy} 95 ${129 + dy} 90 ${128 + dy - tilt}Z" fill="${L.lip}"/>
    <path d="M91 ${128.4 + dy - tilt}C96 ${133 + dy} 104 ${133 + dy} 109 ${128.4 + dy + tilt}C104 ${130 + dy} 96 ${130 + dy} 91 ${128.4 + dy - tilt}Z" fill="${L.lipLight}"/>
    <path d="M90 ${128 + dy - tilt}Q100 ${129.5 + dy} 110 ${128 + dy + tilt}" fill="none" ${ln(1.1)}/>`;

  const face = {
    genie: () => eye(85) + eye(115)
      + brow('M73 77Q85 69 97 74L97 77.5Q85 73.5 73 80.5Z') + brow('M103 74Q115 69 127 77L127 80.5Q115 73.5 103 77.5Z')
      + `<circle cx="85" cy="87" r="9.5" fill="#bdf0ff22" stroke="#e8b84a" stroke-width="1.8"/><circle cx="115" cy="87" r="9.5" fill="#bdf0ff22" stroke="#e8b84a" stroke-width="1.8"/><path d="M94.5 86q5.5-3 11 0M75.5 85l-10-3M124.5 85l10-3" fill="none" stroke="#e8b84a" stroke-width="1.6"/>`
      + `<path d="M89 127Q100 138 111 127Q100 130 89 127Z" fill="#5a1630" ${ln(1)}/><path d="M91 128Q100 131 109 128L108 129.5Q100 132 92 129.5Z" fill="#fff"/>`,
    confiant: () => eye(85, { lid: 2 }) + eye(115, { lid: 1 })
      + brow('M73 80Q85 75 97 77L97 80.5Q85 79 73 83.5Z') + brow('M103 77Q115 70 127 75L127 78.5Q115 74.5 103 80.5Z')
      + lips(1.5, -1.4) + `<path d="M108 127q3-1 4-3.5" fill="none" ${ln(1.1)}/>`,
    perplexe: () => eye(85, { dx: -1.5, dy: -1 }) + eye(115, { dx: -1.5, dy: -1, lid: 3 })
      + brow('M73 75Q85 66 97 72L97 75.5Q85 70.5 73 78.5Z') + brow('M103 79Q115 78 127 81L127 84.5Q115 82 103 82.5Z')
      + `<path d="M91 129q5-3 9 0t9-1" fill="none" ${ln(1.8)}/>`
      + `<path d="M124 56c3 5 4.5 7.5 4.5 10a4.5 4.5 0 0 1-9 0c0-2.5 1.5-5 4.5-10z" fill="#9fe6ff" stroke="#4a8fb0" stroke-width="1"/><path d="M122.5 64.5a1.6 1.6 0 0 0 1.6 1.6" stroke="#fff" stroke-width="1" fill="none"/>`,
    bug: () => spiral(85) + spiral(115)
      + brow('M73 76Q85 77 97 80L97 83.5Q85 81 73 79.5Z') + brow('M103 80Q115 74 127 74L127 77.5Q115 78 103 83.5Z')
      + `<ellipse cx="100" cy="130" rx="7" ry="5" fill="#4a1226" ${ln(1.2)}/><path d="M95 133q5 2.5 10 0" stroke="#e0607e" stroke-width="2" fill="none"/>` + drool(105, 14),
    entonnoir: () => eye(85, { dx: 2.6, dy: .6 }) + eye(115, { dx: -2.6, dy: .6 })
      + brow('M73 75Q85 82 97 81L97 84Q85 85 73 78.5Z') + brow('M103 81Q115 82 127 75L127 78.5Q115 85 103 84Z')
      + `<path d="M89 126Q100 140 111 126Q100 129 89 126Z" fill="#4a1226" ${ln(1.2)}/><path d="M96 131q5 12 11 0q-5 3-11 0z" fill="#ff7f9c" ${ln(1)}/>` + drool(91, 20)
  }[st.id]();

  const extras = {
    genie: `<g transform="translate(156 30)"><path d="M0-30v8M-22-18l5 5M22-18l-5 5M-28 0h8M28 0h-8" stroke="#ffe27a" stroke-width="3.5" stroke-linecap="round"/><circle r="13" fill="#fff6b8" stroke="#e8b84a" stroke-width="2"/><path d="M-4 3l4-5 4 5" stroke="#e8b84a" stroke-width="1.5" fill="none"/><rect x="-6" y="12" width="12" height="8" rx="2" fill="url(#${id('metal')})" stroke="${LINE}" stroke-width="1"/></g>`,
    confiant: '',
    perplexe: qmark(50, 34) + qmark(152, 26),
    bug: `<circle cx="100" cy="14" r="9" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="12 7"/>`,
    entonnoir: `<path d="M64 50L136 50L111 10L89 10Z" fill="url(#${id('metal')})" ${ln(1.4)}/><path d="M64 50Q100 58 136 50" fill="none" stroke="#5a5874" stroke-width="2.5"/><path d="M94 10h12l-2-12h-8z" fill="url(#${id('metal')})" ${ln(1.2)}/><path d="M112 14L128 46" stroke="#fff" stroke-width="3" opacity=".7"/>`
      + `<g class="fly"><g transform="translate(158 60)"><ellipse cx="-3" cy="-5" rx="4" ry="2.4" fill="#fff" opacity=".85"/><circle r="3" fill="#1a0c08"/></g></g>`
  }[st.id];

  const body = `
    <!-- cheveux, couche arrière (jusqu'aux épaules) -->
    <path d="M56 80C52 42 76 22 100 22s48 20 44 58c2 30 6 58 16 84-10 8-24 8-34 2H74c-10 6-24 6-34-2 10-26 14-54 16-84z" fill="url(#${id('hair')})" ${ln()}/>
    <!-- buste : chemise ouverte sur t-shirt -->
    <path d="M6 222C10 184 42 166 74 160h52c32 6 64 24 68 62z" fill="url(#${id('shirt')})" ${ln()}/>
    <path d="M28 196c8-10 18-16 30-20M172 196c-8-10-18-16-30-20" stroke="${L.shirtLight}" stroke-width="2" opacity=".5" fill="none"/>
    <path d="M77 160L100 200L123 160Z" fill="url(#${id('tee')})" ${ln()}/>
    <path d="M76 160L91 196L62 178ZM124 160L109 196L138 178Z" fill="${L.shirt}" ${ln()}/>
    <path d="M186 210C182 190 170 178 152 170" stroke="#ffcf9a" stroke-width="2" fill="none" opacity=".8"/>
    <!-- cou -->
    <path d="M80 124c0 18-1 28-4 38h48c-3-10-4-20-4-38z" fill="url(#${id('neck')})" ${ln()}/>
    <path d="M80 128c8 10 32 10 40 0v10c-10 7-30 7-40 0z" fill="${L.skinShade}" opacity=".55"/>
    <path d="M99 146q2 5 1 9" stroke="${L.skinShade}" stroke-width="1.6" fill="none" opacity=".7"/>
    <path d="M85 160q15 24 30 0" fill="none" stroke="#e8b84a" stroke-width="1.6"/>
    <!-- visage, mâchoire carrée -->
    <path d="M62 80C62 50 80 36 100 36s38 14 38 44c0 16-2 26-5 34-4 12-15 24-27 27-4 1-8 1-12 0-12-3-23-15-27-27-3-8-5-18-5-34z" fill="url(#${id('skin')})" ${ln()}/>
    <path d="M62 80c0 16 2 26 5 34 4 12 15 24 27 27-9-6-15-16-18-28-4-14-4-30 0-50-8 3-14 9-14 17z" fill="${L.skinShade}" opacity=".45"/>
    <path d="M136 64c3 20 1 38-5 52" fill="none" stroke="${L.rim}" stroke-width="2.4" opacity=".9"/>
    <ellipse cx="121" cy="101" rx="8" ry="5" fill="${L.skinLight}" opacity=".4"/>
    <!-- barbe légère sur les côtés, sans moustache -->
    <g>
      <path d="M62 82c0 16 2 26 5 34 4 12 15 24 27 27l1-6c-9-4-16-12-20-22-4-10-5-20-5-33zM138 82c0 16-2 26-5 34-4 12-15 24-27 27l-1-6c9-4 16-12 20-22 4-10 5-20 5-33z" fill="${L.hair}" opacity=".42"/>
      <path d="M62 82c0 16 2 26 5 34 4 12 15 24 27 27l1-6c-9-4-16-12-20-22-4-10-5-20-5-33zM138 82c0 16-2 26-5 34-4 12-15 24-27 27l-1-6c9-4 16-12 20-22 4-10 5-20 5-33z" fill="url(#${id('stub')})" opacity=".75"/>
    </g>
    <!-- gros nez -->
    <path d="M98 82c-2 12-6 20-10 26-3 5-1 11 5 12l6-2z" fill="${L.skinShade}" opacity=".55"/>
    <path d="M104 86c1.5 9 1.5 17 .5 23" fill="none" stroke="${L.skinLight}" stroke-width="2.6" opacity=".55"/>
    <ellipse cx="101.5" cy="113.5" rx="6.5" ry="5" fill="${L.skin}"/>
    <ellipse cx="103" cy="112" rx="3.8" ry="2.6" fill="${L.skinLight}" opacity=".7"/>
    <path d="M89 108c-7 9-1 15 7 12M112 108c7 9 1 15-7 12" fill="none" stroke="#7a4238" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>
    <path d="M93 120q7.5 4 15 0" fill="none" stroke="#6a3a30" stroke-width="1.4"/>
    <ellipse cx="95.6" cy="119" rx="3" ry="1.5" fill="#3a1a16"/><ellipse cx="105.4" cy="119" rx="3" ry="1.5" fill="#3a1a16"/>
    ${face}
    <!-- cheveux, mèches avant (raie au milieu, rideau sur les tempes) -->
    <path d="M60 86c-4-28 8-46 30-52-8 10-14 22-18 38-2 10-4 20-6 30-3-4-5-10-6-16z" fill="url(#${id('hair')})" ${ln()}/>
    <path d="M140 86c4-28-8-46-30-52 8 10 14 22 18 38 2 10 4 20 6 30 3-4 5-10 6-16z" fill="url(#${id('hair')})" ${ln()}/>
    <path d="M68 64c6-20 18-30 32-30s26 10 32 30c-8-10-18-16-32-16S76 54 68 64z" fill="url(#${id('hair')})" ${ln()}/>
    <path d="M100 34v12" stroke="${L.skinShade}" stroke-width="1.4" opacity=".6"/>
    <g fill="none" stroke-linecap="round">
      <path d="M128 44c8 14 10 34 10 56M122 42c6 8 8 18 8 30M144 98c2 24 6 46 14 64" stroke="${L.hairLight}" stroke-width="1.6" opacity=".85"/>
      <path d="M72 46c-6 12-8 28-8 46M58 100c-2 22-6 44-14 62" stroke="#b07ad0" stroke-width="1.6" opacity=".7"/>
      <path d="M96 36c-8 4-14 12-18 22M106 36c8 4 14 12 18 22" stroke="${L.hairLight}" stroke-width="1.2" opacity=".6"/>
    </g>`;

  const disc = bg ? `<circle cx="100" cy="110" r="96" fill="url(#${id('bg')})"/>` : '';
  const main = bg && clip ? `<g clip-path="url(#${id('c')})">${body}</g>` : `<g>${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 222" role="img" aria-label="Ryan, état : ${st.n}"><defs>${defs}</defs>${disc}${main}${extras}</svg>`;
}
