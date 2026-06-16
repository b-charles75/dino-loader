# dino-run-loader (`<dino-loader>`)

A waiting / loading **Web Component**: the Chrome **T-Rex Runner** game, looping
forever and **non-playable**. It starts on its own, the dino runs and
**auto-jumps** over the cacti, and the loop never ends — a fun way to keep users
busy while something loads.

- **Universal** — it's a custom element (`<dino-loader>`). Works on any page:
  plain HTML, React, Vue, Svelte, etc.
- **Self-contained** — a single `dino-loader.js` file, sprite inlined, **zero
  dependencies**, no build step needed to use it.
- **Themeable** — size via `height` / `width`, recolor the whole scene to any
  CSS color (or a CSS variable) via `color`. The canvas is transparent, so the
  page background shows through.
- **Accessible** — `role="status"` + `aria-label`; respects
  `prefers-reduced-motion` (the dino stays still).

## Demo

Open [`preview.html`](preview.html) in a browser.

## Usage — plain HTML

```html
<script src="dino-loader.js"></script>

<dino-loader height="100" label="Loading…"></dino-loader>
```

No build required: copy `dino-loader.js` next to your page and include it. The
sprite is embedded in the file, nothing else to copy.

## Usage — React

```tsx
import { DinoLoader } from 'dino-run-loader/react';

<DinoLoader height={100} label="Loading…" color="var(--accent)" />
```

The wrapper registers the custom element on import and types the props. You can
also use `<dino-loader …>` directly.

## Attributes / props

| Attribute | Prop | Default | Effect |
|---|---|---|---|
| `height` | `height` | `100` | scene height in px; scales the whole scene |
| `width` | `width` | `480` | logical track width in px (max 600) |
| `speed` | `speed` | `1` | speed multiplier (1.6 = faster) |
| `label` | `label` | — | optional caption under the scene (inherits font) |
| `color` | `color` | _(gray)_ | recolor the whole scene; any CSS color or `var(--x)` |
| `dark` | `dark` | — | invert the dino for dark backgrounds |

Multiple `<dino-loader>` elements can coexist on the same page (each instance is
independent).

### Theming with your accent color

The dino is gray by default (faithful to the game). To match an app's colors,
`color` recolors the whole scene. It keeps the sprite's two-tone gradient — dark
parts (dino, cactus, ground) take the accent, light parts (clouds, moon) take a
lighter shade of it — and it accepts a CSS variable so it picks up your theme:

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

## Files

| File | Role |
|---|---|
| `dino-loader.js` | **the deliverable**: self-contained component (generated) |
| `src/dino-loader.driver.js` | source of the auto-pilot + custom element |
| `scripts/build.mjs` | generator (engine + driver + sprite → `dino-loader.js`) |
| `vendor/t-rex-runner/` | original Chromium engine + sprites + LICENSE |
| `dino-loader.react.tsx` | optional React wrapper (typed props) |
| `preview.html` | live demo |

## Out of scope

No sound, the original game's on-screen **score is hidden** (this is a loader,
not a game). The day/night cycle from the original game is kept.
