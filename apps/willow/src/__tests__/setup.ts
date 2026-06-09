import '@testing-library/jest-dom'

const noop = () => {}

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  writable: true,
  value: localStorageMock,
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: noop,
    removeListener: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    observe = noop
    unobserve = noop
    disconnect = noop
  },
})

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: () =>
      Promise.resolve({
        getTracks: () => [{ stop: noop }],
      }),
  },
})

const origGetContext = HTMLCanvasElement.prototype.getContext
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(HTMLCanvasElement.prototype as any).getContext = function (
    id: string,
    ...args: unknown[]
  ) {
    if (id === '2d') {
      return {
        fillRect: noop,
        clearRect: noop,
        fillText: noop,
        beginPath: noop,
        moveTo: noop,
        lineTo: noop,
        stroke: noop,
        quadraticCurveTo: noop,
        arc: noop,
        fill: noop,
        closePath: noop,
        save: noop,
        restore: noop,
        translate: noop,
        rotate: noop,
        scale: noop,
        setTransform: noop,
        drawImage: noop,
        createImageData: noop,
        getImageData: noop,
        putImageData: noop,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        fillStyle: '#000',
        strokeStyle: '#000',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        canvas: this,
      }
    }
    if (id === 'webgl' || id === 'webgl2') {
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return origGetContext.apply(this, [id, ...args] as any)
  }

Object.defineProperty(globalThis, 'AudioContext', {
  writable: true,
  value: class AudioContext {
    state = 'running'
    currentTime = 0
    destination = {}
    createOscillator = () => ({
      connect: noop,
      start: noop,
      stop: noop,
      disconnect: noop,
      type: 'sine',
      frequency: {
        setValueAtTime: noop,
        exponentialRampToValueAtTime: noop,
        linearRampToValueAtTime: noop,
        value: 440,
      },
    })
    createGain = () => ({
      connect: noop,
      disconnect: noop,
      gain: {
        setValueAtTime: noop,
        exponentialRampToValueAtTime: noop,
        linearRampToValueAtTime: noop,
        value: 1,
      },
    })
    createAnalyser = () => ({
      connect: noop,
      disconnect: noop,
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: noop,
      getByteTimeDomainData: noop,
    })
    createBiquadFilter = () => ({
      connect: noop,
      disconnect: noop,
      type: 'lowpass',
      frequency: { value: 440, setValueAtTime: noop },
      Q: { value: 1 },
      gain: { value: 0, setValueAtTime: noop },
    })
    resume = () => Promise.resolve()
    close = () => Promise.resolve()
  },
})

Object.defineProperty(globalThis, 'webkitAudioContext', {
  writable: true,
  value: class webkitAudioContext extends (globalThis.AudioContext as unknown as new () => AudioContext) {},
})

Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  writable: true,
  value: class SpeechSynthesisUtterance {
    text = ''
    rate = 1
    pitch = 1
    volume = 1
    onend = noop
    onerror = noop
  },
})

Object.defineProperty(globalThis, 'speechSynthesis', {
  writable: true,
  value: {
    speak: noop,
    cancel: noop,
  },
})

let rafId = 0
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  writable: true,
  value: (_cb: FrameRequestCallback) => ++rafId,
})
Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  writable: true,
  value: () => {},
})
