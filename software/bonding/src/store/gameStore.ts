// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Game store: single source of truth via Zustand
//
// WCD-04: Central nervous system.
//   Every game action flows through endDrag →
//   check achievements → check quests → emit toasts.
//
// WCD-08: Multiplayer state (roomCode, playerId, etc.)
// WCD-14: Quest + Exhibit A integration
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { eventBus, GameEventType } from '../genesis/eventBus';
import type {
  PlacedAtom,
  Bond,
  ElementSymbol,
  UnlockedAchievement,
  CompletedMolecule,
  ToastMessage,
  LoveTransaction,
} from '../types';
import { ELEMENTS } from '../data/elements';
import {
  isMoleculeComplete,
  generateFormula,
  displayFormula,
  MOLECULE_NAMES,
  isK4,
} from '../engine/chemistry';
import { playMoleculeChord } from '../engine/audio';
import { KNOWN_MOLECULES } from '../data/achievements';
import type { DifficultyId } from '../data/modes';
import { getModeById } from '../data/modes';
import { saveToGallery } from '../engine/gallery';
import { isDiscovery, lookupDiscovery, saveDiscovery } from '../engine/discovery';
import { initAmbient, updateAmbient, stopAmbient } from '../engine/ambientEngine';
import { initSpatial, playAtomPlacementSound, playBondSpatialSound } from '../engine/spatialAudio';
import type { Player, Ping } from '../lib/gameSync';
import { leaveRoom } from '../lib/gameSync';
import { useProgressStore } from './progressStore';
import {
  playAtomNote,
  playBondInterval,
  playCompletionChord,
  playWhoosh,
  playAchievementUnlock,
  playLoveChime,
  playPingEmoji,
  playQuestStep,
  playQuestComplete,
  playModeSelect,
  playWarp,
} from '../engine/sound';
import { haptic } from '../engine/haptic';
import { logEventA } from '../engine/exhibitA';
import {
  evaluateAchievements,
} from '../engine/achievementEngine';
import type { Quest, QuestProgress } from '../engine/quests';
import {
  getQuestsForMode,
  initializeProgress,
  checkQuestProgress,
} from '../engine/quests';
import { BASHIUM } from '../config/bashium';
import { WILLIUM } from '../config/willium';
import type { Tutorial, TutorialState } from '../engine/tutorial';
import {
  getTutorial,
  initTutorialState,
  getCurrentStep as getTutorialCurrentStep,
  checkStepComplete,
  advanceStep as advanceTutorialStep,
} from '../engine/tutorial';
import { getElementFact, getMoleculeFact } from '../engine/factLookup';

// ── Constants ──

const COHERENCE_WINDOW_MS = 37 * 60 * 1000;
const LOVE_PER_ATOM = 1;
const LOVE_PER_BOND = 2;
const LOVE_PER_MOLECULE = 10;
const TOAST_DURATION_MS = 3000;

// ── Store interface ──

interface GameStore {
  // Molecule state
  atoms: PlacedAtom[];
  bonds: Bond[];
  nextAtomId: number;
  nextBondId: number;
  gamePhase: 'placing' | 'complete';
  sessionStartTime: number | null;

  // Drag state
  dragging: ElementSymbol | null;
  dragPointer: { x: number; y: number } | null;
  snappedSite: { atomId: number | null; position: { x: number; y: number; z: number } } | null;

  // Achievement state
  unlockedAchievements: UnlockedAchievement[];

  // LOVE economy
  loveTotal: number;
  loveTransactions: LoveTransaction[];

  // Molecule history
  completedMolecules: CompletedMolecule[];

  // Toast queue
  toasts: ToastMessage[];

  // Checkpoint state
  knownFormulaMatch: string | null;
  dragCooldownUntil: number;

  // Difficulty mode
  gameMode: DifficultyId | null;

  // Quest state
  activeQuests: Quest[];
  questProgress: Record<string, QuestProgress>;
  playerName: string;

  // Multiplayer state
  roomCode: string | null;
  playerId: string | null;
  remotePlayers: Player[];
  incomingPings: Ping[];
  lobbyActive: boolean;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';

  // Breathing pacer
  breathing: boolean;

  // Calcium logging
  calciumLogged: boolean;

  // Fun facts / social tracking
  seenElements: string[];
  pingsReceived: number;

  // Discovery state
  pendingDiscovery: { formula: string; displayFormula: string } | null;

  // WCD-48: Track formulas completed in current build chain (for LOVE dedup)
  sessionCompletedFormulas: string[];

  // WCD-49: Large centered ping notification
  pingNotification: { emoji: string; senderName: string } | null;

  // Tutorial state
  activeTutorial: Tutorial | null;
  tutorialState: TutorialState | null;

  // UX Audit: Age-based UI scaling
  ageGroup: 'child' | 'adult' | 'senior' | null;

  // Kid Mode
  simpleMode: boolean;

  // Kid Mode actions
  setSimpleMode: (enabled: boolean) => void;

