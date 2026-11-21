// Sound: tiny WebAudio synth, no audio files. Every effect is a few
// oscillators shaped by a gain envelope, built lazily on the first user
// gesture (browsers only allow audio after one). A found difference
// chimes higher with the combo; a wrong click buzzes low; a hint blips;
// clearing a level plays a short arpeggio.

export function createSound() {
  let audio = null;
  let muted = false;

  function ensure() {
    if (audio) return audio;
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      audio = new Ctor();
    } catch {
      return null;
    }
    return audio;
  }

  function tone(freq, start, dur, type = 'sine', vol = 0.16) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + start);
    gain.gain.setValueAtTime(0, ac.currentTime + start);
    gain.gain.linearRampToValueAtTime(vol, ac.currentTime + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + start);
    osc.stop(ac.currentTime + start + dur + 0.05);
  }

  return {
    /** Unlock audio on a gesture; safe to call any time. */
    unlock() {
      ensure();
    },
    /** Silence every effect (M key); returns the new state. */
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    click() {
      tone(520, 0, 0.06, 'triangle', 0.08);
    },
    found(combo) {
      const base = 620 + Math.min(combo, 8) * 40;
      tone(base, 0, 0.14, 'sine', 0.18);
      tone(base * 1.5, 0.08, 0.2, 'sine', 0.16);
    },
    wrong() {
      tone(150, 0, 0.22, 'sawtooth', 0.12);
      tone(110, 0.05, 0.22, 'sawtooth', 0.1);
    },
    hint() {
      tone(880, 0, 0.1, 'sine', 0.12);
      tone(1174, 0.09, 0.14, 'sine', 0.1);
    },
    clear() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((freq, i) => tone(freq, i * 0.11, 0.24, 'triangle', 0.16));
    },
    over() {
      const notes = [392, 330, 262];
      notes.forEach((freq, i) => tone(freq, i * 0.16, 0.3, 'triangle', 0.14));
    },
  };
}
