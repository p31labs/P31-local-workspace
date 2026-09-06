export const audioEngine = {
  ctx: null as AudioContext | null,
  masterGain: null as GainNode | null,
  filter: null as BiquadFilterNode | null,
  oscBase: null as OscillatorNode | null,
  oscNoise: null as OscillatorNode | null,
  noiseGain: null as GainNode | null,
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.15;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 20000;
    this.oscBase = this.ctx.createOscillator();
    this.oscBase.type = 'sine';
    this.oscBase.frequency.value = 55;
    this.oscNoise = this.ctx.createOscillator();
    this.oscNoise.type = 'sawtooth';
    this.oscNoise.frequency.value = 55;
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.oscBase.connect(this.masterGain);
    this.oscNoise.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.masterGain.connect(this.filter);
    this.filter.connect(this.ctx.destination);
    this.oscBase.start();
    this.oscNoise.start();
  },
  destroy() {
    if (!this.ctx) return;
    this.oscBase?.stop();
    this.oscNoise?.stop();
    this.oscBase?.disconnect();
    this.oscNoise?.disconnect();
    this.noiseGain?.disconnect();
    this.masterGain?.disconnect();
    this.filter?.disconnect();
    this.ctx.close();
    this.ctx = null;
    this.oscBase = null;
    this.oscNoise = null;
    this.noiseGain = null;
    this.masterGain = null;
    this.filter = null;
  },
  update(coherence: number, isTransitioning: boolean, activeRoom: string) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.filter!.frequency.setTargetAtTime(isTransitioning ? 300 : 20000, this.ctx.currentTime, 0.1);
    if (activeRoom === 'BUFFER') {
      this.oscBase!.frequency.setTargetAtTime(432, this.ctx.currentTime, 1.0);
      this.noiseGain!.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    } else {
      const jitter = (1.0 - coherence) * 20;
      this.oscBase!.frequency.setTargetAtTime(55 + (Math.random() * jitter), this.ctx.currentTime, 0.05);
      this.noiseGain!.gain.setTargetAtTime((1.0 - coherence) * 0.05, this.ctx.currentTime, 0.05);
    }
  }
};
