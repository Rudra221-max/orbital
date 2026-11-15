import * as THREE from 'three';
import { camera, render } from './core/renderer.js';
import { initAudio } from './core/audio.js';
import { look, inputState, lockPointer, unlockPointer, onLockChange } from './core/input.js';
import { updatePlayer, resetPlayer, getFuel } from './core/player.js';
import { setColliders } from './core/collision.js';
import { initHands, updateHands } from './core/hands.js';
import { loadPlace, showLoading, hideLoading } from './scenes/Place.js';
import { showMenu } from './scenes/Menu.js';
import { showReport } from './scenes/Results.js';
import { runQuiz } from './ui/quiz.js';
import { showHUD, hideHUD, showResume, setFuel, setTimer } from './ui/hud.js';
import { $ } from './utils/helpers.js';
import { MISSIONS } from './utils/missions.js';
import { Spacewalk } from './modules/Spacewalk.js';
import { Debris } from './modules/Debris.js';
import { Airlock } from './modules/Airlock.js';

// mission.type -> module class
const MODULES = { crack: Spacewalk, debris: Debris, airlock: Airlock };

let place = null;        // abhi ka 3D place (station / satellite ...)
let current = null;      // abhi chal raha mission module
let playing = false;
let busy = false;
let missionIndex = 0;
let missionTime = 0;
const history = [];      // clear hue missions ki stats
const clock = new THREE.Clock();

async function ensurePlace(def) {
  if (place && place.key === def.model) return;     // wahi place hai to dobara load nahi
  if (place) { place.dispose(); place = null; }
  place = await loadPlace(def);
}

async function startMission(index) {
  if (busy) return;
  busy = true;
  missionIndex = index;
  const def = MISSIONS[index];
  initAudio();
  $('results').classList.add('hidden');

  showLoading(`MISSION ${index + 1} / ${MISSIONS.length}: ${def.name}`, def.brief);
  // brief padhne ka time dene ke liye kam se kam 2.2 second loading screen
  await Promise.all([ensurePlace(def.place), new Promise((r) => setTimeout(r, 2200))]);
  setColliders(place.root);
  hideLoading();

  camera.position.copy(place.startPosition);
  look.yaw = 0;
  look.pitch = 0;
  resetPlayer();
  missionTime = 0;

  current = new MODULES[def.type](place, def);
  showHUD();
  inputState.enabled = true;
  playing = true;
  showResume(true);      // lock na mile (browser rule) to "click karo" screen dikhe
  lockPointer();
  busy = false;
}

async function endMission(status) {
  playing = false;
  inputState.enabled = false;
  unlockPointer();
  hideHUD();
  showResume(false);

  const def = MISSIONS[missionIndex];
  const stats = {
    index: missionIndex,
    count: MISSIONS.length,
    name: def.name,
    status,
    time: missionTime,
    oxygenLeft: Math.max(0, current.oxygen),
    oxygenMax: current.oxygenMax,
    fuelLeft: getFuel(),
    score: 0,
    total: 0,
  };
  current.dispose();
  current = null;

  if (status === 'complete') {
    const q = await runQuiz(def.quiz);
    stats.score = q.score;
    stats.total = q.total;
    history[missionIndex] = stats;
  }

  showReport(stats, {
    hasNext: status === 'complete' && missionIndex < MISSIONS.length - 1,
    history,
    onNext: () => startMission(missionIndex + 1),
    onReplay: () => startMission(missionIndex),
    onMenu: () => {
      $('results').classList.add('hidden');
      history.length = 0;
      showMenu(() => startMission(0));
    },
  });
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (playing && current) {
    updatePlayer(dt);
    missionTime += dt;
    setTimer(missionTime);
    setFuel(getFuel());
    const status = current.update(dt, t);
    if (status !== 'running') endMission(status);
  }

  updateHands(dt, t);
  if (place) place.update(dt, t);
  render();
}

async function init() {
  // Menu ke peeche pehle mission ka place dikhega
  await Promise.all([
    ensurePlace(MISSIONS[0].place),
    initHands().catch((e) => console.error('HANDS FAIL:', e)),
  ]);
  setColliders(place.root);
  camera.position.copy(place.startPosition);

  // Esc dabane par "Click karo" screen
  onLockChange((locked) => { if (playing) showResume(!locked); });
  $('resume').onclick = lockPointer;

  showMenu(() => startMission(0));
  animate();
}

init();
