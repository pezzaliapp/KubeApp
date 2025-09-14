// Draggable.js — versione classica (no modules), espone window.Draggable
(function () {
  const THREE_NS = window.THREE;

  function isLeftMouse(event) {
    // button: 0 = left; which: 1 = left (fallback)
    if (typeof event.button === 'number') return event.button === 0;
    if (typeof event.which === 'number') return event.which === 1;
    return true;
  }

  class Draggable {
    constructor(element, options) {
      this.position = {
        current: new THREE_NS.Vector2(),
        start:   new THREE_NS.Vector2(),
        delta:   new THREE_NS.Vector2(),
        old:     new THREE_NS.Vector2(),
        drag:    new THREE_NS.Vector2(),
      };

      this.options = Object.assign({ calcDelta: false }, options || {});
      this.element = element;
      this.touch = null;

      // Evita scroll/zoom e selezione SOLO nell'area di gioco
      if (this.element && this.element.style) {
        this.element.style.touchAction = 'none';
        this.element.style.userSelect = 'none';
        this.element.style.webkitUserSelect = 'none';
      }

      // Bind per removeEventListener
      this._onStart = this._onStart.bind(this);
      this._onMove  = this._onMove.bind(this);
      this._onEnd   = this._onEnd.bind(this);
      this._onCancel= this._onEnd.bind(this);

      this.onDragStart = () => {};
      this.onDragMove  = () => {};
      this.onDragEnd   = () => {};

      this.enable();
      return this;
    }

    enable() {
      if (!this.element) return this;
      // start su element; move/end su window
      this.element.addEventListener('touchstart', this._onStart, { passive: true });
      this.element.addEventListener('mousedown',  this._onStart, false);
      return this;
    }

    disable() {
      if (!this.element) return this;
      this.element.removeEventListener('touchstart', this._onStart, { passive: true });
      this.element.removeEventListener('mousedown',  this._onStart, false);
      // cleanup eventuali listener residui
      window.removeEventListener('touchmove', this._onMove, { passive: false });
      window.removeEventListener('touchend',  this._onEnd,  { passive: true  });
      window.removeEventListener('touchcancel', this._onCancel, { passive: true });
      window.removeEventListener('mousemove', this._onMove, false);
      window.removeEventListener('mouseup',   this._onEnd,  false);
      return this;
    }

    _onStart(event) {
      if (event.type === 'mousedown' && !isLeftMouse(event)) return;
      if (event.type === 'touchstart' && event.touches.length > 1) return;

      this.getPositionCurrent(event);

      if (this.options.calcDelta) {
        this.position.start.copy(this.position.current);
        this.position.delta.set(0, 0);
        this.position.drag.set(0, 0);
      }

      this.touch = (event.type === 'touchstart');
      this.onDragStart(this.position);

      const moveEvt = this.touch ? 'touchmove' : 'mousemove';
      const endEvt  = this.touch ? 'touchend'  : 'mouseup';

      window.addEventListener(moveEvt, this._onMove, { passive: false });
      window.addEventListener(endEvt,  this._onEnd,  this.touch ? { passive: true } : false);
      if (this.touch) {
        window.addEventListener('touchcancel', this._onCancel, { passive: true });
      }
    }

    _onMove(event) {
      if (this.options.calcDelta) {
        this.position.old.copy(this.position.current);
      }

      this.getPositionCurrent(event);

      if (this.options.calcDelta) {
        this.position.delta.copy(this.position.current).sub(this.position.old);
        this.position.drag.copy(this.position.current).sub(this.position.start);
      }

      this.onDragMove(this.position);

      // Evita scroll durante il drag su touch
      if (event.cancelable) event.preventDefault();
    }

    _onEnd(event) {
      this.getPositionCurrent(event);
      this.onDragEnd(this.position);

      const moveEvt = this.touch ? 'touchmove' : 'mousemove';
      const endEvt  = this.touch ? 'touchend'  : 'mouseup';

      window.removeEventListener(moveEvt, this._onMove, { passive: false });
      window.removeEventListener(endEvt,  this._onEnd,  this.touch ? { passive: true } : false);
      if (this.touch) {
        window.removeEventListener('touchcancel', this._onCancel, { passive: true });
      }
    }

    getPositionCurrent(event) {
      const e = event.touches
        ? (event.touches[0] || (event.changedTouches && event.changedTouches[0]) || event)
        : event;

      const rect = this.element.getBoundingClientRect();
      const cx = (e.clientX != null ? e.clientX : e.pageX);
      const cy = (e.clientY != null ? e.clientY : e.pageY);

      const x = cx - rect.left;
      const y = cy - rect.top;

      this.position.current.set(x, y);
    }

    // Converte coordinate pixel-relative all’elemento in NDC per Raycaster
    convertPosition(position) {
      position.x = (position.x / this.element.clientWidth) * 2 - 1;
      position.y = -((position.y / this.element.clientHeight) * 2 - 1);
      return position;
    }
  }

  window.Draggable = Draggable;
})();
