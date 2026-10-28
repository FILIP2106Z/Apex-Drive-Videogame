/**
 * Apex Horizon - Procedural Web Audio Sound Engine
 * Zero external audio files; 100% synthesized in code.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine oscillators
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Turbo whistle
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Tire squeal noise
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Radio music synthesizer
  private radioStation: 'off' | 'synthwave' | 'cyberpunk' | 'lofi' = 'synthwave';
  private radioGain: GainNode | null = null;
  private radioInterval: number | null = null;
  private radioStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      // Create white noise buffer for tires and impacts
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.initEngineAudio();
      this.initTireAudio();
      this.startRadio();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private initEngineAudio() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.15;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 800;

    // Primary engine sawtooth
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.value = 65;

    // Harmonic engine triangle
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.value = 130;

    // Sub-bass rumble sine
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.value = 35;

    // Turbo whistle
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.value = 1200;
    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.value = 0.0;
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.masterGain);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSubOsc.start();
    this.turboOsc.start();
  }

  private initTireAudio() {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.value = 0.0;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.value = 1200;
    this.tireFilter.Q.value = 3.5;

    this.tireNoiseNode = this.ctx.createBufferSource();
    this.tireNoiseNode.buffer = this.noiseBuffer;
    this.tireNoiseNode.loop = true;
    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.masterGain);
    this.tireNoiseNode.start();
  }

  public updateEngine(rpm: number, throttle: number, speedMs: number, nitroActive: boolean, isElectric = false) {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const clampedRpm = Math.max(900, Math.min(8500, rpm));

    if (isElectric) {
      // High-pitched electric whine
      const freq = 180 + (clampedRpm / 8500) * 1200;
      if (this.engineOsc1) this.engineOsc1.frequency.setTargetAtTime(freq, t, 0.05);
      if (this.engineOsc2) this.engineOsc2.frequency.setTargetAtTime(freq * 1.5, t, 0.05);
      if (this.engineFilter) this.engineFilter.frequency.setTargetAtTime(3000, t, 0.05);
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(0.08 + throttle * 0.1, t, 0.05);
    } else {
      // Internal combustion engine frequency
      const fundamental = (clampedRpm / 60) * 2.0; // 4-stroke V8 / 6-cylinder pulse
      if (this.engineOsc1) this.engineOsc1.frequency.setTargetAtTime(fundamental, t, 0.04);
      if (this.engineOsc2) this.engineOsc2.frequency.setTargetAtTime(fundamental * 2.0, t, 0.04);
      if (this.engineSubOsc) this.engineSubOsc.frequency.setTargetAtTime(fundamental * 0.5, t, 0.04);

      // Filter opens up with throttle for growl
      const filterFreq = 450 + (clampedRpm / 8500) * 2200 + throttle * 1400;
      if (this.engineFilter) this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.04);

      // Volume swells on load
      const volume = (0.12 + throttle * 0.22 + (nitroActive ? 0.15 : 0)) * (this.isMuted ? 0 : 1);
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(volume, t, 0.04);

      // Turbo spool whistle
      if (this.turboOsc && this.turboGain) {
        const turboTargetGain = throttle > 0.5 && clampedRpm > 3500 ? 0.06 : 0.0;
        const turboPitch = 800 + (clampedRpm / 8500) * 2400;
        this.turboOsc.frequency.setTargetAtTime(turboPitch, t, 0.08);
        this.turboGain.gain.setTargetAtTime(turboTargetGain, t, 0.1);
      }
    }
  }

  public updateTireScreech(slipAmount: number, speedMs: number) {
    if (!this.tireGain || !this.tireFilter || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (slipAmount > 0.15 && Math.abs(speedMs) > 3) {
      const targetGain = Math.min(0.28, (slipAmount - 0.15) * 0.4);
      this.tireGain.gain.setTargetAtTime(targetGain, t, 0.03);
      this.tireFilter.frequency.setTargetAtTime(1100 + slipAmount * 800, t, 0.03);
    } else {
      this.tireGain.gain.setTargetAtTime(0, t, 0.05);
    }
  }

  public playCollisionSound(intensity: number) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Low boom
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'triangle';
      boom.frequency.setValueAtTime(120, t);
      boom.frequency.exponentialRampToValueAtTime(30, t + 0.35);

      const vol = Math.min(0.8, 0.15 + intensity * 0.04);
      boomGain.gain.setValueAtTime(vol, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      boom.connect(boomGain);
      boomGain.connect(this.masterGain);
      boom.start(t);
      boom.stop(t + 0.36);

      // Crunch noise
      if (this.noiseBuffer) {
        const crunch = this.ctx.createBufferSource();
        const crunchFilter = this.ctx.createBiquadFilter();
        const crunchGain = this.ctx.createGain();

        crunch.buffer = this.noiseBuffer;
        crunchFilter.type = 'bandpass';
        crunchFilter.frequency.setValueAtTime(1800, t);
        crunchFilter.Q.value = 1.2;

        crunchGain.gain.setValueAtTime(vol * 0.7, t);
        crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        crunch.connect(crunchFilter);
        crunchFilter.connect(crunchGain);
        crunchGain.connect(this.masterGain);

        crunch.start(t);
        crunch.stop(t + 0.26);
      }
    } catch {
      // Audio fallback
    }
  }

  public playBlowOffValve() {
    if (!this.ctx || !this.masterGain || this.isMuted || !this.noiseBuffer) return;
    try {
      const t = this.ctx.currentTime;
      const bov = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      bov.buffer = this.noiseBuffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + 0.22);
      filter.Q.value = 4.0;

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      bov.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      bov.start(t);
      bov.stop(t + 0.23);
    } catch {}
  }

  public playHorn(active: boolean) {
    // Dual-tone automotive horn (400Hz + 500Hz)
    // Managed via state if needed
  }

  public playRepairSound() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
      chords.forEach((note, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, t + i * 0.08);

        gain.gain.setValueAtTime(0.12, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.42);
      });
    } catch {}
  }

  // Radio synthesizer tracks
  private startRadio() {
    if (!this.ctx || !this.masterGain) return;
    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.value = 0.08;
    this.radioGain.connect(this.masterGain);

    if (this.radioInterval) clearInterval(this.radioInterval);
    this.radioInterval = window.setInterval(() => {
      this.tickRadioStep();
    }, 240); // ~125 BPM 16th notes
  }

  private tickRadioStep() {
    if (!this.ctx || this.isMuted || this.radioStation === 'off' || !this.radioGain) return;
    const t = this.ctx.currentTime;
    this.radioStep = (this.radioStep + 1) % 16;

    if (this.radioStation === 'synthwave') {
      // 80s arpeggiated bassline: D minor / F / C / G
      const bassNotes = [73.42, 73.42, 87.31, 87.31, 65.41, 65.41, 98.0, 98.0];
      const note = bassNotes[Math.floor(this.radioStep / 2) % bassNotes.length];
      if (this.radioStep % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note, t);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(g);
        g.connect(this.radioGain);
        osc.start(t);
        osc.stop(t + 0.2);
      }
    } else if (this.radioStation === 'cyberpunk') {
      // Heavy mid-tempo electro bass stab
      if (this.radioStep % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(55, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(g);
        g.connect(this.radioGain);
        osc.start(t);
        osc.stop(t + 0.3);
      }
    } else if (this.radioStation === 'lofi') {
      // Smooth electric piano chords
      if (this.radioStep % 8 === 0) {
        [261.63, 329.63, 392.0, 493.88].forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const g = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.03, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
          osc.connect(g);
          g.connect(this.radioGain!);
          osc.start(t);
          osc.stop(t + 1.25);
        });
      }
    }
  }

  public setRadioStation(station: 'off' | 'synthwave' | 'cyberpunk' | 'lofi') {
    this.radioStation = station;
  }

  public getRadioStation() {
    return this.radioStation;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
