#!/usr/bin/env node
/* Génère le fichier autonome dino-loader.js :
 *   bannière + moteur t-rex-runner (auto-init neutralisée) + driver auto-pilote,
 *   sprites PNG inlinés en data-URI → un seul fichier, zéro dépendance.
 *
 * Usage : node scripts/build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const V = join(ROOT, 'vendor', 't-rex-runner');

// 1. Moteur Chromium d'origine, avec l'auto-instanciation retirée
//    (le jeu ne doit pas démarrer tout seul sur `.interstitial-wrapper`).
let engine = readFileSync(join(V, 'index.js'), 'utf8');
const before = engine.length;
engine = engine
  .replace(/function onDocumentLoad\(\)\s*\{[\s\S]*?\}\s*/, '')
  .replace(/document\.addEventListener\(\s*['"]DOMContentLoaded['"]\s*,\s*onDocumentLoad\s*\)\s*;?/, '');
if (engine.length === before) {
  console.error('⚠️  auto-init introuvable — le moteur a peut-être changé.');
  process.exit(1);
}

// 2. Sprites → data-URI
const dataUri = (p) =>
  'data:image/png;base64,' + readFileSync(join(V, p)).toString('base64');
const sprite1x = dataUri('assets/default_100_percent/100-offline-sprite.png');
const sprite2x = dataUri('assets/default_200_percent/200-offline-sprite.png');

// 3. Driver + substitution des sprites
let driver = readFileSync(join(ROOT, 'src', 'dino-loader.driver.js'), 'utf8');
driver = driver.replace('__SPRITE_1X__', sprite1x).replace('__SPRITE_2X__', sprite2x);

// 4. Assemblage
const banner = `/*!
 * dino-loader — composant d'attente <dino-loader> (Web Component).
 * Le dino, le décor et l'animation de saut sont le jeu Chrome "T-Rex Runner",
 * code Chromium extrait par @liuwayong (wayou/t-rex-runner), licence BSD.
 * Voir vendor/t-rex-runner/LICENSE. Auto-pilote (non jouable) ajouté par-dessus.
 * Fichier généré par scripts/build.mjs — ne pas éditer à la main.
 */
`;

const out = banner + '\n' + engine + '\n' + driver + '\n';
writeFileSync(join(ROOT, 'dino-loader.js'), out);
console.log(`✓ dino-loader.js généré (${(out.length / 1024).toFixed(1)} Ko, sprites inlinés)`);
