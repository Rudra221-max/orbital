import * as THREE from 'three';

export const $ = (id) => document.getElementById(id);

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Model ko ek fixed size mein fit karke center karta hai
export function fitModel(obj, size) {
  const box = new THREE.Box3().setFromObject(obj);
  const dim = box.getSize(new THREE.Vector3());
  obj.scale.multiplyScalar(size / Math.max(dim.x, dim.y, dim.z));
  const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  obj.position.sub(c);
}

// Ek sphere par barabar doori ke points
export function fibonacciSphere(count, radius, center) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    pts.push(new THREE.Vector3(
      center.x + radius * Math.sin(phi) * Math.cos(theta),
      center.y + radius * Math.cos(phi),
      center.z + radius * Math.sin(phi) * Math.sin(theta)
    ));
  }
  return pts;
}

// Origin se target ki taraf ray chalao, station ki body par pehla hit point + surface normal deta hai
const raycaster = new THREE.Raycaster();
export function surfaceHit(root, origin, target) {
  const dir = target.clone().sub(origin).normalize();
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObject(root, true);
  if (!hits.length) return null;
  const h = hits[0];
  const normal = h.face
    ? h.face.normal.clone().transformDirection(h.object.matrixWorld)
    : dir.clone().negate();
  if (normal.dot(dir) > 0) normal.negate(); // normal hamesha bahar ki taraf
  return { point: h.point.clone(), normal };
}