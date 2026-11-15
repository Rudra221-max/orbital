import * as THREE from 'three';
import { scene, camera } from '../core/renderer.js';
import { beep } from '../core/audio.js';
import { setScoreText, setTask, setOxygen, setMarker } from '../ui/hud.js';

const tmp = new THREE.Vector3();
const GREEN = new THREE.Color(0x33ff99);
const CYAN = new THREE.Color(0x22ddff);

export class Airlock {
  constructor(place, def) {
    this.place = place;
    this.def = def;
    this.oxygenMax = def.oxygen;
    this.oxygen = def.oxygen;
    this.progress = 0;
    this.lastTick = -1;

    // Airlock model ki doosri taraf (-z side), thoda upar
    const pos = place.center.clone().add(
      new THREE.Vector3(10, 6, -(place.radius + def.airlockDistance))
    );

    this.group = new THREE.Group();
    this.group.position.copy(pos);

    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd, metalness: 0.6, roughness: 0.35,
      emissive: GREEN.clone(), emissiveIntensity: 1.2,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.4, 14, 48), this.ringMat);

    this.tubeMat = new THREE.MeshStandardMaterial({
      color: 0x556066, metalness: 0.5, roughness: 0.6, side: THREE.DoubleSide,
      emissive: 0x113322, emissiveIntensity: 0.6,
    });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 9, 32, 1, true), this.tubeMat);
    tube.rotation.x = Math.PI / 2;            // axis z ke along

    // Ring ki lights
    this.lightMat = new THREE.MeshBasicMaterial({ color: GREEN.clone() });
    this.lightGeo = new THREE.SphereGeometry(0.25, 10, 10);
    this.lights = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const l = new THREE.Mesh(this.lightGeo, this.lightMat);
      l.position.set(Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0.45);
      this.group.add(l);
      this.lights.push(l);
    }

    // Door ke andar halki chamak + door se dikhne wala beacon
    this.glowMat = new THREE.MeshBasicMaterial({
      color: GREEN.clone(), transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.glowGeo = new THREE.SphereGeometry(7, 24, 24);
    const glow = new THREE.Mesh(this.glowGeo, this.glowMat);

    this.group.add(ring, tube, glow);
    this.group.lookAt(place.startPosition);   // darwaza player ki taraf khule
    scene.add(this.group);

    setScoreText('Airlock: not reached');
  }

  update(dt, t) {
    this.oxygen -= dt;
    setOxygen(Math.max(0, this.oxygen / this.oxygenMax), this.oxygenMax);
    if (this.oxygen <= 0) return 'failed';

    const d = this.group.position.distanceTo(camera.position);
    const inside = d < this.def.enterRange;
    let label = d.toFixed(0) + ' m';

    if (inside) {
      this.progress += dt;
      const remaining = Math.max(1, Math.ceil(this.def.enterTime - this.progress));
      if (remaining !== this.lastTick) {
        this.lastTick = remaining;
        beep(500 + (this.def.enterTime - remaining) * 90, 0.1);
      }
      label = 'ENTERING ' + remaining;
      setTask('Airlock mein dakhil ho rahe ho... ruke raho: ' + remaining);
      setScoreText('Airlock: ENTERING');
      if (this.progress >= this.def.enterTime) { beep(1300, 0.4); return 'complete'; }
    } else {
      this.progress = 0;
      this.lastTick = -1;
      setTask('Airlock tak pahucho: ' + d.toFixed(0) + ' m');
      setScoreText('Airlock: not reached');
    }

    // Marker
    tmp.copy(this.group.position).project(camera);
    let x = tmp.x;
    let y = tmp.y;
    if (tmp.z > 1) { x = x >= 0 ? 0.9 : -0.9; y = -y; }
    setMarker(x, y, label);

    // Look: oxygen kam hone par lights tez blink karein
    const low = this.oxygen / this.oxygenMax < 0.3;
    const speed = inside ? 10 : low ? 8 : 3;
    const col = inside ? CYAN : GREEN;
    this.ringMat.emissive.copy(col);
    this.lightMat.color.copy(col);
    this.glowMat.color.copy(col);
    this.glowMat.opacity = inside ? 0.25 : 0.1 + 0.05 * Math.sin(t * 2);
    this.lights.forEach((l, i) => {
      l.scale.setScalar(0.7 + 0.5 * Math.max(0, Math.sin(t * speed - i * 0.55)));
    });
    return 'running';
  }

  dispose() {
    scene.remove(this.group);
    this.group.traverse((o) => { if (o.geometry && o.geometry !== this.lightGeo) o.geometry.dispose(); });
    this.ringMat.dispose();
    this.tubeMat.dispose();
    this.lightMat.dispose();
    this.glowMat.dispose();
    this.lightGeo.dispose();
  }
}
