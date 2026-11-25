// Simmer & Serve — sound, made from nothing but the Web Audio API.
// Every sound is a short oscillator blip, so the game ships no audio files
// and loads nothing over the network. M toggles it; it starts muted-safe
// until the player first interacts, as browsers require.

/** A tiny synth: one context, one helper per sound. */
export class SoundBox {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  /** Create the context on first use, after a player gesture. */
  ensure() {
    if (this.context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
      return true;
    } catch {
      return false;
    }
  }

  /** One blip: a frequency that slides, for this long, at this volume. */
  blip(from, to, seconds, volume = 0.08, type = 'sine') {
    if (this.muted || !this.ensure()) return;
    const ctx = this.context;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  pickup() { this.blip(520, 720, 0.09, 0.07); }
  chop() { this.blip(180, 120, 0.07, 0.09, 'square'); }
  sizzle() { this.blip(900, 1400, 0.12, 0.04, 'sawtooth'); }
  ding() { this.blip(880, 880, 0.18, 0.09); this.blip(1320, 1320, 0.22, 0.06); }
  serve() { this.blip(660, 990, 0.16, 0.09); this.blip(990, 1320, 0.2, 0.07); }
  error() { this.blip(220, 140, 0.18, 0.09, 'square'); }
  tick() { this.blip(1200, 1200, 0.05, 0.05); }
  rush() { this.blip(440, 660, 0.3, 0.08, 'triangle'); }
}
