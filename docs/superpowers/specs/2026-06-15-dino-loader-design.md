# `<dino-loader>` — Web Component d'attente

**Date :** 2026-06-15
**Statut :** design validé (Charles, 15/06)

## ⚠️ Révision 2 (15/06) — fidélité au vrai jeu

Charles a tranché : il veut **exactement** le dino, le décor et l'animation de
saut du jeu Chrome (réf. https://mhasbini.com/miscs/react-chrome-dino-demo/) —
pas une réinterprétation SVG. On **abandonne le SVG pixel-art maison** (rev. 1
ci-dessous) au profit du **vrai moteur Chromium** (`wayou/t-rex-runner`, licence
BSD, vendored avec sa LICENSE) :

- moteur d'origine **non modifié** (rendu fidèle : sprite, sol, nuages, cactus,
  ptérodactyles, score, jour/nuit) ;
- on l'enrobe dans `<dino-loader>` et on ajoute un **pilote automatique** :
  démarrage seul, saut auto quand un cactus approche, **pas de game-over** →
  **non jouable**, boucle infinie ;
- `dino-loader.js` est **généré** (`scripts/build.mjs`) = bannière + moteur
  (auto-init retirée) + driver + sprites inlinés en data-URI → un seul fichier.
- Conséquence sur « s'adapte au CSS » : le dino garde sa couleur d'origine (gris)
  — `currentColor` n'a plus de sens. Restent : `height` (taille), `width` (piste),
  `speed`, `label`, `dark` (invert fond sombre), canvas transparent.
- Multi-instances : le moteur partage `Runner.defaultDimensions` (objet statique)
  → le driver clone `dimensions` par instance, sinon les loaders s'écrasent.
- Accessibilité : `prefers-reduced-motion` → dino immobile (le moteur n'en tient
  pas compte seul).

Le reste du document (rev. 1, approche SVG) est conservé pour mémoire.

---

## Intention

Composant d'**attente** (loader) inspiré du jeu Chrome Dino, **non jouable** : on
voit le dino courir et sauter par-dessus des cactus à l'infini. But = faire
patienter l'utilisateur pendant un chargement court, avec un objet sympathique
qui **s'adapte au CSS de la page** sur laquelle on le pose.

Référence visuelle : https://mhasbini.com/miscs/react-chrome-dino-demo/index.html
(on s'inspire de l'esthétique, on ne reprend ni le code ni le sprite PNG).

## Décisions actées

| Sujet | Décision |
|---|---|
| Forme | **Web Component** (`<dino-loader>`), custom element universel |
| Rendu | **SVG monochrome**, `fill: currentColor` (se recolore selon le thème hôte) |
| Scène | Dino qui court (pattes alternées) + sol qui défile + cactus qui traversent + saut par-dessus |
| Jouabilité | **Aucune** — saut chorégraphié (phase-locké au cactus), pas d'input, pas de collision réelle |
| Emplacement | **Mini-projet autonome** `projects/dino-loader/` (hors huge-bi-reporting), repo git dédié |
| Build | Aucun build obligatoire — `dino-loader.js` en JS moderne **est** le livrable |
| Wrapper React | Fourni, mince (`dino-loader.react.tsx`) pour la DX dans les apps React |
| Intégration app | **Non** dans ce lot — livrable = composant + preview isolée |

## Architecture

Un seul fichier source autonome `dino-loader.js` :

- Définit le custom element via `customElements.define('dino-loader', DinoLoader)`
  (garde anti-double-définition si le script est inclus deux fois).
- **Shadow DOM** (mode `open`) qui encapsule :
  - un `<style>` (keyframes + layout de la scène) ;
  - la scène SVG (sol, dino, cactus).
- L'encapsulation isole le CSS de la page (rien ne fuit, rien ne casse), **mais**
  les propriétés CSS héritées traversent la frontière shadow : `color` (donc
  `currentColor`) et `font-*`. C'est exactement le canal d'adaptation au thème
  hôte voulu.

### Attributs (observés → réactifs)

