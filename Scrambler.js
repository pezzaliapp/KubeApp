// Scrambler.js — versione classica (no modules), espone window.Scrambler
/*
© 2025 Alessandro Pezzali. Tutti i diritti riservati.
Licenza d’Uso — Il Cubo di Rubik PWA
*/

(function () {
  'use strict';

  class Scrambler {
    constructor(game) {
      this.game = game;

      this.dificulty = 0;

      this.scrambleLength = {
        2: [ 7,  9, 11 ],
        3: [ 20, 25, 30 ],
        4: [ 30, 40, 50 ],
        5: [ 40, 60, 80 ],
      };

      this.moves = [];
      this.converted = [];  // fix: era "conveted"
      this.print = '';      // fix: era "pring"
      this.callback = () => {};
    }

    scramble(scramble) {
      let count = 0;

      // Se viene passato uno scramble testuale, usa quello
      if (typeof scramble !== 'undefined' && typeof scramble === 'string') {
        this.moves = scramble.trim().length ? scramble.trim().split(/\s+/) : [];
      } else {
        this.moves = [];
      }

      if (this.moves.length < 1) {
        // Genera uno scramble casuale
        const scrambleLength = this.scrambleLength[this.game.cube.size][this.dificulty];

        // per size >= 4 includi anche facce "doppie" minuscole
        const faces = (this.game.cube.size < 4) ? 'UDLRFB' : 'UuDdLlRrFfBb';
        const modifiers = ['', "'", '2'];

        // Se viene passato un numero, usalo come lunghezza
        const total = (typeof scramble === 'number') ? scramble : scrambleLength;

        while (count < total) {
          const move =
            faces[Math.floor(Math.random() * faces.length)] +
            modifiers[Math.floor(Math.random() * 3)];

          // Evita due mosse consecutive sulla stessa faccia
          if (count > 0 && move.charAt(0) === this.moves[count - 1].charAt(0)) continue;
          if (count > 1 && move.charAt(0) === this.moves[count - 2].charAt(0)) continue;

          this.moves.push(move);
          count++;
        }
      }

      this.callback = () => {};
      this.convert();
      this.print = this.moves.join(' ');

      return this;
    }

    convert() {
      this.converted = [];

      this.moves.forEach(move => {
        const convertedMove = this.convertMove(move);
        const modifier = move.charAt(1);

        this.converted.push(convertedMove);
        if (modifier === '2') this.converted.push(convertedMove); // ripeti per la doppia rotazione
      });
    }

    convertMove(move) {
      const face = move.charAt(0);
      const modifier = move.charAt(1);

      const upper = face.toUpperCase();
      const axis = { D:'y', U:'y', L:'x', R:'x', F:'z', B:'z' }[upper];
      let row =   { D:-1,  U: 1,  L:-1,  R: 1,  F: 1,  B:-1 }[upper];

      // su cube >3, se la faccia è maiuscola sposta la layer esterna *2 (regola originale)
      if (this.game.cube.size > 3 && face !== face.toLowerCase()) row = row * 2;

      const position = new THREE.Vector3();
      position[axis] = row;

      const angle = (Math.PI / 2) * -row * (modifier === "'" ? -1 : 1);

      return { position, axis, angle, name: move };
    }
  }

  window.Scrambler = Scrambler;
})();
