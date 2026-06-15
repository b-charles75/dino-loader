/**
 * <dino-loader> — Web Component d'attente (loader), inspiré du jeu Chrome Dino.
 *
 * NON jouable : le dino court et saute par-dessus des cactus en boucle infinie,
 * le saut est chorégraphié (phase-locké au cactus). Aucun input, aucune collision.
 *
 * S'adapte au CSS de la page hôte :
 *   - couleur via `currentColor` (hérite de `color`) ou attribut `color`
 *   - taille via attribut `height`
 *   - police du label héritée
 *   - encapsulé en Shadow DOM (n'altère pas la page, n'est pas cassé par elle)
 *
 * Usage HTML pur :
 *   <script type="module" src="dino-loader.js"></script>
 *   <dino-loader height="48" label="Chargement…"></dino-loader>
 *
 * Attributs : height (px, déf. 48) · color (déf. currentColor) · speed (déf. 1) · label
 */

const TAG = 'dino-loader';

// --- Géométrie de la scène (unités viewBox) -------------------------------
const CS = 3;            // taille d'une "case" pixel
const VB_W = 360;        // largeur viewBox
const VB_H = 140;        // hauteur viewBox
const GROUND_Y = 110;    // ligne de sol
const DINO_X = 45;       // position horizontale fixe du dino

// --- Pixel-art (grilles) ---------------------------------------------------
// '#' = plein · 'o' = œil (trou, laisse voir le fond) · '.' = vide
// Corps du dino (sans les pattes basses, qui sont animées séparément).
const DINO_BODY = [
  '...........######...',
  '..........#######...',
  '..........#oo#####..',
  '..........########..',
  '..........#######...',
  '..........###.####..',
  '..........#######...',
  '#.........#######...',
  '##.......########...',
  '###.....#########...',
  '####..############..',
  '#################...',
  '.################...',
  '..##############....',
  '...############.....',
  '...##########.##....',
  '...#########........',
];
// Pattes — 2 poses alternées (rangées sous le corps, mêmes colonnes).
const DINO_LEGS_A = [
  '....######.####.....',
  '....###....###......',
  '....###....##.......',
  '....###.............',
  '...####.............',
];
const DINO_LEGS_B = [
  '....######.####.....',
  '....###.....###.....',
  '.....##.....###.....',
  '............###.....',
  '............####....',
];
const LEGS_OFFSET_ROWS = DINO_BODY.length; // les pattes commencent sous le corps

// Cactus (saguaro) : colonne centrale + deux bras.
const CACTUS = [
  '...#..',
  '...#..',
  '#..#..',
  '#..#.#',
  '#..#.#',
  '#.##.#',
  '####.#',
  '...###',
  '...#..',
  '...#..',
  '...#..',
  '..###.',
];

// --- Helpers de rendu ------------------------------------------------------
/** Convertit une grille en rectangles SVG. Renvoie {fill, eye} (chaînes). */
function gridToRects(grid, cs, ox, oy) {
  let fill = '';
  let eye = '';
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch !== '#' && ch !== 'o') continue;
      // +0.6 de débord pour éviter les coutures entre cases.
      const rect = `<rect x="${ox + c * cs}" y="${oy + r * cs}" width="${cs + 0.6}" height="${cs + 0.6}"/>`;
      if (ch === 'o') eye += rect;
      else fill += rect;
    }
  }
  return { fill, eye };
}

function buildScene() {
  const dinoH = (DINO_BODY.length + DINO_LEGS_A.length) * CS;
  const dinoTopY = GROUND_Y - dinoH; // y du haut du dino au repos

  const body = gridToRects(DINO_BODY, CS, 0, 0);
  const legsA = gridToRects(DINO_LEGS_A, CS, 0, LEGS_OFFSET_ROWS * CS).fill;
  const legsB = gridToRects(DINO_LEGS_B, CS, 0, LEGS_OFFSET_ROWS * CS).fill;

  const cactusH = CACTUS.length * CS;
  const cactus = gridToRects(CACTUS, CS, 0, 0).fill;
  const cactusTopY = GROUND_Y - cactusH;

  // Sol : 2 tuiles côte à côte (défilement sans couture). Ligne + cailloux.
  const tile = (xoff) => {
    let pebbles = '';
    // positions déterministes (pas de Math.random — rendu stable)
    const spots = [18, 70, 96, 150, 205, 240, 300, 332];
    for (const s of spots) {
      pebbles += `<rect x="${xoff + s}" y="4" width="${(s % 7) + 2}" height="2"/>`;
    }
    return `<rect x="${xoff}" y="0" width="${VB_W}" height="2"/>${pebbles}`;
  };

  return `
  <svg class="scene" viewBox="0 0 ${VB_W} ${VB_H}" role="img" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <mask id="dl-eye">
        <rect x="-2" y="-2" width="${DINO_BODY[0].length * CS + 4}" height="${dinoH + 4}" fill="#fff"/>
        ${body.eye ? `<g fill="#000">${body.eye}</g>` : ''}
      </mask>
    </defs>

    <!-- Sol défilant -->
    <g transform="translate(0 ${GROUND_Y})">
      <g class="ground">${tile(0)}${tile(VB_W)}</g>
    </g>

    <!-- Cactus (traverse de droite à gauche) -->
    <g transform="translate(0 ${cactusTopY})">
      <g class="cactus">${cactus}</g>
    </g>

    <!-- Dino (position fixe + saut chorégraphié) -->
    <g transform="translate(${DINO_X} ${dinoTopY})">
      <g class="jump">
        <g mask="url(#dl-eye)">
          ${body.fill}
          <g class="legA">${legsA}</g>
          <g class="legB">${legsB}</g>
        </g>
      </g>
    </g>
  </svg>`;
}

