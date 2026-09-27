import { useState, useMemo } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import type { Pilot, SortField, SortDir } from '../types/pilot';
import { useSortedPilots } from '../hooks/usePilots';

interface PilotTableProps {
  pilots: Pilot[];
}

export function PilotTable({ pilots }: PilotTableProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: 'id',
    dir: 'desc',
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return pilots;
    const q = search.toLowerCase();
    return pilots.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        p.did.toLowerCase().includes(q),
    );
  }, [pilots, search]);

  const sortedPilots = useSortedPilots(filtered, sort);

  const toggleSort = (field: SortField) => {
    setSort((s: { field: SortField; dir: SortDir }) => ({
      field,
      dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'text-quantum-green',
      invited: 'text-quantum-gold',
      pending: 'text-muted',
    };
    return map[status] || 'text-muted';
  };

  const sourceBadge = (source: string) => {
    const map: Record<string, string> = {
      synthetic: 'text-quantum-violet',
      test: 'text-muted',
      live: 'text-quantum-cyan',
    };
    return map[source] || 'text-muted';
  };

  return (
    <GlassCard className="p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading text-cloud uppercase tracking-wider">
          Pilot Registry
        </h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          aria-label="Search pilots"
          className="bg-surface2 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-quantum-cyan transition-colors"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th
                scope="col"
                className="px-3 py-2 font-heading text-cloud uppercase text-xs cursor-pointer"
                onClick={() => toggleSort('id')}
              >
                DID
              </th>
              <th
                scope="col"
                className="px-3 py-2 font-heading text-cloud uppercase text-xs cursor-pointer"
                onClick={() => toggleSort('name')}
              >
                Name
              </th>
              <th
                scope="col"
                className="px-3 py-2 font-heading text-cloud uppercase text-xs cursor-pointer"
                onClick={() => toggleSort('status')}
              >
                Status
              </th>
              <th
                scope="col"
                className="px-3 py-2 font-heading text-cloud uppercase text-xs cursor-pointer"
                onClick={() => toggleSort('source')}
              >
                Source
              </th>
              <th
                scope="col"
                className="px-3 py-2 font-heading text-cloud uppercase text-xs cursor-pointer"
                onClick={() => toggleSort('created_at')}
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedPilots.map((p) => (
              <tr key={p.id} className="hover:bg-surface2/50 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs text-muted truncate max-w-[200px]">
                  {p.did}
                </td>
                <td className="px-3 py-2.5 text-ink">{p.name}</td>
                <td className="px-3 py-2.5">
                  <span className={`${statusBadge(p.status)} text-xs font-medium`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`${sourceBadge(p.source)} text-xs`}>
                    [{p.source}]
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted text-xs">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-muted py-8">No pilots match your search.</div>
        )}
      </div>
      <div className="mt-3 text-xs text-muted">
        Showing {filtered.length} of {pilots.length} pilots
      </div>
    </GlassCard>
  );
}
