import { $, clamp } from '../utils/helpers.js';

const RING = 2 * Math.PI * 40; // ring ki circumference

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

export const showHUD = () => $('hud').classList.remove('hidden');
export const hideHUD = () => $('hud').classList.add('hidden');
export const showResume = (show) => $('resume').classList.toggle('hidden', !show);

export const setScore = (done, total, label = 'Cracks repaired') =>
  ($('score').textContent = `${label}: ${done} / ${total}`);
export const setScoreText = (text) => ($('score').textContent = text);

export const setTask = (text) => ($('task').textContent = text);

function setRing(ringId, valId, pct) {
  const p = clamp(pct, 0, 1);
  const ring = $(ringId);
  ring.style.strokeDashoffset = RING * (1 - p);
  ring.classList.toggle('low', p < 0.25);
  $(valId).textContent = Math.round(p * 100) + '%';
}

// maxSeconds = is mission ka total oxygen (har mission ka alag hota hai)
export function setOxygen(pct, maxSeconds) {
  setRing('o2ring', 'o2val', pct);
  $('o2time').textContent = fmt(pct * maxSeconds);
}

export const setFuel = (pct) => setRing('fuelring', 'fuelval', pct);

export const setTimer = (seconds) => ($('timer').textContent = 'T+ ' + fmt(seconds));

// x, y = screen coordinates -1 se +1 tak (visor ke window ke andar rakhte hain)
export function setMarker(x, y, text) {
  const mx = clamp(x, -0.72, 0.72);
  const my = clamp(y, -0.6, 0.6);
  const el = $('marker');
  el.style.left = (mx * 0.5 + 0.5) * innerWidth + 'px';
  el.style.top = (-my * 0.5 + 0.5) * innerHeight + 'px';
  $('markerText').textContent = text;
}
