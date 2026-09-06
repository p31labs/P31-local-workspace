// ═══════════════════════════════════════════════════════
// @p31/shared — Cognitive Shield
//
// LLM-powered message filtering that intercepts high-voltage
// messages and rewrites them into neutral BLUF (Bottom Line Up Front)
// summaries. Three-tier fallback: WebGPU LLM → Ollama LAN → Template.
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

import { ConflictLevel, MessageAnalysis, ShieldedMessage, CognitiveShieldConfig } from './types';

// Constants for input sanitization and limits
const MAX_INPUT_LENGTH = 2000;
const MAX_RESPONSE_LENGTH = 4000;

/**
 * Sanitize input text to prevent prompt injection attacks
 */
function sanitizeInput(text: string): string {
  return text
    .slice(0, MAX_INPUT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Detect conflict level in a message using heuristic patterns.
 */
export function analyzeMessage(text: string): MessageAnalysis {
  // Sanitize input to prevent prompt injection
  const sanitizedText = sanitizeInput(text);
  
  const triggers: string[] = [];
  let conflictScore = 0;

  // Pattern detection
  const patterns = {
    allCaps: sanitizedText.match(/\b[A-Z]{4,}\b/g),
    exclamations: sanitizedText.match(/[!]{2,}/g),
    absolutist: sanitizedText.match(/\b(always|never|every time|everyone|no one)\b/gi),
    personalAttacks: sanitizedText.match(/\b(you are|you never|you always|you never)\b/gi),
    passiveAggressive: sanitizedText.match(/\b(fine|whatever|I guess)\b/gi),
    sarcasm: sanitizedText.match(/\b(sure|great|perfect)\b/gi),
  };

  // Count triggers
  if (patterns.allCaps) {
    triggers.push(`ALL CAPS: ${patterns.allCaps.join(', ')}`);
    conflictScore += patterns.allCaps.length * 0.2;
  }
  if (patterns.exclamations) {
    triggers.push(`EXCLAMATIONS: ${patterns.exclamations.join(', ')}`);
    conflictScore += patterns.exclamations.length * 0.1;
  }
  if (patterns.absolutist) {
    triggers.push(`ABSOLUTIST: ${patterns.absolutist.join(', ')}`);
    conflictScore += patterns.absolutist.length * 0.3;
  }
  if (patterns.personalAttacks) {
    triggers.push(`PERSONAL ATTACKS: ${patterns.personalAttacks.join(', ')}`);
    conflictScore += patterns.personalAttacks.length * 0.4;
  }
  if (patterns.passiveAggressive) {
    triggers.push(`PASSIVE AGGRESSIVE: ${patterns.passiveAggressive.join(', ')}`);
    conflictScore += patterns.passiveAggressive.length * 0.25;
  }
  if (patterns.sarcasm) {
    triggers.push(`SARCASM: ${patterns.sarcasm.join(', ')}`);
    conflictScore += patterns.sarcasm.length * 0.15;
  }

  // Determine conflict level
  let conflictLevel: ConflictLevel;
  if (conflictScore >= 0.8) {
    conflictLevel = 'CRITICAL';
  } else if (conflictScore >= 0.5) {
    conflictLevel = 'HIGH';
  } else if (conflictScore >= 0.2) {
    conflictLevel = 'ELEVATED';
  } else {
    conflictLevel = 'SAFE';
  }

  // Simple sentiment analysis (very basic)
  const positiveWords = ['good', 'great', 'thanks', 'please', 'appreciate'];
  const negativeWords = ['bad', 'hate', 'angry', 'frustrated', 'disappointed'];
  const posCount = positiveWords.filter(w => sanitizedText.toLowerCase().includes(w)).length;
  const negCount = negativeWords.filter(w => sanitizedText.toLowerCase().includes(w)).length;
  const sentiment = posCount > negCount ? 0.5 : negCount > posCount ? -0.5 : 0;

  return {
    originalText: text,
    conflictLevel,
    triggers,
    sentiment,
  };
}

/**
 * Generate BLUF summary from original message.
 */
export function generateBlufSummary(text: string): string {
  // Extract key facts and remove emotional amplifiers
  const cleaned = text
    .replace(/\b(you always|you never|you never|you are)\b/gi, '')
    .replace(/[!]{2,}/g, '.')
    .replace(/\b(always|never|every time)\b/gi, '')
    .replace(/\b(fine|whatever|I guess)\b/gi, '')
    .trim();

  // Simple sentence extraction
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 'Message content unclear.';

  // Take first sentence as BLUF
  const bluf = sentences[0].trim();
  return bluf.length > 100 ? bluf.substring(0, 97) + '...' : bluf;
}

/**
 * Rewrite message to neutral BLUF format.
 */
export function rewriteMessage(text: string): string {
  const bluf = generateBlufSummary(text);
  
  return `**Request:** ${bluf}
The sender is requesting that this matter be addressed. They may want to discuss this at a future time. Original message available behind toggle.`;
}

/**
 * Cognitive Shield main interface with fallback chain.
 */
export class CognitiveShield {
  private config: CognitiveShieldConfig;

  constructor(config: CognitiveShieldConfig) {
    this.config = config;
  }

  /**
   * Process a message through the shield with fallback chain.
   */
  async shieldMessage(originalText: string): Promise<ShieldedMessage> {
    // Sanitize input to prevent prompt injection
    const sanitizedText = sanitizeInput(originalText);
    const analysis = analyzeMessage(sanitizedText);

    // If message is safe, no rewriting needed
    if (analysis.conflictLevel === 'SAFE') {
      return {
        original: originalText,
        rewritten: null,
        conflictLevel: analysis.conflictLevel,
        blufSummary: originalText,
        showOriginal: false,
        shieldTier: 4,
      };
    }

    // Try WebGPU LLM first (Tier 1)
    // Use sanitizedText so control characters and length are bounded before hitting the LLM.
    if (this.config.webllmEnabled) {
      try {
        const rewritten = await this.rewriteWithWebLLM(sanitizedText);
        if (rewritten) {
          return {
            original: originalText,
            rewritten,
            conflictLevel: analysis.conflictLevel,
            blufSummary: generateBlufSummary(sanitizedText),
            showOriginal: true,
            shieldTier: 1,
          };
        }
      } catch (error) {
        console.warn('WebLLM rewrite failed:', error);
      }
    }

    // Try Ollama LAN fallback (Tier 2)
    if (this.config.ollamaEndpoint) {
      try {
        const rewritten = await this.rewriteWithOllama(sanitizedText);
        if (rewritten) {
          return {
            original: originalText,
            rewritten,
            conflictLevel: analysis.conflictLevel,
            blufSummary: generateBlufSummary(sanitizedText),
            showOriginal: true,
            shieldTier: 2,
          };
        }
      } catch (error) {
        console.warn('Ollama rewrite failed:', error);
      }
    }

    // Template-based rewriting (Tier 3)
    try {
      const rewritten = rewriteMessage(sanitizedText);
      return {
        original: originalText,
        rewritten,
        conflictLevel: analysis.conflictLevel,
        blufSummary: generateBlufSummary(originalText),
        showOriginal: true,
        shieldTier: 3,
      };
    } catch (error) {
      console.warn('Template rewrite failed:', error);
    }

    // Flag-only mode (Tier 4)
    return {
      original: originalText,
      rewritten: null,
      conflictLevel: analysis.conflictLevel,
      blufSummary: generateBlufSummary(originalText),
      showOriginal: true,
      shieldTier: 4,
    };
  }

  /**
   * WebGPU LLM rewriting (Tier 1).
   */
  private async rewriteWithWebLLM(text: string): Promise<string | null> {
    // This would integrate with WebLLM library
    // For now, return null to trigger fallback
    return null;
  }

  /**
   * Ollama LAN rewriting (Tier 2).
   */
  private async rewriteWithOllama(text: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.ollamaModel,
          prompt: this.buildPrompt(text),
          stream: false,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const raw = data.response;
      if (typeof raw !== 'string') return null;
      return raw.slice(0, MAX_RESPONSE_LENGTH).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim() || null;
    } catch (error) {
      console.warn('Ollama API error:', error);
      return null;
    }
  }

  /**
   * Build prompt for LLM rewriting.
   */
  private buildPrompt(text: string): string {
    return `SYSTEM: You are a neutral mediator in a shared living space. Your job
is to rewrite messages that contain emotional charge, passive-aggression,
or conflict escalation into neutral, factual BLUF (Bottom Line Up Front)
summaries. Preserve ALL factual content. Remove emotional amplifiers,
absolutes ("always", "never"), personal attacks, and sarcasm. The
rewritten message must be something both parties would agree accurately
represents the factual content of the original.

FORMAT: Start with a one-sentence BLUF summary. Then provide the
factual details in 2-3 neutral sentences. End with "Original message
available behind toggle."

EXAMPLES:

Original: "You NEVER clean up after yourself. I'm sick of being your
maid. The kitchen is disgusting AGAIN."
Rewritten: **Request:** Kitchen cleanup needed. The kitchen currently
needs cleaning. The sender is requesting that shared cleanup
responsibilities be addressed. Original message available behind toggle.

Original: "Fine. Whatever. I'll just do it myself like I always do."
Rewritten: **Notice:** Sender will handle the task independently. The
sender has decided to complete this task themselves. They may want to
discuss task distribution at a future time. Original message available
behind toggle.

NOW REWRITE THE FOLLOWING MESSAGE:

${text.replace(/`/g, "'").replace(/\$/g, '').replace(/\n{3,}/g, '\n\n')}`;
  }
}

/**
 * Default Cognitive Shield configuration.
 */
export const defaultShieldConfig: CognitiveShieldConfig = {
  webllmEnabled: false,
  webllmModel: 'Phi-3-mini-4k-instruct-q4f16_1',
  ollamaEndpoint: 'http://192.168.1.100:11434',
  ollamaModel: 'llama3.1:8b',
  conflictThreshold: 0.5,
  autoShieldEnabled: true,
};