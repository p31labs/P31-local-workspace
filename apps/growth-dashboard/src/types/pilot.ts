export interface Pilot {
  id: number;
  did: string;
  name: string;
  email?: string;
  status: 'active' | 'invited' | 'pending';
  source: 'synthetic' | 'test' | 'live';
  org?: string;
  plan?: string;
  invited_at?: string;
  created_at: string;
  updated_at: string;
  onboardedAt?: number | null;
  createdAt?: string | null;
  invitedAt?: string | null;
  loveAddress?: string | null;
}

export interface ApiResponse {
  pilots: Pilot[];
  meta: {
    total: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
    last_sync: string | null;
  };
}

export type StatusCount = {
  status: string;
  count: number;
  fill: string;
};

export type SourceCount = {
  name: string;
  value: number;
};

export type TrendPoint = {
  date: string;
  count: number;
};

export type SortField = 'did' | 'name' | 'status' | 'source' | 'id' | 'created_at';
export type SortDir = 'asc' | 'desc';
