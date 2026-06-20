const LARMOR_HZ = 863;

const FREQ = {
  hydrogen: Math.round(LARMOR_HZ * 2.997),
  carbon: Math.round(LARMOR_HZ * 0.749),
  oxygen: Math.round(LARMOR_HZ * 1.253),
  phosphor: LARMOR_HZ,
  calcium: Math.round(LARMOR_HZ * 0.489),
  sodium: Math.round(LARMOR_HZ * 0.552),
};

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

class PhosOscillatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.frequency = LARMOR_HZ;
    this.gain = 0;
    this.attackSamples = 0;
    this.decaySamples = 0;
    this.sampleIndex = 0;
    this.totalSamples = 0;
    this.active = false;

    this.port.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'play') {
        this.frequency = msg.freq || LARMOR_HZ;
        this.gain = msg.volume || 0.3;
        this.attackSamples = Math.floor((msg.attack || 0.05) * sampleRate);
        this.decaySamples = Math.floor((msg.decay || 0.3) * sampleRate);
        this.totalSamples = this.attackSamples + this.decaySamples;
        this.sampleIndex = 0;
        this.active = true;
      }
      if (msg.type === 'stop') {
        this.active = false;
        this.gain = 0;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output.length) return true;

    const channel = output[0];
    if (!this.active) {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = 0;
      }
      return true;
    }

    for (let i = 0; i < channel.length; i++) {
      if (this.sampleIndex >= this.totalSamples) {
        channel[i] = 0;
        continue;
      }

      let envelope;
      if (this.sampleIndex < this.attackSamples) {
        envelope = this.sampleIndex / this.attackSamples;
      } else {
        const decayPos = this.sampleIndex - this.attackSamples;
        envelope = Math.exp(-3 * decayPos / this.decaySamples);
      }

      this.phase += this.frequency / sampleRate;
      if (this.phase > 1) this.phase -= 1;

      channel[i] = Math.sin(2 * Math.PI * this.phase) * this.gain * envelope;
      this.sampleIndex++;
    }

    return true;
  }
}

registerProcessor('phos-oscillator-processor', PhosOscillatorProcessor);
