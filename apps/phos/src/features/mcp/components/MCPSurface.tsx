import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function MCPSurface() {
  const { spoons } = useSpoon();
  const key = 'phos:mcp';

  const cards = [{'t': 'vault.read', 'd': 'server: phos-vault'}, {'t': 'ledger.earn', 'd': 'server: phos-ledger'}, {'t': 'justice.log', 'd': 'server: phos-justice'}, {'t': 'passport.issue', 'd': 'server: phos-passport'}, {'t': 'worker.status', 'd': 'server: membrane'}, {'t': 'bonding.molecule', 'd': 'server: phos-bonding'}, {'t': 'attest.create', 'd': 'server: phos-attest'}, {'t': 'cognitive.suggest', 'd': 'server: phos-prosth'}];
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="mcpSurface" data-mcp-state="idle">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">MCP Tools</h1>
      </GlassCard>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(c => (
          <GlassCard key={c.t} className="p-4">
            <h3 className="font-bold text-ink text-sm">{c.t}</h3>
            <p className="text-xs text-cloud/50 mt-1">{c.d}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
