# `<dino-loader>`

Composant d'**attente** (loader) : le vrai jeu Chrome « T-Rex Runner », en boucle
infinie et **non jouable**. Il démarre tout seul, le dino court et **saute tout
seul** par-dessus les cactus, et la boucle ne s'arrête jamais.

Le dino, le décor (sol, nuages, cactus, ptérodactyles, jour/nuit) et l'animation
de saut sont **exactement** ceux du jeu Chrome : on réutilise le moteur Chromium
d'origine sans toucher au rendu. On ne fait qu'ajouter un pilote automatique
(démarrage seul + saut auto + pas de game-over) par-dessus.

- **Universel** : un Web Component (`<dino-loader>`). Marche sur n'importe quelle
  page — HTML pur, React, Vue, etc.
- **Autonome** : un seul fichier `dino-loader.js`, sprite inliné, zéro dépendance,
  aucun build pour l'utiliser.
- **S'adapte** : taille via `height`, fond sombre via `dark`. Le canvas est
  transparent → le fond de la page transparaît.
- **Accessible** : `role="status"` + `aria-label` ; si l'utilisateur a activé
  « réduire les animations » (`prefers-reduced-motion`), le dino reste immobile.

## Démo

Ouvrir [`preview.html`](preview.html) dans un navigateur.

## Usage — HTML pur

```html
<script src="dino-loader.js"></script>

<dino-loader height="100" label="Chargement…"></dino-loader>
```

Sans build : copier `dino-loader.js` à côté de la page et l'inclure. (Le sprite
est embarqué dans le fichier, rien d'autre à copier.)

## Usage — React

```tsx
import { DinoLoader } from './dino-loader.react';

<DinoLoader height={100} label="Chargement…" />
```

Le wrapper enregistre le custom element à l'import et type les props. (On peut
aussi écrire `<dino-loader …>` directement.)

## Attributs / props

| Attribut | Prop | Défaut | Effet |
|---|---|---|---|
| `height` | `height` | `100` | hauteur de la scène en px ; met toute la scène à l'échelle |
| `width` | `width` | `480` | largeur logique de la piste en px (max 600) |
| `speed` | `speed` | `1` | multiplicateur de vitesse (1.6 = plus rapide) |
| `label` | `label` | — | légende optionnelle sous la scène (police héritée) |
| `dark` | `dark` | — | inverse le dino pour un fond sombre |

Plusieurs `<dino-loader>` peuvent coexister sur la même page (chaque instance est
indépendante).

## Régénérer le fichier

`dino-loader.js` est **généré** (moteur + pilote + sprite inliné). Pour le
reconstruire après modification de [`src/dino-loader.driver.js`](src/dino-loader.driver.js) :

```bash
node scripts/build.mjs
```

## Provenance & licence

Le moteur du jeu vient de [`wayou/t-rex-runner`](https://github.com/wayou/t-rex-runner),
extrait du code Chromium par @liuwayong. Code et sprite sous **licence BSD**
(Copyright The Chromium Authors) — voir [`vendor/t-rex-runner/LICENSE`](vendor/t-rex-runner/LICENSE).
Le pilote automatique et l'enrobage Web Component sont ajoutés par-dessus, sans
modifier le rendu d'origine.

## Fichiers

| Fichier | Rôle |
|---|---|
| `dino-loader.js` | **le livrable** : composant autonome (généré) |
| `src/dino-loader.driver.js` | source du pilote auto + custom element |
| `scripts/build.mjs` | générateur (moteur + pilote + sprite → `dino-loader.js`) |
| `vendor/t-rex-runner/` | moteur Chromium d'origine + sprites + LICENSE |
| `dino-loader.react.tsx` | wrapper React optionnel (props typées) |
| `preview.html` | showcase live |
| `docs/superpowers/specs/` | spec de conception |

## Hors scope

Pas de son, pas de packaging npm. Le **compteur de score** du jeu d'origine est
masqué (c'est un loader, pas une partie) ; le mode jour/nuit, lui, est conservé.
