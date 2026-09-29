// convergence/stall-recovery.mjs
// Layer 3 — Output stalling detection + bounded strong-nudge retry.
//
// Research basis:
// - NousResearch/hermes-agent@d6785dc: allow retries after prefill
//   exhaustion; reset prefill/retry counters on tool-call recovery.
// - jaredlockhart/penny#812: the weak nudge ("Please provide your response.")
//   is NOT enough to recover a model that has lost the thread — it needs the
//   ORIGINAL QUESTION restated so it remembers what it was supposed to answer.
// - The output-conformance pattern: one validator, one error-carrying
//   re-prompt, one retry cap, one fallback.
//
// Empty-response retries are capped at 2 (each empty response costs a full
// inference call). The nudge carries the original question, not a platitude.

export async function callWithStallRecovery(system, user, callFn, opts = {}) {
  const maxEmptyRetries = opts.maxEmptyRetries ?? 2;
  const originalQuestion = opts.originalQuestion ?? user.slice(0, 500);

  let lastError = null;
  for (let attempt = 0; attempt <= maxEmptyRetries; attempt++) {
    let body = user;
    if (attempt === 1) {
      // Strong nudge: restate the question, demand output.
      body = `${user}\n\n---\nCRITICAL: Your previous response was empty. You MUST produce a substantive output now.\nThe question you are answering is: "${originalQuestion}"\nOutput directly — no preamble, no commentary.`;
    } else if (attempt === 2) {
      // Reduced input: compact the context so the reasoning budget is not
      // exhausted by prefill before any visible token is emitted.
      body = `${user.slice(0, Math.max(500, Math.floor(user.length / 2)))}\n\n---\nOutput now, directly, with no preamble.`;
    }

    try {
      const result = await callFn(system, body, { ...opts, attempt, recovered: attempt > 0 });
      // Result may be a string or an object {content, modelUsed} (when the
      // caller requested returnModel). Treat both as empty when content is empty.
      const content = typeof result === 'object' && result !== null
        ? (result.content ?? '')
        : (result ?? '');
      if (content && content.trim().length > 0) {
        return { text: result, content: content.trim(), attempts: attempt + 1, recovered: attempt > 0 };
      }
      lastError = new Error('empty-response');
    } catch (e) {
      lastError = e;
      // Loop continues to the next (more aggressive) attempt.
    }
  }
  throw lastError ?? new Error('stall-recovery-exhausted: model returned empty after 3 attempts');
}

// Test hook — deterministic: first attempt empty, second recovers.
export async function __testStallRecovery() {
  let calls = 0;
  const fake = async () => {
    calls++;
    if (calls === 1) return '';
    return 'recovered synthesis content here';
  };
  const r = await callWithStallRecovery('sys', 'user q', fake);
  return { attempts: r.attempts, recovered: r.recovered, textLen: r.text.length, calls };
}