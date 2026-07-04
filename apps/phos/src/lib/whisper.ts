import { WhisperWasmService, ModelManager, convertFromArrayBuffer } from '@timur00kh/whisper.wasm';

export type WhisperStatus = 'idle' | 'loading' | 'listening' | 'transcribing' | 'error' | 'unsupported';
export type WhisperTier = 'local' | 'edge';

export interface WhisperSegment {
  text: string;
  timeStart: number;
  timeEnd: number;
  isPartial: boolean;
}

export interface WhisperState {
  status: WhisperStatus;
  tier: WhisperTier;
  transcript: string;
  segments: WhisperSegment[];
  error?: string;
}

const EDGE_ENDPOINT = (() => {
  try {
    return (import.meta as any).env?.PUBLIC_EDGE_AI_URL
      ? `${(import.meta as any).env.PUBLIC_EDGE_AI_URL}/transcribe`
      : 'https://gateway.p31ca.org/transcribe';
  } catch {
    return 'https://gateway.p31ca.org/transcribe';
  }
})();

export class WhisperEngine {
  private whisper: WhisperWasmService | null = null;
  private modelManager: ModelManager | null = null;
  private session: any = null;
  private isLocalReady = false;
  private listeners: Set<(state: WhisperState) => void> = new Set();
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  public state: WhisperState = {
    status: 'idle',
    tier: 'local',
    transcript: '',
    segments: [],
  };

  private emit() {
    this.listeners.forEach(fn => fn({ ...this.state }));
  }

  subscribe(fn: (state: WhisperState) => void): () => void {
    this.listeners.add(fn);
    fn({ ...this.state });
    return () => this.listeners.delete(fn);
  }

  async init(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || typeof WebAssembly === 'undefined') {
        this.state = { ...this.state, status: 'unsupported', tier: 'edge' };
        this.emit();
        return false;
      }

      this.state = { ...this.state, status: 'loading' };
      this.emit();

      const { WhisperWasmService, ModelManager, convertFromArrayBuffer } = await import('@timur00kh/whisper.wasm');

      const wasmSupported = await WhisperWasmService.prototype.checkWasmSupport();
      if (!wasmSupported) {
        this.state = { ...this.state, status: 'unsupported', tier: 'edge' };
        this.emit();
        return false;
      }

      this.whisper = new WhisperWasmService({ logLevel: 1 });
      this.modelManager = new ModelManager();

      const modelBytes = await this.modelManager.loadModel('base', true);
      await this.whisper.initModel(modelBytes);

      this.session = this.whisper.createSession();
      this.isLocalReady = true;
      this.state = { ...this.state, status: 'idle', tier: 'local' };
      this.emit();
      return true;
    } catch (err) {
      this.state = {
        ...this.state,
        status: 'unsupported',
        tier: 'edge',
        error: err instanceof Error ? err.message : 'WASM init failed',
      };
      this.emit();
      return false;
    }
  }

  async startRecording(): Promise<void> {
    if (this.state.status === 'listening') return;

    if (this.isLocalReady && this.whisper && this.session) {
      try {
        this.chunks = [];
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
          try {
            this.state = { ...this.state, status: 'transcribing' };
            this.emit();

            const blob = new Blob(this.chunks, { type: mimeType });
            const arrayBuffer = await blob.arrayBuffer();

            const { audioData } = await convertFromArrayBuffer(arrayBuffer);

            this.chunks = [];
            this.state = { ...this.state, status: 'listening', transcript: '', segments: [] };
            this.emit();

            for await (const segment of this.session.streaming(audioData, {
              language: 'en',
              threads: 4,
              translate: false,
            })) {
              const newSegment: WhisperSegment = {
                text: segment.text,
                timeStart: segment.timeStart,
                timeEnd: segment.timeEnd,
                isPartial: true,
              };
              this.state.segments.push(newSegment);
              this.state.transcript = this.state.segments.map(s => s.text).join(' ');
              this.emit();
            }

            this.state.segments.forEach(s => { s.isPartial = false; });
            this.state.status = 'idle';
            this.emit();
          } catch (err) {
            this.state = {
              ...this.state,
              status: 'error',
              error: err instanceof Error ? err.message : 'Local transcription failed',
            };
            this.emit();
          }
        };

        this.mediaRecorder.start(250);
        this.state = { ...this.state, status: 'listening', tier: 'local', transcript: '', segments: [] };
        this.emit();
        return;
      } catch (err) {
        console.warn('Local WASM recording failed, escalating to edge:', err);
        this.cleanupRecording();
      }
    }

    await this.edgeTranscribe();
  }

  private async edgeTranscribe(): Promise<void> {
    try {
      this.chunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      await new Promise<void>((resolve, reject) => {
        this.mediaRecorder!.onstop = () => resolve();
        this.mediaRecorder!.onerror = () => reject(new Error('MediaRecorder error'));
        this.mediaRecorder!.start(250);
      });

      this.cleanupRecording();

      const audioBlob = new Blob(this.chunks, { type: mimeType });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      this.state = { ...this.state, status: 'transcribing', tier: 'edge' };
      this.emit();

      const response = await fetch(EDGE_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Edge Whisper returned ${response.status}`);

      const data = await response.json();
      const text = data.text || '';

      this.state = {
        ...this.state,
        status: 'idle',
        transcript: text,
        segments: [{ text, timeStart: 0, timeEnd: 0, isPartial: false }],
      };
      this.emit();
    } catch (err) {
      this.cleanupRecording();
      this.state = {
        ...this.state,
        status: 'error',
        error: err instanceof Error ? err.message : 'Edge transcription failed',
      };
      this.emit();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanupRecording();
    if (this.state.status === 'listening') {
      this.state = { ...this.state, status: 'idle' };
      this.emit();
    }
  }

  private cleanupRecording(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  resetTranscript(): void {
    this.state = { ...this.state, transcript: '', segments: [] };
    this.emit();
  }
}

export const whisper = new WhisperEngine();
