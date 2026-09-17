export type NodeStatus = 'online' | 'offline' | 'degraded';

export interface FleetNode {
  name: string;
  status: NodeStatus;
  url: string;
  group?: string;
  latency_ms?: number;
}

export interface Surface {
  name: string;
  url: string;
  ok: boolean;
  code: number;
}

export interface MeshVertex {
  id: string;
  label: string;
  love: number;
}

export interface MeshEdge {
  a: string;
  b: string;
  weight: number;
}

export interface MeshState {
  vertices: number;
  edges: number;
  isostatic: boolean;
  rigidity: number;
  love: number;
  verticesList: MeshVertex[];
  edgesList: MeshEdge[];
}

export interface Grant {
  name: string;
  amount: string;
  deadline: string;
  days: number;
  url: string;
}

export interface McpEndpoint {
  name: string;
  url: string;
  ok: boolean;
}

export interface McpState {
  name: string;
  version: string;
  registry_url: string;
  endpoints: McpEndpoint[];
}

export interface CostItem {
  service: string;
  operation: string;
  qty: number;
  cost: number;
}

export interface Costs {
  total: number;
  period_hours: number;
  items: CostItem[];
}

export interface LegalState {
  case: string;
  next_hearing: string;
  hearing_date: string;
  days_to_hearing: number;
  judge: string;
  status: string;
  mcghan_deadline?: string;
}

export interface EyeKpi {
  workers_online: number;
  workers_total: number;
  portals_live: number;
  grants_active: number;
  days_to_next_deadline: number;
  days_to_hearing: number;
}

export interface EyeData {
  ts: string;
  control_enabled: boolean;
  kpi: EyeKpi;
  legal: LegalState;
  fleet: FleetNode[];
  surfaces: Surface[];
  mesh: MeshState;
  grants: Grant[];
  mcp: McpState;
  costs: Costs | null;
}

export interface WhoAmI {
  authenticated: boolean;
  email?: string;
  role?: 'admin' | 'operator' | 'reader' | string;
  name?: string;
}
