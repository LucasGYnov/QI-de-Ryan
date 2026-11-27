# Le QI de Ryan

Ryan s'est auto-proclamé à 8/10 en intelligence. Ses potes votent +0,1 ou −0,1 à chaque remarque mémorable.

Site statique (HTML, CSS, JS en modules ES, aucune dépendance) hébergé sur GitHub Pages,
données dans Firebase Realtime Database (offre gratuite).

## Fonctionnalités
- Note partagée en temps réel, départ à 8,0, bornée entre 0 et 10.
- Un vote toutes les 10 s par navigateur (vérifié aussi côté serveur), commentaire facultatif.
- Ryan dessiné qui change selon sa note (5 états).
- Courbe adaptative (zoom automatique, périodes, infobulle par vote), bilan de la semaine, 14 jours.
- 38 trophées (bronze, argent, or, platine, dont des secrets).
- Casier des votes avec réactions « Appuyé », classement des votants, flash info défilant.
- Carte image à partager, sons (désactivés par défaut), installable sur l'écran d'accueil.
- Easter eggs : à trouver.

## Mise en ligne
1. Firebase → Realtime Database → **Règles** : coller `database.rules.json` → **Publier**.
2. L'URL de la base est dans `assets/config.js` (`FIREBASE_URL`).
3. Pousser sur `main` : GitHub Pages publie le site (Settings → Pages → `main` / root).

## Tester en local
Les modules ES ne marchent pas en `file://`. Lancer un serveur :
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000. Sans `FIREBASE_URL`, le site passe en mode démo (votes sur l'appareil).

## Remettre à zéro
Firebase → Realtime Database → Données → supprimer `votes`, `last` et `reactions`.
