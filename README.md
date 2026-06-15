# `<dino-loader>`

Composant d'**attente** (loader) inspiré du jeu Chrome Dino : le dino court et
saute par-dessus des cactus, en boucle, à l'infini. **Non jouable** — c'est une
animation décorative pour faire patienter, pas un jeu (aucun input, aucune
collision : le saut est chorégraphié).

- **Universel** : un Web Component (`<dino-loader>`). Marche sur n'importe quelle
  page — HTML pur, React, Vue, etc.
- **S'adapte au CSS de la page** : monochrome en `currentColor` (hérite de la
  couleur de texte), taille pilotée par `height`, police du label héritée.
- **Autonome** : un seul fichier, zéro dépendance, aucun build pour l'utiliser.
- **Accessible** : `role="status"` + `aria-label` ; respecte
  `prefers-reduced-motion` (scène figée).

## Démo

Ouvrir [`preview.html`](preview.html) dans un navigateur.

## Usage — HTML pur

```html
<script type="module" src="dino-loader.js"></script>

<dino-loader height="48" label="Chargement…"></dino-loader>
```

Sans build : copier `dino-loader.js` à côté de la page et l'inclure.

## Usage — React

```tsx
import { DinoLoader } from './dino-loader.react';

<DinoLoader height={48} label="Chargement…" color="var(--accent)" />
```

Le wrapper enregistre le custom element à l'import et type les props. (On peut
aussi se passer du wrapper et écrire `<dino-loader …>` directement.)

## Attributs / props

| Attribut | Prop | Défaut | Effet |
|---|---|---|---|
| `height` | `height` | `48` | hauteur de la scène en px (ou valeur CSS) ; scale tout |
| `color` | `color` | `currentColor` | couleur du dino/sol/cactus ; hex, nom, ou `var(--x)` |
| `speed` | `speed` | `1` | multiplicateur de vitesse (2 = ×2 plus rapide) |
| `label` | `label` | — | légende optionnelle sous la scène (police héritée) |

### S'adapter au thème de la page

Par défaut le dino prend la couleur du texte ambiant :

```html
<div style="color:#FFD869">
  <dino-loader></dino-loader>   <!-- dino jaune -->
</div>
```

Ou forcer une couleur (utile pour piocher dans une variable de charte) :

```html
<dino-loader color="var(--color-accent, #FFD869)"></dino-loader>
```

## Fichiers

| Fichier | Rôle |
|---|---|
| `dino-loader.js` | le composant (custom element autonome) — **le livrable** |
| `dino-loader.react.tsx` | wrapper React optionnel (props typées) |
| `preview.html` | showcase live (tailles, couleurs, reduced-motion) |
| `docs/superpowers/specs/` | spec de conception |

## Hors scope

Pas de logique de jeu (score, game over, collision), pas de mode nuit/nuages,
pas de packaging npm. À ajouter seulement si un vrai besoin apparaît.
