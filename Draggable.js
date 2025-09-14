// Draggable.js (ES module) — versione pulita e robusta
class Draggable {
  constructor(element, options) {
    this.position = {
      current: new THREE.Vector2(),
      start: new THREE.Vector2(),
      delta: new THREE.Vector2(),
      old: new THREE.Vector2(),
      drag: new THREE.Vector2(),
    };

    this.options = Object.assign({ calcDelta: false }, options || {});

    this.element = element;
    this.touch = null;

    // Migliore controllo dello scroll/gesture solo nell’area di gioco
    // (evita il preventDefault globale)
    if (this.element && this.element.style) {
      this.element.style.touchAction = 'none';   // evita scroll durante il drag
      this.element.style.userSelect  = 'none';   // evita selezione testo
      this.element.style.webkitUserSelect = 'none';
    }

    this.drag = {
      start: (event) => {
        if (event.type === 'mousedown' && event.which !== 1) return;
        if (event.type === 'touchstart' && event.touches.length > 1) return;

        this.getPositionCurrent(event);

        if (this.options.calcDelta) {
          this.position.start.copy(this.position.current);
          this.position.delta.set(0, 0);
          this.position.drag.set(0, 0);
        }

        this.touch = (event.type === 'touchstart');

        this.onDragStart(this.position);

        // listener sul window per seguire il drag anche fuori dal canvas
        const moveEvt = this.touch ? 'touchmove' : 'mousemove';
        const endEvt  = this.touch ? 'touchend'  : 'mouseup';

        window.addEventListener(moveEvt, this.drag.move, { passive: false });
        window.addEventListener(endEvt,  this.drag.end,  { passive: true  });
        if (this.touch) {
          window.addEventListener('touchcancel', this.drag.end, { passive: true });
        }
      },

      move: (event) => {
        if (this.options.calcDelta) {
          this.position.old.copy(this.position.current);
        }

        this.getPositionCurrent(event);

        if (this.options.calcDelta) {
          this.position.delta.copy(this.position.current).sub(this.position.old);
          this.position.drag.copy(this.position.current).sub(this.position.start);
        }

        this.onDragMove(this.position);
      },

      end: (event) => {
        this.getPositionCurrent(event);
        this.onDragEnd(this.position);

        const moveEvt = this.touch ? 'touchmove' : 'mousemove';
        const endEvt  = this.touch ? 'touchend'  : 'mouseup';

        window.removeEventListener(moveEvt, this.drag.move, false);
        window.removeEventListener(endEvt,  this.drag.end,  false);
        if (this.touch) {
          window.removeEventListener('touchcancel', this.drag.end, false);
        }
      },
    };

    this.onDragStart = () => {};
    this.onDragMove  = () => {};
    this.onDragEnd   = () => {};

    this.enable();
    return this;
  }

  enable() {
    // start su element; move/end su window
    this.element.addEventListener('touchstart', this.drag.start, { passive: true });
    this.element.addEventListener('mousedown',  this.drag.start, false);
    return this;
  }

  disable() {
    this.element.removeEventListener('touchstart', this.drag.start, false);
    this.element.removeEventListener('mousedown',  this.drag.start, false);
    return this;
  }

  getPositionCurrent(event) {
    const e = event.touches
      ? (event.touches[0] || event.changedTouches && event.changedTouches[0] || event)
      : event;

    // Coordinate relative all’elemento target
    const rect = this.element.getBoundingClientRect();
    const x = (e.clientX != null ? e.clientX : e.pageX) - rect.left;
    const y = (e.clientY != null ? e.clientY : e.pageY) - rect.top;

    this.position.current.set(x, y);
  }

  // Converte coordinate pixel-relative all’elemento in NDC per Raycaster
  convertPosition(position) {
    position.x = (position.x / this.element.clientWidth) * 2 - 1;
    position.y = -((position.y / this.element.clientHeight) * 2 - 1);
    return position;
  }
}

export { Draggable };