const SCENE = buildScene();

const STYLE = `
  :host {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: .5em;
    color: currentColor;          /* surchargé par l'attribut color */
    line-height: 1;
    vertical-align: middle;
  }
  :host([hidden]) { display: none; }
  .scene {
    display: block;
    height: var(--dl-height, 48px);
    width: auto;
    overflow: visible;
    fill: currentColor;
  }
  .label {
    font: inherit;
    font-size: .85em;
    opacity: .8;
    color: currentColor;
    white-space: nowrap;
  }
  .label:empty { display: none; }

  /* Cactus : traverse la scène sur un cycle. */
  .cactus {
    animation: dl-cactus var(--dl-cycle, 1.4s) linear infinite;
  }
  @keyframes dl-cactus {
    from { transform: translateX(${VB_W}px); }
    to   { transform: translateX(-30px); }
  }

  /* Dino : arc de saut, MÊME durée que le cactus → pic au passage du cactus. */
  .jump {
    animation: dl-jump var(--dl-cycle, 1.4s) cubic-bezier(.3,0,.5,1) infinite;
  }
  @keyframes dl-jump {
    0%, 56%   { transform: translateY(0); }
    66%       { transform: translateY(-40px); }
    72%, 80%  { transform: translateY(-46px); }   /* plateau : cactus passe dessous */
    88%       { transform: translateY(-18px); }
    100%      { transform: translateY(0); }
  }

  /* Pattes : alternance 2 frames (course). */
  .legA { animation: dl-legA var(--dl-leg, .34s) steps(1) infinite; }
  .legB { animation: dl-legB var(--dl-leg, .34s) steps(1) infinite; }
  @keyframes dl-legA { 0% { opacity: 1; } 50%, 100% { opacity: 0; } }
  @keyframes dl-legB { 0% { opacity: 0; } 50%, 100% { opacity: 1; } }

  /* Sol : défilement sans couture (1 tuile par cycle). */
  .ground { animation: dl-ground var(--dl-cycle, 1.4s) linear infinite; }
  @keyframes dl-ground {
    from { transform: translateX(0); }
    to   { transform: translateX(-${VB_W}px); }
  }

  /* Accessibilité : pas de mouvement → scène figée, dino debout. */
  @media (prefers-reduced-motion: reduce) {
    .cactus, .jump, .ground, .legA, .legB { animation: none; }
    .legB { opacity: 0; }
    .cactus { transform: translateX(180px); }
  }
`;

const BASE_CYCLE = 1.4; // s, à vitesse 1
const BASE_LEG = 0.34;  // s, à vitesse 1

class DinoLoader extends HTMLElement {
  static get observedAttributes() { return ['height', 'color', 'speed', 'label']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${STYLE}</style>${SCENE}<span class="label"></span>`;
    }
    if (!this.hasAttribute('role')) this.setAttribute('role', 'status');
    this._sync();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this._sync();
  }

  _sync() {
    const height = this.getAttribute('height') || '48';
    const color = this.getAttribute('color');
    const speed = Math.max(0.1, parseFloat(this.getAttribute('speed') || '1') || 1);
    const label = this.getAttribute('label') || '';

    const h = /^[\d.]+$/.test(height) ? `${height}px` : height;
    this.style.setProperty('--dl-height', h);
    this.style.setProperty('--dl-cycle', `${(BASE_CYCLE / speed).toFixed(3)}s`);
    this.style.setProperty('--dl-leg', `${(BASE_LEG / speed).toFixed(3)}s`);
    this.style.color = color || '';

    const labelEl = this.shadowRoot.querySelector('.label');
    if (labelEl) labelEl.textContent = label;
    this.setAttribute('aria-label', label || 'Chargement');
  }
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, DinoLoader);
}

export { DinoLoader };
