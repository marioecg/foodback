import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { Events } from '../events';

import store from '../store';

import defaultVert from './shaders/default.vert';
import bufferFrag from './shaders/buffer.frag';
import renderFrag from './shaders/render.frag';
import boxVert from './shaders/box.vert';
import boxFrag from './shaders/box.frag';

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
    this.bufferScene = new THREE.Scene();

    const targetOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearMipMapLinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    };

    this.read = new THREE.WebGLRenderTarget(store.bounds.ww, store.bounds.wh, targetOpts);
    this.write = new THREE.WebGLRenderTarget(store.bounds.ww, store.bounds.wh, targetOpts);
  }

  initBufferScene() {
    const bufferMaterial = new THREE.ShaderMaterial({
      vertexShader: defaultVert,
      fragmentShader: bufferFrag,
      uniforms: {
        prevFrame: { value: this.read.texture },
        time: { value: 0 },
      },
    });

    const bufferGeometry = new THREE.PlaneGeometry(2, 2);

    this.bufferObject = new THREE.Mesh(bufferGeometry, bufferMaterial);

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
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    
    this.quad = new THREE.Mesh(geometry, material);

    this.scene.add(this.quad);
  }

  addElements() {
    this.scene2 = new THREE.Scene();
    this.camera2 = this.camera.clone();
    this.camera2.position.set(0, 0, 5);

    const geometry = new THREE.BoxGeometry(1);
    const material = new THREE.ShaderMaterial({
      vertexShader: boxVert,
      fragmentShader: boxFrag,
      uniforms: { 
        time: { value: 0 },
      },
    });

    this.box = new THREE.Mesh(geometry, material);

    this.scene2.add(this.box);
  }

  resize() {
    let width = store.bounds.ww;
    let height = store.bounds.wh;

    this.camera.aspect = width / height;
    this.renderer.setSize(width, height);

    this.write.setSize(width, height);
    this.read.setSize(width, height);

    this.camera2.aspect = width / height;

    this.camera.updateProjectionMatrix();
    this.camera2.updateProjectionMatrix();
  }

  render() {
    this.controls.update();

    this.time = this.clock.getElapsedTime();  

    this.box.rotation.x = this.time;
    this.box.rotation.y = this.time;
    this.box.material.uniforms.time.value = this.time;
    
    this.bufferObject.material.uniforms.prevFrame.value = this.read.texture;
    this.bufferObject.material.uniforms.time.value = this.time;
    this.quad.material.uniforms.time.value = this.time;

    // Save buffer current frame
    this.renderer.setRenderTarget(this.write);
    this.renderer.render(this.bufferScene, this.camera);

    // Make another pass to 3D shapes
    this.renderer.autoClearColor = false;
    this.renderer.render(this.scene2, this.camera2);
    this.renderer.autoClearColor = true;

    this.renderer.setRenderTarget(null);
    
    // Swap read and write
    let temp = this.write;
    this.write = this.read;
    this.read = temp;

    // Update channels
    this.quad.material.uniforms.backbuffer.value = this.read.texture;

    // Render Main Scene
    this.renderer.render(this.scene, this.camera);
  }
}