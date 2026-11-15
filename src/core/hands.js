import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { scene, camera } from './renderer.js';
import { loadModel } from './loader.js';
import { look } from './input.js';
import { getVelocity } from './player.js';
import { fitModel, clamp, $ } from '../utils/helpers.js';
import { GLOVE_MODEL, HAND } from '../utils/config.js';

const state = { size: HAND.size, pos: [...HAND.pos], rot: [...HAND.rot] };
const hands = [];
const invQ = new THREE.Quaternion();
const lv = new THREE.Vector3();
const lag = new THREE.Vector3();
const lookLag = new THREE.Vector2();
let prevYaw = 0;
let prevPitch = 0;
let tuning = false;

function makeHand(gltfScene, mirrored) {
  const glove = clone(gltfScene);
  fitModel(glove, HAND.size);
  glove.traverse((o) => { if (o.isMesh) {
  o.frustumCulled = false;
  o.renderOrder = 999;
  o.material = o.material.clone();
  o.material.depthTest = false;
} });

  const flip = new THREE.Group();          // left hand = X-axis mirror
  flip.scale.x = mirrored ? -1 : 1;
  flip.add(glove);

  const holder = new THREE.Group();
  holder.add(flip);
  camera.add(holder);
  hands.push({ holder, mirrored, phase: mirrored ? 1.7 : 0 });
}

// Right hand ki position/rotation se left hand ki mirrored position/rotation
function applyBase() {
  const [px, py, pz] = state.pos;
  const [rx, ry, rz] = state.rot;
  hands.forEach(({ holder, mirrored }) => {
    holder.userData.base = {
      pos: new THREE.Vector3(mirrored ? -px : px, py, pz),
      rot: new THREE.Euler(rx, mirrored ? -ry : ry, mirrored ? -rz : rz),
    };
    holder.scale.setScalar(state.size / HAND.size);
  });
  const f = (a) => '[' + a.map((n) => n.toFixed(2)).join(', ') + ']';
  $('tune').textContent =
    'TUNE MODE (T = band)\n' +
    '1/2 rotX   3/4 rotY   5/6 rotZ\n' +
    'Arrows = x,y   PgUp/PgDn = z   7/8 = size\n\n' +
    `HAND = { size: ${state.size.toFixed(2)}, pos: ${f(state.pos)}, rot: ${f(state.rot)} }`;
  if (tuning) console.log($('tune').textContent);
}

function onKey(e) {
  if (e.code === 'KeyT') {
    tuning = !tuning;
    $('tune').classList.toggle('hidden', !tuning);
    applyBase();
    return;
  }
  if (!tuning) return;
  const s = 0.1;
  const p = 0.02;
  const actions = {
    Digit1: () => (state.rot[0] -= s), Digit2: () => (state.rot[0] += s),
    Digit3: () => (state.rot[1] -= s), Digit4: () => (state.rot[1] += s),
    Digit5: () => (state.rot[2] -= s), Digit6: () => (state.rot[2] += s),
    ArrowLeft: () => (state.pos[0] -= p), ArrowRight: () => (state.pos[0] += p),
    ArrowUp: () => (state.pos[1] += p), ArrowDown: () => (state.pos[1] -= p),
    PageUp: () => (state.pos[2] -= p), PageDown: () => (state.pos[2] += p),
    Digit7: () => (state.size *= 0.92), Digit8: () => (state.size *= 1.08),
  };
  if (actions[e.code]) {
    e.preventDefault();
    actions[e.code]();
    applyBase();
  }
}

export async function initHands() {
  scene.add(camera); // camera ke bachche tabhi dikhte hain jab camera scene mein ho
  const gltf = await loadModel(GLOVE_MODEL);
  if (!gltf) return;
  makeHand(gltf.scene, false); // right
  makeHand(gltf.scene, true);  // left (mirror clone)
  applyBase();
  addEventListener('keydown', onKey);
  prevYaw = look.yaw;
  prevPitch = look.pitch;
}

export function updateHands(dt, t) {
  if (!hands.length) return;

  // Camera ke hisaab se velocity: chalne par hath peeche khinchte hain
  invQ.copy(camera.quaternion).invert();
  lv.copy(getVelocity()).applyQuaternion(invQ);
  const k = 1 - Math.exp(-6 * dt);
  lag.x += (clamp(-lv.x * 0.01, -0.07, 0.07) - lag.x) * k;
  lag.y += (clamp(-lv.y * 0.01, -0.07, 0.07) - lag.y) * k;
  lag.z += (clamp(-lv.z * 0.01, -0.07, 0.07) - lag.z) * k;

  // Mouse ghumane par hath thoda peeche reh jate hain
  const d = Math.max(dt, 1e-4);
  const dYaw = (look.yaw - prevYaw) / d;
  const dPitch = (look.pitch - prevPitch) / d;
  prevYaw = look.yaw;
  prevPitch = look.pitch;
  lookLag.x += (clamp(dYaw * 0.012, -0.06, 0.06) - lookLag.x) * k;
  lookLag.y += (clamp(-dPitch * 0.012, -0.06, 0.06) - lookLag.y) * k;

  for (const { holder, phase } of hands) {
    const b = holder.userData.base;
    const w = t * 0.9 + phase;
    holder.position.set(
      b.pos.x + lag.x + lookLag.x + Math.sin(w * 1.3) * 0.008,
      b.pos.y + lag.y + lookLag.y + Math.sin(w) * 0.012,
      b.pos.z + lag.z
    );
    holder.rotation.set(
      b.rot.x + Math.sin(w * 0.8) * 0.03,
      b.rot.y + Math.sin(w * 0.6) * 0.02,
      b.rot.z + Math.sin(w * 0.7 + 1) * 0.04
    );
  }
}