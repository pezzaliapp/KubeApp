// Game.js — versione non-module (niente import), usa classi globali già caricate
/*
© 2025 Alessandro Pezzali. Tutti i diritti riservati.
Licenza d’Uso — Il Cubo di Rubik PWA
*/
const STATE = { Menu:0, Playing:1, Complete:2, Stats:3, Prefs:4, Theme:5 };
const BUTTONS = {
  Menu:['stats','prefs'],
  Playing:['back'],
  Complete:[],
  Stats:[],
  Prefs:['back','theme'],
  Theme:['back','reset'],
  None:[]
};
const SHOW=true, HIDE=false;

// helper selettori sicuri
const $ = sel => document.querySelector(sel) || null;

(function(){
  // prendi le classi dal namespace globale (window)
  const World       = window.World;
  const Cube        = window.Cube;
  const Controls    = window.Controls;
  const Scrambler   = window.Scrambler;
  const Transition  = window.Transition;
  const Timer       = window.Timer;
  const Preferences = window.Preferences;
  const Confetti    = window.Confetti;
  const Scores      = window.Scores;
  const Storage     = window.Storage;
  const Themes      = window.Themes;
  const ThemeEditor = window.ThemeEditor;
  const States      = window.States || {}; // es. States['3']['checkerboard']
  // Icons.js può solo registrare SVG/inline: non serve reference qui

  class Game {
    constructor() {
      this.dom = {
        ui: $('.ui'),
        game: $('.ui__game'),
        back: $('.ui__background'),
        prefs: $('.ui__prefs'),
        theme: $('.ui__theme'),
        stats: $('.ui__stats'),
        texts: {
          title: $('.text--title'),
          note: $('.text--note'),
          timer: $('.text--timer'),
          complete: $('.text--complete'),
          best: $('.text--best-time'),
        },
        buttons: {
          prefs: $('.btn--prefs'),
          back: $('.btn--back'),
          stats: $('.btn--stats'),
          reset: $('.btn--reset'),
          theme: $('.btn--theme'),
        },
      };

      this.world       = new World(this);
      this.cube        = new Cube(this);
      this.controls    = new Controls(this);
      this.scrambler   = new Scrambler(this);
      this.transition  = new Transition(this);
      this.timer       = new Timer(this);
      this.preferences = new Preferences(this);
      this.scores      = new Scores(this);
      this.storage     = new Storage(this);
      this.confetti    = new Confetti(this);
      this.themes      = new Themes(this);
      this.themeEditor = new ThemeEditor(this);

      this.initActions();

      this.state = STATE.Menu;
      this.newGame = false;
      this.saved = false;

      this.storage.init();
      this.preferences.init();
      this.cube.init();
      this.transition.init();

      this.storage.loadGame();
      this.scores.calcStats();

      setTimeout(() => {
        this.transition.float && this.transition.float();
        this.transition.cube && this.transition.cube(SHOW);
        setTimeout(() => this.transition.title && this.transition.title(SHOW), 700);
        setTimeout(() => this.transition.buttons && this.transition.buttons(BUTTONS.Menu, BUTTONS.None), 1000);
      }, 500);
    }

    initActions() {
      let tappedTwice = false;

      if (this.dom.game) {
        this.dom.game.addEventListener('click', () => {
          if ((this.transition.activeTransitions || 0) > 0) return;
          if (this.state === STATE.Playing) return;

          if (this.state === STATE.Menu) {
            if (!tappedTwice) {
              tappedTwice = true;
              setTimeout(() => (tappedTwice = false), 480);
              return;
            }
            this.game(SHOW);
          } else if (this.state === STATE.Complete) {
            this.complete(HIDE);
          } else if (this.state === STATE.Stats) {
            this.stats(HIDE);
          }
        }, false);

        this.dom.game.addEventListener('dblclick', () => {
          if ((this.transition.activeTransitions || 0) > 0) return;
          if (this.state === STATE.Menu) this.game(SHOW);
        }, false);
      }

      this.controls.onMove = () => {
        if (this.newGame) {
          this.timer.start(true);
          this.newGame = false;
        }
      };

      this.dom.buttons.back && (this.dom.buttons.back.onclick = () => {
        if ((this.transition.activeTransitions || 0) > 0) return;

        if (this.state === STATE.Playing) this.game(false);
        else if (this.state === STATE.Prefs) this.prefs(false);
        else if (this.state === STATE.Theme) this.theme(false);
      });

      this.dom.buttons.reset && (this.dom.buttons.reset.onclick = () => {
        if (this.state === STATE.Theme) this.themeEditor.resetTheme();
      });

      this.dom.buttons.prefs && (this.dom.buttons.prefs.onclick = () => this.prefs(true));
      this.dom.buttons.theme && (this.dom.buttons.theme.onclick = () => this.theme(true));
      this.dom.buttons.stats && (this.dom.buttons.stats.onclick = () => this.stats(true));

      this.controls.onSolved = () => this.complete(true);
    }

    game(show) {
      if (show) {
        if (!this.saved) {
          this.scrambler.scramble();
          this.controls.scrambleCube();
          this.newGame = true;
        }

        const cfg = this.controls.flipConfig || 0;
        const perMove = (this.controls.flipSpeeds && this.controls.flipSpeeds[cfg] || 150) + 10;
        const duration = this.saved ? 0 : this.scrambler.converted.length * perMove;

        this.state = STATE.Playing;
        this.saved = true;

        this.transition.buttons(BUTTONS.None, BUTTONS.Menu);
        this.transition.zoom(STATE.Playing, duration);
        this.transition.title(false);

        setTimeout(() => {
          this.transition.timer(true);
          this.transition.buttons(BUTTONS.Playing, BUTTONS.None);
        }, this.transition.durations.zoom - 1000);

        setTimeout(() => {
          this.controls.enable();
          if (!this.newGame) this.timer.start(true);
        }, this.transition.durations.zoom);

      } else {
        this.state = STATE.Menu;

        this.transition.buttons(BUTTONS.Menu, BUTTONS.Playing);
        this.transition.zoom(STATE.Menu, 0);

        this.controls.disable();
        if (!this.newGame) this.timer.stop();
        this.transition.timer(false);

        setTimeout(() => this.transition.title(true), this.transition.durations.zoom - 1000);

        this.playing = false;
        this.controls.disable();
      }
    }

    prefs(show) {
      if (show) {
        if ((this.transition.activeTransitions || 0) > 0) return;

        this.state = STATE.Prefs;
        this.transition.buttons(BUTTONS.Prefs, BUTTONS.Menu);
        this.transition.title(false);
        this.transition.cube(false);

        setTimeout(() => this.transition.preferences(true), 1000);

      } else {
        this.cube.resize();

        this.state = STATE.Menu;
        this.transition.buttons(BUTTONS.Menu, BUTTONS.Prefs);
        this.transition.preferences(false);

        setTimeout(() => this.transition.cube(true), 500);
        setTimeout(() => this.transition.title(true), 1200);
      }
    }

    theme(show) {
      this.themeEditor.colorPicker(show);

      if (show) {
        if ((this.transition.activeTransitions || 0) > 0) return;

        // mostra pattern esempio per editing tema
        const preset = States && States['3'] && States['3']['checkerboard'];
        if (preset) this.cube.loadFromData(preset);

        this.themeEditor.setHSL(null, false);

        this.state = STATE.Theme;
        this.transition.buttons(BUTTONS.Theme, BUTTONS.Prefs);
        this.transition.preferences(false);

        setTimeout(() => this.transition.cube(true, true), 500);
        setTimeout(() => this.transition.theming(true), 1000);

      } else {
        this.state = STATE.Prefs;
        this.transition.buttons(BUTTONS.Prefs, BUTTONS.Theme);
        this.transition.cube(false, true);
        this.transition.theming(false);

        setTimeout(() => this.transition.preferences(true), 1000);
        setTimeout(() => {
          const gameCubeData = JSON.parse(localStorage.getItem('theCube_savedState'));
          if (!gameCubeData) {
            this.cube.resize(true);
            return;
          }
          this.cube.loadFromData(gameCubeData);
        }, 1500);
      }
    }

    stats(show) {
      if (show) {
        if ((this.transition.activeTransitions || 0) > 0) return;

        this.state = STATE.Stats;
        this.transition.buttons(BUTTONS.Stats, BUTTONS.Menu);
        this.transition.title(false);
        this.transition.cube(false);

        setTimeout(() => this.transition.stats(true), 1000);

      } else {
        this.state = STATE.Menu;

        this.transition.buttons(BUTTONS.Menu, BUTTONS.None);
        this.transition.stats(false);

        setTimeout(() => this.transition.cube(true), 500);
        setTimeout(() => this.transition.title(true), 1200);
      }
    }

    complete(show) {
      if (show) {
        this.transition.buttons(BUTTONS.Complete, BUTTONS.Playing);

        this.state = STATE.Complete;
        this.saved = false;

        this.controls.disable();
        this.timer.stop();
        this.storage.clearGame();

        this.bestTime = this.scores.addScore(this.timer.deltaTime);

        this.transition.zoom(STATE.Menu, 0);
        this.transition.elevate(true);

        setTimeout(() => {
          this.transition.complete(true, this.bestTime);
          this.confetti.start();
        }, 1000);

      } else {
        this.state = STATE.Stats;
        this.saved = false;

        this.transition.timer(false);
        this.transition.complete(false, this.bestTime);
        this.transition.cube(false);
        this.timer.reset();

        setTimeout(() => {
          this.cube.reset();
          this.confetti.stop();
          this.transition.stats(true);
          this.transition.elevate(0);
        }, 1000);

        return false;
      }
    }
  }

  window.Game = Game;       // esponi la classe (non strettamente necessario)
  window.game = new Game(); // avvia subito
})();
