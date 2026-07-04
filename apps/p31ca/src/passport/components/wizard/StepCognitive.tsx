import React from 'react';
import { VoiceInput } from '../fields/VoiceInput';

interface CognitiveFields {
  neurotype: string;
  sensorySensitivity: number;
  sensoryOverloadThreshold: number;
  communicationStyle: string;
  executiveFunctionPatterns: string;
  processingSpeed: string;
  accommodationNeeds: string;
}

interface StepCognitiveProps {
  data: Partial<CognitiveFields>;
  onChange: (field: keyof CognitiveFields, value: string | number) => void;
}

const NEUROTYPE_OPTIONS = [
  'Autistic / ASD',
  'ADHD',
  'AuDHD',
  'Dyslexic',
  'Dyspraxic',
  'Tourette Syndrome',
  'Sensory Processing Disorder',
  'Neurotypical',
  'Uncertain / Exploring',
  'Prefer not to say',
];

export function StepCognitive({ data, onChange }: StepCognitiveProps) {
  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-sm text-zinc-400">
          Your cognitive and sensory profile helps the system adapt to how you experience the world.
          All fields optional — fill what feels right.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">Neurotype</label>
        <p className="text-xs text-zinc-500 mb-1">How do you describe your neurotype?</p>
        <div className="flex gap-2 items-center">
          <select
            value={data.neurotype ?? ''}
            onChange={e => onChange('neurotype', e.target.value)}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="">Select or speak...</option>
            {NEUROTYPE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <VoiceInput
            onTranscript={text => onChange('neurotype', text)}
            fieldLabel="Neurotype"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">
          Sensory Sensitivity (0–10)
        </label>
        <p className="text-xs text-zinc-500 mb-1">0 = minimal, 10 = extreme sensitivity to sensory input</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={data.sensorySensitivity ?? 5}
            onChange={e => onChange('sensorySensitivity', parseInt(e.target.value))}
            className="flex-1 accent-teal-500"
          />
          <span className="text-sm text-zinc-300 w-8 text-center font-mono">
            {data.sensorySensitivity ?? 5}
          </span>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Low sensitivity</span>
          <span>High sensitivity</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">
          Overload Threshold (0–10)
        </label>
        <p className="text-xs text-zinc-500 mb-1">How quickly do you reach sensory/mental overload?</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={data.sensoryOverloadThreshold ?? 5}
            onChange={e => onChange('sensoryOverloadThreshold', parseInt(e.target.value))}
            className="flex-1 accent-teal-500"
          />
          <span className="text-sm text-zinc-300 w-8 text-center font-mono">
            {data.sensoryOverloadThreshold ?? 5}
          </span>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Hard to overload</span>
          <span>Overloads easily</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">Communication Style</label>
        <p className="text-xs text-zinc-500 mb-1">How do you prefer to communicate?</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={data.communicationStyle ?? ''}
            onChange={e => onChange('communicationStyle', e.target.value)}
            placeholder="e.g. Direct, literal, prefer written over verbal"
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <VoiceInput
            onTranscript={text => onChange('communicationStyle', text)}
            fieldLabel="Communication style"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">Executive Function Patterns</label>
        <p className="text-xs text-zinc-500 mb-1">Any patterns around executive function?</p>
        <div className="flex gap-2 items-center">
          <textarea
            value={data.executiveFunctionPatterns ?? ''}
            onChange={e => onChange('executiveFunctionPatterns', e.target.value)}
            placeholder="e.g. Task initiation challenges, hyperfocus on novel problems, need clear step-by-step instructions"
            rows={3}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
