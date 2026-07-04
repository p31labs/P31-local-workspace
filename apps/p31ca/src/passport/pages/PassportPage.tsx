import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WizardShell, type WizardStepId, WIZARD_STEPS } from '../components/wizard/WizardShell';
import { StepPII } from '../components/wizard/StepPII';
import { StepCognitive } from '../components/wizard/StepCognitive';
import { StepCommunication } from '../components/wizard/StepCommunication';
import { PassportPreview } from '../components/preview/PassportPreview';
import { AudienceSelector } from '../components/preview/AudienceSelector';
import { createAutoSaver } from '../lib/db/auto-save';
import { PassportDocumentManager } from '../lib/passport';
import type { PassportProfileId } from '@p31/shared/cognitive-passport';
import { generateEd25519Keypair } from '@p31/shared/cognitive-passport';

type ViewMode = 'wizard' | 'preview';

interface WizardData {
  pii: Record<string, string>;
  cog: Record<string, string | number>;
  comm: Record<string, string | number>;
}

export function PassportPage() {
  const [view, setView] = useState<ViewMode>('wizard');
  const [currentStep, setCurrentStep] = useState<WizardStepId>('pii');
  const [completedSteps, setCompletedSteps] = useState<WizardStepId[]>([]);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hasKeypair, setHasKeypair] = useState(false);
  const [exportProfile, setExportProfile] = useState<PassportProfileId>('public');
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const managerRef = useRef(new PassportDocumentManager());
  const saverRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const dataRef = useRef<WizardData>({ pii: {}, cog: {}, comm: {} });

  useEffect(() => {
    setMounted(true);
    saverRef.current = createAutoSaver({
      key: 'current-draft',
      delay: 1500,
      onSave: (ts) => setLastSaved(ts),
    });

    // Try to load existing keypair from IndexedDB
    loadExistingKeypair();

    return () => {
      saverRef.current?.destroy();
    };
  }, []);

  async function loadExistingKeypair() {
    try {
      const { loadDraft } = await import('../lib/db/index');
      const draft = await loadDraft('p31-keypair');
      if (draft?.data?.publicKey) {
        setHasKeypair(true);
        const pubBytes = Uint8Array.from(
          (draft.data.publicKey as number[])
        );
        const privBytes = Uint8Array.from(
          (draft.data.privateKey as number[])
        );
        managerRef.current.setKeypair({ publicKey: pubBytes, privateKey: privBytes });
      }
    } catch {
      // No existing keypair — user can generate one
    }
  }

  const handleFieldChange = useCallback((step: WizardStepId, field: string, value: string | number) => {
    if (!dataRef.current[step as keyof WizardData]) {
      (dataRef.current as Record<string, Record<string, string | number>>)[step] = {};
    }
    (dataRef.current as Record<string, Record<string, string | number>>)[step][field] = value;

    const manager = managerRef.current;

    switch (step) {
      case 'pii':
        manager.setField('pii', { ...dataRef.current.pii, [field]: value });
        break;
      case 'cog':
        manager.setField('cog', { ...dataRef.current.cog, [field]: value });
        break;
      case 'comm':
        manager.setField('comm', { ...dataRef.current.comm, [field]: value });
        break;
    }

    manager.markStepComplete(step);
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...new Set([...prev, step])]);
    }

    saverRef.current?.schedule(manager.toJSON(), manager.getCompletedSteps());
  }, [completedSteps]);

  const handleSave = useCallback(() => {
    const manager = managerRef.current;
    manager.markStepComplete(currentStep);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
    }
    saverRef.current?.flush();
  }, [currentStep, completedSteps]);

  const handleExport = useCallback(async (format: 'json' | 'yaml' | 'signed') => {
    const manager = managerRef.current;
    try {
      let output: string | Uint8Array;
      if (format === 'signed') {
        output = await manager.export({
          format: 'signed',
          profile: exportProfile,
          sign: true,
        });
      } else {
        output = await manager.export({
          format,
          profile: exportProfile,
          sign: false,
        });
      }
      const text = typeof output === 'string' ? output : new TextDecoder().decode(output);
      setExportResult(text);

      // Trigger download
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `p31-passport-${exportProfile}.${format === 'yaml' ? 'yaml' : 'json'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setExportResult(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [exportProfile]);

  const handleGenerateKeypair = useCallback(async () => {
    try {
      const keypair = await generateEd25519Keypair();
      managerRef.current.setKeypair(keypair);
      setHasKeypair(true);

      // Store in IndexedDB
      const { saveDraft } = await import('../lib/db/index');
      await saveDraft('p31-keypair', {
        publicKey: Array.from(keypair.publicKey),
        privateKey: Array.from(keypair.privateKey),
      } as any);

      alert('Keypair generated successfully! Your passport data can now be signed.');
    } catch (err) {
      console.error('Keypair generation failed:', err);
      alert('Failed to generate keypair. Is @noble/ed25519 installed?');
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex gap-4 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setView('wizard')}
          className={`text-sm pb-1 border-b-2 transition-colors ${
            view === 'wizard'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Build Passport
        </button>
        <button
          onClick={() => setView('preview')}
          className={`text-sm pb-1 border-b-2 transition-colors ${
            view === 'preview'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Preview & Export
        </button>
      </div>

      {view === 'wizard' && (
        <WizardShell
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepChange={setCurrentStep}
          onSave={handleSave}
          lastSaved={lastSaved}
        >
          {currentStep === 'pii' && (
            <StepPII
              data={dataRef.current.pii}
              onChange={(field, value) => handleFieldChange('pii', field, value)}
            />
          )}
          {currentStep === 'cog' && (
            <StepCognitive
              data={dataRef.current.cog as any}
              onChange={(field, value) => handleFieldChange('cog', field, value)}
            />
          )}
          {currentStep === 'comm' && (
            <StepCommunication
              data={dataRef.current.comm as any}
              onChange={(field, value) => handleFieldChange('comm', field, value)}
            />
          )}
          {currentStep === 'med' && (
            <div className="text-center py-8 text-zinc-500">
              <p>Medical profile step — coming soon</p>
              <button
                onClick={() => {
                  handleFieldChange('med', '_placeholder', 'true');
                }}
                className="mt-2 text-sm text-teal-400 hover:underline"
              >
                Skip for now
              </button>
            </div>
          )}
          {currentStep === 'fam' && (
            <div className="text-center py-8 text-zinc-500">
              <p>Relationship graph step — coming soon</p>
              <button
                onClick={() => {
                  handleFieldChange('fam', '_placeholder', 'true');
                }}
                className="mt-2 text-sm text-teal-400 hover:underline"
              >
                Skip for now
              </button>
            </div>
          )}
          {currentStep === 'sched' && (
            <div className="text-center py-8 text-zinc-500">
              <p>Schedule & rhythms step — coming soon</p>
              <button
                onClick={() => {
                  handleFieldChange('sched', '_placeholder', 'true');
                }}
                className="mt-2 text-sm text-teal-400 hover:underline"
              >
                Skip for now
              </button>
            </div>
          )}
          {currentStep === 'advanced' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-300">Crypto Keys</h3>
              <p className="text-sm text-zinc-500">
                Sign your passport so consumers can verify authenticity.
              </p>
              {hasKeypair ? (
                <div className="p-3 bg-teal-900/20 border border-teal-800/30 rounded-lg">
                  <p className="text-sm text-teal-400">✓ Keypair ready</p>
                  <p className="text-xs text-zinc-500 mt-1">Your passport exports will be signed.</p>
                </div>
              ) : (
                <button
                  onClick={handleGenerateKeypair}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Generate Keypair
                </button>
              )}

              <div className="pt-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Export Audience</h3>
                <AudienceSelector
                  selected={exportProfile}
                  onChange={setExportProfile}
                />
              </div>
            </div>
          )}
        </WizardShell>
      )}

      {view === 'preview' && (
        <div className="space-y-4">
          <AudienceSelector
            selected={exportProfile}
            onChange={setExportProfile}
          />
          <PassportPreview
            fields={managerRef.current.toJSON().fields ?? {}}
            profile={exportProfile}
            fieldCount={managerRef.current.getFieldCount()}
            onExport={handleExport}
            hasKeypair={hasKeypair}
          />
          {exportResult && (
            <details className="mt-4">
              <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300">
                View export output
              </summary>
              <pre className="mt-2 p-4 bg-zinc-900 rounded-lg text-xs text-zinc-400 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
                {exportResult}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
