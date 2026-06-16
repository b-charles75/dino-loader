/* =====================================================================
 * <dino-loader> — driver auto-pilot autour du moteur t-rex-runner.
 *
 * Le moteur (au-dessus dans le fichier généré) est le code Chromium
 * d'origine (BSD, voir vendor/t-rex-runner/LICENSE). Ici on ne fait que :
 *   - l'alimenter en sprite + éléments DOM attendus,
 *   - le démarrer tout seul (pas d'interaction → NON jouable),
 *   - faire sauter le dino quand un cactus approche (pilote automatique),
 *   - neutraliser le game-over (la boucle ne s'arrête jamais).
 *
 * Le dino, le décor et l'animation de saut sont donc EXACTEMENT ceux du
 * jeu Chrome. On ne touche pas au rendu.
 * ===================================================================== */
(function () {
  'use strict';

  var SPRITE_1X = '__SPRITE_1X__';
  var SPRITE_2X = '__SPRITE_2X__';

  var Runner = window.Runner;
  if (!Runner) { return; } // moteur absent → rien à faire

  var docPrepared = false;
  var seq = 0;

  // Injecte (une seule fois) le sprite + les éléments que le moteur cherche
  // par id/classe dans le document, et le CSS de présentation.
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

    // Le moteur fait `.icon-offline`.style.visibility = 'hidden' au init.
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
      // dino gris sombre sur fond clair par défaut ; option dark = invert
      'dino-loader[dark] canvas{filter:invert(1) hue-rotate(180deg);}'
    ].join('');
    document.head.appendChild(css);
  }

  function num(v, dflt) {
    var n = parseFloat(v);
    return isFinite(n) && n > 0 ? n : dflt;
  }

  var TAG = 'dino-loader';
  var NATIVE_H = 150; // hauteur native du canvas du jeu

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

      // Résout l'attribut `color` (couleur CSS ou var(--x)) en rgb concret,
      // via une sonde dans le contexte CSS, puis construit la table de tint.
      // Null = pas de tint (gris d'origine).
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

      // Table luminance(0..255) -> couleur. Dégradé ANCRÉ sur l'accent :
      //   - les tons FONCÉS du sprite (dino/cactus/sol, gris #535353) -> l'accent EXACT
      //   - les tons CLAIRS (nuages/lune, gris #DADADA) -> une version éclaircie
      // Ainsi la CLARTÉ de l'accent compte : accent clair => dino clair.
      _buildLut(rgb) {
        var m = /(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(rgb || '');
        if (!m) { this._lut = null; return; }
        var A = [+m[1], +m[2], +m[3]];          // accent = couleur du dino
        var DARK = 0.325, LIGHT = 0.855;        // luminances des 2 tons du sprite
        var k = 0.6;                            // éclaircissement des tons clairs vers le blanc
        var lr = new Uint8ClampedArray(256), lg = new Uint8ClampedArray(256), lb = new Uint8ClampedArray(256);
        var lut = [lr, lg, lb];
        for (var ch = 0; ch < 3; ch++) {
          var light = A[ch] * (1 - k) + 255 * k; // ton clair = accent éclairci
          var slope = (light - A[ch]) / (LIGHT - DARK);
          for (var i = 0; i < 256; i++) {
            lut[ch][i] = A[ch] + (i / 255 - DARK) * slope;
          }
        }
        this._lut = lut;
      }

      // Tinte le sprite UNE fois (chaque pixel mappé via la table selon sa
      // luminance, alpha conservé) → canvas réutilisé comme source de dessin.
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
          // forcer le moteur à recalculer la largeur du canvas
          try { this._runner.adjustDimensions(); } catch (e) {}
        }
      }

      _syncLabel() {
        var lbl = this.getAttribute('label') || '';
        var el = this.querySelector('.dl-label');
        if (el) el.textContent = lbl;
        this.setAttribute('aria-label', lbl || 'Chargement');
      }

      _boot() {
        var self = this;
        this._applySize();

        var speed = num(this.getAttribute('speed'), 1);
        var cfg = Object.assign({}, Runner.config);
        cfg.SPEED = Runner.config.SPEED * speed;
        cfg.MAX_SPEED = Runner.config.MAX_SPEED * speed;
        cfg.ACCELERATION = Runner.config.ACCELERATION * speed;

        Runner.instance_ = null; // contourne le singleton → instances multiples OK
        var inst;
        try {
          inst = new Runner('#' + this._hostId, cfg);
        } catch (e) {
          return; // moteur indisponible
        }
        // Le moteur fait `this.dimensions = Runner.defaultDimensions` (objet
        // statique PARTAGÉ) : avec plusieurs loaders, la dernière instance
        // écrase la largeur de toutes. On donne à chacune son propre objet.
        inst.dimensions = {
          WIDTH: Runner.defaultDimensions.WIDTH,
          HEIGHT: Runner.defaultDimensions.HEIGHT
        };
        this._runner = inst;

        // Le constructeur charge le sprite puis appelle init() (async).
        // On attend que le jeu soit prêt, puis on le passe en pilote auto.
        var tries = 0;
        var wait = setInterval(function () {
          tries++;
          if (inst.tRex && inst.canvas && inst.horizon) {
            clearInterval(wait);
            self._takeControl();
          } else if (tries > 600) {
            clearInterval(wait); // ~10 s : abandon silencieux
          }
        }, 16);
      }

      _takeControl() {
        var inst = this._runner;

        // Non jouable : on coupe l'écoute clavier/souris/tactile.
        try { inst.stopListening(); } catch (e) {}

        // Accessibilité : si l'utilisateur refuse les animations, on laisse le
        // dino immobile (le moteur a déjà dessiné la scène au repos) au lieu de
        // faire tourner le jeu en boucle.
        var reduce = window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
          inst.setArcadeMode = function () {};
          this._applySize();
          return;
        }
        // Pas de plein écran « arcade ».
        inst.setArcadeMode = function () {};
        inst.setArcadeModeContainerScale = function () {};
        // La boucle ne meurt jamais.
        inst.gameOver = function () {};
        // Pas de score affiché : c'est un loader, pas une partie. On neutralise
        // le dessin du compteur (le reste du moteur — nuit, difficulté — vit sa vie).
        if (inst.distanceMeter) {
          inst.distanceMeter.update = function () { return false; };
        }

        this._applySize();
        this._resolveTint();

        // Recolorisation SANS coût par frame : on tinte le sprite UNE fois
        // (_buildTintedSprite) et on l'échange le temps de chaque update. Tout
        // dessine alors depuis le sprite teinté — y compris les nuages, qui
        // mettent le sprite en cache à leur création (ils sont créés pendant
        // l'update). Aucun traitement pixel par frame → le jeu reste fluide,
        // donc le pilote de saut garde un timing correct.
        var self = this;
        var origUpdate = inst.update.bind(inst);
        inst.update = function () {
          if (!self._tintedSprite) { origUpdate(); return; }
          var saved = Runner.imageSprite;
          Runner.imageSprite = self._tintedSprite;
          origUpdate();
          Runner.imageSprite = saved;
        };

        // Démarrage : on active la partie et on lance le dino en course.
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
            // sauter quand le cactus arrive à portée (proportionnel à la vitesse)
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
