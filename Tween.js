// Tween.js — versione classica (no modules), dipende da window.Animation e window.Easing
(function () {
  'use strict';

  class Tween extends window.Animation {
    constructor(options) {
      super(false);

      options = options || {};

      this.duration   = options.duration || 500;
      this.easing     = options.easing || (t => t);
      this.onUpdate   = options.onUpdate || (() => {});
      this.onComplete = options.onComplete || (() => {});

      this.delay = options.delay || false;
      // Se yoyo è truthy, abilita ping-pong: parte avanti (yoyo=false), poi inverte
      this.yoyo = options.yoyo ? false : null;

      this.progress = 0;
      this.value    = 0;
      this.delta    = 0;

      this.getFromTo(options);

      if (this.delay) setTimeout(() => super.start(), this.delay);
      else super.start();

      // primo aggiornamento "a freddo" per applicare gli stati iniziali
      this.onUpdate(this);
    }

    update(delta) {
      const old = this.value * 1;
      const direction = (this.yoyo === true) ? -1 : 1;

      this.progress += (delta / this.duration) * direction;

      this.value = this.easing(this.progress);
      this.delta = this.value - old;

      if (this.values !== null) this.updateFromTo();

      if (this.yoyo !== null) {
        this.updateYoyo();
      } else if (this.progress <= 1) {
        this.onUpdate(this);
      } else {
        this.progress = 1;
        this.value = 1;
        this.onUpdate(this);
        this.onComplete(this);
        super.stop();
      }
    }

    updateYoyo() {
      if (this.progress > 1 || this.progress < 0) {
        this.value = this.progress = (this.progress > 1) ? 1 : 0;
        this.yoyo = !this.yoyo; // inverti direzione
      }
      this.onUpdate(this);
    }

    updateFromTo() {
      this.values.forEach(key => {
        this.target[key] = this.from[key] + (this.to[key] - this.from[key]) * this.value;
      });
    }

    getFromTo(options) {
      if (!options.target || !options.to) {
        this.values = null;
        return;
      }

      this.target = options.target || null;
      this.from   = options.from || {};
      this.to     = options.to   || null;
      this.values = [];

      if (Object.keys(this.from).length < 1) {
        Object.keys(this.to).forEach(key => { this.from[key] = this.target[key]; });
      }
      Object.keys(this.to).forEach(key => { this.values.push(key); });
    }
  }

  window.Tween = Tween;
  // window.Easing è definito nel file Easing.js separato
})();
