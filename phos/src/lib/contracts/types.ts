export type ContractStatus = 'draft' | 'pending' | 'active' | 'fulfilled' | 'breached' | 'dissolved' | 'arbitration';
export type ContractType = 'ROCCA' | 'PARENTING' | 'FINANCIAL' | 'CUSTODY';

export interface ContractParty {
  did: string;
  displayName: string;
  signedAt?: string;
  signature?: string;
}

export interface ContractTerm {
  id: string;
  description: string;
  category: 'LOGISTICS' | 'FINANCIAL' | 'MEDICAL' | 'EDUCATION' | 'EMOTIONAL';
  isConditional: boolean;
  condition?: string;
  deadline?: string;
  fulfilled?: boolean;
  fulfilledAt?: string;
}

export interface ROCCAStake {
  amount: number;
  depositedBy: string;
  depositedAt: string;
  vestedAmount: number;
  vestingSchedule: 'linear' | 'step' | 'milestone';
  milestones: ROCCAMilestone[];
}

export interface ROCCAMilestone {
  id: string;
  description: string;
  targetDate: string;
  achieved: boolean;
  achievedAt?: string;
  verifiedBy: string[];
}

export interface SovereignContract {
  id: string;
  type: ContractType;
  status: ContractStatus;
  title: string;
  description: string;
  parties: ContractParty[];
  terms: ContractTerm[];
  stakes: ROCCAStake[];
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  fulfilledAt?: string;
  dissolvedAt?: string;
  metadata: {
    jurisdiction: string;
    governingLaw: string;
    version: string;
  };
  hashChain: string[];
  signatures: {
    partyA: string;
    partyB: string;
  };
}
