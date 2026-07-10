import { generateInterface } from '@p31/interface-generator';
import type { InterfaceDescription } from '@p31/interface-generator';
import { identityStore } from '../store/identity';

export type UigRole = 'coordinator' | 'researcher' | 'participant' | 'grant-reviewer';

// PHOS has no explicit role concept; sovereign (registered) users get the
// coordinator-style adaptive dashboard, guests fall back to participant.
export function phosRoleFromIdentity(): UigRole {
  const id = identityStore.get();
  return id.isRegistered === 'true' ? 'coordinator' : 'participant';
}

// Reference payload so the UIG produces a rich, role-appropriate widget set for
// the demo surface. Real surfaces would supply their own fetched view data.
export function samplePhosViewData(surfaceId: string): Record<string, any> {
  if (surfaceId === 'DASHBOARD') {
    return {
      participants_count: 3,
      sessions_count: 12,
      payments_pending: 2,
      days_until_aug1: 22,
      participants_by_cohort: { A: 3, B: 0, C: 0 },
      sessions_by_phase: { 1: 4, 2: 4, 3: 4 },
      deadlines: [
        { label: 'NLnet Submission', due_date: '2026-08-01', owner: 'William', met: false },
        { label: 'ADA Title II Compliance', due_date: '2027-04-26', owner: 'Research', met: false },
      ],
    };
  }
  return {};
}

export function generatePhosInterface(
  surfaceId: string,
  opts: { spoons?: number; role?: UigRole; viewData?: Record<string, any> } = {},
): InterfaceDescription {
  const spoons = opts.spoons ?? 3;
  const role = opts.role ?? 'participant';
  return generateInterface({
    passport: null,
    viewData: opts.viewData ?? samplePhosViewData(surfaceId),
    role,
    spoons,
  });
}
