import React from 'react';
import { VoiceInput } from '../fields/VoiceInput';

interface CommFields {
  modality_order: string;
  bandwidth_spoons: number;
  response_time_preference: string;
  scheduling_needs: string;
  boundary_notes: string;
}

interface StepCommunicationProps {
  data: Partial<CommFields>;
  onChange: (field: keyof CommFields, value: string | number) => void;
}

const MODALITY_OPTIONS = [
  'Written (async)',
  'Verbal (sync)',
  'Typed chat (sync)',
  'Visual / diagrams',
  'Video call',
  'Voice message',
  'Any / flexible',
];

export function StepCommunication({ data, onChange }: StepCommunicationProps) {
  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-sm text-zinc-400">
          How should others communicate with you? These preferences help the system
          choose the right channel and timing.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">Preferred Modality</label>
        <p className="text-xs text-zinc-500 mb-1">How do you prefer to receive information?</p>
        <select
          value={data.modality_order ?? ''}
          onChange={e => onChange('modality_order', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        >
          <option value="">Select...</option>
          {MODALITY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">
          Bandwidth Spoons (0–12)
        </label>
        <p className="text-xs text-zinc-500 mb-1">How much communication energy do you typically have?</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={data.bandwidth_spoons ?? 6}
            onChange={e => onChange('bandwidth_spoons', parseInt(e.target.value))}
            className="flex-1 accent-teal-500"
          />
          <span className="text-sm text-zinc-300 w-8 text-center font-mono">
            {data.bandwidth_spoons ?? 6}
          </span>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Low energy</span>
          <span>High energy</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">Response Time Preference</label>
        <p className="text-xs text-zinc-500 mb-1">How quickly do you prefer others to expect a response?</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={data.response_time_preference ?? ''}
            onChange={e => onChange('response_time_preference', e.target.value)}
            placeholder="e.g. Within 24 hours, no rush, urgent only"
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <VoiceInput
            onTranscript={text => onChange('response_time_preference', text)}
            fieldLabel="Response time preference"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">Scheduling Needs</label>
        <p className="text-xs text-zinc-500 mb-1">Any special scheduling considerations?</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={data.scheduling_needs ?? ''}
            onChange={e => onChange('scheduling_needs', e.target.value)}
            placeholder="e.g. Need 24hr notice for meetings, prefer mornings"
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <VoiceInput
            onTranscript={text => onChange('scheduling_needs', text)}
            fieldLabel="Scheduling needs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-300">Boundary Notes</label>
        <p className="text-xs text-zinc-500 mb-1">Communication boundaries or hard limits?</p>
        <div className="flex gap-2 items-start">
          <textarea
            value={data.boundary_notes ?? ''}
            onChange={e => onChange('boundary_notes', e.target.value)}
            placeholder="e.g. No calls without prior text, no group chat mentions after 9pm"
            rows={3}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
