/* =====================================================================
 * <dino-loader> — auto-pilot driver around the t-rex-runner engine.
 *
 * The engine (above this in the generated file) is the original Chromium
 * code (BSD, see vendor/t-rex-runner/LICENSE). Here we only:
 *   - feed it the sprite + the DOM elements it expects,
 *   - start it on its own (no interaction → NOT playable),
 *   - make the dino jump when a cactus approaches (auto-pilot),
 *   - neutralize game-over (the loop never stops).
 *
 * The dino, the scenery and the jump animation are therefore EXACTLY the
 * ones from the Chrome game. We do not touch the rendering.
 * ===================================================================== */
(function () {
  'use strict';

  var SPRITE_1X = '__SPRITE_1X__';
  var SPRITE_2X = '__SPRITE_2X__';

  var Runner = window.Runner;
  if (!Runner) { return; } // engine missing → nothing to do

  var docPrepared = false;
  var seq = 0;

  // Inject (once) the sprite + the elements the engine looks up by id/class
  // in the document, plus the presentation CSS.
  function prepareDoc() {
    if (docPrepared) return;
    docPrepared = true;

    var holder = document.createElement('div');
    holder.id = 'offline-resources';
    holder.style.display = 'none';

    var img1 = new Image();
    img1.id = 'offline-resources-1x';
    img1.src = SPRITE_1X;

    var img2 = new Image();
    img2.id = 'offline-resources-2x';
    img2.src = SPRITE_2X;

    // The engine does `.icon-offline`.style.visibility = 'hidden' on init.
    var icon = document.createElement('div');
    icon.className = 'icon icon-offline';

    holder.appendChild(img1);
    holder.appendChild(img2);
    holder.appendChild(icon);
    document.body.appendChild(holder);

    var css = document.createElement('style');
    css.setAttribute('data-dino-loader', '');
    css.textContent = [
      'dino-loader{display:inline-flex;flex-direction:column;align-items:center;',
      'gap:.4em;vertical-align:middle;line-height:1;}',
      'dino-loader[hidden]{display:none;}',
      'dino-loader .dl-stage{overflow:hidden;position:relative;}',
      'dino-loader .dl-scale{transform-origin:top left;}',
      'dino-loader .runner-container{position:relative !important;top:0 !important;}',
      'dino-loader canvas{display:block;}',
      'dino-loader .dl-label{font:inherit;font-size:.85em;opacity:.8;color:currentColor;',
      'text-align:center;white-space:nowrap;}',
      'dino-loader .dl-label:empty{display:none;}',
      // dark-gray dino on a light background by default; the dark option inverts it
      'dino-loader[dark] canvas{filter:invert(1) hue-rotate(180deg);}'
    ].join('');
    document.head.appendChild(css);
  }

  function num(v, dflt) {
    var n = parseFloat(v);
    return isFinite(n) && n > 0 ? n : dflt;
  }

  var TAG = 'dino-loader';
  var NATIVE_H = 150; // native height of the game canvas

  var DinoLoader = function () {};
  DinoLoader.prototype = Object.create(HTMLElement.prototype);

  function defineEl() {
    class DinoLoaderEl extends HTMLElement {
      static get observedAttributes() { return ['height', 'width', 'speed', 'label', 'color']; }

      connectedCallback() {
        prepareDoc();
        if (!this.hasAttribute('role')) this.setAttribute('role', 'status');
        if (!this._built) this._build();
        this._applySize();
        this._syncLabel();
      }

      disconnectedCallback() {
        if (this._raf) cancelAnimationFrame(this._raf);
        if (this._runner && this._runner.stop) {
          try { this._runner.stop(); } catch (e) {}
        }
      }

      attributeChangedCallback(name) {
        if (!this._built) return;
        if (name === 'label') this._syncLabel();
        else if (name === 'color') this._resolveTint();
        else this._applySize();
      }

      // Resolve the `color` attribute (CSS color or var(--x)) to a concrete rgb,
      // via a probe in the CSS context, then build the tint table.
      // Null = no tint (original gray).
      _resolveTint() {
        var c = this.getAttribute('color');
        if (!c) { this._tint = null; this._lut = null; return; }
        var probe = this._probe || (this._probe = document.createElement('span'));
        probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;color:' + c;
        if (probe.parentNode !== this) this.appendChild(probe);
        var rgb = getComputedStyle(probe).color;
        this._tint = rgb || c;
        this._buildLut(this._tint);
        this._buildTintedSprite();
      }

      // Table luminance(0..255) -> color. Gradient ANCHORED on the accent:
      //   - the DARK tones of the sprite (dino/cactus/ground, gray #535353) -> the EXACT accent
      //   - the LIGHT tones (clouds/moon, gray #DADADA) -> a lightened version
      // So the LIGHTNESS of the accent matters: light accent => light dino.
      _buildLut(rgb) {
        var m = /(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(rgb || '');
        if (!m) { this._lut = null; return; }
        var A = [+m[1], +m[2], +m[3]];          // accent = dino color
        var DARK = 0.325, LIGHT = 0.855;        // luminances of the sprite's 2 tones
        var k = 0.6;                            // how much light tones are pushed toward white
        var lr = new Uint8ClampedArray(256), lg = new Uint8ClampedArray(256), lb = new Uint8ClampedArray(256);
        var lut = [lr, lg, lb];
        for (var ch = 0; ch < 3; ch++) {
          var light = A[ch] * (1 - k) + 255 * k; // light tone = lightened accent
          var slope = (light - A[ch]) / (LIGHT - DARK);
          for (var i = 0; i < 256; i++) {
            lut[ch][i] = A[ch] + (i / 255 - DARK) * slope;
          }
        }
        this._lut = lut;
      }

      // Tint the sprite ONCE (each pixel mapped through the table by its
      // luminance, alpha preserved) → canvas reused as the drawing source.
      _buildTintedSprite() {
        var R = window.Runner;
        var src = R && R.imageSprite;
        if (!this._lut || !src || !src.complete && !src.width) { this._tintedSprite = null; return; }
        var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
        if (!w || !h) { this._tintedSprite = null; return; }
        var cv = this._spriteCv || (this._spriteCv = document.createElement('canvas'));
        cv.width = w; cv.height = h;
        var cx = cv.getContext('2d');
        cx.clearRect(0, 0, w, h);
        cx.drawImage(src, 0, 0);
        var img, d;
        try { img = cx.getImageData(0, 0, w, h); d = img.data; }
        catch (e) { this._tintedSprite = null; return; }
        var lr = this._lut[0], lg = this._lut[1], lb = this._lut[2];
        for (var i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue;
          var lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
          d[i] = lr[lum]; d[i + 1] = lg[lum]; d[i + 2] = lb[lum];
        }
        cx.putImageData(img, 0, 0);
        this._tintedSprite = cv;
      }

      _build() {
        this._built = true;
        var id = 'dl-host-' + (++seq);
        this.innerHTML =
          '<div class="dl-stage"><div class="dl-scale">' +
          '<div class="dl-host" id="' + id + '"></div></div></div>' +
          '<span class="dl-label"></span>';
        this._stage = this.querySelector('.dl-stage');
        this._scale = this.querySelector('.dl-scale');
        this._host = this.querySelector('.dl-host');
        this._hostId = id;
        this._boot();
      }

      _applySize() {
        if (!this._stage) return;
        var h = num(this.getAttribute('height'), 100);
        var wLogical = Math.min(600, num(this.getAttribute('width'), 480));
        var s = h / NATIVE_H;
        this._wLogical = wLogical;
        this._host.style.width = wLogical + 'px';
        this._host.style.height = NATIVE_H + 'px';
        this._scale.style.width = wLogical + 'px';
        this._scale.style.height = NATIVE_H + 'px';
        this._scale.style.transform = 'scale(' + s + ')';
        this._stage.style.width = (wLogical * s) + 'px';
        this._stage.style.height = h + 'px';
        if (this._runner) {
          // force the engine to recompute the canvas width
          try { this._runner.adjustDimensions(); } catch (e) {}
        }
      }

      _syncLabel() {
        var lbl = this.getAttribute('label') || '';
        var el = this.querySelector('.dl-label');
        if (el) el.textContent = lbl;
        this.setAttribute('aria-label', lbl || 'Loading');
      }

      _boot() {
        var self = this;
        this._applySize();

        var speed = num(this.getAttribute('speed'), 1);
        var cfg = Object.assign({}, Runner.config);
        cfg.SPEED = Runner.config.SPEED * speed;
        cfg.MAX_SPEED = Runner.config.MAX_SPEED * speed;
        cfg.ACCELERATION = Runner.config.ACCELERATION * speed;

        Runner.instance_ = null; // bypass the singleton → multiple instances OK
        var inst;
        try {
          inst = new Runner('#' + this._hostId, cfg);
        } catch (e) {
          return; // engine unavailable
        }
        // The engine does `this.dimensions = Runner.defaultDimensions` (a SHARED
        // static object): with several loaders, the last instance overwrites the
        // width of all of them. We give each its own object.
        inst.dimensions = {
          WIDTH: Runner.defaultDimensions.WIDTH,
          HEIGHT: Runner.defaultDimensions.HEIGHT
        };
        this._runner = inst;

        // The constructor loads the sprite then calls init() (async).
        // We wait for the game to be ready, then switch it to auto-pilot.
        var tries = 0;
        var wait = setInterval(function () {
          tries++;
          if (inst.tRex && inst.canvas && inst.horizon) {
            clearInterval(wait);
            self._takeControl();
          } else if (tries > 600) {
            clearInterval(wait); // ~10 s: give up silently
          }
        }, 16);
      }

      _takeControl() {
        var inst = this._runner;

        // Not playable: cut off keyboard/mouse/touch listening.
        try { inst.stopListening(); } catch (e) {}

        // Accessibility: if the user prefers reduced motion, we leave the dino
        // still (the engine has already drawn the scene at rest) instead of
        // running the game in a loop.
        var reduce = window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
          inst.setArcadeMode = function () {};
          this._applySize();
          return;
        }
        // No fullscreen "arcade" mode.
        inst.setArcadeMode = function () {};
        inst.setArcadeModeContainerScale = function () {};
        // The loop never dies.
        inst.gameOver = function () {};
        // No score displayed: this is a loader, not a game. We neutralize the
        // counter's drawing (the rest of the engine — night, difficulty — lives on).
        if (inst.distanceMeter) {
          inst.distanceMeter.update = function () { return false; };
        }

        this._applySize();
        this._resolveTint();

        // Recoloring with NO per-frame cost: we tint the sprite ONCE
        // (_buildTintedSprite) and swap it in for the duration of each update.
        // Everything then draws from the tinted sprite — including the clouds,
        // which cache the sprite when created (they are created during update).
        // No per-frame pixel work → the game stays smooth, so the jump pilot
        // keeps correct timing.
        var self = this;
        var origUpdate = inst.update.bind(inst);
        inst.update = function () {
          if (!self._tintedSprite) { origUpdate(); return; }
          var saved = Runner.imageSprite;
          Runner.imageSprite = self._tintedSprite;
          origUpdate();
          Runner.imageSprite = saved;
        };

        // Start: activate the game and send the dino off running.
        inst.activated = true;
        inst.playing = true;
        try { inst.tRex.update(0, 'RUNNING'); } catch (e) {}
        inst.update();

        this._autopilot();
      }

      _autopilot() {
        var self = this;
        var inst = this._runner;

        function frame() {
          if (!self.isConnected) return;
          var trex = inst.tRex;
          var obs = inst.horizon && inst.horizon.obstacles;
          if (trex && obs && obs.length && !trex.jumping && !trex.ducking) {
            var o = obs[0];
            var trexRight = trex.xPos + trex.config.WIDTH;          // ~94
            var gap = o.xPos - trexRight;
            // jump when the cactus comes within reach (proportional to speed)
            var lead = 24 + inst.currentSpeed * 8;
            if (gap > 0 && gap < lead) {
              inst.tRex.startJump(inst.currentSpeed);
            }
          }
          self._raf = requestAnimationFrame(frame);
        }
        this._raf = requestAnimationFrame(frame);
      }
    }

    if (!customElements.get(TAG)) {
      customElements.define(TAG, DinoLoaderEl);
    }
  }

  if (document.body) defineEl();
  else document.addEventListener('DOMContentLoaded', defineEl);
})();
