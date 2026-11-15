import { $ } from '../utils/helpers.js';

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

// 1-3 star: oxygen bacha (70%) + quiz score (30%)
export function calcStars(s) {
  if (s.status !== 'complete') return 0;
  const o2 = s.oxygenMax ? s.oxygenLeft / s.oxygenMax : 0;
  const quiz = s.total ? s.score / s.total : 1;
  const pts = o2 * 0.7 + quiz * 0.3;
  return pts >= 0.65 ? 3 : pts >= 0.35 ? 2 : 1;
}
const starText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

// s = stats, history = ab tak clear hue missions ki stats (final report ke liye)
export function showReport(s, { hasNext, history, onNext, onReplay, onMenu }) {
  const ok = s.status === 'complete';
  const final = ok && !hasNext;
  const stars = calcStars(s);

  const title = !ok ? 'MISSION FAILED' : final ? 'ALL MISSIONS COMPLETE' : 'MISSION REPORT';
  const sub = `Mission ${s.index + 1} / ${s.count}: ${s.name}`;

  let rows = `
    <tr><td>Status</td><td>${ok ? 'CLEARED' : 'FAILED (oxygen khatam)'}</td></tr>
    <tr><td>Time</td><td>${fmt(s.time)}</td></tr>
    <tr><td>Oxygen bacha</td><td>${fmt(s.oxygenLeft)} / ${fmt(s.oxygenMax)}</td></tr>
    <tr><td>Fuel bacha</td><td>${Math.round(s.fuelLeft * 100)}%</td></tr>`;
  if (ok) rows += `<tr><td>Quiz</td><td>${s.score} / ${s.total}</td></tr>`;

  let summary = '';
  if (final && history) {
    const done = history.filter(Boolean);
    const total = done.reduce((a, h) => a + calcStars(h), 0);
    summary = `<h3>Campaign Summary</h3><table class="report-table">${
      done.map((h) => `<tr><td>${h.name}</td><td class="stars-sm">${starText(calcStars(h))}</td></tr>`).join('')
    }<tr><td><b>Total</b></td><td><b>${total} / ${s.count * 3}</b></td></tr></table>`;
  }

  const box = $('results');
  box.classList.remove('hidden');
  box.innerHTML = `
    <h1>${title}</h1>
    <p class="report-sub">${sub}</p>
    ${ok ? `<div class="stars">${starText(stars)}</div>` : ''}
    <table class="report-table">${rows}</table>
    ${summary}
    <div class="report-btns">
      ${hasNext ? '<button id="rNext">NEXT MISSION</button>' : ''}
      <button id="rReplay">REPLAY</button>
      <button id="rMenu">MENU</button>
    </div>`;

  if (hasNext) $('rNext').onclick = onNext;
  $('rReplay').onclick = onReplay;
  $('rMenu').onclick = onMenu;
}
