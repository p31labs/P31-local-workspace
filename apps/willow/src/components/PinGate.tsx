/**
 * @file PinGate.tsx — WILLOW PIN gate for caregiver portal.
 * 4-digit PIN entry. Stored in localStorage (prototype-only; not production-grade).
 */

import { useState, useEffect } from 'react';

const PIN_KEY = 'willow-caregiver-pin';
const DEFAULT_PIN = '1234';

function readPin(): string {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

function hashPin(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) - h + pin.charCodeAt(i)) | 0;
  return String(h);
}

interface PinGateProps {
  onUnlock: () => void;
  onClose: () => void;
}

export function PinGate({ onUnlock, onClose }: PinGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [setting, setSetting] = useState(false);

  useEffect(() => {
    const hasPin = localStorage.getItem(PIN_KEY);
    if (!hasPin) setSetting(true);
  }, []);

  const handleSubmit = () => {
    if (setting) {
      if (pin.length >= 4) {
        localStorage.setItem(PIN_KEY, pin);
        onUnlock();
      } else {
        setError(true);
      }
      return;
    }
    if (pin === readPin()) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  const digits = pin.split('');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: 'rgba(7,13,10,0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-xs" style={{ background: 'var(--p31-surface)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 20, padding: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🔐</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--p31-text-primary)', marginBottom: 4, textAlign: 'center' }}>
          {setting ? 'Set a PIN' : 'Parent Portal'}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--p31-text-secondary)', marginBottom: 20, textAlign: 'center' }}>
          {setting ? 'Choose a 4-digit PIN to protect this area.' : 'Enter the PIN to continue.'}
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 48, height: 48, borderRadius: 12,
                border: `1px solid ${error ? 'rgba(251,113,133,0.4)' : 'rgba(52,211,153,0.2)'}`,
                background: digits[i] ? 'rgba(52,211,153,0.1)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: 'var(--p31-accent)',
              }}
            >
              {digits[i] ? '•' : ''}
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--p31-accent-red)', textAlign: 'center', marginBottom: 12 }}>
            {setting ? 'PIN must be at least 4 digits.' : 'Incorrect PIN. Try again.'}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
            <button
              key={key}
              disabled={key === ''}
              onClick={() => {
                if (key === '⌫') {
                  setPin((p) => p.slice(0, -1));
                  setError(false);
                } else if (key) {
                  setPin((p) => {
                    if (p.length >= 4) return p;
                    return p + key;
                  });
                  setError(false);
                }
              }}
              style={{
                minHeight: 56, borderRadius: 12, border: '1px solid rgba(52,211,153,0.12)',
                background: 'rgba(52,211,153,0.04)', color: 'var(--p31-text-primary)',
                fontSize: 18, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            style={{ minHeight: 48, flex: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--p31-text-secondary)', fontSize: 14, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4}
            style={{
              minHeight: 48, flex: 1, borderRadius: 12, border: '1px solid rgba(52,211,153,0.3)',
              background: pin.length >= 4 ? 'rgba(52,211,153,0.1)' : 'rgba(52,211,153,0.03)',
              color: pin.length >= 4 ? 'var(--p31-accent)' : 'var(--p31-text-tertiary)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {setting ? 'Save PIN' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
