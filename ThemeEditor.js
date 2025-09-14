// ThemeEditor.js — versione classica (no modules), usa window.Tween/Easing ed espone window.ThemeEditor
(function () {
  'use strict';

  class ThemeEditor {
    constructor(game) {
      this.game = game;
      this.editColor = 'R';

      this.getPieceColor = this.getPieceColor.bind(this);
      this.tweenHSL = null;
    }

    colorFromHSL(h, s, l) {
      h = Math.round(h);
      s = Math.round(s);
      l = Math.round(l);
      return new THREE.Color(`hsl(${h}, ${s}%, ${l}%)`);
    }

    setHSL(color = null, animate = false) {
      this.editColor = (color === null) ? 'R' : color;

      const hsl = new THREE.Color(this.game.themes.getColors()[this.editColor]);
      const { h, s, l } = hsl.getHSL(hsl);

      const { hue, saturation, lightness } = this.game.preferences.ranges;

      if (animate) {
        const ho = hue.value / 360;
        const so = saturation.value / 100;
        const lo = lightness.value / 100;

        const colorOld = this.colorFromHSL(hue.value, saturation.value, lightness.value);

        if (this.tweenHSL && typeof this.tweenHSL.stop === 'function') this.tweenHSL.stop();

        this.tweenHSL = new window.Tween({
          duration: 200,
          easing: window.Easing && window.Easing.Sine ? window.Easing.Sine.Out() : (t => t),
          onUpdate: tween => {
            hue.setValue((ho + (h - ho) * tween.value) * 360);
            saturation.setValue((so + (s - so) * tween.value) * 100);
            lightness.setValue((lo + (l - lo) * tween.value) * 100);

            const colorTween = colorOld.clone().lerp(hsl, tween.value);
            const colorTweenStyle = colorTween.getStyle();
            const colorTweenHSL = colorTween.getHSL(colorTween);

            hue.handle.style.color = colorTweenStyle;
            saturation.handle.style.color = colorTweenStyle;
            lightness.handle.style.color = colorTweenStyle;

            saturation.track.style.color =
              this.colorFromHSL(colorTweenHSL.h * 360, 100, 50).getStyle();
            lightness.track.style.color =
              this.colorFromHSL(colorTweenHSL.h * 360, colorTweenHSL.s * 100, 50).getStyle();

            // forzare repaint per gradienti
            this.game.dom.theme.style.display = 'none';
            this.game.dom.theme.offsetHeight; // reflow
            this.game.dom.theme.style.display = '';
          },
          onComplete: () => {
            this.updateHSL();
            this.game.storage.savePreferences();
          },
        });
      } else {
        hue.setValue(h * 360);
        saturation.setValue(s * 100);
        lightness.setValue(l * 100);

        this.updateHSL();
        this.game.storage.savePreferences();
      }
    }

    updateHSL() {
      const { hue, saturation, lightness } = this.game.preferences.ranges;

      const h = hue.value;
      const s = saturation.value;
      const l = lightness.value;

      const color = this.colorFromHSL(h, s, l).getStyle();

      hue.handle.style.color = color;
      saturation.handle.style.color = color;
      lightness.handle.style.color = color;

      saturation.track.style.color = this.colorFromHSL(h, 100, 50).getStyle();
      lightness.track.style.color = this.colorFromHSL(h, s, 50).getStyle();

      // reflow per aggiornare gradienti
      this.game.dom.theme.style.display = 'none';
      this.game.dom.theme.offsetHeight;
      this.game.dom.theme.style.display = '';

      const theme = this.game.themes.theme;
      this.game.themes.colors[theme][this.editColor] = this.colorFromHSL(h, s, l).getHex();
      this.game.themes.setTheme();
    }

    colorPicker(enable) {
      if (enable) {
        this.game.dom.game.addEventListener('click', this.getPieceColor, false);
      } else {
        this.game.dom.game.removeEventListener('click', this.getPieceColor, false);
      }
    }

    getPieceColor(event) {
      // 1) Ottieni coordinate del click
      const clickEvent = event.touches
        ? (event.touches[0] || event.changedTouches[0])
        : event;

      // 2) Converti in coordinate RELATIVE all’area di gioco
      const rect = this.game.dom.game.getBoundingClientRect();
      const relX = (clickEvent.clientX != null ? clickEvent.clientX : clickEvent.pageX) - rect.left;
      const relY = (clickEvent.clientY != null ? clickEvent.clientY : clickEvent.pageY) - rect.top;

      const clickPosition = new THREE.Vector2(relX, relY);

      // 3) Intersezioni: edges e poi cubi (usa Controls.getIntersect, che internamente converte in NDC)
      let edgeIntersect = this.game.controls.getIntersect(clickPosition, this.game.cube.edges, true);
      let pieceIntersect = this.game.controls.getIntersect(clickPosition, this.game.cube.cubes, true);

      // Se è un edge “interno” (non visibile all’esterno), scartalo
      if (edgeIntersect !== false) {
        const edge = edgeIntersect.object;

        const position = edge.parent
          .localToWorld(edge.position.clone())
          .sub(this.game.cube.object.position)
          .sub(this.game.cube.animator.position);

        const mainAxis = this.game.controls.getMainAxis(position);
        if (position.multiplyScalar(2).round()[mainAxis] < 1) edgeIntersect = false;
      }

      const name = edgeIntersect ? edgeIntersect.object.name : (pieceIntersect ? 'P' : 'G');

      this.setHSL(name, true);
    }

    resetTheme() {
      this.game.themes.colors[this.game.themes.theme] =
        JSON.parse(JSON.stringify(this.game.themes.defaults[this.game.themes.theme]));

      this.game.themes.setTheme();
      this.setHSL(this.editColor, true);
    }
  }

  window.ThemeEditor = ThemeEditor;
})();
