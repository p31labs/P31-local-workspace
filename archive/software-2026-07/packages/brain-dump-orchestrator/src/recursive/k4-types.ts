import type { Axis } from '../types/axis.js';

export type K4Edge =
  | 'factuality'
  | 'relevance'
  | 'formatting'
  | 'constraints'
  | 'bias'
  | 'logic';

export interface K4EdgeResult {
  edge: K4Edge;
  passed: boolean;
  evidence?: string;
  error?: string;
}

export interface K4PersonaResult {
  persona: 'critic' | 'refiner' | 'validator';
  edges: K4EdgeResult[];
  overall: boolean;
  latencyMs: number;
}

export interface K4ConsensusResult {
  passed: boolean;
  edges: K4EdgeResult[];
  personaResults: K4PersonaResult[];
  checkedAt: string;
  mode: 'full' | 'fast' | 'off';
}

export interface K4ContentProvider {
  getContent(filePaths: string[], axisId: string): Promise<string>;
}

export interface K4Verifier {
  verify(persona: string, content: string, axis: Axis, edges: K4Edge[]): Promise<K4PersonaResult>;
}

export type K4Mode = 'full' | 'fast' | 'off';

export interface K4GateConfig {
  mode: K4Mode;
  llmEnv?: { apiKey?: string; baseUrl?: string; model?: string };
  edges?: K4Edge[];
}
