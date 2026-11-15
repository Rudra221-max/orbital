import * as THREE from 'three';

const ray = new THREE.Raycaster();
const normal = new THREE.Vector3();
const dir = new THREE.Vector3();
let colliders = [];

const AXES = [
  new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
];

// Station ki saari meshes ko collider bana do
export function setColliders(root) {
  colliders = [];
  if (!root) return;
  root.updateMatrixWorld(true);
  root.traverse((o) => { if (o.isMesh) colliders.push(o); });
}

function push(pos, vel, d, far, radius) {
  ray.set(pos, d);
  ray.far = far;
  const hit = ray.intersectObjects(colliders, false)[0];
  if (!hit || hit.distance >= radius) return;

  normal.copy(hit.face ? hit.face.normal : d.clone().negate())
    .transformDirection(hit.object.matrixWorld);
  if (normal.dot(d) > 0) normal.negate();      // normal player ki taraf rakho

  pos.addScaledVector(normal, radius - hit.distance);   // bahar dhakelo
  const vn = vel.dot(normal);
  if (vn < 0) vel.addScaledVector(normal, -vn);         // deewar ke andar wali speed cancel
}

export function collide(pos, vel, dt, radius = 1.2) {
  if (!colliders.length) return;

  // 1) Jis taraf ja rahe ho, us taraf aage tak dekho (tez speed par andar na ghuse)
  const speed = vel.length();
  if (speed > 0.001) {
    dir.copy(vel).normalize();
    push(pos, vel, dir, radius + speed * dt, radius);
  }
  // 2) Chaaron taraf se bhi check (side/upar/neeche)
  for (const a of AXES) push(pos, vel, a, radius, radius);
}