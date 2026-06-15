(function () {
  var KEY = 'p31:onboard';

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }

  function set(obj) {
    try {
      var cur = get();
      for (var k in obj) cur[k] = obj[k];
      localStorage.setItem(KEY, JSON.stringify(cur));
    } catch (e) {}
  }

  window.__onboard = {
    door: function (d) { if (d) set({ door: d }); return get().door; },
    step: function (s) { if (s !== undefined) set({ step: s }); return get().step; },
    love: function (n) { if (n !== undefined) set({ love: n }); return get().love || 0; },
    name: function (n) { if (n) set({ name: n }); return get().name; },
    delta: function () { return !!get().delta; },
    complete: function () { set({ delta: true }); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };

  function playTone(freq, dur, type) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }

  window.__sfx = {
    pop: function () { playTone(800, 0.08, 'sine'); },
    chime: function () { playTone(523, 0.15, 'sine'); setTimeout(function () { playTone(659, 0.15, 'sine'); }, 120); setTimeout(function () { playTone(784, 0.25, 'sine'); }, 240); },
    sparkle: function () { playTone(1200, 0.06, 'sine'); setTimeout(function () { playTone(1600, 0.06, 'sine'); }, 50); },
    heart: function () { playTone(440, 0.3, 'triangle'); },
    done: function () { playTone(523, 0.2, 'sine'); setTimeout(function () { playTone(659, 0.2, 'sine'); }, 150); setTimeout(function () { playTone(784, 0.2, 'sine'); }, 300); setTimeout(function () { playTone(1047, 0.4, 'sine'); }, 450); },
    blink: function () { playTone(300, 0.05, 'square'); }
  };
})();
