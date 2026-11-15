import * as THREE from 'three';
import { scene, camera } from '../core/renderer.js';
import { beep } from '../core/audio.js';
import { setScore, setTask, setOxygen, setMarker } from '../ui/hud.js';
import { fibonacciSphere, surfaceHit } from '../utils/helpers.js';
import { PANEL_COUNT, REPAIR_TIME, REPAIR_RANGE, CRACK_SIZE } from '../utils/config.js';

const tmp = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);
const FIXING = new THREE.Color(0x22ddff);

// Canvas par tedhi-medhi, branch wali crack banao
function makeCrackTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 6;

  const branch = (x, y, angle, len, width, depth) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const step = 14;
    for (let i = 0; i < len / step; i++) {
      angle += (Math.random() - 0.5) * 0.9;
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      ctx.lineTo(x, y);
      if (depth < 3 && Math.random() < 0.2) {
        const side = Math.random() < 0.5 ? -1 : 1;
        branch(x, y, angle + side * (0.5 + Math.random() * 0.7), len * 0.45, width * 0.6, depth + 1);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  };

  const arms = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < arms; i++) {
    branch(S / 2, S / 2, (i / arms) * Math.PI * 2 + Math.random() * 0.6, 200 + Math.random() * 60, 7, 0);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Spacewalk {
  constructor(station, def) {
    this.station = station;
    this.def = def;
    this.cracks = [];
    this.collected = 0;
    this.oxygenMax = def.oxygen;
    this.oxygen = def.oxygen;

    this.target = null;
    this.progress = 0;
    this.lastTick = -1;

    this.geo = new THREE.PlaneGeometry(CRACK_SIZE, CRACK_SIZE);
    this.textures = [makeCrackTexture(), makeCrackTexture(), makeCrackTexture()];

    this.findSurfaceSpots().forEach((spot, i) => this.createCrack(spot, i));
    setScore(0, PANEL_COUNT, 'Cracks repaired');
  }

  findSurfaceSpots() {
    const st = this.station;
    const spots = [];
    const candidates = fibonacciSphere(PANEL_COUNT * 4, st.radius + 10, st.center);

    for (const origin of candidates) {
      if (spots.length >= PANEL_COUNT) break;
      if (!st.root) break;

      const jitter = new THREE.Vector3(
        Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5
      ).multiplyScalar(st.span * 0.3);

      const hit = surfaceHit(st.root, origin, st.center.clone().add(jitter));
      if (!hit) continue;
      if (spots.some((s) => s.point.distanceTo(hit.point) < st.span * 0.15)) continue;
      spots.push(hit);
    }

    let k = 0;
    while (spots.length < PANEL_COUNT) {
      const o = candidates[k++ % candidates.length];
      spots.push({ point: o.clone(), normal: o.clone().sub(st.center).normalize() });
    }
    return spots;
  }

  createCrack({ point, normal }, i) {
    const mat = new THREE.MeshBasicMaterial({
      map: this.textures[i % this.textures.length],
      color: 0x880000,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    const mesh = new THREE.Mesh(this.geo, mat);
    mesh.position.copy(point).addScaledVector(normal, 0.05);
    mesh.quaternion.setFromUnitVectors(Z, normal);
    mesh.rotateZ(Math.random() * Math.PI * 2);
    scene.add(mesh);
    this.cracks.push({ mesh, mat, done: false, healing: false });
  }

  heal(crack) {
    crack.done = true;
    crack.healing = true;
    this.collected++;
    beep(1200, 0.35);
    setScore(this.collected, PANEL_COUNT, 'Cracks repaired');
    this.target = null;
    this.progress = 0;
    this.lastTick = -1;
  }

  update(dt, t) {
    this.oxygen -= dt;
    setOxygen(Math.max(0, this.oxygen / this.oxygenMax), this.oxygenMax);
    if (this.oxygen <= 0) return 'failed';

    let nearest = null;
    let nearestD = Infinity;
    for (const c of this.cracks) {
      if (c.done) continue;
      const d = c.mesh.position.distanceTo(camera.position);
      if (d < nearestD) { nearestD = d; nearest = c; }
    }

    let label = null;
    if (nearest && nearestD < REPAIR_RANGE) {
      if (this.target !== nearest) {
        this.target = nearest;
        this.progress = 0;
        this.lastTick = -1;
      }
      this.progress += dt;
      const remaining = Math.max(1, Math.ceil(REPAIR_TIME - this.progress));
      if (remaining !== this.lastTick) {
        this.lastTick = remaining;
        beep(600 + (REPAIR_TIME - remaining) * 40, 0.08);
      }
      label = 'REPAIRING ' + remaining;
      setTask('Repairing crack... ruke raho: ' + remaining);
      if (this.progress >= REPAIR_TIME) this.heal(nearest);
    } else {
      this.target = null;
      this.progress = 0;
      this.lastTick = -1;
    }

    if (this.collected >= PANEL_COUNT) return 'complete';

    if (nearest) {
      tmp.copy(nearest.mesh.position).project(camera);
      let x = tmp.x;
      let y = tmp.y;
      if (tmp.z > 1) { x = x >= 0 ? 0.9 : -0.9; y = -y; }
      setMarker(x, y, label || nearestD.toFixed(0) + ' m');
      if (!label) setTask('Nearest crack: ' + nearestD.toFixed(0) + ' m');
    }

    this.cracks.forEach((c, i) => {
      if (c.healing) {
        c.mat.opacity -= dt * 1.2;
        c.mat.color.copy(FIXING);
        if (c.mat.opacity <= 0) { c.mesh.visible = false; c.healing = false; }
      } else if (!c.done) {
        if (c === this.target) {
          c.mat.color.copy(FIXING);
          c.mat.opacity = 0.5 + 0.5 * (1 - this.progress / REPAIR_TIME);
        } else {
          const s = 0.5 + 0.5 * Math.sin(t * 3 + i);
          c.mat.color.setRGB(0.35 + 0.5 * s, 0.03, 0.02);
          c.mat.opacity = 1;
        }
      }
    });
    return 'running';
  }

  dispose() {
    this.cracks.forEach((c) => { scene.remove(c.mesh); c.mat.dispose(); });
    this.textures.forEach((tx) => tx.dispose());
    this.geo.dispose();
  }
}
