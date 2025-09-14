// Timer.js — versione classica (no import/export)
// Dipende da Animation.js (che deve definire window.Animation)

(function () {
  'use strict';

  class Timer extends window.Animation {
    constructor(game) {
      super(false);

      this.game = game;
      this.reset();
    }

    start(continueGame) {
      this.startTime = continueGame ? (Date.now() - this.deltaTime) : Date.now();
      this.deltaTime = 0;
      this.converted = this.convert();

      super.start();
    }

    reset() {
      this.startTime = 0;
      this.currentTime = 0;
      this.deltaTime = 0;
      this.converted = '0:00';
    }

    stop() {
      this.currentTime = Date.now();
      this.deltaTime = this.currentTime - this.startTime;
      this.convert();

      super.stop();

      return { time: this.converted, millis: this.deltaTime };
    }

    update() {
      const old = this.converted;

      this.currentTime = Date.now();
      this.deltaTime = this.currentTime - this.startTime;
      this.convert();

      if (this.converted !== old) {
        localStorage.setItem('theCube_time', this.deltaTime);
        this.setText();
      }
    }

    convert() {
      const seconds = parseInt((this.deltaTime / 1000) % 60);
      const minutes = parseInt(this.deltaTime / (1000 * 60));

      this.converted = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
      return this.converted;
    }

    setText() {
      this.game.dom.texts.timer.innerHTML = this.converted;
    }
  }

  window.Timer = Timer;
})();