  // Actions
  setGameMode: (mode: DifficultyId | null, questId?: string) => void;
  setAgeGroup: (age: 'child' | 'adult' | 'senior') => void;
  setPlayerName: (name: string) => void;
  startDrag: (element: ElementSymbol) => void;
  updateDragPointer: (x: number, y: number) => void;
  snapToSite: (atomId: number | null, position: { x: number; y: number; z: number }) => void;
  unsnapFromSite: () => void;
  endDrag: () => void;
  reset: () => void;
  initAudio: () => void;
  dismissToast: (id: string) => void;
  nameDiscovery: (name: string) => void;
  dismissDiscovery: () => void;
  fireTutorialEvent: (event: { type: string; mode?: string; element?: string; button?: string }) => void;
  showMoleculeFact: (formula: string) => void;
  continueBuilding: () => void;

  // Multiplayer actions
  setLobbyActive: (active: boolean) => void;
  setMultiplayer: (roomCode: string, playerId: string) => void;
  leaveMultiplayer: () => void;
  updateRemotePlayers: (players: Player[]) => void;
  addIncomingPing: (ping: Ping) => void;
  clearIncomingPings: () => void;
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void;
  toggleBreathing: () => void;

  // Calcium logging
  toggleCalciumLogged: () => void;

  // Ambient reward actions (shooting stars, missing node)
  pushToast: (toast: Omit<ToastMessage, 'id' | 'createdAt'>) => void;
  addLove: (amount: number) => void;

  // Ghost site preview from palette tap
  previewElement: ElementSymbol | null;
  setPreviewElement: (el: ElementSymbol | null) => void;

  // Blood Moon haze toggle
  bloodMoonActive: boolean;
  toggleBloodMoon: () => void;

  // Molecular warp field (double-tap easter egg)
  warpActive: boolean;
  triggerWarp: () => void;

  // K4 tetrahedron detection — fires once per session
  k4Detected: boolean;
}

// ── Helpers ──

function createToastId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function earnLove(
  currentTransactions: LoveTransaction[],
  amount: number,
  source: LoveTransaction['source'],
  sourceId?: string,
): { transactions: LoveTransaction[]; total: number } {
  const tx: LoveTransaction = {
    amount,
    source,
    sourceId,
    timestamp: new Date().toISOString(),
  };
  const transactions = [...currentTransactions, tx];
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  return { transactions, total };
}

// ── Store ──

