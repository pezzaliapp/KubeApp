// KeyboardArrows.js — versione classica (no modules), espone window.KeyboardArrows
(function () {
  'use strict';

  const ARROW = [
    37, // left
    39, // right
    38, // up
    40, // down
  ];

  const CTRL = [
    81, // q
    87, // w
    69, // e
    65, // a
    83, // s
    68, // d
    90, // z
    88, // x
    67, // c
  ];

  class KeyboardArrows {
    constructor(game) {
      this.game = game;
      this.ctrl = false;

      this.keydown = this.keydown.bind(this);
      this.keyup   = this.keyup.bind(this);

      window.addEventListener('keydown', this.keydown, false);
      window.addEventListener('keyup',   this.keyup,   false);

      // Debug opzionale
      const dbg = document.querySelector('#dbg');
      if (dbg) {
        const animate = () => {
          dbg.textContent = this.ctrl ? this.ctrl : '';
          requestAnimationFrame(animate);
        };
        animate();
      }
    }

    keydown(e) {
      const { keyCode } = e;
      const { ctrl, game } = this;

      if (CTRL.includes(keyCode)) {
        this.ctrl = keyCode;
      }

      if (ARROW.includes(keyCode) && ctrl !== false) {
        let face = false, modifier = false;

        if (ctrl === 65) { // A → Left face
          face = 'L';
          if (keyCode === 38) modifier = "'"; // UP
          if (keyCode === 40) modifier = '';  // DOWN
        }

        if (ctrl === 68) { // D → Right face
          face = 'R';
          if (keyCode === 38) modifier = '';  // UP
          if (keyCode === 40) modifier = "'"; // DOWN
        }

        if (ctrl === 87) { // W → Up face
          face = 'U';
          if (keyCode === 37) modifier = '';  // LEFT
          if (keyCode === 39) modifier = "'"; // RIGHT
        }

        if (ctrl === 83) { // S → Down face
          face = 'D';
          if (keyCode === 37) modifier = "'"; // LEFT
          if (keyCode === 39) modifier = '';  // RIGHT
        }

        if (ctrl === 81) { // Q → Front face
          face = 'F';
          if (keyCode === 37) modifier = "'"; // LEFT
          if (keyCode === 39) modifier = '';  // RIGHT
        }

        if (ctrl === 69) { // E → Back face
          face = 'B';
          if (keyCode === 37) modifier = '';  // LEFT
          if (keyCode === 39) modifier = "'"; // RIGHT
        }

        if (face === false || modifier === false) return;

        const convertedMove = game.scrambler.convertMove(face + modifier);

        // NB: nel tuo Controls.js non esiste execute(), ma rotateLayer/keyboardMove
        // Se vuoi coerenza, probabilmente era game.controls.keyboardMove(...)
        if (typeof game.controls.execute === 'function') {
          game.controls.execute(convertedMove, () => {});
        } else if (typeof game.controls.keyboardMove === 'function') {
          game.controls.keyboardMove('LAYER', convertedMove, () => {});
        }
      }
    }

    keyup(e) {
      if (this.ctrl === e.keyCode) {
        this.ctrl = false;
      }
    }
  }

  window.KeyboardArrows = KeyboardArrows;
})();
