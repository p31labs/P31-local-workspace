import { useQuery } from '@tanstack/react-query';
import { fetchPilots } from '../lib/api';
import type { Pilot, SortField, SortDir } from '../types/pilot';

export function usePilots() {
  return useQuery({
    queryKey: ['pilots'],
    queryFn: fetchPilots,
    staleTime: 60_000,
  });
}

export function useSortedPilots(pilots: Pilot[] | undefined, sort: { field: SortField; dir: SortDir }) {
  const sorted = pilots
    ? [...pilots].sort((a, b) => {
        const aVal = String(a[sort.field] ?? '');
        const bVal = String(b[sort.field] ?? '');
        return sort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      })
    : [];
  return sorted;
}
