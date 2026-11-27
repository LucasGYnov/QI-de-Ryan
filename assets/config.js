// URL de la Realtime Database Firebase. Vide = mode démo (votes sur l'appareil uniquement).
// Cette URL n'est pas un secret : la sécurité vient des règles (database.rules.json).
export const FIREBASE_URL = "https://qi-de-ryan-default-rtdb.europe-west1.firebasedatabase.app";

// Note de départ en dixièmes : 80 = 8,0/10, la note auto-déclarée de Ryan. Ne pas changer :
// tout l'historique est recalculé depuis cette valeur.
export const START = 80;

// Délai entre deux votes d'un même navigateur (ms). Aussi imposé côté serveur par les règles.
export const COOLDOWN = 10000;

// Couleurs du personnage (style affiche peinte : lumière chaude à droite, ombre violette à gauche).
// Signalement : cheveux longs aux épaules, yeux marron, barbe légère sur les côtés, pas de moustache, gros nez.
export const RYAN_LOOK = {
  skin: "#d49a76",
  skinLight: "#f6c8a0",
  skinShade: "#8a5262",
  rim: "#ffd9b0",
  hair: "#2b1a12",
  hairLight: "#7a5238",
  eyes: "#4a2a14",
  eyesLight: "#9a6034",
  lip: "#9a5048",
  lipLight: "#c07466",
  shirt: "#2e2350",
  shirtLight: "#6a4f9e",
  tee: "#f4f0ff"
};
