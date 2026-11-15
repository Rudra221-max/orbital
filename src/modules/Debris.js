import * as THREE from 'three';
import { scene, camera } from '../core/renderer.js';
import { beep } from '../core/audio.js';
import { setScore, setTask, setOxygen, setMarker } from '../ui/hud.js';

const tmp = new THREE.Vector3();
const rad = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);

function randomUnit() {
  return new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize();
}

export class Debris {
  constructor(place, def) {
    this.place = place;
    this.def = def;
    this.oxygenMax = def.oxygen;
    this.oxygen = def.oxygen;
    this.total = def.debrisCount;
    this.collected = 0;
    this.items = [];

    this.geos = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.BoxGeometry(1.8, 0.15, 1.1),    // patli plate (jaise purana solar panel)
    ];
    this.mats = [
      new THREE.MeshStandardMaterial({
        color: 0x8a8a8a, metalness: 0.7, roughness: 0.45, flatShading: true,
        emissive: 0xff5500, emissiveIntensity: 0.35,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x3a3330, metalness: 0.5, roughness: 0.7, flatShading: true,
        emissive: 0xff3300, emissiveIntensity: 0.45,
      }),
    ];

    this.minR = place.radius - 8 + 3;      // model ke andar na ghuse (half-span + 3)
    this.maxR = place.radius + 45;         // bahut door na jaye
    for (let i = 0; i < this.total; i++) this.spawn(i);
    setScore(0, this.total, 'Debris collected');
  }

  spawn(i) {
    const p = this.place;
    const dir = randomUnit();
    const dist = p.radius + 6 + Math.random() * 22;
    const mesh = new THREE.Mesh(
      this.geos[i % this.geos.length],
      this.mats[i % this.mats.length]
    );
    mesh.position.copy(p.center).addScaledVector(dir, dist);
    mesh.scale.setScalar(rnd(0.6, 1.4));
    mesh.rotation.set(rnd(0, 6), rnd(0, 6), rnd(0, 6));
    scene.add(mesh);

    // Model ke charo taraf ghoomta hua (tangent) drift
    const vel = new THREE.Vector3().crossVectors(dir, randomUnit()).normalize()
      .multiplyScalar(rnd(0.8, 2.6));
    const spin = randomUnit().multiplyScalar(rnd(0.3, 1.2));
    this.items.push({ mesh, vel, spin });
  }

  update(dt, t) {
    this.oxygen -= dt;
    setOxygen(Math.max(0, this.oxygen / this.oxygenMax), this.oxygenMax);
    if (this.oxygen <= 0) return 'failed';

    const c = this.place.center;
    let nearest = null;
    let nearestD = Infinity;

    for (const it of this.items) {
      if (!it.mesh.visible) continue;
      const m = it.mesh;
      m.position.addScaledVector(it.vel, dt);
      m.rotation.x += it.spin.x * dt;
      m.rotation.y += it.spin.y * dt;
      m.rotation.z += it.spin.z * dt;

      // Andar/bahar ki seema se takra ke wapas
      rad.copy(m.position).sub(c);
      const d = rad.length();
      rad.divideScalar(d || 1);
      const vr = it.vel.dot(rad);
      if ((d > this.maxR && vr > 0) || (d < this.minR && vr < 0)) {
        it.vel.addScaledVector(rad, -2 * vr);
      }

      const dp = m.position.distanceTo(camera.position);
      if (dp < this.def.pickRange) {
        m.visible = false;
        this.collected++;
        beep(1000, 0.2);
        setScore(this.collected, this.total, 'Debris collected');
        continue;
      }
      if (dp < nearestD) { nearestD = dp; nearest = it; }
    }

    if (this.collected >= this.total) return 'complete';

    if (nearest) {
      tmp.copy(nearest.mesh.position).project(camera);
      let x = tmp.x;
      let y = tmp.y;
      if (tmp.z > 1) { x = x >= 0 ? 0.9 : -0.9; y = -y; }
      setMarker(x, y, nearestD.toFixed(0) + ' m');
      setTask('Nearest debris: ' + nearestD.toFixed(0) + ' m');
    }
    return 'running';
  }

  dispose() {
    this.items.forEach((it) => scene.remove(it.mesh));
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
  }
}
