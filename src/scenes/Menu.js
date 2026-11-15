import { $ } from '../utils/helpers.js';

export function showMenu(onStart) {
  const btn = $('start');
  btn.disabled = false;
  btn.textContent = 'START MISSION';
  btn.onclick = () => {
    $('menu').classList.add('hidden');
    onStart();
  };
}