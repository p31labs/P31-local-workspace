import React from 'react';

export interface SecurityBadgeProps {
  storageType?: string;
  encryptionStatus?: 'active' | 'simulated' | 'passive';
  signatureVerified?: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  storageType = 'IndexedDB',
  encryptionStatus = 'active',
  signatureVerified = true,
}) => {
  const getEncryptionColor = () => {
    switch (encryptionStatus) {
      case 'active': return 'text-emerald-400';
      case 'simulated': return 'text-amber-400';
      case 'passive': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="border-t border-emerald-900/50 mt-6 pt-4 flex flex-wrap justify-between items-center gap-4 text-[11px] font-mono">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500">🔒</span>
          <span className="uppercase tracking-wider text-emerald-600">Sovereign Vault</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">🗄️</span>
          <span className="text-gray-400">{storageType}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={getEncryptionColor()}>⚙️</span>
          <span className={getEncryptionColor()}>
            {encryptionStatus === 'active' ? 'ML-KEM-768' : encryptionStatus === 'simulated' ? 'Simulated' : 'Passive'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={signatureVerified ? 'text-emerald-400' : 'text-red-400'}>
          {signatureVerified ? '✓ SIGNATURE VERIFIED' : '✗ SIGNATURE TAMPERED'}
        </span>
      </div>
    </div>
  );
};
