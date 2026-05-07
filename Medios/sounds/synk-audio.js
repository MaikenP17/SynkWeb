// SYNK Audio Engine — procedural synthesis via Web Audio API
const SynkAudio = (function () {
  let ac = null;
  const OFFSET = 0.06; // schedule 60ms ahead to survive context resume latency

  function getCtx() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function osc(freq, type, gain, dur, opts) {
    try {
      const a = getCtx();
      const delay = (opts && opts.delay) || 0;
      const t = a.currentTime + OFFSET + delay;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (opts && opts.end) {
        o.frequency.exponentialRampToValueAtTime(opts.end, t + dur);
      }
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    } catch (e) {}
  }

  function noise(gain, dur, filterFreq) {
    try {
      const a = getCtx();
      const t = a.currentTime + OFFSET;
      const len = Math.ceil(a.sampleRate * dur);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource();
      src.buffer = buf;
      const flt = a.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.value = filterFreq;
      flt.Q.value = 1.8;
      const g = a.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(flt);
      flt.connect(g);
      g.connect(a.destination);
      src.start(t);
    } catch (e) {}
  }

  return {
    init() {
      try { getCtx(); } catch (e) {}
    },

    isReady() {
      return !!ac && ac.state === 'running';
    },

    // Ascending synth arpeggio — game start
    start() {
      [330, 440, 523, 660].forEach((f, i) =>
        osc(f, 'triangle', 0.17, 0.22, { end: f * 1.01, delay: i * 0.07 })
      );
    },

    // Crystal double-ping — food eaten
    eat() {
      osc(1047, 'sine', 0.2, 0.12);
      osc(1318, 'sine', 0.13, 0.09, { delay: 0.04 });
    },

    // Short freq-drop click — ball bounce
    bounce() {
      osc(280, 'square', 0.1, 0.04, { end: 140 });
    },

    // Noise burst + sub-thud — brick destroyed
    breakBrick() {
      noise(0.22, 0.07, 500 + Math.random() * 500);
      osc(180, 'sine', 0.12, 0.09, { end: 70 });
    },

    // Descending minor — game over
    gameOver() {
      [440, 370, 293, 220].forEach((f, i) =>
        osc(f, 'sawtooth', 0.14, 0.28, { end: f * 0.76, delay: i * 0.13 })
      );
    },

    // Ascending bright arpeggio — victory
    victory() {
      [523, 659, 784, 880, 1047].forEach((f, i) =>
        osc(f, 'sine', 0.17, 0.38, { end: f * 1.005, delay: i * 0.1 })
      );
    },

    // Subliminal tick — hover (only after first interaction)
    hover() {
      if (!ac || ac.state !== 'running') return;
      osc(1700, 'sine', 0.05, 0.03);
    },

    // Two-tone confirm — card select
    select() {
      osc(660, 'sine', 0.17, 0.14);
      osc(990, 'sine', 0.14, 0.11, { delay: 0.08 });
    },
  };
})();
