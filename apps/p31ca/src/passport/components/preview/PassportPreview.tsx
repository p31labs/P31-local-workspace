import React, { useState } from 'react';
import type { PassportProfileId } from '@p31/shared/cognitive-passport';
import { AUDIENCE_MATRIX, FIELD_GROUPS } from '@p31/shared/cognitive-passport';

interface PassportPreviewProps {
  fields: Partial<Record<string, unknown>>;
  profile: PassportProfileId;
  fieldCount: number;
  onExport: (format: 'json' | 'yaml' | 'signed') => void;
  hasKeypair: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  pii: 'Identity', med: 'Medical', cog: 'Cognitive', comm: 'Communication',
  prof: 'Professional', fam: 'Relationships', org: 'Organizations', leg: 'Legal',
  ben: 'Benefits', fin: 'Financial', work: 'Work', vault: 'Private Vault',
  comms: 'Communications', sched: 'Schedule', lex: 'Lexicon', agt: 'Agent Config',
  sent: 'Sentinel', gen: 'Genesis',
};

const PROFILE_LABELS: Record<string, string> = {
  'cursor-agent': 'Coding Agent', 'claude-session': 'AI Session', clinician: 'Clinician',
  ssa: 'SSA', court: 'Court', 'ada-support': 'ADA Support', beta: 'Beta',
  child: 'Child', 'grant-reviewer': 'Grant Reviewer', public: 'Public',
  sentinel: 'Sentinel', family: 'Family',
};

export function PassportPreview({ fields, profile, fieldCount, onExport, hasKeypair }: PassportPreviewProps) {
  const matrixRow = AUDIENCE_MATRIX[profile];
  const [exporting, setExporting] = useState(false);

  if (!fields || fieldCount === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg mb-2">No passport data yet</p>
        <p className="text-sm">Fill in the wizard steps to build your passport.</p>
      </div>
    );
  }

  const fieldEntries = Object.entries(fields).filter(([_, v]) => v !== undefined && v !== null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Passport Preview</h3>
          <p className="text-xs text-zinc-500">
            {fieldCount} field groups · Exporting for <span className="text-teal-400">{PROFILE_LABELS[profile] ?? profile}</span>
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {fieldEntries.map(([key]) => {
          const cell = matrixRow?.[key as keyof typeof matrixRow] as string;
          const visibilityLabel = cell === 'A' ? 'Included'
            : cell === 'R' ? 'Redacted'
            : cell === 'D' ? 'Excluded'
            : cell === 'S' ? 'Session-only'
            : 'Unknown';

          const visibilityColor = cell === 'A' ? 'text-teal-400'
            : cell === 'R' ? 'text-amber-400'
            : cell === 'D' ? 'text-zinc-600'
            : cell === 'S' ? 'text-blue-400'
            : 'text-zinc-500';

          return (
            <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded bg-zinc-800/50">
              <span className="text-sm text-zinc-300">{FIELD_LABELS[key] ?? key}</span>
              <span className={`text-xs ${visibilityColor}`}>{visibilityLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => { setExporting(true); onExport('json'); setExporting(false); }}
          disabled={exporting}
          className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50"
        >
          Export JSON
        </button>
        <button
          onClick={() => { setExporting(true); onExport('yaml'); setExporting(false); }}
          disabled={exporting}
          className="flex-1 px-3 py-2 text-sm bg-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-600 transition-colors disabled:opacity-50"
        >
          Export YAML
        </button>
        <button
          onClick={() => { setExporting(true); onExport('signed'); setExporting(false); }}
          disabled={exporting || !hasKeypair}
          title={!hasKeypair ? 'Generate a keypair first to sign exports' : 'Signed export'}
          className="flex-1 px-3 py-2 text-sm bg-amber-700 text-amber-100 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          Signed
        </button>
      </div>
    </div>
  );
}
