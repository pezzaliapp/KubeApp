// Storage.js — versione classica (no modules), espone window.Storage
(function () {
  'use strict';

  function hasLocalStorage() {
    try {
      const k = '__thecube_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      console.warn('[Storage] localStorage non disponibile:', e);
      return false;
    }
  }

  class Storage {
    constructor(game) {
      this.game = game;
      this.enabled = hasLocalStorage();

      if (!this.enabled) return;

      const userVersion = localStorage.getItem('theCube_version');

      if (!userVersion || userVersion !== (window.gameVersion || '0')) {
        this.clearGame();
        this.clearPreferences();
        this.migrateScores();
        localStorage.setItem('theCube_version', window.gameVersion || '0');
      }
    }

    init() {
      if (!this.enabled) return;
      this.loadPreferences();
      this.loadScores();
    }

    loadGame() {
      if (!this.enabled) {
        this.game.saved = false;
        return;
      }

      try {
        const gameInProgress = localStorage.getItem('theCube_playing') === 'true';
        if (!gameInProgress) throw new Error('no in-progress');

        const gameCubeData = JSON.parse(localStorage.getItem('theCube_savedState') || 'null');
        const gameTimeRaw = localStorage.getItem('theCube_time');
        const gameTime = gameTimeRaw != null ? parseInt(gameTimeRaw, 10) : null;

        if (!gameCubeData || gameTime === null || isNaN(gameTime)) throw new Error('bad data');
        if (gameCubeData.size !== this.game.cube.sizeGenerated) throw new Error('size mismatch');

        this.game.cube.loadFromData(gameCubeData);
        this.game.timer.deltaTime = gameTime;
        this.game.saved = true;
      } catch (e) {
        this.game.saved = false;
      }
    }

    saveGame() {
      if (!this.enabled) return;

      const gameCubeData = { names: [], positions: [], rotations: [] };
      const gameTime = this.game.timer.deltaTime;

      gameCubeData.size = this.game.cube.sizeGenerated;

      this.game.cube.pieces.forEach(piece => {
        gameCubeData.names.push(piece.name);
        // THREE.Vector3 serializza in {x,y,z}
        gameCubeData.positions.push(piece.position);
        gameCubeData.rotations.push(piece.rotation.toVector3());
      });

      localStorage.setItem('theCube_playing', 'true');
      localStorage.setItem('theCube_savedState', JSON.stringify(gameCubeData));
      localStorage.setItem('theCube_time', String(gameTime));
    }

    clearGame() {
      if (!this.enabled) return;
      localStorage.removeItem('theCube_playing');
      localStorage.removeItem('theCube_savedState');
      localStorage.removeItem('theCube_time');
    }

    loadScores() {
      if (!this.enabled) return;
      try {
        const raw = localStorage.getItem('theCube_scores');
        if (!raw) return;
        const scoresData = JSON.parse(raw);
        if (scoresData && typeof scoresData === 'object') {
          this.game.scores.data = scoresData;
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    saveScores() {
      if (!this.enabled) return;
      const scoresData = this.game.scores.data;
      localStorage.setItem('theCube_scores', JSON.stringify(scoresData));
    }

    clearScores() {
      if (!this.enabled) return;
      localStorage.removeItem('theCube_scores');
    }

    migrateScores() {
      if (!this.enabled) return;
      try {
        const scoresData = JSON.parse(localStorage.getItem('theCube_scoresData') || 'null');
        const bestRaw   = localStorage.getItem('theCube_scoresBest');
        const worstRaw  = localStorage.getItem('theCube_scoresWorst');
        const solvesRaw = localStorage.getItem('theCube_scoresSolves');

        const scoresBest  = bestRaw  != null ? parseInt(bestRaw, 10)  : NaN;
        const scoresWorst = worstRaw != null ? parseInt(worstRaw, 10) : NaN;
        const scoresSolves= solvesRaw!= null ? parseInt(solvesRaw,10) : NaN;

        // valida: array e numeri finiti (0 è valido)
        const ok =
          Array.isArray(scoresData) &&
          Number.isFinite(scoresBest) &&
          Number.isFinite(scoresWorst) &&
          Number.isFinite(scoresSolves);

        if (!ok) return false;

        this.game.scores.data[3].scores = scoresData;
        this.game.scores.data[3].best   = scoresBest;
        this.game.scores.data[3].solves = scoresSolves;
        this.game.scores.data[3].worst  = scoresWorst;

        localStorage.removeItem('theCube_scoresData');
        localStorage.removeItem('theCube_scoresBest');
        localStorage.removeItem('theCube_scoresWorst');
        localStorage.removeItem('theCube_scoresSolves');
      } catch (e) {
        // ignore
      }
    }

    loadPreferences() {
      if (!this.enabled) return false;

      try {
        const raw = localStorage.getItem('theCube_preferences');
        const preferences = raw ? JSON.parse(raw) : null;
        if (!preferences) throw new Error('no prefs');

        this.game.cube.size               = parseInt(preferences.cubeSize, 10);
        this.game.controls.flipConfig     = parseInt(preferences.flipConfig, 10);
        this.game.scrambler.dificulty     = parseInt(preferences.dificulty, 10);

        this.game.world.fov = parseFloat(preferences.fov);
        this.game.world.resize();

        // temi
        this.game.themes.colors = preferences.colors;
        this.game.themes.setTheme(preferences.theme);

        return true;
      } catch (e) {
        // default di sicurezza
        this.game.cube.size = 3;
        this.game.controls.flipConfig = 0;
        this.game.scrambler.dificulty = 1;

        this.game.world.fov = 10;
        this.game.world.resize();

        this.game.themes.setTheme('cube');

        this.savePreferences();
        return false;
      }
    }

    savePreferences() {
      if (!this.enabled) return;

      const preferences = {
        cubeSize:   this.game.cube.size,
        flipConfig: this.game.controls.flipConfig,
        dificulty:  this.game.scrambler.dificulty,
        fov:        this.game.world.fov,
        theme:      this.game.themes.theme,
        colors:     this.game.themes.colors,
      };

      localStorage.setItem('theCube_preferences', JSON.stringify(preferences));
    }

    clearPreferences() {
      if (!this.enabled) return;
      localStorage.removeItem('theCube_preferences');
    }
  }

  window.Storage = Storage;
})();
