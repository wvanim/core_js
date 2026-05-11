# core_js

Programmation JS de WvAnim.

## Modèle

WvAnim repose sur une séparation stricte entre :

- **le Temps** : un **Piece**
- **l'Espace** : un **Face**

Cette base volontairement légère permet de construire des scénarios HTML,
des outils personnels, ou des interfaces interactives sans mélanger la logique
temporelle et la représentation visuelle.

Un `Face` peut représenter :

- une image,
- un texte,
- une forme géométrique,
- ou une structure plus autonome comme un GIF animé, un son, une vidéo,
  un formulaire, un jeu, voire un groupe de `Piece`.

Le seul contrat imposé est l'échange standardisé avec le Temps.

## Démonstration

Le dépôt contient maintenant une démonstration minimale autonome :

- `index.html` : l'interface de démonstration
- `core.js` : le noyau `Face` / `Piece` / `Scenario`

Pour l'essayer, ouvrez simplement `index.html` dans un navigateur.

Pour lancer automatiquement la démonstration, utilisez :

- `index.html?autoplay=1`
