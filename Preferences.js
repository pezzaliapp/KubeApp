// Preferences.js — versione classica (no modules), espone window.Preferences
/*
© 2025 Alessandro Pezzali. Tutti i diritti riservati.
Licenza d’Uso — Il Cubo di Rubik PWA
*/

(function () {
  'use strict';

  class Preferences {
    constructor(game) {
      this.game = game;
    }

    init() {
      const getProgressInRange = (value, start, end) => {
        return Math.min(Math.max((value - start) / (end - start), 0), 1);
      };

      this.ranges = {
        size: new window.Range('size', {
          value: this.game.cube.size,
          range: [2, 5],
          step: 1,
          onUpdate: value => {
            this.game.cube.size = value;

            this.game.preferences.ranges.scramble.list.forEach((item, i) => {
              item.innerHTML = this.game.scrambler.scrambleLength[this.game.cube.size][i];
            });
          },
          onComplete: () => this.game.storage.savePreferences(),
        }),

        flip: new window.Range('flip', {
          value: this.game.controls.flipConfig,
          range: [0, 2],
          step: 1,
          onUpdate: value => {
            this.game.controls.flipConfig = value;
          },
          onComplete: () => this.game.storage.savePreferences(),
        }),

        scramble: new window.Range('scramble', {
          value: this.game.scrambler.dificulty,
          range: [0, 2],
          step: 1,
          onUpdate: value => {
            this.game.scrambler.dificulty = value;
          },
          onComplete: () => this.game.storage.savePreferences(),
        }),

        fov: new window.Range('fov', {
          value: this.game.world.fov,
          range: [2, 45],
          onUpdate: value => {
            this.game.world.fov = value;
            this.game.world.resize();
          },
          onComplete: () => this.game.storage.savePreferences(),
        }),

        theme: new window.Range('theme', {
          value: { cube: 0, erno: 1, dust: 2, camo: 3, rain: 4 }[this.game.themes.theme],
          range: [0, 4],
          step: 1,
          onUpdate: value => {
            const theme = ['cube', 'erno', 'dust', 'camo', 'rain'][value];
            this.game.themes.setTheme(theme);
          },
          onComplete: () => this.game.storage.savePreferences(),
        }),

        hue: new window.Range('hue', {
          value: 0,
          range: [0, 360],
          onUpdate: () => this.game.themeEditor.updateHSL(),
          onComplete: () => this.game.storage.savePreferences(),
        }),

        saturation: new window.Range('saturation', {
          value: 100,
          range: [0, 100],
          onUpdate: () => this.game.themeEditor.updateHSL(),
          onComplete: () => this.game.storage.savePreferences(),
        }),

        lightness: new window.Range('lightness', {
          value: 50,
          range: [0, 100],
          onUpdate: () => this.game.themeEditor.updateHSL(),
          onComplete: () => this.game.storage.savePreferences(),
        }),
      };

      // inizializza i valori dello scramble in base alla size
      this.ranges.scramble.list.forEach((item, i) => {
        item.innerHTML = this.game.scrambler.scrambleLength[this.game.cube.size][i];
      });
    }
  }

  window.Preferences = Preferences;
})();
