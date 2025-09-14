// World.js — versione classica (no modules), dipende da window.Animation e THREE
(function () {
  'use strict';

  class World extends window.Animation {
    constructor(game) {
      super(true);

      this.game = game;

      this.container = this.game.dom && this.game.dom.game
        ? this.game.dom.game
        : document.body;

      this.scene = new THREE.Scene();

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);
      this.container.appendChild(this.renderer.domElement);

      // FOV piccolo: lavoriamo con zoom via Transition
      this.camera = new THREE.PerspectiveCamera(2, 1, 0.1, 10000);

      this.stage = { width: 2, height: 3 };
      this.fov = 10;

      this.createLights();

      this.onResize = [];

      this.resize();
      window.addEventListener('resize', () => this.resize(), false);
    }

    update() {
      this.renderer.render(this.scene, this.camera);
    }

    resize() {
      this.width = this.container.offsetWidth || window.innerWidth;
      this.height = this.container.offsetHeight || window.innerHeight;

      this.renderer.setSize(this.width, this.height);

      this.camera.fov = this.fov;
      this.camera.aspect = this.width / this.height;

      const aspect = this.stage.width / this.stage.height;
      const fovRad = this.fov * THREE.Math.DEG2RAD;

      let distance = (aspect < this.camera.aspect)
        ? (this.stage.height / 2) / Math.tan(fovRad / 2)
        : (this.stage.width / this.camera.aspect) / (2 * Math.tan(fovRad / 2));

      // allontana un filo per margini
      distance *= 0.5;

      this.camera.position.set(distance, distance, distance);
      this.camera.lookAt(this.scene.position);
      this.camera.updateProjectionMatrix();

      const docFontSize = (aspect < this.camera.aspect)
        ? (this.height / 100) * aspect
        : this.width / 100;

      document.documentElement.style.fontSize = docFontSize + 'px';

      if (Array.isArray(this.onResize)) this.onResize.forEach(cb => cb && cb());
    }

    createLights() {
      this.lights = {
        holder:  new THREE.Object3D(),
        ambient: new THREE.AmbientLight(0xffffff, 0.69),
        front:   new THREE.DirectionalLight(0xffffff, 0.36),
        back:    new THREE.DirectionalLight(0xffffff, 0.19),
      };

      this.lights.front.position.set( 1.5,  5,  3);
      this.lights.back.position.set( -1.5, -5, -3);

      this.lights.holder.add(this.lights.ambient);
      this.lights.holder.add(this.lights.front);
      this.lights.holder.add(this.lights.back);

      this.scene.add(this.lights.holder);
    }
  }

  window.World = World;
})();
