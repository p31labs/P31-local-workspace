import { useState, useRef, useCallback, useEffect } from 'react';
import { useShipStore } from '../store/shipStore';

export interface GazeSignalsState {
  pupilDilation: number;
  active: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

const EMA_FACTOR = 0.05;

function computeIrisDiameter(
  landmarks: { x: number; y: number; z: number }[],
  centerIdx: number,
  boundaryStartIdx: number
): number {
  const center = landmarks[centerIdx];
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const b = landmarks[boundaryStartIdx + i];
    const dx = center.x - b.x;
    const dy = center.y - b.y;
    sum += Math.sqrt(dx * dx + dy * dy);
  }
  return (sum / 4) * 2;
}

let faceLandmarkerPromise: Promise<any> | null = null;
let activeStream: MediaStream | null = null;
let activeVideo: HTMLVideoElement | null = null;
let activeCanvas: HTMLCanvasElement | null = null;
let activeCtx: CanvasRenderingContext2D | null = null;
let rafId: number | null = null;
let isTracking = false;

function releaseResources(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }
  if (activeVideo) {
    activeVideo.srcObject = null;
    activeVideo = null;
  }
  activeCanvas = null;
  activeCtx = null;
  isTracking = false;
}

async function ensureFaceLandmarker(): Promise<any> {
  if (faceLandmarkerPromise) return faceLandmarkerPromise;

  faceLandmarkerPromise = (async () => {
    try {
      const { FilesetResolver, FaceLandmarker } = await import(
        '@mediapipe/tasks-vision'
      );
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    } catch {
      throw new Error('Failed to load MediaPipe FaceLandmarker');
    }
  })();

  return faceLandmarkerPromise;
}

export function useGazeSignals(): GazeSignalsState {
  const [pupilDilation, setPupilDilation] = useState(0);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smoothedRef = useRef(0);
  const gazeActive = useShipStore((s) => s.gazeActive);
  const setGazeActive = useShipStore((s) => s.setGazeActive);
  const spoons = useShipStore((s) => s.spoons);
  const gazeActiveRef = useRef(gazeActive);
  gazeActiveRef.current = gazeActive;
  const spoonsRef = useRef(spoons);
  spoonsRef.current = spoons;

  const detectFrame = useCallback(
    (landmarker: any) => {
      if (!isTracking || !activeVideo || !activeCtx || !activeCanvas) return;

      if (activeVideo.readyState >= 2) {
        try {
          activeCtx.drawImage(
            activeVideo,
            0,
            0,
            activeCanvas.width,
            activeCanvas.height
          );
          const result = landmarker.detectForVideo(
            activeCanvas,
            performance.now()
          );

          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0];

            const leftDiameter = computeIrisDiameter(landmarks, 468, 469);
            const rightDiameter = computeIrisDiameter(landmarks, 473, 474);
            const avgDiameter = (leftDiameter + rightDiameter) / 2;

            const leftCenter = landmarks[468];
            const rightCenter = landmarks[473];
            const ipd = Math.sqrt(
              (leftCenter.x - rightCenter.x) ** 2 +
                (leftCenter.y - rightCenter.y) ** 2
            );

            const relativeDilation = ipd > 0 ? avgDiameter / ipd : 0;
            const normalized = Math.max(
              0,
              Math.min(1, (relativeDilation - 0.12) / 0.15)
            );

            smoothedRef.current +=
              EMA_FACTOR * (normalized - smoothedRef.current);
            setPupilDilation(smoothedRef.current);
          }
        } catch {
          // Silently skip frames that fail processing
        }
      }

      rafId = requestAnimationFrame(() => detectFrame(landmarker));
    },
    []
  );

  const startTracking = useCallback(async () => {
    if (isTracking) return;
    if (spoonsRef.current <= 1) return;

    setError(null);
    try {
      const landmarker = await ensureFaceLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas 2d context');

      activeStream = stream;
      activeVideo = video;
      activeCanvas = canvas;
      activeCtx = ctx;
      isTracking = true;
      setActive(true);
      setGazeActive(true);

      rafId = requestAnimationFrame(() => detectFrame(landmarker));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to initialize gaze tracking';
      setError(msg);
      releaseResources();
      setGazeActive(false);
    }
  }, [detectFrame, setGazeActive]);

  const stopTracking = useCallback(() => {
    releaseResources();
    setActive(false);
    setGazeActive(false);
  }, [setGazeActive]);

  useEffect(() => {
    if (spoons <= 1) {
      releaseResources();
      setActive(false);
      return;
    }
    if (gazeActive && !isTracking) {
      startTracking();
    } else if (!gazeActive && isTracking) {
      releaseResources();
      setActive(false);
    }

    return () => {
      releaseResources();
    };
  }, [gazeActive, startTracking, spoons]);

  return { pupilDilation, active, error, startTracking, stopTracking };
}
