// RoundedPlaneGeometry.js — versione classica (no modules), espone window.RoundedPlaneGeometry
/*
© 2025 Alessandro Pezzali. Tutti i diritti riservati.
Licenza d’Uso — Il Cubo di Rubik PWA
*/

(function () {
  'use strict';

  function RoundedPlaneGeometry(size, radius, depth) {
    const THREE_NS = window.THREE;
    if (!THREE_NS || !THREE_NS.Shape) {
      throw new Error('THREE non trovato. Carica three.js prima di RoundedPlaneGeometry.js');
    }

    const half = size / 2;
    const x = -half;
    const y = -half;
    const width = size;
    const height = size;

    // raggio in unità, clamp a metà lato
    let r = size * radius;
    r = Math.max(0, Math.min(r, Math.min(width, height) / 2));

    const shape = new THREE_NS.Shape();
    shape.moveTo(x, y + r);
    shape.lineTo(x, y + height - r);
    shape.quadraticCurveTo(x, y + height, x + r, y + height);
    shape.lineTo(x + width - r, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - r);
    shape.lineTo(x + width, y + r);
    shape.quadraticCurveTo(x + width, y, x + width - r, y);
    shape.lineTo(x + r, y);
    shape.quadraticCurveTo(x, y, x, y + r);

    const extrudeOpts = { depth: depth, bevelEnabled: false, curveSegments: 3 };

    // Compat: ExtrudeBufferGeometry (vecchie versioni) vs ExtrudeGeometry (recenti)
    let geometry;
    if (typeof THREE_NS.ExtrudeBufferGeometry === 'function') {
      geometry = new THREE_NS.ExtrudeBufferGeometry(shape, extrudeOpts);
    } else if (typeof THREE_NS.ExtrudeGeometry === 'function') {
      geometry = new THREE_NS.ExtrudeGeometry(shape, extrudeOpts);
    } else {
      throw new Error('Né ExtrudeBufferGeometry né ExtrudeGeometry disponibili in THREE.');
    }

    return geometry;
  }

  window.RoundedPlaneGeometry = RoundedPlaneGeometry;
})();
