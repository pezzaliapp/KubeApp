// RoundedBoxGeometry.js — versione classica (no modules), espone window.RoundedBoxGeometry
/*
© 2025 Alessandro Pezzali. Tutti i diritti riservati.
Licenza d’Uso — Il Cubo di Rubik PWA
*/

(function () {
  'use strict';

  function RoundedBoxGeometry(size, radius, radiusSegments) {
    const THREE_NS = window.THREE;
    if (!THREE_NS || !THREE_NS.BufferGeometry) {
      throw new Error('THREE non trovato. Carica three.js prima di RoundedBoxGeometry.js');
    }

    THREE_NS.BufferGeometry.call(this);
    this.type = 'RoundedBoxGeometry';

    radiusSegments = !isNaN(radiusSegments) ? Math.max(1, Math.floor(radiusSegments)) : 1;

    let width, height, depth;
    width = height = depth = size;

    // radius come frazione della size (es. 0.12)
    radius = size * radius;
    radius = Math.min(radius, Math.min(width, Math.min(height, depth)) / 2);

    const edgeHalfWidth  = width  / 2 - radius;
    const edgeHalfHeight = height / 2 - radius;
    const edgeHalfDepth  = depth  / 2 - radius;

    this.parameters = {
      width, height, depth,
      radius,
      radiusSegments
    };

    const rs1 = radiusSegments + 1;
    const totalVertexCount = (rs1 * radiusSegments + 1) << 3;

    const positions = new THREE_NS.BufferAttribute(new Float32Array(totalVertexCount * 3), 3);
    const normals   = new THREE_NS.BufferAttribute(new Float32Array(totalVertexCount * 3), 3);

    const cornerVerts   = [];
    const cornerNormals = [];
    const normal   = new THREE_NS.Vector3();
    const vertex   = new THREE_NS.Vector3();
    const vertexPool = [];
    const normalPool = [];
    const indices = [];

    const lastVertex = rs1 * radiusSegments;
    const cornerVertNumber = rs1 * radiusSegments + 1;

    doVertices();
    doFaces();
    doCorners();
    doHeightEdges();
    doWidthEdges();
    doDepthEdges();

    function doVertices() {
      const cornerLayout = [
        new THREE_NS.Vector3( 1,  1,  1),
        new THREE_NS.Vector3( 1,  1, -1),
        new THREE_NS.Vector3(-1,  1, -1),
        new THREE_NS.Vector3(-1,  1,  1),
        new THREE_NS.Vector3( 1, -1,  1),
        new THREE_NS.Vector3( 1, -1, -1),
        new THREE_NS.Vector3(-1, -1, -1),
        new THREE_NS.Vector3(-1, -1,  1),
      ];

      for (let j = 0; j < 8; j++) {
        cornerVerts.push([]);
        cornerNormals.push([]);
      }

      const PIhalf = Math.PI / 2;
      const cornerOffset = new THREE_NS.Vector3(edgeHalfWidth, edgeHalfHeight, edgeHalfDepth);

      for (let y = 0; y <= radiusSegments; y++) {
        const v = y / radiusSegments;
        const va = v * PIhalf;
        const cosVa = Math.cos(va);
        const sinVa = Math.sin(va);

        if (y === radiusSegments) {
          vertex.set(0, 1, 0);
          const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
          cornerVerts[0].push(vert);
          vertexPool.push(vert);
          const norm = vertex.clone();
          cornerNormals[0].push(norm);
          normalPool.push(norm);
          continue;
        }

        for (let x = 0; x <= radiusSegments; x++) {
          const u  = x / radiusSegments;
          const ha = u * PIhalf;
          vertex.x = cosVa * Math.cos(ha);
          vertex.y = sinVa;
          vertex.z = cosVa * Math.sin(ha);

          const vert = vertex.clone().multiplyScalar(radius).add(cornerOffset);
          cornerVerts[0].push(vert);
          vertexPool.push(vert);

          const norm = vertex.clone().normalize();
          cornerNormals[0].push(norm);
          normalPool.push(norm);
        }
      }

      for (let i = 1; i < 8; i++) {
        for (let j = 0; j < cornerVerts[0].length; j++) {
          const vert = cornerVerts[0][j].clone().multiply(cornerLayout[i]);
          cornerVerts[i].push(vert);
          vertexPool.push(vert);

          const norm = cornerNormals[0][j].clone().multiply(cornerLayout[i]);
          cornerNormals[i].push(norm);
          normalPool.push(norm);
        }
      }
    }

    function doCorners() {
      const flips = [ true, false, true, false, false, true, false, true ];
      const lastRowOffset = rs1 * (radiusSegments - 1);

      for (let i = 0; i < 8; i++) {
        const cornerOffset = cornerVertNumber * i;

        for (let v = 0; v < radiusSegments - 1; v++) {
          const r1 = v * rs1;
          const r2 = (v + 1) * rs1;

          for (let u = 0; u < radiusSegments; u++) {
            const u1 = u + 1;
            const a = cornerOffset + r1 + u;
            const b = cornerOffset + r1 + u1;
            const c = cornerOffset + r2 + u;
            const d = cornerOffset + r2 + u1;

            if (!flips[i]) {
              indices.push(a, b, c, b, d, c);
            } else {
              indices.push(a, c, b, b, c, d);
            }
          }
        }

        for (let u = 0; u < radiusSegments; u++) {
          const a = cornerOffset + lastRowOffset + u;
          const b = cornerOffset + lastRowOffset + u + 1;
          const c = cornerOffset + lastVertex;

          if (!flips[i]) {
            indices.push(a, b, c);
          } else {
            indices.push(a, c, b);
          }
        }
      }
    }

    function doFaces() {
      let a = lastVertex;
      let b = lastVertex + cornerVertNumber;
      let c = lastVertex + cornerVertNumber * 2;
      let d = lastVertex + cornerVertNumber * 3;
      indices.push(a, b, c, a, c, d);

      a = lastVertex + cornerVertNumber * 4;
      b = lastVertex + cornerVertNumber * 5;
      c = lastVertex + cornerVertNumber * 6;
      d = lastVertex + cornerVertNumber * 7;
      indices.push(a, c, b, a, d, c);

      a = 0;
      b = cornerVertNumber;
      c = cornerVertNumber * 4;
      d = cornerVertNumber * 5;
      indices.push(a, c, b, b, c, d);

      a = cornerVertNumber * 2;
      b = cornerVertNumber * 3;
      c = cornerVertNumber * 6;
      d = cornerVertNumber * 7;
      indices.push(a, c, b, b, c, d);

      a = radiusSegments;
      b = radiusSegments + cornerVertNumber * 3;
      c = radiusSegments + cornerVertNumber * 4;
      d = radiusSegments + cornerVertNumber * 7;
      indices.push(a, b, c, b, d, c);

      a = radiusSegments + cornerVertNumber;
      b = radiusSegments + cornerVertNumber * 2;
      c = radiusSegments + cornerVertNumber * 5;
      d = radiusSegments + cornerVertNumber * 6;
      indices.push(a, c, b, b, c, d);
    }

    function doHeightEdges() {
      for (let i = 0; i < 4; i++) {
        const cOffset = i * cornerVertNumber;
        const cRowOffset = 4 * cornerVertNumber + cOffset;
        const needsFlip = ((i & 1) === 1); // FIX: parentesi, altrimenti precedenza sbagliata

        for (let u = 0; u < radiusSegments; u++) {
          const u1 = u + 1;
          const a = cOffset + u;
          const b = cOffset + u1;
          const c = cRowOffset + u;
          const d = cRowOffset + u1;

          if (!needsFlip) {
            indices.push(a, b, c, b, d, c);
          } else {
            indices.push(a, c, b, b, c, d);
          }
        }
      }
    }

    function doDepthEdges() {
      const cStarts = [0, 2, 4, 6];
      const cEnds   = [1, 3, 5, 7];

      for (let i = 0; i < 4; i++) {
        const cStart = cornerVertNumber * cStarts[i];
        const cEnd   = cornerVertNumber * cEnds[i];

        const needsFlip = (1 >= i); // true per i=0,1

        for (let u = 0; u < radiusSegments; u++) {
          const urs1  = u * rs1;
          const u1rs1 = (u + 1) * rs1;

          const a = cStart + urs1;
          const b = cStart + u1rs1;
          const c = cEnd   + urs1;
          const d = cEnd   + u1rs1;

          if (needsFlip) {
            indices.push(a, c, b, b, c, d);
          } else {
            indices.push(a, b, c, b, d, c);
          }
        }
      }
    }

    function doWidthEdges() {
      const end = radiusSegments - 1;

      const cStarts = [0, 1, 4, 5];
      const cEnds   = [3, 2, 7, 6];
      const needsFlip = [0, 1, 1, 0];

      for (let i = 0; i < 4; i++) {
        const cStart = cStarts[i] * cornerVertNumber;
        const cEnd   = cEnds[i]   * cornerVertNumber;

        for (let u = 0; u <= end; u++) {
          const a = cStart + radiusSegments + u * rs1;
          const b = cStart + (u !== end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1);

          const c = cEnd + radiusSegments + u * rs1;
          const d = cEnd + (u !== end ? radiusSegments + (u + 1) * rs1 : cornerVertNumber - 1);

          if (!needsFlip[i]) {
            indices.push(a, b, c, b, d, c);
          } else {
            indices.push(a, c, b, b, c, d);
          }
        }
      }
    }

    // Scrivi attributi
    let index = 0;
    for (let i = 0; i < vertexPool.length; i++) {
      positions.setXYZ(index, vertexPool[i].x, vertexPool[i].y, vertexPool[i].z);
      normals.setXYZ(index, normalPool[i].x, normalPool[i].y, normalPool[i].z);
      index++;
    }

    // setIndex: usa Uint16Array se possibile, altrimenti Uint32Array
    const maxIndex = Math.max.apply(null, indices);
    const IndexArray = (maxIndex > 65535) ? Uint32Array : Uint16Array;

    this.setIndex(new THREE_NS.BufferAttribute(new IndexArray(indices), 1));

    // Compat con versioni nuove/vecchie di Three
    if (typeof this.setAttribute === 'function') {
      this.setAttribute('position', positions);
      this.setAttribute('normal', normals);
    } else {
      // deprecated nelle versioni più recenti, ma ok su three vecchio
      this.addAttribute('position', positions);
      this.addAttribute('normal', normals);
    }
  }

  RoundedBoxGeometry.prototype = Object.create(window.THREE.BufferGeometry.prototype);
  RoundedBoxGeometry.prototype.constructor = RoundedBoxGeometry;

  window.RoundedBoxGeometry = RoundedBoxGeometry;
})();
