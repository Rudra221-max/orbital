import { $ } from '../utils/helpers.js';
import { beep } from '../core/audio.js';

let allFacts = null;

// key = the mission's quiz name ('crack' / 'debris' / 'airlock'). Returns { score, total } when finished
export async function runQuiz(key) {
  if (!allFacts) allFacts = await (await fetch('/data/facts.json')).json();
  const facts = allFacts[key] || [];
  if (!facts.length) return { score: 0, total: 0 };

  const box = $('quiz');
  box.classList.remove('hidden');
  let i = 0;
  let score = 0;

  return new Promise((resolve) => {
    const show = () => {
      if (i >= facts.length) {
        box.classList.add('hidden');
        box.innerHTML = '';
        resolve({ score, total: facts.length });
        return;
      }
      const f = facts[i];
      box.innerHTML = `<h2>${f.q}</h2><div class="opts">${
        f.options.map((o, k) => `<button data-k="${k}">${o}</button>`).join('')
      }</div>`;

      box.querySelectorAll('button').forEach((b) => {
        b.onclick = () => {
          const ok = +b.dataset.k === f.answer;
          if (ok) score++;
          beep(ok ? 900 : 300, 0.25);
          box.innerHTML = `<h2>${ok ? 'Correct!' : 'Not quite.'}</h2>
            <p class="fact">${f.fact}</p><button id="next">NEXT</button>`;
          $('next').onclick = () => { i++; show(); };
        };
      });
    };
    show();
  });
}