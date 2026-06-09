// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// App: root component — WCD-08 Phase A: THE COCKPIT
//
// Z-Index contract (WCD-08):
//   z-1:  MoleculeCanvas (R3F, full viewport)
//   z-10: HUD Container (pointer-events: none)
//   z-11: TopBar, ElementDock, CommandBar (glass panels)
//   z-20: Floating overlays (retained from pre-cockpit)
//   z-50: Toast layer (AchievementToast)
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { genesisInit } from './genesis/genesis';
import { MoleculeCanvas } from './components/MoleculeCanvas';
import { useBondingAtmosphere } from './atmosphere/useBondingAtmosphere';
import { ElementPalette } from './components/ElementPalette';
import { StabilityMeter } from './components/StabilityMeter';
import { AchievementToast } from './components/AchievementToast';
import { ModeSelect } from './components/ModeSelect';
import { QuestHUD } from './components/QuestHUD';
import { FormulaDisplay } from './components/FormulaDisplay';
import { JitterbugNavigator } from './components/Navigation/Jitterbug';
import { CockpitLayout } from './components/hud/CockpitLayout';
import { TopBar } from './components/hud/TopBar';
import { CommandBar } from './components/hud/CommandBar';
import { isBirthdayOrAfter, hasSeenBoot } from './components/hud/bootHelpers';

// Lazy-loaded: only fetched when their conditional render triggers
const Lobby = lazy(() => import('./components/Lobby').then(m => ({ default: m.Lobby })));
const RoomSidebar = lazy(() => import('./components/RoomSidebar').then(m => ({ default: m.RoomSidebar })));
const BootSequence = lazy(() => import('./components/hud/BootSequence').then(m => ({ default: m.BootSequence })));
const TutorialOverlay = lazy(() => import('./components/TutorialOverlay').then(m => ({ default: m.TutorialOverlay })));
const DiscoveryModal = lazy(() => import('./components/DiscoveryModal').then(m => ({ default: m.DiscoveryModal })));
const TelemetryModal = lazy(() => import('./components/hud/TelemetryModal').then(m => ({ default: m.TelemetryModal })));
const BugReport = lazy(() => import('./components/BugReport').then(m => ({ default: m.BugReport })));
import { useGameStore } from './store/gameStore';
import {
  calculateStability,
  generateFormula,
  displayFormula,
  MOLECULE_NAMES,
} from './engine/chemistry';
import { getPersonality } from './engine/personalities';
import type { PersonalityType } from './engine/personalities';
import { getModeById } from './data/modes';
import type { DifficultyId } from './data/modes';
import { useMultiplayer } from './hooks/useMultiplayer';
import { exportAsSummary, logEventA } from './engine/exhibitA';
// WCD-25: haptic toggle moved to Jitterbug navigator (removed from top bar)
import { sendPing } from './lib/gameSync';
import { eventBus, GameEventType } from './genesis/eventBus';
import { initAudio } from './engine/sound';
import { useConsoleEgg } from './hooks/useConsoleEgg';
import { useHashRouter } from './hooks/useHashRouter';
import { ColliderMode } from './components/ColliderMode';
const GeodesicMode = lazy(() => import('./components/GeodesicMode').then(m => ({ default: m.GeodesicMode })));
import { ElementManager } from './components/elements';
import { getFunFact } from './config/funFacts';
import { getQuestMessage } from './config/questMessages';
import { FIRST_MOLECULE, CONFETTI } from './config/easterEggs';
import { BASHIUM } from './config/bashium';
import { WILLIUM } from './config/willium';
import { spawnConfetti } from './engine/confetti';
import { BloodMoonOverlay } from './components/BloodMoonOverlay';
import { BloodMoonNode } from './components/BloodMoonNode';
import { ShootingStars } from './components/ShootingStars';
import { MissingNode } from './components/MissingNode';

// Stable action references — useShallow prevents new-object re-renders
import { useShallow } from 'zustand/react/shallow';
const useActions = () => useGameStore(useShallow((s) => ({
  reset: s.reset,
  setGameMode: s.setGameMode,
  setLobbyActive: s.setLobbyActive,
  leaveMultiplayer: s.leaveMultiplayer,
  fireTutorialEvent: s.fireTutorialEvent,
  showMoleculeFact: s.showMoleculeFact,
  continueBuilding: s.continueBuilding,
})));

