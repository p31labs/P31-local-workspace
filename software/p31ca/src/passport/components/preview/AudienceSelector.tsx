import React from 'react';
import type { PassportProfileId } from '@p31/shared/cognitive-passport';

interface AudienceSelectorProps {
  selected: PassportProfileId;
  onChange: (profile: PassportProfileId) => void;
}

const PROFILES: Array<{
  id: PassportProfileId;
  label: string;
  description: string;
  color: string;
}> = [
  { id: 'public', label: 'Public', description: 'Minimal info — professional identity only', color: 'zinc' },
  { id: 'family', label: 'Family', description: 'Relationship context, communication preferences', color: 'emerald' },
  { id: 'clinician', label: 'Clinician', description: 'Medical, cognitive, full communication profile', color: 'blue' },
  { id: 'court', label: 'Court / Legal', description: 'Legal identifiers, family context, minimal medical', color: 'amber' },
  { id: 'cursor-agent', label: 'Coding Agent', description: 'Cognitive profile, lexicon, agent config', color: 'purple' },
  { id: 'grant-reviewer', label: 'Grant Reviewer', description: 'Professional, financial, communication', color: 'teal' },
];

export function AudienceSelector({ selected, onChange }: AudienceSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400 mb-3">
        Choose who this export is for. Different recipients see different fields.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PROFILES.map(profile => (
          <button
            key={profile.id}
            onClick={() => onChange(profile.id)}
            className={[
              'text-left p-3 rounded-lg border transition-all',
              selected === profile.id
                ? `border-${profile.color}-500 bg-${profile.color}-500/10 ring-1 ring-${profile.color}-500/30`
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500',
            ].join(' ')}
          >
            <div className="font-medium text-sm text-zinc-200">{profile.label}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{profile.description}</div>
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-zinc-500 mt-2">
          Exporting for: <span className="text-teal-400 font-medium">{PROFILES.find(p => p.id === selected)?.label}</span>
        </p>
      )}
    </div>
  );
}
