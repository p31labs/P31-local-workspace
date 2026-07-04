import { endpoints } from '../../config/endpoints';
import { signedFetch } from '../api/signer';

export interface ContractCreateInput {
  partyADid: string;
  partyBDid: string;
  type?: string;
  title: string;
  description?: string;
  terms?: any[];
  stakes?: any[];
  metadata?: Record<string, any>;
}

export interface ContractRecord {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  parties: { did: string; displayName: string; signedAt: string; signature: string }[];
  terms: any[];
  stakes: any[];
  metadata: Record<string, any>;
  hashChain: any[];
  signatures: { partyA: string; partyB: string };
  createdAt: number;
  updatedAt: number;
  activatedAt: string;
  fulfilledAt: string;
  dissolvedAt: string;
}

export async function createContract(input: ContractCreateInput): Promise<ContractRecord> {
  const res = await signedFetch(
    `${endpoints.contractEngine}/contract/initiate`,
    {
      method: 'POST',
      body: JSON.stringify({
        partyADid: input.partyADid,
        partyBDid: input.partyBDid,
        type: input.type || 'ROCCA',
        title: input.title,
        description: input.description || '',
        terms: input.terms || [],
        stakes: input.stakes || [],
        metadata: input.metadata,
      }),
    },
    'partyADid'
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create contract');
  return data.contract;
}

export async function fetchContract(contractId: string): Promise<ContractRecord | null> {
  const url = new URL(`${endpoints.contractEngine}/contract`);
  url.searchParams.set('contractId', contractId);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch contract');
  return data.contract;
}

export async function signContract(contractId: string, partyId: string, signature: string): Promise<void> {
  const res = await signedFetch(
    `${endpoints.contractEngine}/contract/sign`,
    { method: 'POST', body: JSON.stringify({ contractId, partyId, signature }) },
    'partyId'
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to sign contract');
  }
}

export async function activateContract(contractId: string): Promise<void> {
  const res = await signedFetch(
    `${endpoints.contractEngine}/contract/activate`,
    { method: 'POST', body: JSON.stringify({ contractId }) },
    'partyADid'
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to activate contract');
  }
}

export async function fulfillContract(contractId: string, attestation?: Record<string, any>): Promise<void> {
  const res = await signedFetch(
    `${endpoints.contractEngine}/contract/fulfill`,
    { method: 'POST', body: JSON.stringify({ contractId, attestation: attestation ? JSON.stringify(attestation) : null }) },
    'partyADid'
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fulfill contract');
  }
}

export async function dissolveContract(contractId: string, reason?: string): Promise<void> {
  const res = await signedFetch(
    `${endpoints.contractEngine}/contract/dissolve`,
    { method: 'POST', body: JSON.stringify({ contractId, reason }) },
    'partyADid'
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to dissolve contract');
  }
}
