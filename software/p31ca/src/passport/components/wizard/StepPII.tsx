import React, { useState, useCallback } from 'react';
import { VoiceInput } from '../fields/VoiceInput';

interface PIIFields {
  givenName: string;
  familyName: string;
  preferredName: string;
  pronouns: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

interface StepPIIProps {
  data: Partial<PIIFields>;
  onChange: (field: keyof PIIFields, value: string) => void;
}

export function StepPII({ data, onChange }: StepPIIProps) {
  const fields: Array<{
    key: keyof PIIFields;
    label: string;
    type: string;
    placeholder: string;
    required?: boolean;
    description?: string;
  }> = [
    { key: 'givenName', label: 'Given Name', type: 'text', placeholder: 'Legal first name', required: true },
    { key: 'familyName', label: 'Family Name', type: 'text', placeholder: 'Legal last name', required: true },
    { key: 'preferredName', label: 'Preferred Name', type: 'text', placeholder: 'What you like to be called', description: 'Leave blank if same as given name' },
    { key: 'pronouns', label: 'Pronouns', type: 'text', placeholder: 'e.g. he/him, she/her, they/them' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', placeholder: '' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <p className="text-sm text-zinc-400">
          Basic identifiers. These help consumers know who you are and how to reach you.
          Fields marked with * are recommended for most profiles.
        </p>
      </div>
      {fields.map(field => (
        <div key={field.key} className="space-y-1">
          <label className="block text-sm font-medium text-zinc-300">
            {field.label}
            {field.required && <span className="text-rose-400 ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-xs text-zinc-500 mb-1">{field.description}</p>
          )}
          <div className="flex gap-2 items-center">
            <input
              type={field.type}
              value={data[field.key] ?? ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm"
            />
            <VoiceInput
              onTranscript={text => onChange(field.key, text)}
              fieldLabel={field.label}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
