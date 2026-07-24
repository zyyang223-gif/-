import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createParticleSystem, updateParticles, generateShape, getShapeColors, particle } from './particles.js';
import { startHandTracking } from './hand-tracking.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020208, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.prepend(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.5, 0.1
));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;
controls.enableZoom = true;
controls.minDistance = 10;
controls.maxDistance = 50;
controls.enablePan = false;

createParticleSystem(scene);

export const state = {
  openness: 0,
  handsActive: false,
  triggerNextShape: false,
  pointTriggered: false,
  currentShape: 'heart',
};

startHandTracking(state);

const shapeNames = ['heart', 'flower', 'saturn', 'dna', 'firework'];
const shapeLabels = { heart: '爱心', flower: '花朵', saturn: '土星', dna: 'DNA', firework: '烟花' };
let currentShapeIdx = 0;

function applyShape(idx) {
  currentShapeIdx = idx;
  state.currentShape = shapeNames[idx];
  generateShape(shapeNames[idx]);
  particle.currentColors = getShapeColors(shapeNames[idx]);
  document.querySelectorAll('.shape-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
}

document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', () => applyShape(shapeNames.indexOf(btn.dataset.shape)));
});

const colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener('input', (e) => {
  const base = new THREE.Color(e.target.value);
  const hsl = {};
  base.getHSL(hsl);
  particle.currentColors = {
    base: base,
    accent: new THREE.Color().setHSL((hsl.h + 0.08) % 1, hsl.s * 0.8, Math.min(1, hsl.l + 0.1)),
    highlight: new THREE.Color().setHSL(hsl.h, hsl.s * 0.3, Math.min(1, hsl.l + 0.25)),
  };
});
document.querySelectorAll('.color-preset').forEach(el => {
  el.addEventListener('click', () => {
    colorPicker.value = el.dataset.color;
    colorPicker.dispatchEvent(new Event('input'));
  });
});

const hud = document.getElementById('hud');
const fpsEl = document.getElementById('fps-val');
let frameCount = 0;
let lastFpsTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();

  if (state.triggerNextShape) {
    state.triggerNextShape = false;
    applyShape((currentShapeIdx + 1) % shapeNames.length);
  }

  updateParticles(state, 0.016);

  frameCount++;
  if (now - lastFpsTime >= 1000) {
    fpsEl.textContent = frameCount;
    frameCount = 0;
    lastFpsTime = now;
  }

  if (state.handsActive) {
    controls.autoRotate = false;
    hud.textContent = `${shapeLabels[state.currentShape]} · ${(state.openness * 100).toFixed(0)}%`;
    hud.style.opacity = '1';
  } else {
    controls.autoRotate = true;
    hud.style.opacity = '0';
  }

  controls.update();
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});