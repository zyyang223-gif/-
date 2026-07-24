import * as THREE from 'three';

const N = 25000;

export const particle = {
  geo: null,
  mat: null,
  targetPos: new Float32Array(N * 3),
  spreadSmooth: 0,
  currentColors: null,
};

const shapeColors = {
  heart: { base: new THREE.Color(0xff3366), accent: new THREE.Color(0xff6699), highlight: new THREE.Color(0xffaacc) },
  flower: { base: new THREE.Color(0xff66aa), accent: new THREE.Color(0xcc88ff), highlight: new THREE.Color(0xffffff) },
  saturn: { base: new THREE.Color(0xddaa33), accent: new THREE.Color(0xff8800), highlight: new THREE.Color(0xffcc66) },
  dna: { base: new THREE.Color(0x00ddaa), accent: new THREE.Color(0x00aaff), highlight: new THREE.Color(0x66ffcc) },
  firework: { base: new THREE.Color(0xff4444), accent: new THREE.Color(0x44ff44), highlight: new THREE.Color(0x4444ff) },
};

const shapes = {
  heart: (i) => {
    const t = Math.random() * Math.PI * 2;
    const r = Math.cbrt(Math.random());
    return [
      16 * Math.pow(Math.sin(t), 3) * r * 0.38,
      (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * r * 0.38,
      (Math.random() - 0.5) * 8 * r * 0.38,
    ];
  },
  flower: (i) => {
    const k = 5;
    const t = Math.random() * Math.PI * 2;
    const r = (10 * Math.cos(k * t) + 5) * Math.cbrt(Math.random());
    return [
      r * Math.cos(t),
      r * Math.sin(t),
      (Math.random() - 0.5) * 4 * (1 - Math.abs(r) / 15) + Math.cos(t * k) * 1.5,
    ];
  },
  saturn: (i) => {
    if (Math.random() > 0.35) {
      const r = 5 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ];
    } else {
      const r = 7.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      return [r * Math.cos(theta), (Math.random() - 0.5) * 0.3, r * Math.sin(theta)];
    }
  },
  dna: (i) => {
    const t = (i / N) * Math.PI * 8;
    const strand = Math.random() > 0.5 ? 1 : -1;
    const x = strand * 3 * Math.cos(t);
    const y = (i / N) * 20 - 10;
    const z = strand * 3 * Math.sin(t);
    if (Math.random() > 0.7) {
      const t2 = t + strand * 0.3;
      return [strand * 3 * Math.cos(t2) * 0.3, y, strand * 3 * Math.sin(t2) * 0.3];
    }
    return [x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5];
  },
  firework: (i) => {
    const center = [
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 16,
    ];
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2 + Math.random() * 3;
    return [
      center[0] + r * Math.sin(phi) * Math.cos(theta),
      center[1] + r * Math.sin(phi) * Math.sin(theta),
      center[2] + r * Math.cos(phi),
    ];
  },
};

export function getShapeColors(type) { return shapeColors[type]; }

export function generateShape(type) {
  const t = particle.targetPos;
  for (let i = 0; i < N; i++) {
    const [x, y, z] = shapes[type](i);
    t[i*3] = x;
    t[i*3+1] = y;
    t[i*3+2] = z;
  }
}

export function createParticleSystem(scene) {
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    pos[i*3] = (Math.random() - 0.5) * 40;
    pos[i*3+1] = (Math.random() - 0.5) * 40;
    pos[i*3+2] = (Math.random() - 0.5) * 40;
    col[i*3] = 0; col[i*3+1] = 0.8; col[i*3+2] = 1;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  particle.geo = geo;

  const tex = (() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.12, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.5, 'rgba(200,220,255,0.15)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const mat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
    map: tex,
  });
  particle.mat = mat;

  generateShape('heart');
  particle.currentColors = shapeColors.heart;

  const system = new THREE.Points(geo, mat);
  scene.add(system);
  return system;
}

export function updateParticles(state, dt) {
  const p = particle;
  const targetSpread = state.handsActive ? state.openness : 0;
  p.spreadSmooth += (targetSpread - p.spreadSmooth) * 0.06;
  const spread = 0.3 + p.spreadSmooth * 1.7;

  const pos = p.geo.attributes.position.array;
  const colAttr = p.geo.attributes.color;
  const t = performance.now() * 0.001;

  const colors = p.currentColors || shapeColors.heart;
  const cb = colors.base;
  const ca = colors.accent;
  const ch = colors.highlight;

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const tx = p.targetPos[i3] * spread;
    const ty = p.targetPos[i3+1] * spread;
    const tz = p.targetPos[i3+2] * spread;

    pos[i3] += (tx - pos[i3]) * 0.045;
    pos[i3+1] += (ty - pos[i3+1]) * 0.045;
    pos[i3+2] += (tz - pos[i3+2]) * 0.045;
    pos[i3+1] += Math.sin(t * 0.4 + i * 0.002) * 0.004;

    const hash = (i * 2654435761) >>> 0;
    const rnd = (hash % 10000) / 10000;
    const wave = Math.sin(t * 0.3 + i * 0.005) * 0.5 + 0.5;

    let r, g, b;
    if (rnd < 0.55) {
      r = cb.r; g = cb.g; b = cb.b;
    } else if (rnd < 0.82) {
      r = ca.r; g = ca.g; b = ca.b;
    } else {
      r = ch.r; g = ch.g; b = ch.b;
    }
    const brightness = 0.6 + wave * 0.4;
    colAttr.array[i3] = r * brightness;
    colAttr.array[i3+1] = g * brightness;
    colAttr.array[i3+2] = b * brightness;
  }
  p.geo.attributes.position.needsUpdate = true;
  colAttr.needsUpdate = true;
}