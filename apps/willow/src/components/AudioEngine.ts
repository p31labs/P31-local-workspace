let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
  }
  return ctx
}

function playTone(type: OscillatorType, freq: number, duration: number, volume = 0.3) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch {
  }
}

export function playPop() {
  playTone('sine', 600, 0.1)
}

export function playSuccess() {
  playTone('sine', 880, 0.3)
}

export function playStamp() {
  playTone('square', 200, 0.15)
}

export function playBubblePop() {
  playTone('sine', 500, 0.08)
}

export function playMiss() {
  playTone('square', 150, 0.2, 0.2)
}

export function playWin() {
  playTone('sine', 1047, 0.4, 0.4)
}

export function playFlip() {
  playTone('sine', 440, 0.06)
}

export function playCatch() {
  playTone('triangle', 660, 0.12)
}

export { getCtx }
