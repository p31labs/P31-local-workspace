/**
 * @file LumiIdentityCard — agent identity as a first-class object.
 * Renders Lumi's DID, capability scope checklist, token expiry countdown,
 * and a live PQC signature status. Aligns with the emerging AgentCard /
 * AIC-JWT agent-identity standards.
 *
 * @a2ui-component LumiIdentityCard
 * @a2ui-props did string - did:key identifier
 * @a2ui-props scope { allowed: string[]; denied: string[] } - Capability scope
 * @a2ui-props tokenExpiresIn number - Seconds until token expiry
 * @a2ui-props signatureVerified boolean - PQC signature status
 */

import { useEffect, useState } from 'react';
import { GOVERNANCE } from '../math/colors.js';

export interface LumiScope {
  allowed: string[];
  denied: string[];
  attenuated?: string[];
}

export interface LumiIdentityCardProps {
  did: string;
  scope: LumiScope;
  tokenExpiresIn?: number;
  signatureVerified?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function LumiIdentityCard({ did, scope, tokenExpiresIn = 900, signatureVerified = true, className, style }: LumiIdentityCardProps) {
  const [remaining, setRemaining] = useState(tokenExpiresIn);

  useEffect(() => {
    setRemaining(tokenExpiresIn);
    if (tokenExpiresIn <= 0) return;
    const timer = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, [tokenExpiresIn]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const low = remaining < 120;

  return (
    <div className={`p31-lumi-identity-card rounded-lg border border-white/12 bg-[${GOVERNANCE.agentSurface}] p-3 ${className || ''}`} style={style}>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wider text-[${GOVERNANCE.agentAccent}]`}>Lumi</span>
        {signatureVerified ? (
          <span className={`ml-auto rounded-full bg-[${GOVERNANCE.chainVerified}]/10 px-2 py-0.5 text-[10px] font-medium text-[${GOVERNANCE.chainVerified}]`}>
            ML-DSA-65 ✓
          </span>
        ) : (
          <span className={`ml-auto rounded-full bg-[${GOVERNANCE.chainBroken}]/10 px-2 py-0.5 text-[10px] font-medium text-[${GOVERNANCE.chainBroken}]`}>
            Signature unverified
          </span>
        )}
      </div>

      <p className={`mt-2 font-mono text-[11px] break-all text-slate-400 ${low ? 'text-amber-300' : ''}`} title="did:key">
        {did}
      </p>

      <div className="mt-2.5 flex items-center gap-2">
        <span className={`text-[10px] font-mono uppercase tracking-wider ${low ? `text-[${GOVERNANCE.chainPending}]` : 'text-slate-500'}`}>
          token {minutes}:{String(seconds).padStart(2, '0')}
        </span>
        <div className="h-1 flex-1 rounded-full bg-white/10" aria-hidden="true">
          <div
            className={`h-full rounded-full ${low ? `bg-[${GOVERNANCE.chainPending}]` : `bg-[${GOVERNANCE.agentAccent}]`}`}
            style={{ width: `${Math.max(0, Math.min(100, (remaining / tokenExpiresIn) * 100))}%` }}
          />
        </div>
      </div>

      <ul className="mt-2.5 space-y-1 text-xs">
        {scope.allowed.map((c) => (
          <li key={`allow-${c}`} className="flex items-center gap-1.5">
            <span className={`text-[${GOVERNANCE.chainVerified}]`} aria-hidden="true">✓</span>
            <span className="text-slate-200">{c}</span>
          </li>
        ))}
        {(scope.attenuated ?? []).map((c) => (
          <li key={`atten-${c}`} className="flex items-center gap-1.5">
            <span className={`text-[${GOVERNANCE.chainPending}]`} aria-hidden="true">◇</span>
            <span className="text-slate-300">{c} <span className="text-slate-500">(attenuated)</span></span>
          </li>
        ))}
        {scope.denied.map((c) => (
          <li key={`deny-${c}`} className="flex items-center gap-1.5 opacity-60">
            <span className="text-slate-600" aria-hidden="true">—</span>
            <span className="text-slate-500">{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LumiIdentityCard;