// Range.js — versione classica (no modules), usa window.Draggable ed espone window.Range
/*
© 2025 Alessandro Pezzali. Tutti i diritti riservati.
Licenza d’Uso — Il Cubo di Rubik PWA
*/

(function () {
  'use strict';

  const RangeHTML = [
    '<div class="range">',
      '<div class="range__label"></div>',
      '<div class="range__track">',
        '<div class="range__track-line"></div>',
        '<div class="range__handle"><div></div></div>',
      '</div>',
      '<div class="range__list"></div>',
    '</div>',
  ].join('\n');

  function upgradeRangeTags() {
    document.querySelectorAll('range').forEach(el => {
      const temp = document.createElement('div');
      temp.innerHTML = RangeHTML;

      const range = temp.querySelector('.range');
      const rangeLabel = range.querySelector('.range__label');
      const rangeList = range.querySelector('.range__list');

      // attributi base
      const name = el.getAttribute('name') || '';
      const title = el.getAttribute('title') || '';
      range.setAttribute('name', name);
      rangeLabel.innerHTML = title;

      // modalità color
      if (el.hasAttribute('color')) {
        range.classList.add('range--type-color');
        range.classList.add('range--color-' + name);
      }

      // lista (etichette)
      if (el.hasAttribute('list')) {
        el.getAttribute('list').split(',').forEach(listItemText => {
          const li = document.createElement('div');
          li.innerHTML = listItemText;
          rangeList.appendChild(li);
        });
      }

      // sostituisci il tag custom con il markup reale
      if (el.parentNode) el.parentNode.replaceChild(range, el);
    });
  }

  // Esegui conversione quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', upgradeRangeTags);
  } else {
    upgradeRangeTags();
  }

  class Range {
    constructor(name, options) {
      options = Object.assign({
        range: [0, 1],
        value: 0,
        step: 0,
        onUpdate: () => {},
        onComplete: () => {},
      }, options || {});

      this.element = document.querySelector('.range[name="' + name + '"]');
      if (!this.element) {
        console.warn('[Range] elemento non trovato per name=', name);
        return;
      }

      this.track  = this.element.querySelector('.range__track');
      this.handle = this.element.querySelector('.range__handle');
      this.list   = [].slice.call(this.element.querySelectorAll('.range__list div'));

      this.value = options.value;
      this.min   = options.range[0];
      this.max   = options.range[1];
      this.step  = options.step;

      this.onUpdate   = options.onUpdate;
      this.onComplete = options.onComplete;

      this.setValue(this.value);
      this.initDraggable();
    }

    setValue(value) {
      this.value = this.round(this.limitValue(value));
      this.setHandlePosition();
    }

    initDraggable() {
      let current;

      // richiede Draggable già caricato
      if (!window.Draggable) {
        console.error('[Range] Draggable non trovato. Carica Draggable.js prima di Range.js');
        return;
      }

      this.draggable = new window.Draggable(this.handle, { calcDelta: true });

      this.draggable.onDragStart = () => {
        current = this.positionFromValue(this.value);
        this.handle.style.left = current + 'px';
      };

      this.draggable.onDragMove = (position) => {
        current = this.limitPosition(current + position.delta.x);
        this.value = this.round(this.valueFromPosition(current));
        this.setHandlePosition();
        this.onUpdate(this.value);
      };

      this.draggable.onDragEnd = () => {
        this.onComplete(this.value);
      };
    }

    round(value) {
      if (this.step < 1) return value;
      return Math.round((value - this.min) / this.step) * this.step + this.min;
    }

    limitValue(value) {
      const max = Math.max(this.max, this.min);
      const min = Math.min(this.max, this.min);
      return Math.min(Math.max(value, min), max);
    }

    limitPosition(position) {
      const maxPx = this.track ? this.track.offsetWidth : 0;
      return Math.min(Math.max(position, 0), maxPx);
    }

    percentsFromValue(value) {
      const span = (this.max - this.min) || 1;
      return (value - this.min) / span;
    }

    valueFromPosition(position) {
      const width = (this.track && this.track.offsetWidth) || 1;
      return this.min + (this.max - this.min) * (position / width);
    }

    positionFromValue(value) {
      const width = (this.track && this.track.offsetWidth) || 0;
      return this.percentsFromValue(value) * width;
    }

    setHandlePosition() {
      this.handle.style.left = (this.percentsFromValue(this.value) * 100) + '%';
    }
  }

  window.Range = Range;
})();
