/**
 * geodesicStore — campaign + coach state for GeodesicMode.
 *
 * The engine fires string events via the onEvent callback.
 * This store decides whether to advance the campaign step.
 * React HUD reads this store and re-renders the coach overlay.
 */

import { create } from 'zustand';
import { GEODESIC_CAMPAIGN } from '@p31/shared/geodesic-campaign';

const STORAGE_KEY = 'geodesic:progress:v1';

interface GeodesicState {
  trackIdx: number;
  stepIdx: number;
  coachDone: boolean;
  coachMinimized: boolean;
  toastMsg: string | null;
  shapeCount: number;
  wireMode: boolean;
  solidMode: boolean;
  autoSnap: boolean;
  fireEvent: (type: string) => void;
  skipCoach: () => void;
  setCoachMinimized: (v: boolean) => void;
  setShapeCount: (n: number) => void;
  setWireMode: (on: boolean) => void;
  setSolidMode: (on: boolean) => void;
  setAutoSnap: (on: boolean) => void;
  dismissToast: () => void;
  resetProgress: () => void;
}

function loadProgress(): { trackIdx: number; stepIdx: number; coachDone: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { trackIdx: 0, stepIdx: 0, coachDone: false };
    const s = JSON.parse(raw) as { track?: number; step?: number; done?: boolean };
    return {
      trackIdx: Math.min(Math.max(0, s.track ?? 0), GEODESIC_CAMPAIGN.tracks.length - 1),
      stepIdx:  Math.min(Math.max(0, s.step  ?? 0), (GEODESIC_CAMPAIGN.tracks[s.track ?? 0]?.steps.length ?? 1) - 1),
      coachDone: !!s.done,
    };
  } catch {
    return { trackIdx: 0, stepIdx: 0, coachDone: false };
  }
}

function saveProgress(trackIdx: number, stepIdx: number, coachDone: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ track: trackIdx, step: stepIdx, done: coachDone }));
  } catch { /* storage full */ }
}

const initial = loadProgress();

export const useGeodesicStore = create<GeodesicState>((set, get) => ({
  ...initial,
  coachMinimized: false,
  toastMsg: null,
  shapeCount: 0,
  wireMode: true,
  solidMode: false,
  autoSnap: false,

  fireEvent(type: string) {
    const { trackIdx, stepIdx, coachDone } = get();
    if (coachDone) return;
    const track = GEODESIC_CAMPAIGN.tracks[trackIdx];
    const step  = track?.steps[stepIdx];
    if (!step) return;

    const wf = step.waitFor;
    let matches = false;
    if (wf === 'any_tap' || wf === type) {
      matches = true;
    } else if (wf.startsWith('shape_count:') && type.startsWith('shape_count:')) {
      matches = parseInt(type.split(':')[1]!) >= parseInt(wf.split(':')[1]!);
    } else if (wf.startsWith('shape_added:') && wf === type) {
      matches = true;
    }
    if (!matches) return;

    if (step.celebration) {
      set({ toastMsg: step.celebration });
      setTimeout(() => set({ toastMsg: null }), 2200);
    }

    const newStep = stepIdx + 1;
    if (newStep < track.steps.length) {
      set({ stepIdx: newStep });
      saveProgress(trackIdx, newStep, false);
      return;
    }

    // End of track
    const newTrack = trackIdx + 1;
    if (newTrack >= GEODESIC_CAMPAIGN.tracks.length) {
      set({ coachDone: true, toastMsg: 'All tools unlocked!' });
      setTimeout(() => set({ toastMsg: null }), 2200);
      saveProgress(newTrack, 0, true);
    } else {
      set({ trackIdx: newTrack, stepIdx: 0 });
      saveProgress(newTrack, 0, false);
    }
  },

  skipCoach() {
    set({ coachDone: true });
    saveProgress(GEODESIC_CAMPAIGN.tracks.length, 0, true);
  },

  setCoachMinimized: (v) => set({ coachMinimized: v }),
  setShapeCount: (n) => set({ shapeCount: n }),
  setWireMode: (on) => set({ wireMode: on }),
  setSolidMode: (on) => set({ solidMode: on }),
  setAutoSnap: (on) => set({ autoSnap: on }),
  dismissToast: () => set({ toastMsg: null }),

  resetProgress() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
    set({ trackIdx: 0, stepIdx: 0, coachDone: false, coachMinimized: false, toastMsg: null });
  },
}));

export function unlockedThroughTrack(trackIdx: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i <= trackIdx; i++) {
    for (const id of GEODESIC_CAMPAIGN.tracks[i]?.unlock ?? []) ids.push(id);
  }
  return ids;
}
