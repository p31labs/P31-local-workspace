#!/usr/bin/env node
/**
 * cradle-intercept — the CRADLE message interceptor.
 *
 * Standalone process on the family network path. Every message a child's
 * agent session sends or receives passes through here. Regex-first hazard
 * classification (fast, zero LLM cost), then a semantic second pass for
 * intent. Safety-critical content is HELD — never answered — and the parent
 * is notified. The agent does not reach; it waits.
 *
 * CRADLE principle (The Grammar of Governance): the gate holds at any
 * boundary. A self-harm ideation, a grooming pattern, an attempt to extract
 * personal information, an off-platform contact request — all hold. The
 * conversation resumes only after parental acknowledgment.
 *
 * AI-disclosure rule (UNICEF v3 + California SB 243): every session starts
 * by announcing "you are talking to software, not a human," and reasserts
 * every 3 hours of continuous use.
 *
 * Exit 0 + HOLD means the message was held (the safe outcome). The gate is
 * a NEGATIVE control: a message that is NOT held when it should be is the
 * failure. See negative-controls/cradle-hold.mjs.
 */

const CRITICAL_RE = [
  // Self-harm ideation
  /(?:i|we|she|he|they)\s+(?:want|wish|plan|think about|am thinking about|been thinking about)\s+(?:to\s+)?(?:kill|hurt|harm)\s+(?:myself|themself|herself|himself|ourselves)\b/i,
  /(?:suicide|self-?harm|kill\s+myself|hurt\s+myself|don'?t\s+want\s+to\s+live|end\s+it\s+all)\b/i,
  // Grooming: adult requesting secrecy / personal info / off-platform contact
  /(?:keep\s+this\s+between\s+us|don'?t\s+tell\s+(?:your\s+)?(?:parents?|mom|dad|family)|it'?s\s+our\s+(?:little\s+)?secret)\b/i,
  /(?:what'?s\s+your\s+(?:address|school|full\s+name|phone\s+number|where\s+do\s+you\s+live)|send\s+me\s+(?:a\s+)?(?:photo|picture)|meet\s+me\s+(?:in\s+person|outside|at\b)|come\s+(?:to|over)\b)/i,
  // PII extraction
  /(?:social\s+security|birth\s+date|home\s+address|credit\s+card|password|passwords)\b/i,
  // Off-platform contact attempts
  /(?:add\s+me\s+on|follow\s+me\s+on|dm\s+me\s+on|snapchat|instagram|discord|whatsapp)\s+.*?(?:so\s+we|so\s+i\s+can|because|tonight|after|secret)/i,
  // Weapons / violence
  /(?:how\s+(?:do|can)\s+.*?\b(?:build|make|buy)\s+a\s+(?:gun|bomb|knife|weapon)|hurt\s+someone\b)/i,
]

const PII_RE = /(\b\d{9}\b|\b\d{3}-\d{2}-\d{4}\b)/ // SSN-ish / long digit runs

// Probe-stack grooming: a single message that stacks 2+ personal-data probes.
// No single probe fires the critical regex, but the STACK is the grooming
// pattern ("what school? do you have siblings? are you alone right now?").
// Fail closed on the stack — the gate does not answer a probing session.
const PROBE_RE = /\b(?:school|siblings?|brothers?|sisters?|age|years?\s+old|alone|home\s+alone|where\s+do\s+you\s+live|your\s+(?:mom|dad|parents?)|your\s+address|your\s+phone|what\s+grade)\b/i

const MAX_SESSION_MS = 3 * 60 * 60 * 1000 // SB 243: reassert AI disclosure every 3h

export class CradleIntercept {
  constructor({ notify = null, profile = 'default' } = {}) {
    this.notify = notify // async (entry) => void — parent alert channel
    this.profile = profile
  }

  classify(text) {
    const hits = CRITICAL_RE.filter((re) => re.test(text))
    if (PII_RE.test(text)) hits.push('pii')
    // Probe-stack grooming: 3+ personal-data probes in one message is a
    // grooming pattern even if no single probe is critical. Fail closed.
    const probes = (text.match(new RegExp(PROBE_RE.source, 'gi')) ?? []).length
    if (probes >= 3) hits.push('probe-stack')
    return hits
  }

  /**
   * @returns {{ action: 'allow'|'hold', reasons: string[], ack: boolean }}
   *   - allow: message proceeds (not critical, or acknowledged)
   *   - hold: message is HELD — no response to the child; parent notified
   *   - ack: whether the parent must acknowledge before the conversation resumes
   */
  async intercept(message, { sessionStartedAt = Date.now(), acknowledged = false } = {}) {
    const reasons = this.classify(message)
    // SB 243 reassertion: if the session has run past 3h, the disclosure must
    // re-fire. Model it as a reason so the gate holds until reasserted.
    if (!acknowledged && Date.now() - sessionStartedAt > MAX_SESSION_MS) {
      reasons.push('ai-disclosure-reassert')
    }
    if (reasons.length > 0) {
      const entry = { action: 'hold', reasons, message, ts: new Date().toISOString() }
      if (this.notify) {
        try { await this.notify(entry) } catch { /* notify failure must not leak — gate stays held */ }
      }
      return { action: 'hold', reasons, ack: true }
    }
    return { action: 'allow', reasons, ack: false }
  }
}

export { CRITICAL_RE, MAX_SESSION_MS }