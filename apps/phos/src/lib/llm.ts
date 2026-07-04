import {
  CreateMLCEngine,
  hasModelInCache,
  deleteModelAllInfoInCache,
  type MLCEngineInterface,
  type InitProgressReport,
} from '@mlc-ai/web-llm';
import { calculateConfidence, type ConfidenceResult } from './confidence';
import { getDb } from './pglite';

export type BrainStatus = 'unsupported' | 'off' | 'downloading' | 'ready' | 'error';
export type AITier = 'local' | 'edge';
export type RoutingDecision = 'local' | 'edge';
export type RoutingOverride = 'auto' | 'force-local' | 'force-edge';

export interface BrainState {
  status: BrainStatus;
  progress: number;
  tier: AITier;
  currentRoute?: RoutingDecision;
  error?: string;
}

const LOCAL_MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

const DEFAULT_SYSTEM_PROMPT = `You are PHOS, a sovereign, zero-telemetry cognitive mesh gateway. You help a neurodivergent father navigate co-parenting, family logistics, and emotional regulation.

Guidelines:
- Be concise, warm, and grounded
- When the user is upset, validate before advising
- Never use jargon or corporate language
- Use metaphors from nature, physics, or the mesh when helpful
- Keep responses under 3 sentences unless asked for detail
- If the user seems overwhelmed, suggest a grounding technique or buffer action`;

function detectCapability(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'gpu' in navigator && navigator.gpu !== undefined;
}

export class HybridLLMEngine {
  private engine: MLCEngineInterface | null = null;
  private modelId: string;
  private systemPrompt: string;
  private listeners: Set<(state: BrainState) => void> = new Set();

  public state: BrainState = {
    status: 'off',
    progress: 0,
    tier: 'edge',
  };

  constructor(modelId = LOCAL_MODEL_ID, systemPrompt = DEFAULT_SYSTEM_PROMPT) {
    this.modelId = modelId;
    this.systemPrompt = systemPrompt;
  }

  private emit() {
    this.listeners.forEach(fn => fn({ ...this.state }));
  }

  subscribe(fn: (state: BrainState) => void): () => void {
    this.listeners.add(fn);
    fn({ ...this.state });
    return () => this.listeners.delete(fn);
  }

  async init(): Promise<void> {
    if (!detectCapability()) {
      this.state = { status: 'unsupported', progress: 0, tier: 'edge' };
      this.emit();
      return;
    }

    const cached = await hasModelInCache(this.modelId);
    if (cached) {
      this.state = { status: 'ready', progress: 1, tier: 'local' };
      this.emit();
      try {
        this.engine = await CreateMLCEngine(this.modelId, {
          initProgressCallback: (report: InitProgressReport) => {
            this.state.progress = report.progress;
            this.emit();
          },
        });
      } catch (err) {
        this.state = {
          status: 'error',
          progress: 0,
          tier: 'edge',
          error: err instanceof Error ? err.message : 'Failed to load model',
        };
        this.emit();
      }
      return;
    }

    this.state = { status: 'off', progress: 0, tier: 'edge' };
    this.emit();
  }

  async enableLocal(progressCallback?: (p: number) => void): Promise<void> {
    this.state = { status: 'downloading', progress: 0, tier: 'local' };
    this.emit();

    try {
      this.engine = await CreateMLCEngine(this.modelId, {
        initProgressCallback: (report: InitProgressReport) => {
          this.state.progress = report.progress;
          this.emit();
          progressCallback?.(report.progress);
        },
      });
      this.state = { status: 'ready', progress: 1, tier: 'local' };
      this.emit();
    } catch (err) {
      this.state = {
        status: 'error',
        progress: 0,
        tier: 'edge',
        error: err instanceof Error ? err.message : 'Download failed',
      };
      this.emit();
    }
  }

  async disableLocal(): Promise<void> {
    try {
      await deleteModelAllInfoInCache(this.modelId);
    } catch { /* cache already clear */ }
    this.engine = null;
    this.state = { status: 'off', progress: 0, tier: 'edge' };
    this.emit();
  }

  private evaluateCognitiveLoad(prompt: string, contextLength: number): RoutingDecision {
    if (contextLength > 2048) return 'edge';
    const deepTriggers = /research|synthesize|analyze|decompose|compare|quantum brain dump|investigate/i;
    if (deepTriggers.test(prompt)) return 'edge';
    if (prompt.length > 1500) return 'edge';
    return 'local';
  }

  createEdgePrompt(prompt: string): string {
    return `${this.systemPrompt}\n\nUser message: "${prompt}"\n\nPlease provide a thoughtful, context-aware response:`;
  }

  async generateResponse(
    prompt: string,
    contextLength = 0,
    options?: {
      edgeEndpoint?: string;
      override?: RoutingOverride;
      onRoutingDecision?: (result: ConfidenceResult, route: RoutingDecision, tier: AITier) => void;
    },
  ): Promise<string> {
    const confidence = calculateConfidence(prompt);
    let decision: RoutingDecision;

    if (options?.override === 'force-edge') {
      decision = 'edge';
    } else if (options?.override === 'force-local' && this.state.status === 'ready') {
      decision = 'local';
    } else if (this.state.status === 'ready' && confidence.route === 'local' && this.evaluateCognitiveLoad(prompt, contextLength) !== 'edge') {
      decision = 'local';
    } else {
      decision = 'edge';
    }

    if (decision === 'local' && this.state.status !== 'ready') {
      decision = 'edge';
    }

    this.state.currentRoute = decision;
    this.emit();

    options?.onRoutingDecision?.(confidence, decision, this.state.tier);
    this.logRoutingDecision(prompt, decision, this.state.tier, confidence).catch(() => {});

    if (decision === 'local' && this.engine) {
      const completion = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 512,
      });
      return completion.choices[0].message.content || '';
    }

    if (decision === 'edge' && options?.edgeEndpoint) {
      const resp = await fetch(options.edgeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!resp.ok) throw new Error(`Edge AI returned ${resp.status}`);
      const data: any = await resp.json();
      return data.result?.response || data.response || '';
    }

    throw new Error('No AI backend available for the requested route.');
  }

  private async logRoutingDecision(
    prompt: string,
    route: RoutingDecision,
    tier: AITier,
    confidence: ConfidenceResult,
  ): Promise<void> {
    const db = getDb();
    if (!db) return;
    try {
      const id = `route_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(prompt))))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16);
      await db.query(
        'INSERT INTO ai_routing_log (id, prompt_hash, route, confidence, entropy, variance, semantic, abstention, tier, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [id, hash, route, confidence.score, confidence.signals.entropy, confidence.signals.variance, confidence.signals.semantic, confidence.signals.abstention, tier, Date.now()]
      );
    } catch {
      // never block response on telemetry
    }
  }

  async getCachedSize(): Promise<string | null> {
    const cached = await hasModelInCache(this.modelId);
    if (!cached) return null;
    return this.modelId;
  }
}

export const brain = new HybridLLMEngine();
