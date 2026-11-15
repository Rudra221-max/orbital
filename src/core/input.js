import { renderer } from './renderer.js';
import { MOUSE_SENS } from '../utils/config.js';
import { clamp } from '../utils/helpers.js';

export const keys = {};
export const look = { yaw: 0, pitch: 0 };
export const inputState = { enabled: false };

addEventListener('keydown', (e) => (keys[e.code] = true));
addEventListener('keyup', (e) => (keys[e.code] = false));

addEventListener('mousemove', (e) => {
  if (!inputState.enabled || document.pointerLockElement !== renderer.domElement) return;
  look.yaw -= e.movementX * MOUSE_SENS;
  look.pitch = clamp(look.pitch - e.movementY * MOUSE_SENS, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
});

export const lockPointer = () => renderer.domElement.requestPointerLock();
export const unlockPointer = () => document.exitPointerLock();

export function onLockChange(callback) {
  document.addEventListener('pointerlockchange', () =>
    callback(document.pointerLockElement === renderer.domElement)
  );
}