import * as THREE from 'three';
import { camera } from './renderer.js';
import { keys, look } from './input.js';
import { MOVE_SPEED, FUEL_BURN, FUEL_REGEN } from '../utils/config.js';
import { collide } from './collision.js';

const vel = new THREE.Vector3();
const dir = new THREE.Vector3();
let fuel = 100;

export const getFuel = () => fuel / 100; // 0 se 1
export const getVelocity = () => vel;

export function resetPlayer() {
  vel.set(0, 0, 0);
  fuel = 100;
}

export function updatePlayer(dt) {
  camera.rotation.set(look.pitch, look.yaw, 0);

  dir.set(0, 0, 0);
  if (keys.KeyW) dir.z -= 1;
  if (keys.KeyS) dir.z += 1;
  if (keys.KeyA) dir.x -= 1;
  if (keys.KeyD) dir.x += 1;
  if (dir.lengthSq() > 0) dir.normalize().applyQuaternion(camera.quaternion);
  if (keys.Space) dir.y += 1;
  if (keys.ShiftLeft || keys.ShiftRight) dir.y -= 1;

  // Jetpack: thrust par fuel kharch, rukne par dheere dheere wapas
  let power = 1;
  if (dir.lengthSq() > 0) {
    if (fuel > 0) fuel = Math.max(0, fuel - FUEL_BURN * dt);
    else power = 0.2; // fuel khatam = bahut kamzor thrust
  } else {
    fuel = Math.min(100, fuel + FUEL_REGEN * dt);
  }

  vel.addScaledVector(dir, MOVE_SPEED * power * dt);
  vel.multiplyScalar(Math.pow(0.3, dt)); // zero-g floaty feel
  camera.position.addScaledVector(vel, dt);
  collide(camera.position, vel, dt, 1.2);
}