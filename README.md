# dino-run-loader &nbsp;`<dino-loader>`

[![npm version](https://img.shields.io/npm/v/dino-run-loader.svg)](https://www.npmjs.com/package/dino-run-loader)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)
[![Web Component](https://img.shields.io/badge/Web%20Component-custom%20element-8a2be2.svg)](https://developer.mozilla.org/docs/Web/API/Web_components)

**The Chrome dino game as a loading spinner.** A drop-in Web Component that plays
the real Chrome **T-Rex Runner** while your app loads — the dino runs and
**jumps the cacti by itself**, forever, and it's **not playable** (it's a loader,
not a game).

<p align="center">
  <strong><a href="https://b-charles75.github.io/dino-loader/">▶ Live demo</a></strong>
</p>

```html
<script src="https://unpkg.com/dino-run-loader@1"></script>

<dino-loader label="Loading…"></dino-loader>
```

That's it. One tag, **zero dependencies**, works on any page — plain HTML, React,
Vue, Svelte, anything that renders HTML.

## Why use it

Loading states don't have to be a boring spinner. `<dino-loader>` turns waiting
time into the universally-loved Chrome offline dino — instantly recognizable,
playful, and on-brand once you recolor it. Good for:

- **Page / route loading** and full-screen waiting screens
- **Slow API calls**, uploads, exports, "preparing your data…" panels
- A friendlier alternative to a **spinner** or a blank **skeleton**
- **404 / offline / maintenance** pages (where the dino already belongs)

It's the actual Chromium game engine, so the animation is the real thing — not a
re-drawn imitation.

## Quick start

**npm** (recommended for apps) — install, then import once; the import registers
the `<dino-loader>` custom element:

```bash
npm install dino-run-loader
```
```js
import 'dino-run-loader';      // registers <dino-loader> globally
// now use <dino-loader …></dino-loader> anywhere in your markup
```

**CDN** — no install, great for a quick try or a static page:

```html
<script src="https://unpkg.com/dino-run-loader@1"></script>
<dino-loader height="100" label="Loading…"></dino-loader>
```

For production over a CDN, pin the exact version and add Subresource Integrity:

```html
<script src="https://unpkg.com/dino-run-loader@1.0.2/dino-loader.js"
        integrity="sha384-/DU5vYaNCVcvYAalxKl4X4+aPL5pv5E9ZPK/aaY5h2N64+4Q/Kh4oy3KnbFOzxVK"
        crossorigin="anonymous"></script>
```

**Self-hosted** — copy the single `dino-loader.js` next to your page:

```html
<script src="dino-loader.js"></script>
<dino-loader label="Loading…"></dino-loader>
```

The sprite is embedded in `dino-loader.js`; there is nothing else to copy and no
build step to use it. (`jsdelivr` works too: `https://cdn.jsdelivr.net/npm/dino-run-loader@1`.)

**React** (typed wrapper):

```tsx
import { DinoLoader } from 'dino-run-loader/react';

<DinoLoader height={100} label="Loading…" color="var(--accent)" />
```

The wrapper registers the custom element on import and types the props. You can
also use `<dino-loader …>` directly in JSX.

## Features

- **Universal** — a standard custom element (`<dino-loader>`); no framework required.
- **Self-contained** — one `dino-loader.js`, sprite inlined, **zero dependencies**.
- **Themeable** — size it, set the speed, and recolor the whole scene to your
  brand color (or a CSS variable). The canvas is transparent, so your background
  shows through.
- **Accessible** — `role="status"` + `aria-label`, and it respects
  `prefers-reduced-motion` (the dino stays still instead of looping).
- **Non-playable & multi-instance** — no input is captured, the loop never ends,
  the score is hidden, and many loaders can run on one page independently.

## Attributes / props

| Attribute | Prop | Default | Effect |
|---|---|---|---|
| `height` | `height` | `100` | scene height in px; scales the whole scene |
| `width` | `width` | `480` | logical track width in px (max 600) |
| `speed` | `speed` | `1` | speed multiplier — `1.6` = faster (clamped to a safe range; only speeds up, never below the default) |
| `label` | `label` | — | optional caption under the scene (inherits font) |
| `color` | `color` | _(gray)_ | recolor the whole scene; any CSS color or `var(--x)` |
| `dark` | `dark` | — | invert the dino for dark backgrounds |

`height`/`width` set the natural size; the component is **responsive** — it
scales down to fit a narrower container (keeping its aspect ratio) so it never
overflows.

### Theming with your accent color

The dino is gray by default (faithful to the game). To match your app, `color`
recolors the whole scene. It keeps the sprite's two-tone gradient — dark parts
(dino, cactus, ground) take the accent, light parts (clouds, moon) take a
lighter shade — and it accepts a CSS variable so it follows your theme:

```html
<dino-loader color="var(--accent)"></dino-loader>
<dino-loader color="#3E3CBA"></dino-loader>
```

## Rebuild

`dino-loader.js` is **generated** (engine + driver + inlined sprite). To rebuild
it after editing [`src/dino-loader.driver.js`](src/dino-loader.driver.js):

```bash
node scripts/build.mjs
```

## License & attribution

This project's own code — the auto-pilot driver, the Web Component wrapper, the
build script and the React wrapper — is licensed under the **MIT License**
(see [`LICENSE`](LICENSE)).

It **bundles** the Chrome **T-Rex Runner** game (engine + sprite), which is third
-party software under the **BSD 3-Clause License**:

- Engine & sprite: Copyright © 2014 The Chromium Authors.
- Source packaging: [wayou/t-rex-runner](https://github.com/wayou/t-rex-runner),
  Copyright © 2022 牛さん, BSD 3-Clause.

Per the BSD terms, that copyright notice and license are retained and shipped
with this software — see [`NOTICE`](NOTICE) and
[`vendor/t-rex-runner/LICENSE`](vendor/t-rex-runner/LICENSE). The original
authors do not endorse this project.

## Out of scope

No sound, and the original game's on-screen **score is hidden** (this is a
loader, not a game). The day/night cycle from the original game is kept.
