/**
 * @file VerifyButton — one-click chain verification.
 * Calls an async verifier (e.g. the Loom's GET /api/loom/verify) and renders
 * the verdict as a single sentence: "Chain intact across N events."
 *
 * @a2ui-component VerifyButton
 * @a2ui-props onVerify () => Promise<{intact: boolean; count: number; brokenAt?: number; checkedAt: string}>
 * @a2ui-props label string - Button text (default "Verify chain")
 */

import { useState } from 'react';
import { GOVERNANCE } from '../math/colors.js';

export interface VerifyResult {
  intact: boolean;
  count: number;
  brokenAt?: number;
  checkedAt: string;
}

export interface VerifyButtonProps {
  onVerify: () => Promise<VerifyResult>;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

type VerifyState = 'idle' | 'verifying' | 'ok' | 'failed';

export function VerifyButton({ onVerify, label = 'Verify chain', className, style }: VerifyButtonProps) {
  const [state, setState] = useState<VerifyState>('idle');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setState('verifying');
    setError(null);
    try {
      const res = await onVerify();
      setResult(res);
      setState(res.intact ? 'ok' : 'failed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
      setState('failed');
    }
  };

  const verdict = (() => {
    switch (state) {
      case 'verifying':
        return <span className={`text-[${GOVERNANCE.chainPending}]`}>Verifying hash chain…</span>;
      case 'ok':
        return (
          <span className={`text-[${GOVERNANCE.chainVerified}]`}>
            Chain intact across {result!.count.toLocaleString()} events. Last verified {result!.checkedAt}.
          </span>
        );
      case 'failed':
        return result
          ? <span className={`text-[${GOVERNANCE.chainBroken}]`}>Chain broken at event {result.brokenAt ?? '?'}. {error ?? ''}</span>
          : <span className={`text-[${GOVERNANCE.chainBroken}]`}>{error ?? 'Verification failed'}</span>;
      default:
        return null;
    }
  })();

  return (
    <div className={`p31-verify-button flex flex-col gap-2 ${className || ''}`} style={style}>
      <button
        onClick={run}
        disabled={state === 'verifying'}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-white/30 disabled:opacity-60 disabled:cursor-wait min-h-[44px]"
      >
        {state === 'verifying' ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-widest" aria-hidden="true">✓</span>
        )}
        {label}
      </button>
      {verdict}
    </div>
  );
}

export default VerifyButton;