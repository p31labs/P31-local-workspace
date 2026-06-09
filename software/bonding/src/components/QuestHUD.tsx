// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// QuestHUD: compact quest progress display
//
// Shows below the mode emoji (top-left).
// Each active quest: icon + progress bar + current step.
// Completed quests show a checkmark.
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { getCurrentStep, getQuestPercent } from '../engine/quests';
import { getQuestNarrative } from '../config/questNarrative';

export function QuestHUD() {
  const activeQuests = useGameStore((s) => s.activeQuests);
  const questProgress = useGameStore((s) => s.questProgress);
  const atomCount = useGameStore((s) => s.atoms.length);
  const [collapsed, setCollapsed] = useState(false);

  const checkWidth = useCallback(() => {
    setCollapsed(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [checkWidth]);

  if (activeQuests.length === 0) return null;

  // Find first active (non-completed) quest for the pill
  const primaryQuest = activeQuests[0]!;
  const primaryProgress = questProgress[primaryQuest.id];

  // Mobile: compact pill — collapse to icon-only when formula is active (WCD-15)
  const formulaActive = atomCount > 0;
  if (collapsed && primaryProgress) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="absolute left-6 z-10 px-3 py-2 flex items-center gap-1.5 cursor-pointer pointer-events-auto hud-text"
        style={{ top: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
      >
        <span className="text-sm">{primaryQuest.icon}</span>
        {!formulaActive && (
          <span className="text-[11px] font-semibold text-white/40 truncate max-w-[120px]">
            {primaryQuest.name}
          </span>
        )}
        <span className="text-[10px] text-white/25 font-mono">
          {primaryProgress.completedSteps}/{primaryQuest.steps.length}
        </span>
      </button>
    );
  }

  // WCD-31: Show only the primary quest (first non-completed, or first overall)
  const quest = activeQuests.find(q => {
    const p = questProgress[q.id];
    return p && !p.completed;
  }) ?? primaryQuest;
  const progress = questProgress[quest.id];
  if (!progress) return null;

  const percent = getQuestPercent(quest, progress);
  const currentStep = getCurrentStep(quest, progress);
  const narrative = getQuestNarrative(quest.id);

  return (
    <div className="absolute left-6 z-10 pointer-events-none max-w-[200px]" style={{ top: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
      <div className="px-3 py-2 hud-text">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{quest.icon}</span>
          <span className="text-[11px] font-semibold text-white/50 truncate">
            {quest.name}
          </span>
          {progress.completed && (
            <span className="text-emerald-400/60 text-[10px]">{'\u2713'}</span>
          )}
        </div>
        {/* Narrative intro — shown when no atoms on canvas */}
        {narrative && !formulaActive && progress.completedSteps === 0 && (
          <p className="text-[10px] text-white/30 italic leading-tight mb-1">
            {narrative.intro}
          </p>
        )}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-white/20 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        {/* Step narrative — shows for last completed step */}
        {narrative && progress.completedSteps > 0 && !progress.completed && (
          <p className="text-[10px] text-white/25 italic leading-tight mb-0.5">
            {narrative.stepNarratives[progress.completedSteps - 1]}
          </p>
        )}
        {currentStep && (
          <p className="text-[10px] text-white/25 leading-tight truncate">
            {currentStep.narrative}
          </p>
        )}
        {/* Completion line */}
        {progress.completed && narrative && (
          <p className="text-[10px] text-emerald-400/50 font-semibold leading-tight mt-0.5">
            {narrative.completionLine}
          </p>
        )}
        <p className="text-[9px] text-white/15 font-mono mt-0.5">
          {progress.completedSteps}/{quest.steps.length}
        </p>
      </div>
    </div>
  );
}
