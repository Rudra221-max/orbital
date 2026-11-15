import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { loadModel } from '../core/loader.js';
import { fitModel } from '../utils/helpers.js';
import { NPC_SIZE, PANEL_DISTANCE } from '../utils/config.js';
import { ASTRONAUT_MODEL } from '../utils/missions.js';

// ---------- Loading screen ----------
let overlay = null;
export function showLoading(title, text = '') {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<h2>${title}</h2><p>${text}</p><small>Loading...</small>`;
  overlay.classList.remove('hidden');
}
export const hideLoading = () => overlay && overlay.classList.add('hidden');

// ---------- Model cache (dobara play par dobara download nahi hoga) ----------
const cache = new Map();
async function load(url) {
  if (cache.has(url)) return cache.get(url);
  const gltf = await loadModel(url);
  if (gltf) cache.set(url, gltf);
  return gltf;
}

// def = MISSIONS[i].place  ->  { model, size, npc }
export async function loadPlace(def) {
  const [model, astro] = await Promise.all([
    load(def.model),
    def.npc ? load(ASTRONAUT_MODEL) : null,
  ]);

  const added = [];                       // dispose par scene se hatane ke liye
  const add = (o) => { scene.add(o); added.push(o); };

  let box = new THREE.Box3(new THREE.Vector3(-30, -10, -30), new THREE.Vector3(30, 10, 30));
  let root = null;
  if (model) {
    fitModel(model.scene, def.size);
    add(model.scene);
    model.scene.updateMatrixWorld(true);  // raycast ke liye zaroori
    root = model.scene;
    box = new THREE.Box3().setFromObject(root);
  } else {
    add(new THREE.GridHelper(60, 30));
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z);
  const radius = span * 0.5 + PANEL_DISTANCE;

  // Astronaut NPC (sirf jahan def.npc true ho)
  let npc = null;
  let mixer = null;
  if (astro) {
    fitModel(astro.scene, NPC_SIZE);
    npc = new THREE.Group();
    npc.add(astro.scene);
    npc.position.copy(center).add(new THREE.Vector3(6, 2, radius - 2));
    add(npc);
    if (astro.animations.length) {
      mixer = new THREE.AnimationMixer(astro.scene);
      mixer.clipAction(astro.animations[0]).play();
    }
  }

  return {
    key: def.model,
    root,
    span,
    center,
    radius,
    startPosition: center.clone().add(new THREE.Vector3(0, 3, radius + 12)),
    update(dt, t) {
      if (npc) {
        npc.rotation.y += dt * 0.3;
        npc.position.y += Math.sin(t) * 0.002;
      }
      if (mixer) mixer.update(dt);
    },
    dispose() {
      added.forEach((o) => scene.remove(o));   // cache wali model ki geometry dispose nahi karte
    },
  };
}
