// Controls.js (ES module)
import { Tween, Easing } from './Tween.js';
import { Draggable } from './Draggable.js';

const STILL = 0;
const PREPARING = 1;
const ROTATING = 2;
const ANIMATING = 3;

class Controls {
  constructor(game) {
    this.game = game;

    this.flipConfig = 0;
    this.flipEasings = [ Easing.Power.Out(3), Easing.Sine.Out(), Easing.Back.Out(1.5) ];
    this.flipSpeeds  = [ 125, 200, 300 ];

    this.raycaster = new THREE.Raycaster();

    const helperMaterial = new THREE.MeshBasicMaterial({ depthWrite:false, transparent:true, opacity:0, color:0x0033ff });

    this.group = new THREE.Object3D();
    this.group.name = 'controls';
    this.game.cube.object.add(this.group);

    // Geometrie aggiornate (non-Buffer)
    this.helper = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      helperMaterial.clone()
    );
    this.helper.rotation.set(0, Math.PI / 4, 0);
    this.game.world.scene.add(this.helper);

    this.edges = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      helperMaterial.clone()
    );
    this.game.world.scene.add(this.edges);

    this.onSolved = () => {};
    this.onMove   = () => {};

    this.momentum = [];
    this.scramble = null;
    this.state = STILL;
    this.enabled = false;

    this.initDraggable();
  }

  enable() { this.draggable.enable(); this.enabled = true; }
  disable() { this.draggable.disable(); this.enabled = false; }

  initDraggable() {
    this.draggable = new Draggable(this.game.dom.game);

    this.draggable.onDragStart = position => {
      if (this.scramble !== null) return;
      if (this.state === PREPARING || this.state === ROTATING) return;

      this.gettingDrag = this.state === ANIMATING;

      const edgeIntersect = this.getIntersect(position.current, this.edges, /*multiple=*/false);
      if (edgeIntersect !== false) {
        this.dragIntersect = this.getIntersect(position.current, this.game.cube.cubes, /*multiple=*/true);
      }

      if (edgeIntersect !== false && this.dragIntersect !== false) {
        this.dragNormal = edgeIntersect.face.normal.clone().round();
        this.flipType = 'layer';

        this.attach(this.helper, this.edges);
        this.helper.rotation.set(0, 0, 0);
        this.helper.position.set(0, 0, 0);
        this.helper.lookAt(this.dragNormal);
        this.helper.translateZ(0.5);
        this.helper.updateMatrixWorld();
        this.detach(this.helper, this.edges);

      } else {
        this.dragNormal = new THREE.Vector3(0, 0, 1);
        this.flipType = 'cube';
        this.helper.position.set(0, 0, 0);
        this.helper.rotation.set(0, Math.PI / 4, 0);
        this.helper.updateMatrixWorld();
      }

      let planeIntersect = this.getIntersect(position.current, this.helper, false);
      if (planeIntersect === false) return;

      this.dragCurrent = this.helper.worldToLocal(planeIntersect.point);
      this.dragTotal = new THREE.Vector3();
      this.state = (this.state === STILL) ? PREPARING : this.state;
    };

    this.draggable.onDragMove = position => {
      if (this.scramble !== null) return;
      if (this.state === STILL || (this.state === ANIMATING && this.gettingDrag === false)) return;

      const planeIntersect = this.getIntersect(position.current, this.helper, false);
      if (planeIntersect === false) return;

      const point = this.helper.worldToLocal(planeIntersect.point.clone());
      this.dragDelta = point.clone().sub(this.dragCurrent).setZ(0);
      this.dragTotal.add(this.dragDelta);
      this.dragCurrent = point;
      this.addMomentumPoint(this.dragDelta);

      if (this.state === PREPARING && this.dragTotal.length() > 0.05) {
        this.dragDirection = this.getMainAxis(this.dragTotal);

        if (this.flipType === 'layer') {
          const direction = new THREE.Vector3();
          direction[this.dragDirection] = 1;

          const worldDirection  = this.helper.localToWorld(direction).sub(this.helper.position);
          const objectDirection = this.edges.worldToLocal(worldDirection).round();

          this.flipAxis = objectDirection.cross(this.dragNormal).negate();
          this.selectLayer(this.getLayer(false));

        } else {
          const axis = (this.dragDirection != 'x')
            ? ((this.dragDirection == 'y' && position.current.x > this.game.world.width / 2) ? 'z' : 'x')
            : 'y';

          this.flipAxis = new THREE.Vector3();
          this.flipAxis[axis] = (axis === 'x') ? -1 : 1;
        }

        this.flipAngle = 0;
        this.state = ROTATING;

      } else if (this.state === ROTATING) {
        const rotation = this.dragDelta[this.dragDirection];

        if (this.flipType === 'layer') {
          this.group.rotateOnAxis(this.flipAxis, rotation);
          this.flipAngle += rotation;
        } else {
          this.edges.rotateOnWorldAxis(this.flipAxis, rotation);
          this.game.cube.object.rotation.copy(this.edges.rotation);
          this.flipAngle += rotation;
        }
      }
    };

    this.draggable.onDragEnd = position => {
      if (this.scramble !== null) return;
      if (this.state !== ROTATING) {
        this.gettingDrag = false;
        this.state = STILL;
        return;
      }

      this.state = ANIMATING;

      const momentum = this.getMomentum()[this.dragDirection];
      const flip = (Math.abs(momentum) > 0.05 && Math.abs(this.flipAngle) < Math.PI / 2);

      const angle = flip
        ? this.roundAngle(this.flipAngle + Math.sign(this.flipAngle) * (Math.PI / 4))
        : this.roundAngle(this.flipAngle);

      const delta = angle - this.flipAngle;

      if (this.flipType === 'layer') {
        this.rotateLayer(delta, false, layer => {
          this.game.storage.saveGame();
          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;
          this.checkIsSolved();
        });
      } else {
        this.rotateCube(delta, () => {
          this.state = this.gettingDrag ? PREPARING : STILL;
          this.gettingDrag = false;
        });
      }
    };
  }

  rotateLayer(rotation, scramble, callback) {
    const config = scramble ? 0 : this.flipConfig;
    const easing = this.flipEasings[config];
    const duration = this.flipSpeeds[config];
    const bounce = (config == 2) ? this.bounceCube() : (() => {});

    this.rotationTween = new Tween({
      easing,
      duration,
      onUpdate: tween => {
        const deltaAngle = tween.delta * rotation;
        this.group.rotateOnAxis(this.flipAxis, deltaAngle);
        bounce(tween.value, deltaAngle, rotation);
      },
      onComplete: () => {
        if (!scramble) this.onMove();

        const layer = this.flipLayer.slice(0);
        this.game.cube.object.rotation.setFromVector3(this.snapRotation(this.game.cube.object.rotation.toVector3()));
        this.group.rotation.setFromVector3(this.snapRotation(this.group.rotation.toVector3()));
        this.deselectLayer(this.flipLayer);
        callback(layer);
      },
    });
  }

  bounceCube() {
    let fixDelta = true;
    return (progress, delta, rotation) => {
      if (progress >= 1) {
        if (fixDelta) {
          delta = (progress - 1) * rotation;
          fixDelta = false;
        }
        this.game.cube.object.rotateOnAxis(this.flipAxis, delta);
      }
    };
  }

  rotateCube(rotation, callback) {
    const config = this.flipConfig;
    const easing = [ Easing.Power.Out(4), Easing.Sine.Out(), Easing.Back.Out(2) ][config];
    const duration = [ 100, 150, 350 ][config];

    this.rotationTween = new Tween({
      easing,
      duration,
      onUpdate: tween => {
        this.edges.rotateOnWorldAxis(this.flipAxis, tween.delta * rotation);
        this.game.cube.object.rotation.copy(this.edges.rotation);
      },
      onComplete: () => {
        this.edges.rotation.setFromVector3(this.snapRotation(this.edges.rotation.toVector3()));
        this.game.cube.object.rotation.copy(this.edges.rotation);
        callback();
      },
    });
  }

  selectLayer(layer) {
    this.group.rotation.set(0, 0, 0);
    this.movePieces(layer, this.game.cube.object, this.group);
    this.flipLayer = layer;
  }

  deselectLayer(layer) {
    this.movePieces(layer, this.group, this.game.cube.object);
    this.flipLayer = null;
  }

  movePieces(layer, from, to) {
    from.updateMatrixWorld();
    to.updateMatrixWorld();

    const invTo = new THREE.Matrix4().copy(to.matrixWorld).invert();

    layer.forEach(index => {
      const piece = this.game.cube.pieces[index];
      piece.applyMatrix4(from.matrixWorld);
      from.remove(piece);
      piece.applyMatrix4(invTo);
      to.add(piece);
    });
  }

  getLayer(position) {
    const scalar = { 2: 6, 3: 3, 4: 4, 5: 3 }[this.game.cube.size];
    const layer = [];
    let axis;

    if (position === false) {
      const piece = this.dragIntersect.object.parent;
      axis = this.getMainAxis(this.flipAxis);
      position = piece.position.clone().multiplyScalar(scalar).round();
    } else {
      axis = this.getMainAxis(position);
    }

    this.game.cube.pieces.forEach(piece => {
      const p = piece.position.clone().multiplyScalar(scalar).round();
      if (p[axis] == position[axis]) layer.push(piece.name);
    });

    return layer;
  }

  keyboardMove(type, move) {
    if (this.state !== STILL) return;
    if (this.enabled !== true) return;

    if (type === 'LAYER') {
      const layer = this.getLayer(move.position);
      this.flipAxis = new THREE.Vector3();
      this.flipAxis[move.axis] = 1;
      this.state = ROTATING;

      this.selectLayer(layer);
      this.rotateLayer(move.angle, false, () => {
        this.game.storage.saveGame();
        this.state = STILL;
        this.checkIsSolved();
      });

    } else if (type === 'CUBE') {
      this.flipAxis = new THREE.Vector3();
      this.flipAxis[move.axis] = 1;
      this.state = ROTATING;

      this.rotateCube(move.angle, () => { this.state = STILL; });
    }
  }

  scrambleCube(/* callback? */) {
    if (this.scramble == null) {
      this.scramble = this.game.scrambler;
      // FIX: niente callback non definita
      // this.scramble.callback = (typeof callback !== 'function') ? () => {} : callback;
    }

    const converted = this.scramble.converted;
    const move = converted[0];
    const layer = this.getLayer(move.position);

    this.flipAxis = new THREE.Vector3();
    this.flipAxis[move.axis] = 1;

    this.selectLayer(layer);
    this.rotateLayer(move.angle, true, () => {
      converted.shift();
      if (converted.length > 0) {
        this.scrambleCube();
      } else {
        this.scramble = null;
        this.game.storage.saveGame();
      }
    });
  }

  getIntersect(position, object, multiple) {
    this.raycaster.setFromCamera(
      this.draggable.convertPosition(position.clone()),
      this.game.world.camera
    );

    // Ricorsione abilitata per colpire i figli
    if (multiple) {
      const objs = Array.isArray(object) ? object : [object];
      const intersect = this.raycaster.intersectObjects(objs, true);
      return (intersect.length > 0) ? intersect[0] : false;
    } else {
      const intersect = this.raycaster.intersectObject(object, true);
      return (intersect.length > 0) ? intersect[0] : false;
    }
  }

  getMainAxis(vector) {
    return Object.keys(vector).reduce((a, b) =>
      Math.abs(vector[a]) > Math.abs(vector[b]) ? a : b
    );
  }

  detach(child, parent) {
    child.applyMatrix4(parent.matrixWorld);
    parent.remove(child);
    this.game.world.scene.add(child);
  }

  attach(child, parent) {
    const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
    child.applyMatrix4(inv);
    this.game.world.scene.remove(child);
    parent.add(child);
  }

  addMomentumPoint(delta) {
    const time = Date.now();
    this.momentum = this.momentum.filter(m => time - m.time < 500);
    if (delta !== false) this.momentum.push({ delta, time });
  }

  getMomentum() {
    // opzionale: normalizzazione pesi
    const n = this.momentum.length;
    const out = new THREE.Vector2();
    if (!n) return out;

    let norm = 0;
    this.momentum.forEach((m, i) => {
      const w = (i + 1); // 1..n
      norm += w;
      out.add(m.delta.clone().multiplyScalar(w));
    });
    out.multiplyScalar(1 / norm);
    return out;
  }

  roundAngle(angle) {
    const step = Math.PI / 2;
    return Math.sign(angle) * Math.round(Math.abs(angle) / step) * step;
  }

  snapRotation(angle) {
    return angle.set(
      this.roundAngle(angle.x),
      this.roundAngle(angle.y),
      this.roundAngle(angle.z)
    );
  }

  checkIsSolved() {
    let solved = true;
    const sides = { 'x-': [], 'x+': [], 'y-': [], 'y+': [], 'z-': [], 'z+': [] };

    this.game.cube.edges.forEach(edge => {
      const position = edge.parent
        .localToWorld(edge.position.clone())
        .sub(this.game.cube.object.position);
      const mainAxis = this.getMainAxis(position);
      const mainSign = position.multiplyScalar(2).round()[mainAxis] < 1 ? '-' : '+';
      sides[mainAxis + mainSign].push(edge.name);
    });

    Object.keys(sides).forEach(side => {
      if (!sides[side].every(v => v === sides[side][0])) solved = false;
    });

    if (solved) this.onSolved();
  }
}

export { Controls };
