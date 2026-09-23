/**
 * Web Audio API synthesizer for Indian festive ambient drone and temple chime sound effects.
 * 100% self-contained, no external audio files needed!
 * Next.js SSR-safe.
 */

let audioCtx: AudioContext | null = null;
let droneGain: GainNode | null = null;
let droneOscs: OscillatorNode[] = [];
let isDronePlaying = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignored: browser autoplay policy requires user gesture before resuming
    });
  }
  return audioCtx;
}

/**
 * Play authentic brass temple bell / ghanti chime sound
 */
export function playTempleBell(frequency: number = 880): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic bell frequencies (metallic spectrum)
    const harmonics = [1, 2.02, 3.01, 4.25, 5.43];
    const gains = [0.4, 0.25, 0.15, 0.08, 0.04];

    harmonics.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency * mult, now);

      gain.gain.setValueAtTime(gains[i] * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 + i * 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.5);
    });
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

/**
 * Play soft sitar string pluck sound on clicks
 */
export function playSitarPluck(note: 'Sa' | 'Re' | 'Ga' | 'Ma' | 'Pa' | 'Dha' | 'Ni' = 'Sa'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const scale: Record<string, number> = {
      Sa: 261.63, // C4
      Re: 293.66, // D4
      Ga: 329.63, // E4
      Ma: 349.23, // F4
      Pa: 392.00, // G4
      Dha: 440.00,// A4
      Ni: 493.88  // B4
    };

    const baseFreq = scale[note] || 261.63;

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq * 2, now);

    // Dynamic lowpass filter to mimic acoustic string resonating chamber
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.8);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 1.2);
    subOsc.stop(now + 1.2);
  } catch (e) {
    console.warn('Audio pluck error:', e);
  }
}

/**
 * Toggle festive Indian Tanpura / ambient drone loop
 */
export function toggleFestiveDrone(enable?: boolean): boolean {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (isDronePlaying && enable !== true) {
      // Stop drone
      droneOscs.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      droneOscs = [];
      if (droneGain) {
        droneGain.disconnect();
        droneGain = null;
      }
      isDronePlaying = false;
      return false;
    }

    if (!isDronePlaying && enable !== false) {
      const now = ctx.currentTime;
      droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.01, now);
      droneGain.gain.linearRampToValueAtTime(0.05, now + 2); // Very soft ambient background
      droneGain.connect(ctx.destination);

      // Tanpura frequencies based on C (Pa - Sa - Sa - Kharaj Sa)
      const droneNotes = [196.00, 261.63, 261.63, 130.81];

      droneOscs = droneNotes.map((freq, i) => {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle pitch undulation (jawari buzz)
        lfo.frequency.setValueAtTime(0.3 + i * 0.15, now);
        lfoGain.gain.setValueAtTime(1.2, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        osc.connect(droneGain!);
        osc.start(now);
        lfo.start(now);

        return osc;
      });

      isDronePlaying = true;
      return true;
    }

    return isDronePlaying;
  } catch (e) {
    console.warn('Audio drone error:', e);
    return false;
  }
}

export function isDroneActive(): boolean {
  return isDronePlaying;
}
