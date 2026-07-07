import {
  CreateMLCEngine,
  hasModelInCache,
  deleteModelAllInfoInCache,
  type MLCEngineInterface,
  type InitProgressReport,
} from '@mlc-ai/web-llm';
import { calculateConfidence, type ConfidenceResult } from './confidence';
import { getDb } from './pglite';
import { designTokens } from './design-tokens';

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

function buildSystemPrompt(spoonLevel: number = 3): string {
  const t = designTokens;
  const spoonGuidance: Record<number, string> = {
    0: 'CRISIS MODE — Suggest only grounding exercises (5-4-3-2-1 senses, box breathing). No interactive UI suggestions. Keep to 1 sentence.',
    1: 'Low energy — Suggest simple, single-step actions only. Validate feelings first. Keep to 1-2 sentences.',
    2: 'Recovering — Gentle suggestions, one at a time. Allow silence. Keep to 2 sentences.',
    3: 'Baseline — Balanced suggestions with moderate complexity. Standard interaction.',
    4: 'Energized — Suggest multi-step workflows, creative tasks, planning. Allow detail.',
    5: 'High energy — Full-featured interactions, complex tasks, deep work. Unconstrained.',
  };

  return `You are PHOS, a sovereign, zero-telemetry cognitive mesh gateway. You help a neurodivergent father navigate co-parenting, family logistics, and emotional regulation.

Design System (when suggesting UI, respect these tokens):
- Primary accent: ${t.colors['quantum-cyan']} (never use pure white/black)
- Background: ${t.colors.void}
- Surface: ${t.colors.surface}
- Text: ${t.colors['text-primary']}
- Border radius: ${t.rounded.lg}
- Font: ${t.typography.sans}
- Glass panels: backdrop-filter: blur(12px), border-radius ${t.rounded.lg}, bg ${t.colors['glass-surface']}

Guidelines:
- Be concise, warm, and grounded
- When the user is upset, validate before advising
- Never use jargon or corporate language
- Use metaphors from nature, physics, or the mesh when helpful
- Keep responses under 3 sentences unless asked for detail
- If the user seems overwhelmed, suggest a grounding technique or buffer action

Spoon-Aware Behavior (current level: ${spoonLevel}/5):
${spoonGuidance[spoonLevel] || spoonGuidance[3]}`;
}

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

  constructor(modelId = LOCAL_MODEL_ID, systemPrompt?: string) {
    this.modelId = modelId;
    this.systemPrompt = systemPrompt || buildSystemPrompt(3);
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
      model?: string;
      spoonLevel?: number;
    },
  ): Promise<string> {
    const activePrompt = options?.spoonLevel != null
      ? buildSystemPrompt(options.spoonLevel)
      : this.systemPrompt;
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
          { role: 'system', content: activePrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 512,
      });
      return completion.choices[0].message.content || '';
    }

    if (decision === 'edge' && options?.edgeEndpoint) {
      const body: Record<string, unknown> = {
        messages: [
          { role: 'system', content: activePrompt },
          { role: 'user', content: prompt },
        ],
      };
      if (options.model) {
        body.model = options.model;
      }
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('p31-auth-token') : null;
      const resp = await fetch(options.edgeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
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