| Attribut | Défaut | Effet |
|---|---|---|
| `height` | `48` | hauteur de la scène en px (ou toute valeur CSS de longueur) ; la scène scale proportionnellement |
| `color` | `currentColor` | couleur du dino / sol / cactus ; accepte un hex, un nom, ou `var(--x)` |
| `speed` | `1` | multiplicateur de vitesse (1 = cycle de référence ~1,4 s par cactus ; 2 = deux fois plus rapide) |
| `label` | _(vide)_ | légende optionnelle affichée sous la scène, police héritée |

`observedAttributes` = ces quatre. `attributeChangedCallback` met à jour les
variables CSS internes (`--dl-height`, `--dl-color`, `--dl-cycle`) et le texte du
label, sans reconstruire le DOM.

### Animation (CSS pur, transform/opacity uniquement → GPU-friendly)

Trois boucles, toutes en `animation … infinite linear` :

1. **Sol** : motif répété qui défile en `translateX` (boucle courte indépendante).
2. **Cactus** : `translateX` de droite (hors-champ) vers gauche (hors-champ) sur
   une durée = `--dl-cycle`. Une itération = un cactus qui traverse.
3. **Dino — saut** : `translateY` en arc, durée = **le même `--dl-cycle`**, donc
   **phase-locké** au cactus : le pic du saut tombe au moment où le cactus passe
   sous le dino (le dino est fixe à ~20 % de la largeur ; le cactus l'atteint vers
   ~75-85 % du cycle → pic du saut calé sur cette fenêtre, à affiner en preview).
4. **Dino — pattes** : alternance 2 frames en `steps()`, boucle rapide
   indépendante (effet de course).

`speed` agit en divisant `--dl-cycle` (et la boucle des pattes), gardant la
synchro saut/cactus intacte.

### Accessibilité

- L'hôte porte `role="status"` et `aria-label` = `label` si fourni, sinon
  « Chargement ».
- `@media (prefers-reduced-motion: reduce)` dans le shadow : toutes les animations
  `animation: none` → scène figée (dino debout au sol, un cactus visible, pas de
  défilement). Pas de mouvement pour les utilisateurs sensibles.

## Adaptation au CSS hôte — récapitulatif

- **Couleur** : `currentColor` par défaut → hérite de `color` du conteneur ;
  surcharge via attribut `color` (ex. `color="var(--accent)"`).
- **Taille** : attribut `height` ; SVG en `viewBox` → scale net de ~24 px à pleine
  largeur.
- **Police du label** : héritée (aucune typo imposée).
- **Isolation** : shadow DOM → le composant ne pollue pas la page et n'est pas
  cassé par ses styles globaux.

## Structure du projet

```
projects/dino-loader/
  dino-loader.js          # le composant, autonome, JS moderne, zéro dépendance
  dino-loader.react.tsx   # wrapper React mince (DinoLoader → <dino-loader>, props→attrs)
  preview.html            # showcase live : tailles, couleurs, fonds clair/foncé, reduced-motion, snippets
  README.md               # usage HTML pur + usage React + table des attributs
  docs/superpowers/specs/2026-06-15-dino-loader-design.md
```

## Vérification (pas de test unitaire lourd — c'est une animation)

- **Preview live** (`preview.html`) ouverte via les outils de preview :
  - le dino court, le sol défile, les cactus traversent, le saut passe **au-dessus**
    du cactus (pas dedans, pas trop tôt/tard) ;
  - `color` recolore toute la scène (tester sur fond clair et fond foncé) ;
  - `height` scale proprement (24 px, 48 px, grand) ;
  - `speed` accélère sans casser la synchro ;
  - `prefers-reduced-motion` → scène figée (émulation devtools).
- **Smoke-test léger optionnel** : le custom element s'enregistre, rend sans
  erreur, applique les attributs.

## Hors scope (YAGNI)

- Aucune logique de jeu (score, game over, collision, input clavier).
- Pas de variantes de personnage / mode nuit / nuages (peut venir plus tard si
  réclamé — pas « au cas où »).
- Pas d'intégration dans une app BI dans ce lot.
- Pas de packaging npm / publication (le fichier est copiable tel quel ; à
  formaliser seulement si un vrai besoin de distribution apparaît).
