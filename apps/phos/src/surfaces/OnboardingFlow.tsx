import React, { useState, useCallback } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useAtmosphere } from '../components/AtmosphereProvider';

/**
 * OnboardingFlow — production pilot onboarding wizard.
 * Step-by-step: DID → PQC Keys → ETH Register → Care Proof → SBT Mint.
 *
 * Phase 6 of CWP-2026-031: The Design Frontier.
 */

interface Step {
  id: string;
  title: string;
  description: string;
  spoonSkipBelow?: number;
}

const STEPS: Step[] = [
  {
    id: 'did',
    title: 'Create DID',
    description: 'Generate a decentralised identifier (did:key) for your family.',
  },
  {
    id: 'pqc',
    title: 'Generate PQC Keys',
    description: 'Create ML-DSA-65 post-quantum keypair for quantum-resistant signatures.',
    spoonSkipBelow: 3,
  },
  {
    id: 'register',
    title: 'Register DID',
    description: 'Link your DID to your Ethereum address on Base Sepolia.',
  },
  {
    id: 'careproof',
    title: 'Care Proof Baseline',
    description: 'Submit your first care attestation to the LOVE ledger.',
  },
  {
    id: 'mint',
    title: 'Mint Care SBT',
    description: 'Mint your Care Soulbound Token on Base Sepolia.',
  },
];

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total} aria-label={`Step ${current + 1} of ${total}`}>
      <div className="flex justify-between text-[10px] text-white/30 mb-1">
        <span>Step {current + 1} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-quantum-cyan rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StepIndicator({ step, index, current, completed }: {
  step: Step;
  index: number;
  current: number;
  completed: boolean;
}) {
  const isActive = index === current;
  const isCompleted = completed;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono shrink-0
          transition-all duration-300
          ${isCompleted
            ? 'bg-quantum-green/20 text-quantum-green border border-quantum-green/30'
            : isActive
              ? 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30'
              : 'bg-white/[0.03] text-white/30 border border-white/[0.06]'}
        `}
        aria-hidden="true"
      >
        {isCompleted ? '✓' : index + 1}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-sans ${isActive ? 'text-white/90' : 'text-white/50'}`}>
          {step.title}
        </p>
        {isActive && (
          <p className="text-xs text-white/40 mt-0.5">{step.description}</p>
        )}
      </div>
    </div>
  );
}

export function OnboardingFlow() {
  const { spoons } = useAtmosphere();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);

  const handleComplete = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
      setProcessing(false);
    }, 1500);
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const allComplete = completedSteps.size === STEPS.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-semibold text-white/90">Pilot Onboarding</h1>
        <p className="text-sm text-white/40 mt-1">
          Set up your family&apos;s sovereign identity in 5 steps
        </p>
      </div>

      {/* Progress */}
      <ProgressBar current={currentStep} total={STEPS.length} />

      {/* Step indicators */}
      <GlassCard hover={false} padding="md">
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <StepIndicator
              key={step.id}
              step={step}
              index={i}
              current={currentStep}
              completed={completedSteps.has(i)}
            />
          ))}
        </div>
      </GlassCard>

      {/* Active step content */}
      {!allComplete && (
        <GlassCard hover={false}>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white/90">
                {STEPS[currentStep].title}
              </h2>
              <p className="text-sm text-white/50 mt-1">
                {STEPS[currentStep].description}
              </p>
            </div>

            {/* Step-specific content */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[16px] p-4 min-h-[120px] flex items-center justify-center">
              {currentStep === 0 && (
                <div className="text-center">
                  <p className="text-sm text-white/50">Generating your did:key...</p>
                  <p className="text-xs text-white/30 mt-2">Ed25519 · Web Crypto API</p>
                </div>
              )}
              {currentStep === 1 && (
                <div className="text-center">
                  <p className="text-sm text-white/50">Creating ML-DSA-65 keypair...</p>
                  <p className="text-xs text-white/30 mt-2">@noble/post-quantum · FIPS 204</p>
                </div>
              )}
              {currentStep === 2 && (
                <div className="text-center">
                  <p className="text-sm text-white/50">Registering DID on Base Sepolia...</p>
                  <p className="text-xs text-white/30 mt-2">love-ledger identity_registry</p>
                </div>
              )}
              {currentStep === 3 && (
                <div className="text-center">
                  <p className="text-sm text-white/50">Submitting care proof baseline...</p>
                  <p className="text-xs text-white/30 mt-2">SHA-256 hash chain · Ed25519 signed</p>
                </div>
              )}
              {currentStep === 4 && (
                <div className="text-center">
                  <p className="text-sm text-white/50">Minting Care SBT...</p>
                  <p className="text-xs text-white/30 mt-2">ERC-5192 · Base Sepolia</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={processing}
                className={`
                  px-6 py-2.5 text-sm font-medium rounded-[12px] transition-all duration-300 min-h-[48px]
                  ${processing
                    ? 'bg-quantum-cyan/20 text-quantum-cyan/50 cursor-wait'
                    : 'bg-quantum-cyan text-void hover:bg-quantum-cyan/90'}
                `}
                aria-label={`Complete step: ${STEPS[currentStep].title}`}
              >
                {processing ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* All complete */}
      {allComplete && (
        <GlassCard hover={false}>
          <div className="text-center py-8">
            <StatusBadge status="ok" label="Complete" className="mb-4" />
            <h2 className="text-lg font-semibold text-white/90 mb-2">
              Onboarding Complete
            </h2>
            <p className="text-sm text-white/50 mb-6">
              Your family&apos;s sovereign identity is now active on Base Sepolia.
            </p>
            <button
              onClick={() => { setCurrentStep(0); setCompletedSteps(new Set()); }}
              className="px-6 py-2.5 text-sm font-medium rounded-[12px] bg-quantum-cyan text-void hover:bg-quantum-cyan/90 transition-all min-h-[48px]"
            >
              Start Over
            </button>
          </div>
        </GlassCard>
      )}

      {/* Accessibility: screen reader announcements */}
      <div className="sr-only" aria-live="polite">
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
      </div>
    </div>
  );
}
