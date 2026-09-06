import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getProfile,
  updateProfile as updateProfileStorage,
  ensureDid,
  hasSBTMilestone,
  addSBTMilestone,
  incrementMoodCount,
} from './profile';
import { getLoveBalance, mintLove, registerUser } from './love';
import { buildSBT, computeTetrahedronHash, mintSBTOnChain, LOVESBT_ADDRESS } from './sbt';
import { HeartbeatMesh } from './mesh';
import { pinJSONToIPFS } from './ipfs';
import { anchorCID } from './contracts';
import type {
  Profile,
  Tab,
  TetraVertex,
  SBT,
  MeshState,
  CryptoState,
  LoveBalance,
} from './types';

export interface Toast {
  message: string;
  type?: 'success' | 'error';
}

export interface UiState {
  showCrisis: boolean;
  showBreak: boolean;
  showPin: boolean;
  toast: Toast | null;
  pinTitle: string;
  pinDesc: string;
  pinResolve: ((value: string) => void) | null;
  pinReject: ((reason?: any) => void) | null;
  caregiverPanelVisible: boolean;
}

export interface SovereignState {
  profile: Profile;
  loveBalance: LoveBalance | null;
  did: string;
  mesh: MeshState;
  meshInstance: HeartbeatMesh | null;
  crypto: CryptoState;
  spoons: number;
  tab: Tab;
  darkMode: boolean;
  reduceMotion: boolean;
  soundEffects: boolean;
  timerSeconds: number;
  mood: string | null;
  ui: UiState;
  caregiverPin: string;
  setSpoons: (level: number) => void;
  setTab: (tab: Tab) => void;
  setDarkMode: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  setTimerSeconds: (seconds: number | ((prev: number) => number)) => void;
  setMood: (mood: string | null) => void;
  setUi: (ui: Partial<UiState>) => void;
  addStar: () => void;
  completeGame: () => void;
  updateProfile: (updates: Partial<Profile>) => void;
  updateTetrahedronVertex: (vertexIndex: 0 | 1 | 2 | 3, value: TetraVertex['value']) => void;
  addSBT: (sbt: SBT) => void;
  mintAchievementSBT: (name: string, description: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  extendSession: (minutes: number) => Promise<boolean>;
  openPin: (title: string, desc: string) => Promise<string>;
  closePin: () => void;
  refreshLoveBalance: () => Promise<void>;
  mintLove: (transactionType: string, metadata?: Record<string, unknown>) => Promise<boolean>;
  ensureDid: () => Promise<string>;
  setCaregiverPin: (pin: string) => void;
  setMeshInstance: (instance: HeartbeatMesh | null) => void;
  updateMesh: (updates: Partial<MeshState>) => void;
  incrementMoodCount: () => void;
  checkMoodMilestone: () => void;
  checkLoveMilestone: () => void;
}

const randomPin = () => String(Math.floor(1000 + Math.random() * 9000));

export function createSovereignStore<TTab extends string>(opts: {
  tab: TTab;
  storageKey?: string;
}) {
  const storageKey = opts.storageKey || 'sovereign-storage';
  const defaultTab = opts.tab;

  return create<SovereignState & { tab: TTab }>()(
    persist(
      (set, get) => ({
        profile: getProfile(),
        loveBalance: null,
        did: '',
        mesh: {
          localDid: '',
          nodes: new Map(),
          topology: 'isolated',
          symmetry: 1.0,
          curvature: 0,
          heartbeatInterval: 30000,
        },
        meshInstance: null,
        crypto: {
          keyPair: null,
          biometricHash: null,
          sessionKey: null,
          algorithm: 'TKE',
        },
        spoons: 3,
        tab: defaultTab as any,
        darkMode: false,
        reduceMotion: false,
        soundEffects: true,
        timerSeconds: (() => {
          const v = getProfile().tetrahedron.vertices[2];
          const spoons = v.type === 'preferences' ? v.value.spoons : 3;
          return 30 * 60;
        })(),
        mood: null,
        caregiverPin: (() => {
          const rel = getProfile().tetrahedron.vertices[3];
          return rel.type === 'relations' ? rel.value.caregiverPin || randomPin() : randomPin();
        })(),
        ui: {
          showCrisis: false,
          showBreak: false,
          showPin: false,
          toast: null,
          pinTitle: 'Enter Caregiver PIN',
          pinDesc: 'Enter your 4-digit PIN.',
          pinResolve: null,
          pinReject: null,
          caregiverPanelVisible: false,
        },

        setSpoons: (level) => set({ spoons: level }),
        setTab: (tab) => set({ tab: tab as any }),
        setDarkMode: (enabled) => set({ darkMode: enabled }),
        setReduceMotion: (enabled) => set({ reduceMotion: enabled }),
        setSoundEffects: (enabled) => set({ soundEffects: enabled }),
        setTimerSeconds: (seconds) =>
          set((state) => ({
            timerSeconds: typeof seconds === 'function' ? seconds(state.timerSeconds) : seconds,
          })),
        setMood: (mood) => set({ mood }),
        setUi: (ui) => set((state) => ({ ui: { ...state.ui, ...ui } })),
        setCaregiverPin: (pin) => {
          set({ caregiverPin: pin });
          const state = get();
          const vertices = [...state.profile.tetrahedron.vertices] as [
            TetraVertex,
            TetraVertex,
            TetraVertex,
            TetraVertex
          ];
          if (vertices[3].type === 'relations') {
            vertices[3] = {
              type: 'relations',
              value: { ...vertices[3].value, caregiverPin: pin },
            };
            const updated = updateProfileStorage({
              ...state.profile,
              tetrahedron: { ...state.profile.tetrahedron, vertices },
            });
            set({ profile: updated });
          }
        },

        addStar: () => {
          const { profile } = get();
          const updated = updateProfileStorage({
            ...profile,
            starCount: (profile as any).starCount + 1,
          });
          set({ profile: updated });
        },

        completeGame: () => {
          const { profile } = get();
          const updated = updateProfileStorage({
            ...profile,
            gamesCompleted: (profile as any).gamesCompleted + 1,
            starCount: (profile as any).starCount + 1,
          });
          set({ profile: updated });
        },

        updateProfile: (updates) => {
          const updated = updateProfileStorage(updates);
          set({ profile: updated });
        },

        updateTetrahedronVertex: (vertexIndex, value) => {
          const profile = get().profile;
          const vertices = [...profile.tetrahedron.vertices] as [
            TetraVertex,
            TetraVertex,
            TetraVertex,
            TetraVertex
          ];
          const types = ['did', 'reputation', 'preferences', 'relations'] as const;
          vertices[vertexIndex] = { type: types[vertexIndex], value } as TetraVertex;
          const updated = updateProfileStorage({
            ...profile,
            tetrahedron: { ...profile.tetrahedron, vertices },
          });
          set({ profile: updated });
        },

        addSBT: (sbt) => {
          const { profile } = get();
          const updated = updateProfileStorage({
            ...profile,
            sbts: [...profile.sbts, sbt],
          });
          set({ profile: updated });
        },

        mintAchievementSBT: async (name, description) => {
          const { profile, showToast } = get();
          if (hasSBTMilestone(name)) return;

          const reputation = profile.tetrahedron.vertices[1];
          const careScore =
            reputation.type === 'reputation' ? reputation.value.careScore : 0.5;

          const tetraHash = computeTetrahedronHash({
            did: profile.did,
            name: profile.name,
            starCount: profile.starCount,
            gamesCompleted: profile.gamesCompleted,
          });

          const metadata = {
            name,
            description,
            starCount: profile.starCount,
            gamesCompleted: profile.gamesCompleted,
            did: profile.did,
            timestamp: Date.now(),
            version: '1.0.0',
          };

          const sbt = buildSBT('achievement', profile.did, tetraHash, metadata);

          const updated = updateProfileStorage({
            ...profile,
            sbts: [...profile.sbts, sbt],
            sbtMilestones: [...profile.sbtMilestones, name],
          });
          set({ profile: updated });
          showToast(`🏆 Minting ${name}...`, 'success');

          let metadataUri: string;
          try {
            const cid = await pinJSONToIPFS(metadata);
            metadataUri = `ipfs://${cid}`;

            try {
              const key = `${profile.did}/${name}`;
              await anchorCID(key, cid);
              showToast(`📦 CID pinned & anchored: ${cid.slice(0, 8)}…`, 'success');
            } catch (anchorErr) {
              console.warn('[SBT] P31ContentRoot anchor failed', anchorErr);
              showToast('⚠️ CID pinned but not anchored on-chain', 'error');
            }
          } catch (ipfsErr) {
            console.warn('[SBT] IPFS pinning failed, using data: URI', ipfsErr);
            metadataUri = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
            showToast('⚠️ Using local metadata (IPFS unavailable)', 'error');
          }

          const result = await mintSBTOnChain(profile.did, careScore, 0, metadataUri);

          if (result.ok && result.tokenId !== undefined) {
            const updatedSbt = {
              ...sbt,
              onChainTokenId: result.tokenId,
              onChainContract: LOVESBT_ADDRESS,
            };
            const finalProfile = get().profile;
            const newSbts = finalProfile.sbts.map((s) => (s.id === sbt.id ? updatedSbt : s));
            const final = updateProfileStorage({ ...finalProfile, sbts: newSbts });
            set({ profile: final });
            showToast(`✅ SBT minted on-chain! Token ID: ${result.tokenId}`, 'success');
          } else {
            showToast(
              `⚠️ SBT stored locally (on-chain failed: ${result.error || 'unknown'})`,
              'error'
            );
          }
        },

        incrementMoodCount: () => {
          const updated = incrementMoodCount();
          set({ profile: updated });
        },

        checkMoodMilestone: () => {
          const { profile } = get();
          if (
            profile.moodCount > 0 &&
            profile.moodCount % 10 === 0 &&
            !hasSBTMilestone('Mood Explorer')
          ) {
            get().mintAchievementSBT('Mood Explorer', `${profile.moodCount} moods logged`);
          }
        },

        checkLoveMilestone: () => {
          const { loveBalance, profile } = get();
          if (!loveBalance) return;
          if (loveBalance.availableBalance >= 50 && !hasSBTMilestone('LOVE Steward')) {
            get().mintAchievementSBT('LOVE Steward', 'Reached 50 LOVE balance');
          }
        },

        showToast: (message, type) => {
          set({ ui: { ...get().ui, toast: { message, type } } });
          setTimeout(() => {
            const current = get().ui.toast;
            if (current?.message === message) {
              set({ ui: { ...get().ui, toast: null } });
            }
          }, 3000);
        },

        extendSession: async (minutes) => {
          const { showToast } = get();
          const pin = window.prompt('Enter caregiver PIN to extend session:');
          if (pin === get().caregiverPin) {
            set({ timerSeconds: Math.min(get().timerSeconds + minutes * 60, 7200) });
            showToast(`⏱️ +${minutes} minutes added!`, 'success');
            return true;
          }
          showToast('❌ Incorrect PIN.', 'error');
          return false;
        },

        openPin: (title, desc) => {
          return new Promise<string>((resolve, reject) => {
            set({
              ui: {
                ...get().ui,
                showPin: true,
                pinTitle: title,
                pinDesc: desc,
                pinResolve: resolve,
                pinReject: reject,
              },
            });
          });
        },

        closePin: () => {
          set({
            ui: {
              ...get().ui,
              showPin: false,
              pinResolve: null,
              pinReject: null,
            },
          });
        },

        refreshLoveBalance: async () => {
          const userId = get().profile.did;
          if (!userId) return;
          const balance = await getLoveBalance(userId);
          if (balance) {
            set({ loveBalance: balance });
          }
        },

        mintLove: async (transactionType, metadata) => {
          const userId = get().profile.did;
          if (!userId) return false;
          await registerUser(userId);
          return await mintLove(userId, transactionType, metadata);
        },

        ensureDid: async () => {
          const did = await ensureDid();
          set({ did });
          return did;
        },

        setMeshInstance: (instance) => set({ meshInstance: instance }),

        updateMesh: (updates) =>
          set((state) => ({ mesh: { ...state.mesh, ...updates } })),
      }),
      {
        name: storageKey,
        version: 2,
        migrate: (persistedState: any) => {
          const state = persistedState || {};
          if (typeof state.timerSeconds !== 'number' || isNaN(state.timerSeconds)) {
            state.timerSeconds = 30 * 60;
          }
          if (state.profile) {
            state.profile.starCount = state.profile.starCount ?? 0;
            state.profile.gamesCompleted = state.profile.gamesCompleted ?? 0;
            state.profile.moodCount = state.profile.moodCount ?? 0;
            state.profile.sbtMilestones = state.profile.sbtMilestones ?? [];
          }
          if (!state.profile?.tetrahedron) {
            const profile = getProfile();
            state.profile = profile;
          }
          return state as SovereignState & { tab: TTab };
        },
        merge: (persistedState, currentState) => {
          const p = (persistedState ?? {}) as Partial<SovereignState>;
          const savedMesh = p.mesh as Partial<MeshState> | undefined;
          const mesh: MeshState = savedMesh
            ? {
                ...currentState.mesh,
                ...savedMesh,
                nodes: savedMesh.nodes instanceof Map ? savedMesh.nodes : new Map(),
                localDid: typeof savedMesh.localDid === 'string' ? savedMesh.localDid : '',
              }
            : currentState.mesh;
          return {
            ...currentState,
            ...p,
            mesh,
          } as SovereignState & { tab: TTab };
        },
        partialize: (state) => ({
          profile: state.profile,
          spoons: state.spoons,
          tab: state.tab,
          darkMode: state.darkMode,
          reduceMotion: state.reduceMotion,
          soundEffects: state.soundEffects,
          timerSeconds: state.timerSeconds,
          mood: state.mood,
          caregiverPin: state.caregiverPin,
        }),
      }
    )
  );
}
