import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { Events } from '../events';

import store from '../store';

import defaultVert from './shaders/default.vert';
import copyFrag from './shaders/copy.frag';
import renderFrag from './shaders/render.frag';

export default new class {
  constructor() {
    this.renderer = new THREE.WebGL1Renderer({ 
      antialias: true, 
      alpha: true, 
      preserveDrawingBuffer: true,
    });
    this.dpr = Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(store.bounds.ww, store.bounds.wh);
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(
      45,
      store.bounds.ww / store.bounds.wh,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    this.scene = new THREE.Scene();

    this.canvas = null;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.clock = new THREE.Clock();
    this.time = null;

    this.init();
  }

  init() {
    this.addCanvas();
    this.addEvents();
    this.feedbackSetup();
    this.addElements();
  }

  addCanvas() {
    this.canvas = this.renderer.domElement;
    this.canvas.classList.add('webgl');
    document.body.appendChild(this.canvas);
  }

  addEvents() {
    Events.on('tick', this.render.bind(this));
    Events.on('resize', this.resize.bind(this));
  }

  feedbackSetup() {
    this.setupBufferScene();
    this.initBufferScene();
    this.initMainScene();
  }

  setupBufferScene() {
    // Buffer scene
    this.bufferScene = new THREE.Scene();

    // Render target options
    const targetOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearMipMapLinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    };

    // Render targets
    this.ping = new THREE.WebGLRenderTarget(store.bounds.ww, store.bounds.wh, targetOpts);
    this.pong = new THREE.WebGLRenderTarget(store.bounds.ww, store.bounds.wh, targetOpts);
  }

  initBufferScene() {
    // Buffer 
    const bufferMaterial = new THREE.ShaderMaterial({
      vertexShader: defaultVert,
      fragmentShader: copyFrag,
      uniforms: {
        channel0: { value: this.pong.texture },
      },
      side: THREE.DoubleSide,
    });

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    this.bufferObject = new THREE.Mesh(planeGeometry, bufferMaterial);
    this.bufferScene.add(this.bufferObject);
  }

  initMainScene() {
    const material = new THREE.ShaderMaterial({
      vertexShader: defaultVert,
      fragmentShader: renderFrag,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(store.bounds.ww, store.bounds.wh) },
        backbuffer: { value: null },
      },
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    
    this.quad = new THREE.Mesh(geometry, material);

    this.scene.add(this.quad);
  }

  addElements() {
    const geom = new THREE.BoxGeometry(1);
    const mat = new THREE.MeshNormalMaterial();
    this.box = new THREE.Mesh(geom, mat);

    this.scene.add(this.box);
  }

  resize() {
    let width = store.bounds.ww;
    let height = store.bounds.wh;

    this.camera.aspect = width / height;
    this.renderer.setSize(width, height);

    this.camera.updateProjectionMatrix();
  }

  render() {
    this.controls.update();

    this.time = this.clock.getElapsedTime();  

    this.quad.material.uniforms.time.value = this.time;

    // this.box.rotation.x = this.time;
    // this.box.rotation.y = this.time;
    
    // Save buffer current frame to ping
    this.renderer.setRenderTarget(this.ping);
    this.renderer.render(this.bufferScene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    
    // Swap ping and pong
    let temp = this.pong;
    this.pong = this.ping;
    this.ping = temp;

    // Update channels
    this.quad.material.uniforms.backbuffer.value = this.ping.texture;
    this.bufferObject.material.uniforms.channel0.value = this.pong.texture;

    // Render Main Scene
    this.renderer.render(this.scene, this.camera);
  }
}