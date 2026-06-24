import React, { useState, useCallback, useEffect, useRef } from 'react';

export const WIZARD_STEPS = [
  { id: 'pii', label: 'Identity', description: 'Name, contact, basic identifiers' },
  { id: 'cog', label: 'Cognitive Profile', description: 'Neurotype, sensory, communication' },
  { id: 'comm', label: 'Communication', description: 'Preferences, modalities, bandwidth' },
  { id: 'med', label: 'Medical', description: 'Diagnoses, medications, allergies' },
  { id: 'fam', label: 'Relationships', description: 'Family graph, roles, names' },
  { id: 'sched', label: 'Schedule', description: 'Rhythms, availability, custody' },
  { id: 'advanced', label: 'Advanced', description: 'Legal, vault, agent config' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

interface WizardShellProps {
  currentStep: WizardStepId;
  completedSteps: WizardStepId[];
  onStepChange: (step: WizardStepId) => void;
  onSave: () => void;
  lastSaved: number | null;
  children: React.ReactNode;
}

export function WizardShell({
  currentStep,
  completedSteps,
  onStepChange,
  onSave,
  lastSaved,
  children,
}: WizardShellProps) {
  const currentIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  const totalSteps = WIZARD_STEPS.length;
  const progress = ((currentIndex + 1) / totalSteps) * 100;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const navPrev = useCallback(() => {
    const idx = WIZARD_STEPS.findIndex(s => s.id === currentStep);
    if (idx > 0) onStepChange(WIZARD_STEPS[idx - 1].id);
  }, [currentStep, onStepChange]);

  const navNext = useCallback(() => {
    const idx = WIZARD_STEPS.findIndex(s => s.id === currentStep);
    if (idx < totalSteps - 1) onStepChange(WIZARD_STEPS[idx + 1].id);
  }, [currentStep, onStepChange, totalSteps]);

  if (!mounted) return null;

  return (
    <div className="passport-wizard" data-p31-cogpass-wizard>
      {/* Progress bar */}
      <div className="mb-6" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-zinc-100">
            {WIZARD_STEPS[currentIndex]?.label}
          </h2>
          <span className="text-sm text-zinc-400">
            {currentIndex + 1} / {totalSteps}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          {WIZARD_STEPS[currentIndex]?.description}
        </p>
      </div>

      {/* Step indicator */}
      <nav className="flex gap-2 mb-6 overflow-x-auto pb-2" aria-label="Wizard steps">
        {WIZARD_STEPS.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap',
                isActive ? 'bg-teal-600 text-white' :
                isCompleted ? 'bg-zinc-700 text-teal-400' :
                'bg-zinc-800 text-zinc-500 hover:text-zinc-300',
              ].join(' ')}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                isActive ? 'bg-teal-500 text-white' :
                isCompleted ? 'bg-teal-500/30 text-teal-400' :
                'bg-zinc-700 text-zinc-500',
              ].join(' ')}>
                {isCompleted ? '✓' : idx + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Body */}
      <div className="min-h-[300px]">
        {children}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          {lastSaved
            ? `Saved ${new Date(lastSaved).toLocaleTimeString()}`
            : 'Not saved yet'}
        </div>
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={navPrev}
              className="px-4 py-2 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
          >
            Save
          </button>
          {currentIndex < totalSteps - 1 && (
            <button
              onClick={navNext}
              className="px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
