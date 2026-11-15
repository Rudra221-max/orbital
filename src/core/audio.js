let ctx = null;

// User ke click ke baad hi chalu hona chahiye (browser rule)
export function initAudio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
}

export function beep(freq = 800, dur = 0.15, vol = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}