function App() {
  const bondingAtmosphere = useBondingAtmosphere();

  // Console Easter Egg - "Zero Samples" verification
  // Triggers on DevTools open - displays ASCII tetrahedron
  useConsoleEgg();

  // Game state — grouped by change frequency
  const atoms = useGameStore((s) => s.atoms);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const gameMode = useGameStore((s) => s.gameMode);
  const lobbyActive = useGameStore((s) => s.lobbyActive);
  const roomCode = useGameStore((s) => s.roomCode);
  const pendingDiscovery = useGameStore((s) => s.pendingDiscovery);
  const pingNotification = useGameStore((s) => s.pingNotification);
  const completedMolecules = useGameStore((s) => s.completedMolecules);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const loveTotal = useGameStore((s) => s.loveTotal);
  const playerName = useGameStore((s) => s.playerName);
  const remotePlayers = useGameStore((s) => s.remotePlayers);
  const activeQuests = useGameStore((s) => s.activeQuests);
  const questProgress = useGameStore((s) => s.questProgress);

  // Stable action refs
  const { reset, setGameMode, setLobbyActive, leaveMultiplayer, fireTutorialEvent, showMoleculeFact, continueBuilding } = useActions();

  const [exportCopied, setExportCopied] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [firstMoleculeShown, setFirstMoleculeShown] = useState(false);
  const prevPhaseRef = useRef<string>(gamePhase);
  const prevAchievementCountRef = useRef(unlockedAchievements.length);

  // Room router for hash-based navigation
  const { currentRoom } = useHashRouter();

  // Completion effects: first molecule check + confetti + screen flash
  const [screenFlash, setScreenFlash] = useState<string | null>(null);

  // Achievement unlock → gold screen flash
  useEffect(() => {
    if (unlockedAchievements.length > prevAchievementCountRef.current) {
      setScreenFlash('screen-flash-gold');
      setTimeout(() => setScreenFlash(null), 600);
    }
    prevAchievementCountRef.current = unlockedAchievements.length;
  }, [unlockedAchievements.length]);

  useEffect(() => {
    if (gamePhase === 'complete' && prevPhaseRef.current !== 'complete') {
      // Screen flash
      setScreenFlash('screen-flash-white');
      setTimeout(() => setScreenFlash(null), 500);

      // First molecule ever?
      if (!localStorage.getItem(FIRST_MOLECULE.storageKey)) {
        localStorage.setItem(FIRST_MOLECULE.storageKey, '1');
        setFirstMoleculeShown(true);
      }
      // Confetti — scale by significance
      const hasBa = atoms.some(a => a.element === 'Ba');
      const hasWi = atoms.some(a => a.element === 'Wi');
      const questJustCompleted = activeQuests.some(q => {
        const p = questProgress[q.id];
        return p?.completed && p.completedAt &&
          Date.now() - new Date(p.completedAt).getTime() < 5000;
      });
      if (hasBa || hasWi) {
        spawnConfetti(CONFETTI.bashiumCount);
      } else if (questJustCompleted) {
        spawnConfetti(CONFETTI.questCompleteCount);
      } else {
        spawnConfetti();
      }
    }
    if (gamePhase !== 'complete') {
      setFirstMoleculeShown(false);
    }
    prevPhaseRef.current = gamePhase;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase]);

  // WCD-29: Birthday boot sequence state
  const [showBoot, setShowBoot] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);
  useEffect(() => {
    if (!isBirthdayOrAfter()) { setBootChecked(true); return; }
    hasSeenBoot().then((seen) => {
      if (!seen) setShowBoot(true);
      setBootChecked(true);
    });
  }, []);

  // Genesis: init once on mount, after identity is available
  const genesisCleanup = useRef<(() => void) | null>(null);
  useEffect(() => {
    const id = crypto.randomUUID();
    genesisInit({
      playerId: id,
      playerName: playerName || 'Player',
      roomCode: roomCode ?? null,
      difficulty: gameMode ?? null,
    }).then((cleanup) => {
      genesisCleanup.current = cleanup;
    });
    return () => {
      genesisCleanup.current?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WCD-22: Initialize AudioContext on first user gesture (required by mobile browsers)
  useEffect(() => {
    const handleFirstGesture = () => {
      initAudio();
      document.removeEventListener('pointerdown', handleFirstGesture);
    };
    document.addEventListener('pointerdown', handleFirstGesture);
    return () => document.removeEventListener('pointerdown', handleFirstGesture);
  }, []);

  const PERSONALITY_EMOJI: Record<PersonalityType, string> = {
    mediator: '\u{1F30A}',
    rock: '\u{1FAA8}',
    loner: '\u{1F43A}',
    fuel: '\u{1F525}',
    messenger: '\u{1F4A8}',
    builder: '\u{1F9B4}',
    oracle: '\u{1F52E}',
  };

  // Multiplayer polling + auto-push (no-ops when not in a room)
  useMultiplayer();

  // WCD-08: Ping handler wired into CommandBar (replaces standalone PingBar)
  // Must live before early returns to satisfy Rules of Hooks.
  const handleCommandBarPing = useCallback(async (reaction: string) => {
    if (remotePlayers.length === 0) return;
    for (const player of remotePlayers) {
      await sendPing(player.id, reaction);
      logEventA({
        type: 'ping_sent',
        from: playerName || 'Player',
        to: player.name,
        reaction,
      });
      eventBus.emit(GameEventType.PING_SENT, {
        reaction,
        targetPlayerId: player.id,
        moleculeId: generateFormula(atoms),
      });
    }
  }, [remotePlayers, playerName, atoms]);

  // WCD-CC03: Persist last mode to sessionStorage for quick resume
  useEffect(() => {
    if (gameMode) sessionStorage.setItem('bonding-last-mode', gameMode);
  }, [gameMode]);

  // WCD-CC03: Confirm before switching difficulty mid-build
  const handleDifficultyChange = useCallback((d: DifficultyId) => {
    if (useGameStore.getState().atoms.length > 0) {
      if (!window.confirm('Switch mode? Current molecule will be cleared.')) return;
    }
    setGameMode(d);
  }, [setGameMode]);

  // ── Hooks: must run on EVERY render (Rules of Hooks) ──────
  const formula = useMemo(() => generateFormula(atoms), [atoms]);
  const dispFormula = useMemo(() => displayFormula(formula), [formula]);
  const stability = useMemo(() => Math.round(calculateStability(atoms) * 100), [atoms]);
  const personality = useMemo(() => {
    if (gamePhase !== 'complete' || atoms.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const a of atoms) {
      counts[a.element] = (counts[a.element] ?? 0) + 1;
    }
    return getPersonality(formula, counts);
  }, [gamePhase, atoms, formula]);
  const funFact = useMemo(
    () => gamePhase === 'complete' ? getFunFact(formula) : null,
    [gamePhase, formula],
  );
  const isBashiumMolecule = useMemo(() => atoms.some(a => a.element === 'Ba'), [atoms]);
  const isWilliumMolecule = useMemo(() => atoms.some(a => a.element === 'Wi'), [atoms]);

  // WCD-29: Genesis Fire boot sequence (before anything else)
  if (showBoot) return <Suspense fallback={null}><BootSequence onAcknowledge={() => setShowBoot(false)} /></Suspense>;

  // Wait for boot check before showing UI (prevents flash)
  if (!bootChecked) return null;

  // Layer 0a: Lobby (multiplayer create/join)
  if (lobbyActive) return <Suspense fallback={null}><Lobby /></Suspense>;

  // Layer 0b: Mode selection
  if (!gameMode) return <ModeSelect />;

  // Non-hook derived values (safe after early returns)
  const mode = getModeById(gameMode);
  const isMultiplayer = roomCode !== null;
  const moleculeName = MOLECULE_NAMES[formula] ?? dispFormula;
  const isSecretMolecule = isBashiumMolecule || isWilliumMolecule;
  const questMessage = gamePhase === 'complete' ? (() => {
    for (const quest of activeQuests) {
      const progress = questProgress[quest.id];
      if (!progress || progress.completedSteps === 0) continue;
      const lastIdx = progress.completedSteps - 1;
      if (quest.steps[lastIdx]?.target === formula) {
        return getQuestMessage(quest.id, lastIdx);
      }
    }
    return null;
  })() : null;

  // WCD-CC03: Confirm before exiting mid-build
  const handleModeExit = () => {
    if (atoms.length > 0 && !window.confirm('Leave this molecule? Progress will be lost.')) return;
    if (isMultiplayer) {
      leaveMultiplayer();
    } else {
      setGameMode(null);
    }
  };

  const handleExportClipboard = async () => {
    const summary = exportAsSummary();
    try {
      await navigator.clipboard.writeText(summary);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    } catch {
      handleExportDownload();
    }
  };

  const handleExportDownload = () => {
    const summary = exportAsSummary();
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bonding-exhibit-a-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CockpitLayout
      viewport={<MoleculeCanvas atmosphereCoherence={bondingAtmosphere.coherence} />}
      topBar={
        <TopBar
          modeEmoji={mode.emoji}
          onModeExit={handleModeExit}
          onLobby={() => setLobbyActive(true)}
          isInRoom={isMultiplayer}
          playerCount={remotePlayers.length + 1}
        />
      }
      elementDock={<ElementPalette />}
      commandBar={
        /* WCD-20: Hide command bar when idle (no atoms on canvas) */
        atoms.length > 0 ? (
          <CommandBar
            stability={stability}
            onPing={handleCommandBarPing}
            difficulty={gameMode as DifficultyId}
            onDifficultyChange={handleDifficultyChange}
            canPing={isMultiplayer && remotePlayers.length > 0}
            onToggleTelemetry={() => setTelemetryOpen((v) => !v)}
          />
        ) : null
      }
      toastLayer={<AchievementToast />}
    >
      {/* ── Screen flash overlay ── */}
      {screenFlash && (
        <div className={`fixed inset-0 pointer-events-none z-[60] ${screenFlash}`} />
      )}

      {/* ── Ambient layers — behind game UI ── */}
      <BloodMoonOverlay />
      <BloodMoonNode />
      <ShootingStars />
      <MissingNode />

      {/* Room router: full-screen modes keyed on hash */}
      {currentRoom === 'collider'  && <ColliderMode />}
      {currentRoom === 'geodesic'  && <Suspense fallback={null}><GeodesicMode /></Suspense>}

      {/* ── Floating overlays (z-20) — retained from pre-cockpit layout ── */}

      {/* Stability meter: formula + bar (top-right) */}
      <StabilityMeter />

      {/* JitterbugNavigator (WCD-07) — fixed bottom-right */}
      <JitterbugNavigator />

      {/* WCD-25: Second icon row removed. Mode emoji now lives in TopBar.
          Breathing pacer + haptic toggle accessible through Jitterbug navigator. */}

      {/* Quest HUD */}
      <QuestHUD />

      {/* Hint text — center when no atoms */}
      {atoms.length === 0 && gamePhase !== 'complete' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
          <p className="text-white/25 text-sm font-mono">
            Drag an element up to begin
          </p>
        </div>
      )}

      {/* Molecule count — positioned above both dock and command bar */}
      {completedMolecules.length > 0 && gamePhase !== 'complete' && (
        <div className="absolute bottom-[148px] left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-4 py-1.5 text-base text-white/60 font-mono hud-text">
            {'\u{1F9EA}'} {completedMolecules.length} molecule{completedMolecules.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Room sidebar (multiplayer only) */}
      {isMultiplayer && <Suspense fallback={null}><RoomSidebar /></Suspense>}

      {/* Ping notification overlay */}
      {pingNotification && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="ping-enter glass-card px-8 py-6 rounded-3xl text-center">
            <p className="text-6xl mb-2">{pingNotification.emoji}</p>
            <p className="text-sm text-white/50 font-mono">{pingNotification.senderName}</p>
          </div>
        </div>
      )}

      {/* Tutorial overlay */}
      <Suspense fallback={null}>
        <TutorialOverlay />
      </Suspense>

      {/* WCD-11: Bug report overlay */}
      <Suspense fallback={null}>
        <BugReport isOpen={bugReportOpen} onClose={() => setBugReportOpen(false)} />
      </Suspense>

      {/* WCD-26: Telemetry viewer (OQE log) */}
      {telemetryOpen && (
        <Suspense fallback={null}>
          <TelemetryModal onClose={() => setTelemetryOpen(false)} />
        </Suspense>
      )}

      {/* Discovery naming modal */}
      {gamePhase === 'complete' && pendingDiscovery && (
        <Suspense fallback={null}>
          <DiscoveryModal />
        </Suspense>
      )}

      {/* Completion overlay */}
      {gamePhase === 'complete' && !pendingDiscovery && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto completion-bg-pulse">
          <div className="complete-enter completion-shimmer-border glass-card p-6 sm:p-10 rounded-3xl text-center max-w-[420px] mx-4 max-h-[90vh] overflow-y-auto scrollbar-none">
            {/* Formula (WCD-50: HTML <sub> for universal rendering) */}
            <p className="text-5xl font-black text-white mb-2 formula-reveal">
              <FormulaDisplay formula={dispFormula} />
            </p>
            <p className="text-2xl text-white/70 mb-1">
              {moleculeName !== dispFormula ? moleculeName : 'Complete!'}
            </p>
            {moleculeName !== dispFormula && (
              <p className="text-sm text-green mb-2">Complete!</p>
            )}

            {/* Bashium special message */}
            {isBashiumMolecule && (
              <div className="mb-4">
                <p className="text-sm text-purple-400 font-semibold mb-1">{BASHIUM.completionMessage.line1}</p>
                <p className="text-lg text-white font-bold mb-1">{BASHIUM.completionMessage.line2}</p>
                <p className="text-sm text-white/60 italic">{BASHIUM.completionMessage.line3}</p>
              </div>
            )}

            {/* Willium special message */}
            {isWilliumMolecule && (
              <div className="mb-4">
                <p className="text-sm text-green-400 font-semibold mb-1">{WILLIUM.completionMessage.line1}</p>
                <p className="text-lg text-white font-bold mb-1">{WILLIUM.completionMessage.line2}</p>
                <p className="text-sm text-white/60 italic">{WILLIUM.completionMessage.line3}</p>
              </div>
            )}

            {/* First molecule ever */}
            {firstMoleculeShown && !isSecretMolecule && (
              <div className="mb-3">
                <p className="text-base text-amber-400 font-bold">{FIRST_MOLECULE.line1}</p>
                <p className="text-sm text-white/50">{FIRST_MOLECULE.line2}</p>
              </div>
            )}

            {/* Quest step message */}
            {questMessage && !isSecretMolecule && (
              <div className="text-center mb-3">
                <p className="text-base font-semibold text-green">{questMessage.congratsLine}</p>
                <p className="text-sm text-white/40 mt-1">{questMessage.bridgeLine}</p>
              </div>
            )}

            {/* Fun fact */}
            {funFact && !isSecretMolecule && (
              <p className="text-sm text-white/50 italic mb-3">{funFact}</p>
            )}

            {/* Personality — skip for secret element molecules */}
            {personality && !isSecretMolecule && (
              <div className="mb-4">
                <p className="text-lg mb-0.5">
                  {PERSONALITY_EMOJI[personality.type]} {personality.name}
                </p>
                <p className="text-xs text-white/30 italic">
                  {personality.description}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 mb-6 text-xs text-white/50">
              <span>{atoms.length} atoms</span>
              <span>{'\u00B7'}</span>
              <span className="text-amber-400 font-semibold">
                {'\u2665'} {loveTotal} L.O.V.E.
              </span>
              {unlockedAchievements.length > 0 && (
                <>
                  <span>{'\u00B7'}</span>
                  <span>
                    {unlockedAchievements.length} achievement
                    {unlockedAchievements.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  fireTutorialEvent({ type: 'button_tapped', button: 'build_another' });
                  const completedFormula = formula;
                  reset();
                  showMoleculeFact(completedFormula);
                }}
                className="px-7 py-3 bg-green hover:bg-green/90 text-void rounded-xl transition-all cursor-pointer text-sm font-semibold min-h-12 button-glow"
              >
                Build Another
              </button>

              {/* WCD-27: Build Next — clear canvas, start fresh molecule */}
              <button
                type="button"
                onClick={() => {
                  fireTutorialEvent({ type: 'button_tapped', button: 'keep_building' });
                  continueBuilding();
                }}
                className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white/70 rounded-xl transition-all cursor-pointer text-sm min-h-12"
              >
                Build Next
              </button>

              {/* Exhibit A export */}
              <button
                type="button"
                onClick={handleExportClipboard}
                className="px-4 py-3 bg-transparent hover:bg-white/5 text-white/40 hover:text-white/60 rounded-xl transition-all cursor-pointer border border-white/15 text-xs min-h-12"
                title="Copy engagement log to clipboard"
              >
                {exportCopied ? 'Copied!' : 'Exhibit A'}
              </button>
            </div>

            {/* Download fallback */}
            <button
              type="button"
              onClick={handleExportDownload}
              className="mt-3 text-[10px] text-white/15 hover:text-white/30 transition-colors cursor-pointer"
            >
              Download .txt
            </button>
          </div>
        </div>
      )}
    </CockpitLayout>
  );
}

export default App;