export const useGameStore = create<GameStore>()((set, get) => ({
  // Initial state
  atoms: [],
  bonds: [],
  nextAtomId: 1,
  nextBondId: 1,
  gamePhase: 'placing',
  sessionStartTime: null,

  dragging: null,
  dragPointer: null,
  snappedSite: null,

  unlockedAchievements: [],
  loveTotal: 0,
  loveTransactions: [],
  completedMolecules: [],
  toasts: [],
  knownFormulaMatch: null,
  dragCooldownUntil: 0,
  gameMode: null,
  activeQuests: [],
  questProgress: {},
  playerName: '',
  roomCode: null,
  playerId: null,
  remotePlayers: [],
  incomingPings: [],
  lobbyActive: false,
   connectionStatus: 'connected',
   breathing: false,
   calciumLogged: false,
  seenElements: [],
  pingsReceived: 0,
  pendingDiscovery: null,
  sessionCompletedFormulas: [],
  pingNotification: null,
  activeTutorial: null,
  tutorialState: null,

  // UX Audit: Age-based UI scaling
  ageGroup: null,

  // Kid Mode
  simpleMode: false,

  k4Detected: false,

  // ── Mode selection ──

  setGameMode: (mode, questId) => {
    const previousMode = get().gameMode;

    if (mode === null) {
      get().reset();
      eventBus.emit(GameEventType.DIFFICULTY_CHANGED, { from: previousMode, to: null });
      set({ gameMode: null, activeQuests: [], questProgress: {}, activeTutorial: null, tutorialState: null });
      return;
    }

    // WCD-16: Clear canvas state on mode switch (atoms, bonds, formula, stability)
    // Preserves: loveBalance, achievements, completedMolecules, session
    get().reset();

    // ... rest unchanged ...

    // Initialize quests — filter by selected quest or free build
    let quests: Quest[];
    if (questId === 'free_build') {
      quests = [];
    } else if (questId) {
      const allQuests = getQuestsForMode(mode);
      const picked = allQuests.find(q => q.id === questId);
      quests = picked ? [picked] : allQuests;
    } else {
      quests = getQuestsForMode(mode);
    }
    // WCD-21: Preserve quest progress across mode switches.
    // Merge existing progress with fresh initialization so that
    // switching Seed → Sprout → back to Seed keeps Genesis progress.
    const freshProgress = initializeProgress(quests);
    const existingProgress = get().questProgress;
    const progress: Record<string, QuestProgress> = {};
    for (const [qid, fresh] of Object.entries(freshProgress)) {
      const existing = existingProgress[qid];
      progress[qid] = existing && existing.completedSteps > 0 ? existing : fresh;
    }

    // Tutorial: check if first time for this mode
    let activeTutorial: Tutorial | null = null;
    let tutorialState: TutorialState | null = null;
    const tutorialKey = `tutorial_${mode}_complete`;
    if (!localStorage.getItem(tutorialKey)) {
      const tutorial = getTutorial(mode);
      if (tutorial) {
        activeTutorial = tutorial;
        const tState = initTutorialState(tutorial.id);
        // Auto-advance past mode_selected steps (mode already chosen)
        let current = getTutorialCurrentStep(tutorial, tState);
        let advanced = tState;
        while (current && current.waitFor.type === 'mode_selected') {
          advanced = advanceTutorialStep(tutorial, advanced);
          current = getTutorialCurrentStep(tutorial, advanced);
        }
        tutorialState = advanced;
      }
    }

    set({ gameMode: mode, activeQuests: quests, questProgress: progress, seenElements: [], activeTutorial, tutorialState });
    eventBus.emit(GameEventType.DIFFICULTY_CHANGED, { from: previousMode, to: mode });
    playModeSelect();

    // Exhibit A: session started
    const state = get();
    logEventA({
      type: 'session_started',
      mode,
      roomCode: state.roomCode,
      players: state.playerName ? [state.playerName] : [],
    });
  },

  setPlayerName: (name) => set({ playerName: name }),

  // UX Audit: Age group selection
  setAgeGroup: (age) => {
    // Update CSS custom properties on document for age-based styling
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-age-group', age);
    }
    set({ ageGroup: age });
  },

  // ── Drag lifecycle ──

  startDrag: (element) => {
    if (Date.now() < get().dragCooldownUntil) return;
    set({ dragging: element, dragPointer: null, snappedSite: null });
    haptic.snap();
  },

  updateDragPointer: (x, y) => {
    set({ dragPointer: { x, y } });
  },

  snapToSite: (atomId, position) => {
    const prev = get().snappedSite;
    if (
      prev &&
      prev.atomId === atomId &&
      Math.abs(prev.position.x - position.x) < 0.01 &&
      Math.abs(prev.position.y - position.y) < 0.01 &&
      Math.abs(prev.position.z - position.z) < 0.01
    ) {
      return;
    }
    set({ snappedSite: { atomId, position } });
    haptic.goodBond();
  },

  unsnapFromSite: () => {
    if (!get().snappedSite) return;
    set({ snappedSite: null });
  },

  // ── Core game action: place atom ──

  endDrag: () => {
    const state = get();
    if (!state.dragging) return;

    if (!state.snappedSite) {
      playWhoosh();
      eventBus.emit(GameEventType.ATOM_REJECTED, {
        element: state.dragging,
        reason: 'no_bond_site',
      });
      set({ dragging: null, dragPointer: null, snappedSite: null });
      return;
    }

    const element = state.dragging;
    const position = state.snappedSite.position;
    const bondToAtomId = state.snappedSite.atomId;
    const elementData = ELEMENTS[element];
    const pName = state.playerName || 'Player';

    // ── Session tracking ──
    const isFirstAtom = state.atoms.length === 0;
    const sessionStart = isFirstAtom ? Date.now() : state.sessionStartTime;

    // ── Create atom ──
    const newAtomId = state.nextAtomId;
    const newAtom: PlacedAtom = {
      id: newAtomId,
      element,
      position,
      bondSites: elementData.valence,
      bondedTo: bondToAtomId != null ? [bondToAtomId] : [],
      placedBy: 0,
      timestamp: new Date().toISOString(),
    };

    // ── Update atoms array ──
    let updatedAtoms = [...state.atoms, newAtom];
    const newBonds = [...state.bonds];
    let nextBondId = state.nextBondId;

    if (bondToAtomId != null) {
      updatedAtoms = updatedAtoms.map((a) =>
        a.id === bondToAtomId
          ? { ...a, bondedTo: [...a.bondedTo, newAtomId] }
          : a,
      );
      newBonds.push({
        id: nextBondId,
        from: bondToAtomId,
        to: newAtomId,
        timestamp: new Date().toISOString(),
      });
      nextBondId++;

      // ── Phase 4: Update progress store for badges ──
      if (bondToAtomId != null) {
        useProgressStore.getState().addBond();
      }

      const parentAtom = state.atoms.find((a) => a.id === bondToAtomId);
      if (parentAtom) {
        playBondInterval(
          ELEMENTS[parentAtom.element].frequency,
          elementData.frequency,
        );
        // WCD-22: Spatial audio for bond formation
        playBondSpatialSound(
          [parentAtom.position.x, parentAtom.position.y, parentAtom.position.z],
          [position.x, position.y, position.z],
          elementData.frequency,
        );
      }
    } else {
      playAtomNote(elementData.frequency);
      // WCD-22: Spatial audio for atom placement
      playAtomPlacementSound(newAtom, elementData.frequency);
    }

    haptic.place();

    // ── Fun fact toast on first element placement ──
    const seenElements = [...state.seenElements];
    const isNewElement = !seenElements.includes(element);
    if (isNewElement) {
      seenElements.push(element);
    }

    // ── Check completion ──
    const complete =
      updatedAtoms.length > 1 && isMoleculeComplete(updatedAtoms);

    // ── LOVE economy ──
    let { transactions: loveTx, total: loveTotal } = earnLove(
      state.loveTransactions,
      LOVE_PER_ATOM,
      'atom_placed',
    );

    if (bondToAtomId != null) {
      const bondResult = earnLove(loveTx, LOVE_PER_BOND, 'bond_formed');
      loveTx = bondResult.transactions;
      loveTotal = bondResult.total;
    }

    // ── Molecule history ──
    let completedMolecules = [...state.completedMolecules];
    const elapsed = sessionStart ? Date.now() - sessionStart : 0;
    const coherencePhase = sessionStart
      ? Math.min(elapsed / COHERENCE_WINDOW_MS, 1.0)
      : 0;

    if (complete) {
      const molecule: CompletedMolecule = {
        formula: generateFormula(updatedAtoms),
        atomCount: updatedAtoms.length,
        completedAt: new Date().toISOString(),
        sessionElapsedMs: elapsed,
        coherencePhase,
        elements: updatedAtoms.map(a => a.element),
      };
      completedMolecules = [...completedMolecules, molecule];

      // P06.1: Play molecule chord on completion
      playMoleculeChord(molecule.elements);

      // Phase 4: Update progress store for molecules
      useProgressStore.getState().addMolecule(molecule.formula);

      // WCD-48: Only award completion LOVE if this formula hasn't been
      // completed already in the current build chain (dedup for "Keep Building")
      if (!state.sessionCompletedFormulas.includes(molecule.formula)) {
        const molResult = earnLove(loveTx, LOVE_PER_MOLECULE, 'molecule_completed');
        loveTx = molResult.transactions;
        loveTotal = molResult.total;
      }

      // WCD-22: Update ambient soundscape on molecule completion
      const elements = updatedAtoms.map((a) => a.element);
      updateAmbient(elements);
    } else {
      // WCD-22: Update ambient with current atoms
      const elements = updatedAtoms.map((a) => a.element);
      if (elements.length > 0) {
        updateAmbient(elements);
      }
    }

    // ── Achievement evaluation ──
    const unlockedIds = new Set(state.unlockedAchievements.map((a) => a.id));
    const modeData = state.gameMode ? getModeById(state.gameMode) : null;
    const newAchievements = evaluateAchievements({
      atoms: updatedAtoms,
      justCompleted: complete,
      sessionElapsedMs: elapsed,
      unlockedIds,
      completedMolecules,
      pingsReceived: state.pingsReceived,
      availableElements: modeData ? [...modeData.palette] : undefined,
    });

    const newToasts: ToastMessage[] = [];

    // Fun fact toast for first-time element (tier-based from elementFacts)
    if (isNewElement && state.gameMode) {
      const tierFact = getElementFact(element, state.gameMode);
      newToasts.push({
        id: createToastId(),
        icon: '\u{1F52C}',
        text: elementData.name,
        subtext: tierFact ?? elementData.funFact,
        duration: 4000,
        createdAt: Date.now(),
      });
    }
    const newUnlocked: UnlockedAchievement[] = [...state.unlockedAchievements];
    const formula = generateFormula(updatedAtoms);
    const dispFormula = displayFormula(formula);

    // ── K4 detection — First Tetrahedron egg ──
    const k4Fired = bondToAtomId != null && !state.k4Detected && isK4(updatedAtoms, newBonds);
    if (k4Fired) {
      newToasts.push({
        id: createToastId(),
        icon: '🔺',
        text: 'K4 TETRAHEDRON DETECTED',
        subtext: 'E = 3V − 6  ·  4 vertices  ·  6 edges — post this in #showcase to claim your egg',
        duration: 6000,
        createdAt: Date.now(),
      });
    }

    for (const result of newAchievements) {
      const achResult = earnLove(
        loveTx,
        result.achievement.love,
        'achievement',
        result.achievement.id,
      );
      loveTx = achResult.transactions;
      loveTotal = achResult.total;

      newUnlocked.push({
        id: result.achievement.id,
        unlockedAt: result.unlockedAt,
        moleculeFormula: result.moleculeFormula,
      });

      newToasts.push({
        id: createToastId(),
        icon: result.achievement.icon,
        text: result.achievement.name,
        subtext: result.achievement.description,
        love: result.achievement.love,
        duration: TOAST_DURATION_MS,
        createdAt: Date.now(),
      });

      // Exhibit A
      logEventA({
        type: 'achievement_unlocked',
        achievementId: result.achievement.id,
        achievementName: result.achievement.name,
        love: result.achievement.love,
        player: pName,
      });

      // Genesis: ACHIEVEMENT_UNLOCKED
      eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
        achievementId: result.achievement.id,
        achievementName: result.achievement.name,
        loveReward: result.achievement.love,
      });
    }

    // ── Checkpoint: known formula detection ──
    let knownFormulaMatch: string | null = null;
    let dragCooldownUntil = state.dragCooldownUntil;

    if (!complete && KNOWN_MOLECULES.has(formula)) {
      knownFormulaMatch = formula;
      dragCooldownUntil = Date.now() + 1000;

      newToasts.push({
        id: createToastId(),
        icon: '\u{1F9EA}',
        text: MOLECULE_NAMES[formula] ?? formula,
        subtext: `${dispFormula} \u2014 keep building or start fresh`,
        duration: 2000,
        createdAt: Date.now(),
      });
    }

    // ── WCD-23/25: Discovery toast on known molecule completion ──
    // High-contrast visual reward with molecule name + formula + LOVE.
    // Hero goals (per-tier) get gold styling + double LOVE.
    // Only fires once per formula per session (dedup via sessionCompletedFormulas).
    if (complete && KNOWN_MOLECULES.has(formula) && !state.sessionCompletedFormulas.includes(formula)) {
      const currentMode = state.gameMode ? getModeById(state.gameMode) : null;
      const isHero = currentMode?.heroGoal === formula;
      const discoveryLove = isHero ? LOVE_PER_MOLECULE * 2 : LOVE_PER_MOLECULE;

      // Award bonus LOVE for hero goal
      if (isHero) {
        const heroResult = earnLove(loveTx, LOVE_PER_MOLECULE, 'molecule_completed');
        loveTx = heroResult.transactions;
        loveTotal = heroResult.total;
      }

      newToasts.push({
        id: createToastId(),
        icon: isHero ? '\u{1F451}' : '\u{2728}', // 👑 for hero, ✨ for standard
        text: MOLECULE_NAMES[formula] ?? formula,
        subtext: dispFormula,
        love: discoveryLove,
        duration: isHero ? 5000 : 4000,
        createdAt: Date.now(),
        variant: isHero ? 'hero' : 'discovery',
      });
    }

    // ── Quest progress check ──
    // Quests advance on checkpoint fire (KNOWN_MOLECULES match)
    // AND on completion with a known formula.
    let questProgress = { ...state.questProgress };
    const questsUpdated: string[] = []; // quest IDs with step advances

    if (KNOWN_MOLECULES.has(formula)) {
      const result = checkQuestProgress(formula, state.activeQuests, questProgress);
      questProgress = result.updatedProgress;

      // Detect which quests advanced (compare old vs new)
      for (const quest of state.activeQuests) {
        const oldP = state.questProgress[quest.id];
        const newP = questProgress[quest.id];
        if (oldP && newP && newP.completedSteps > oldP.completedSteps) {
          questsUpdated.push(quest.id);
        }
      }

      // Quest step toasts
      for (const qid of questsUpdated) {
        const quest = state.activeQuests.find(q => q.id === qid);
        const progress = questProgress[qid];
        if (!quest || !progress) continue;

        // Log quest step
        logEventA({
          type: 'quest_step_completed',
          questId: quest.id,
          questName: quest.name,
          stepIndex: progress.completedSteps - 1,
          stepTarget: formula,
          player: pName,
        });

        // Genesis: QUEST_STEP_COMPLETED
        eventBus.emit(GameEventType.QUEST_STEP_COMPLETED, {
          questId: quest.id,
          formula,
          stepIndex: progress.completedSteps - 1,
        });

        if (progress.completed) {
          // Quest completed!
          const qReward = quest.reward.love;
          const questLove = earnLove(loveTx, qReward, 'quest_completed', quest.id);
          loveTx = questLove.transactions;
          loveTotal = questLove.total;

          newUnlocked.push({
            id: quest.reward.achievementId,
            unlockedAt: new Date().toISOString(),
            moleculeFormula: formula,
          });

          newToasts.push({
            id: createToastId(),
            icon: quest.icon,
            text: `${quest.name} Complete!`,
            subtext: quest.description,
            love: qReward,
            duration: TOAST_DURATION_MS + 1000,
            createdAt: Date.now(),
          });

          logEventA({
            type: 'quest_completed',
            questId: quest.id,
            questName: quest.name,
            love: qReward,
            player: pName,
          });

          // Genesis: QUEST_CHAIN_COMPLETED
          eventBus.emit(GameEventType.QUEST_CHAIN_COMPLETED, {
            questId: quest.id,
            totalSteps: quest.steps.length,
            bonusLove: qReward,
          });

          // Bashium unlock: show special toast when Genesis chain completes
          if (quest.id === 'genesis') {
            newToasts.push({
              id: createToastId(),
              icon: '\u{1F52E}',
              text: BASHIUM.unlockToast.line1,
              subtext: BASHIUM.unlockToast.line2,
              duration: 5000,
              createdAt: Date.now(),
            });
          }

          // Willium unlock: show special toast when Kitchen chain completes
          if (quest.id === 'kitchen') {
            newToasts.push({
              id: createToastId(),
              icon: '\u{1F331}',
              text: WILLIUM.unlockToast.line1,
              subtext: WILLIUM.unlockToast.line2,
              duration: 5000,
              createdAt: Date.now(),
            });
          }
        } else {
          // Step advanced — show narrative
          const prevStep = quest.steps[progress.completedSteps - 1];
          newToasts.push({
            id: createToastId(),
            icon: quest.icon,
            text: `${quest.name} ${progress.completedSteps}/${quest.steps.length}`,
            subtext: prevStep?.narrative ?? '',
            duration: 2500,
            createdAt: Date.now(),
          });
        }
      }
    }

    // ── Commit state ──
    set({
      atoms: updatedAtoms,
      bonds: newBonds,
      nextAtomId: newAtomId + 1,
      nextBondId: nextBondId,
      dragging: null,
      dragPointer: null,
      snappedSite: null,
      gamePhase: complete ? 'complete' : 'placing',
      sessionStartTime: sessionStart,
      unlockedAchievements: newUnlocked,
      loveTotal,
      loveTransactions: loveTx,
      completedMolecules,
      toasts: [...state.toasts, ...newToasts],
      knownFormulaMatch,
      dragCooldownUntil,
      questProgress,
      seenElements,
      sessionCompletedFormulas: complete
        ? [...state.sessionCompletedFormulas, formula]
        : state.sessionCompletedFormulas,
      k4Detected: k4Fired ? true : state.k4Detected,
    });

    // ── Post-commit effects ──

    // WCD-20: Broadcast celebration to peers on molecule completion
    if (complete) {
      // Dynamically import to avoid circular dep - relay lives in spaceship-earth
      import('@p31/spaceship-earth/services/sovereignRelay').then(({ sendCelebration }) => {
        sendCelebration({ type: 'molecule_complete', formula });
      }).catch(() => {
        // Relay not available - no-op in standalone mode
      });
    }

    // K4_DETECTED
    if (k4Fired) {
      eventBus.emit(GameEventType.K4_DETECTED, {
        atomCount: updatedAtoms.length,
        bondCount: newBonds.length,
        formula,
      });
    }

    // Genesis: ATOM_PLACED
    eventBus.emit(GameEventType.ATOM_PLACED, {
      element,
      moleculeId: formula,
      position,
      bondSiteIndex: bondToAtomId ?? -1,
    });

    // Exhibit A logging
    logEventA({
      type: 'atom_placed',
      element,
      atomCount: updatedAtoms.length,
      formula,
      displayFormula: dispFormula,
      player: pName,
      mode: state.gameMode ?? 'seed',
    });
    if (bondToAtomId != null) {
      const parentAtom = state.atoms.find((a) => a.id === bondToAtomId);
      logEventA({
        type: 'bond_formed',
        fromElement: parentAtom?.element ?? element,
        toElement: element,
        formula,
        displayFormula: dispFormula,
        player: pName,
      });
    }

    // Achievement sounds
    if (newAchievements.length > 0) {
      setTimeout(() => {
        playAchievementUnlock();
        haptic.achievement();
      }, 200);
    }

    // Quest sounds (after achievement sounds)
    if (questsUpdated.length > 0) {
      const anyQuestCompleted = questsUpdated.some(qid => questProgress[qid]?.completed);
      setTimeout(() => {
        if (anyQuestCompleted) {
          playQuestComplete();
        } else {
          playQuestStep();
        }
      }, newAchievements.length > 0 ? 600 : 200);
    }

    if (complete) {
      haptic.complete();

      const moleculeName = MOLECULE_NAMES[formula] ?? dispFormula;
      logEventA({
        type: 'molecule_completed',
        formula,
        displayFormula: dispFormula,
        moleculeName,
        atomCount: updatedAtoms.length,
        love: LOVE_PER_MOLECULE,
        player: pName,
        mode: state.gameMode ?? 'seed',
      });

      // Genesis: MOLECULE_COMPLETED
      eventBus.emit(GameEventType.MOLECULE_COMPLETED, {
        moleculeId: formula,
        formula,
        displayName: moleculeName,
        atomCount: updatedAtoms.length,
        difficulty: state.gameMode ?? 'seed',
        buildTimeMs: elapsed,
        stability: 1,
      });

      const uniqueFreqs = [
        ...new Set(updatedAtoms.map((a) => ELEMENTS[a.element].frequency)),
      ];
      setTimeout(() => playCompletionChord(uniqueFreqs), 300);
      setTimeout(() => playLoveChime(LOVE_PER_MOLECULE), 800);

      // Gallery + Discovery integration
      if (isDiscovery(formula)) {
        const previousName = lookupDiscovery(formula);
        if (previousName) {
          // Previously named discovery — save with known name
          saveToGallery({
            id: crypto.randomUUID(),
            formula,
            displayFormula: dispFormula,
            name: previousName,
            atoms: updatedAtoms.length,
            love: loveTotal,
            achievements: newUnlocked.map(a => a.id),
            mode: state.gameMode ?? 'seed',
            playerName: pName,
            completedAt: new Date().toISOString(),
            isDiscovery: true,
          });
        } else {
          // New discovery — defer gallery save until naming
          set({ pendingDiscovery: { formula, displayFormula: dispFormula } });
        }
      } else {
        // Known molecule — save immediately
        saveToGallery({
          id: crypto.randomUUID(),
          formula,
          displayFormula: dispFormula,
          name: moleculeName,
          atoms: updatedAtoms.length,
          love: loveTotal,
          achievements: newUnlocked.map(a => a.id),
          mode: state.gameMode ?? 'seed',
          playerName: pName,
          completedAt: new Date().toISOString(),
          isDiscovery: false,
        });
      }
    }

    // Auto-dismiss toasts
    for (const toast of newToasts) {
      setTimeout(() => {
        const current = get().toasts;
        set({ toasts: current.filter((t) => t.id !== toast.id) });
      }, toast.duration);
    }

    // Tutorial events (after state commit so UI updates first)
    if (state.activeTutorial && state.tutorialState) {
      setTimeout(() => {
        get().fireTutorialEvent({ type: 'atom_placed', element });
        if (complete) {
          get().fireTutorialEvent({ type: 'molecule_complete' });
        }
      }, 0);
    }
  },

  // ── Reset ──

  reset: () => {
    // WCD-22: Stop ambient on reset
    stopAmbient();
    set({
      atoms: [],
      bonds: [],
      nextAtomId: 1,
      nextBondId: 1,
      gamePhase: 'placing',
      sessionStartTime: null,
      dragging: null,
      dragPointer: null,
      snappedSite: null,
      // NOTE: achievements, love, molecule history, and quest progress persist
      toasts: [],
      knownFormulaMatch: null,
      dragCooldownUntil: 0,
      pendingDiscovery: null,
      sessionCompletedFormulas: [],
      k4Detected: false,
    });
  },

  // WCD-22: Initialize audio engines (must be called on user interaction)
  initAudio: () => {
    initAmbient();
    initSpatial();
  },

  // ── Toast management ──

  dismissToast: (id) => {
    const current = get().toasts;
    set({ toasts: current.filter((t) => t.id !== id) });
  },

  // ── Discovery naming ──

  nameDiscovery: (name) => {
    const state = get();
    const pending = state.pendingDiscovery;
    if (!pending) return;

    const pName = state.playerName || 'Player';
    saveDiscovery(pending.formula, name, pName);
    saveToGallery({
      id: crypto.randomUUID(),
      formula: pending.formula,
      displayFormula: pending.displayFormula,
      name,
      atoms: state.atoms.length,
      love: state.loveTotal,
      achievements: state.unlockedAchievements.map(a => a.id),
      mode: state.gameMode ?? 'seed',
      playerName: pName,
      completedAt: new Date().toISOString(),
      isDiscovery: true,
    });

    const toast: ToastMessage = {
      id: createToastId(),
      icon: '\u{1F52C}',
      text: name,
      subtext: `First synthesized by ${pName}`,
      duration: TOAST_DURATION_MS,
      createdAt: Date.now(),
    };

    set({
      pendingDiscovery: null,
      toasts: [...state.toasts, toast],
    });

    setTimeout(() => {
      const current = get().toasts;
      set({ toasts: current.filter(t => t.id !== toast.id) });
    }, toast.duration);
  },

  dismissDiscovery: () => {
    const state = get();
    const pending = state.pendingDiscovery;
    if (!pending) return;

    // Use formula as name when dismissed without naming
    saveToGallery({
      id: crypto.randomUUID(),
      formula: pending.formula,
      displayFormula: pending.displayFormula,
      name: pending.displayFormula,
      atoms: state.atoms.length,
      love: state.loveTotal,
      achievements: state.unlockedAchievements.map(a => a.id),
      mode: state.gameMode ?? 'seed',
      playerName: state.playerName || 'Player',
      completedAt: new Date().toISOString(),
      isDiscovery: false,
    });

    set({ pendingDiscovery: null });
  },

  // ── Tutorial ──

  fireTutorialEvent: (event) => {
    const state = get();
    if (!state.activeTutorial || !state.tutorialState) return;

    const step = getTutorialCurrentStep(state.activeTutorial, state.tutorialState);
    if (!step) return;

    if (checkStepComplete(step, event)) {
      let newState = advanceTutorialStep(state.activeTutorial, state.tutorialState);

      // Auto-advance mode_selected steps (mode already chosen)
      let nextStep = getTutorialCurrentStep(state.activeTutorial, newState);
      while (nextStep && nextStep.waitFor.type === 'mode_selected') {
        newState = advanceTutorialStep(state.activeTutorial, newState);
        nextStep = getTutorialCurrentStep(state.activeTutorial, newState);
      }

      if (newState.completed) {
        // Tutorial complete — set localStorage flag, award 10 LOVE
        localStorage.setItem(`tutorial_${state.activeTutorial.mode}_complete`, 'true');
        const { transactions, total } = earnLove(state.loveTransactions, 10, 'achievement', 'tutorial_complete');
        const toast: ToastMessage = {
          id: createToastId(),
          icon: '\u{1F393}',
          text: 'Tutorial Complete!',
          subtext: '+10 L.O.V.E.',
          love: 10,
          duration: TOAST_DURATION_MS,
          createdAt: Date.now(),
        };
        set({
          tutorialState: null,
          activeTutorial: null,
          loveTransactions: transactions,
          loveTotal: total,
          toasts: [...state.toasts, toast],
        });
        setTimeout(() => {
          const current = get().toasts;
          set({ toasts: current.filter(t => t.id !== toast.id) });
        }, toast.duration);
      } else {
        set({ tutorialState: newState });
      }
    }
  },

  // ── Molecule fun fact toast (fires after completion overlay dismisses) ──

  showMoleculeFact: (formula) => {
    const state = get();
    const mode = state.gameMode;
    if (!mode) return;
    const factData = getMoleculeFact(formula, mode);
    if (!factData) return;
    const toast: ToastMessage = {
      id: createToastId(),
      icon: '\u{1F9EA}',
      text: factData.name,
      subtext: factData.fact,
      duration: 5000,
      createdAt: Date.now(),
    };
    set({ toasts: [...state.toasts, toast] });
    setTimeout(() => {
      const current = get().toasts;
      set({ toasts: current.filter(t => t.id !== toast.id) });
    }, toast.duration);
  },

  // ── WCD-27 Option C: "Build Next" — clear canvas, start fresh molecule ──
  // A saturated molecule has NO open bond sites. Keeping atoms on canvas causes
  // new atoms to land disconnected (no ghost site → no bond → polluted formula).
  // Option C (recommended for ship): identical to "Build Another" but fires a
  // molecule fact toast so the transition feels intentional, not like a reset.

  continueBuilding: () => {
    const formula = generateFormula(get().atoms);
    get().reset();
    get().showMoleculeFact(formula);
  },

  // ── Multiplayer ──

  setLobbyActive: (active) => set({ lobbyActive: active }),

  setMultiplayer: (roomCode, playerId) => {
    set({ roomCode, playerId, lobbyActive: false });
    // Phase 4: Track family play when joining a room
    useProgressStore.getState().addFamilyPlaySession();
  },

  leaveMultiplayer: () => {
    leaveRoom();
    get().reset();
    set({
      roomCode: null,
      playerId: null,
      remotePlayers: [],
      incomingPings: [],
      lobbyActive: false,
      gameMode: null,
      activeQuests: [],
      questProgress: {},
      breathing: false,
      connectionStatus: 'connected',
      pingsReceived: 0,
      activeTutorial: null,
      tutorialState: null,
    });
  },

  updateRemotePlayers: (players) => set({ remotePlayers: players }),

  addIncomingPing: (ping) => {
    const state = get();
    const sender = state.remotePlayers.find((p) => p.id === ping.from);
    const senderName = sender?.name ?? 'Someone';

    // Toast text depends on whether there's a message
    const toastText = ping.message
      ? `"${ping.message.slice(0, 60)}" \u2014 ${senderName}`
      : `${senderName} sent ${ping.reaction}`;

    const toast: ToastMessage = {
      id: Math.random().toString(36).slice(2, 10),
      icon: ping.reaction,
      text: toastText,
      duration: TOAST_DURATION_MS,
      createdAt: Date.now(),
    };

    const newPingsReceived = state.pingsReceived + 1;
    const pingToasts: ToastMessage[] = [toast];

    // Check ping-triggered achievements
    const unlockedIds = new Set(state.unlockedAchievements.map((a) => a.id));
    const pingAchievements = evaluateAchievements({
      atoms: state.atoms,
      justCompleted: false,
      sessionElapsedMs: 0,
      unlockedIds,
      completedMolecules: state.completedMolecules,
      pingsReceived: newPingsReceived,
    });

    const newUnlocked = [...state.unlockedAchievements];
    let loveTx = state.loveTransactions;
    let loveTotal = state.loveTotal;

    for (const result of pingAchievements) {
      const achResult = earnLove(loveTx, result.achievement.love, 'achievement', result.achievement.id);
      loveTx = achResult.transactions;
      loveTotal = achResult.total;
      newUnlocked.push({
        id: result.achievement.id,
        unlockedAt: result.unlockedAt,
        moleculeFormula: result.moleculeFormula,
      });
      pingToasts.push({
        id: createToastId(),
        icon: result.achievement.icon,
        text: result.achievement.name,
        subtext: result.achievement.description,
        love: result.achievement.love,
        duration: TOAST_DURATION_MS,
        createdAt: Date.now(),
      });
      logEventA({
        type: 'achievement_unlocked',
        achievementId: result.achievement.id,
        achievementName: result.achievement.name,
        love: result.achievement.love,
        player: state.playerName || 'Player',
      });
    }

    set({
      incomingPings: [...state.incomingPings, ping],
      pingsReceived: newPingsReceived,
      toasts: [...state.toasts, ...pingToasts],
      unlockedAchievements: newUnlocked,
      loveTotal,
      loveTransactions: loveTx,
      // WCD-49: Large centered notification for received pings
      pingNotification: { emoji: ping.reaction, senderName },
    });

    // Auto-dismiss ping notification after 2s
    setTimeout(() => {
      if (get().pingNotification?.senderName === senderName) {
        set({ pingNotification: null });
      }
    }, 2000);

    // Emoji-specific ping sound
    playPingEmoji(ping.reaction);
    haptic.ping();

    if (pingAchievements.length > 0) {
      setTimeout(() => {
        playAchievementUnlock();
        haptic.achievement();
      }, 200);
    }

    // Exhibit A — message vs ping
    if (ping.message) {
      logEventA({
        type: 'message_received',
        from: senderName,
        to: state.playerName || 'Player',
        message: ping.message,
        reaction: ping.reaction,
      });
    } else {
      logEventA({
        type: 'ping_received',
        from: senderName,
        to: state.playerName || 'Player',
        reaction: ping.reaction,
      });
    }

    // Genesis: PING_RECEIVED
    eventBus.emit(GameEventType.PING_RECEIVED, {
      reaction: ping.reaction,
      fromPlayerId: ping.from,
      moleculeId: generateFormula(state.atoms),
    });

    for (const t of pingToasts) {
      setTimeout(() => {
        const current = get().toasts;
        set({ toasts: current.filter((x) => x.id !== t.id) });
      }, t.duration);
    }
  },

  clearIncomingPings: () => set({ incomingPings: [] }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  toggleBreathing: () => set({ breathing: !get().breathing }),
  toggleCalciumLogged: () => set({ calciumLogged: !get().calciumLogged }),

  // Ambient reward actions
  pushToast: (toast) => {
    const t: ToastMessage = { ...toast, id: createToastId(), createdAt: Date.now() };
    set({ toasts: [...get().toasts, t] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((x) => x.id !== t.id) });
    }, t.duration);
  },
  addLove: (amount) => {
    set({ loveTotal: get().loveTotal + amount });
  },

  previewElement: null,
  setPreviewElement: (el) => {
    set({ previewElement: el });
  },

  // Kid Mode - simplified UI for ages 6-8
  setSimpleMode: (enabled) => {
    set({ simpleMode: enabled });
  },

  bloodMoonActive: false,
  toggleBloodMoon: () => {
    set({ bloodMoonActive: !get().bloodMoonActive });
  },

  warpActive: false,
  triggerWarp: () => {
    if (get().warpActive) return;
    set({ warpActive: true });
    playWarp();
    haptic.snap();
    setTimeout(() => set({ warpActive: false }), 2500);
  },
}));
