import * as THREE from 'three';
import { scene } from '../core/renderer.js';
import { loadModel } from '../core/loader.js';
import { fitModel } from '../utils/helpers.js';
import { STATION_MODEL, CENTER_SIZE, NPC_SIZE, PANEL_DISTANCE } from '../utils/config.js';

export async function loadStation() {
  const [center, astro] = await Promise.all([
    loadModel(STATION_MODEL),
    loadModel('/models/astronaut.glb'),
  ]);

  let box = new THREE.Box3(new THREE.Vector3(-30, -10, -30), new THREE.Vector3(30, 10, 30));
  let root = null;
  if (center) {
    fitModel(center.scene, CENTER_SIZE);
    scene.add(center.scene);
    center.scene.updateMatrixWorld(true); // raycast ke liye zaroori
    root = center.scene;
    box = new THREE.Box3().setFromObject(root);
  } else {
    scene.add(new THREE.GridHelper(60, 30));
  }

  const stationCenter = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.y, size.z);
  const radius = span * 0.5 + PANEL_DISTANCE;

  // Astronaut model = floating NPC crew member
  let npc = null;
  let mixer = null;
  if (astro) {
    fitModel(astro.scene, NPC_SIZE);
    npc = new THREE.Group();
    npc.add(astro.scene);
    npc.position.copy(stationCenter).add(new THREE.Vector3(6, 2, radius - 2));
    scene.add(npc);
    if (astro.animations.length) {
      mixer = new THREE.AnimationMixer(astro.scene);
      mixer.clipAction(astro.animations[0]).play();
    }
  }

  return {
    root,
    span,
    center: stationCenter,
    radius,
    startPosition: stationCenter.clone().add(new THREE.Vector3(0, 3, radius + 12)),
    update(dt, t) {
      if (npc) {
        npc.rotation.y += dt * 0.3;
        npc.position.y += Math.sin(t) * 0.002;
      }
      if (mixer) mixer.update(dt);
    },
  };
}