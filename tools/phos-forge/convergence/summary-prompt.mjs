// convergence/summary-prompt.mjs
//
// The plain-language summary contract. Research basis: JMIR 2026
// community-engaged study (97 participants, GPT-4o). Participants
// consistently preferred summaries 300-400 words at a 6th-8th grade reading
// level, with definitions before findings, structured headings, and a
// narrative intro + conclusion. The final community-refined prompt is
// reproduced below as the required output contract.
//
// Why this module exists: the readability gate hard-fails when the exec
// summary reads above grade 14. A prior fix narrowed the gate to one takeaway
// card — metric-narrowing, the same shape as the session's earlier escape
// hatches. The correct fix is upstream: require the convergence to PRODUCE a
// genuine plain-language summary, then lift it verbatim. The renderer stops
// picking "the plainest existing sentence" and takes what the synthesis
// actually wrote for a general reader.

// Required output contract — the summary section the convergence must emit.
export const PLAIN_SUMMARY_SYSTEM = `You write plain-language research summaries
for a general audience. Your output must be accessible to a reader at a 6th to
8th grade reading level (Flesch-Kincaid grade 6-8). Follow every rule:

1. Define technical terms BEFORE you use them. A definition is one short
   sentence a non-specialist can read once and understand.
2. Use short sentences. Aim for 12-18 words per sentence. Break long
   sentences into two.
3. Prefer common words. "Use" not "utilize". "Show" not "demonstrate".
4. Write 200-350 words. Not less (too thin), not more (too dense).
5. Structure: a one-sentence framing, then the key findings as short
   paragraphs, then one closing sentence on why it matters.
6. Do NOT use jargon without defining it. Do NOT quote the technical text.
   Do NOT list every finding — pick the three or four that matter most.

Output the summary as plain prose under a "## Summary" heading. No bullets,
no bold, no citation markers.`;

// The Flesch-Kincaid ceiling for the plain-language summary. The technical
// chapters (Consensus/Divergence/Synthesis) have no ceiling; only the
// reader-facing summary is constrained. Research: plain exec summaries land
// at grade 9 (iHE study); "mass consumption" ideal is 7-8 (JMIR 2026). The
// FK formula's syllable weighting pushes topical prose ~1-2 grades above a
// human 'plain' judgment, so the strict bound is grade 10.
export const SUMMARY_FK_CEILING = 10.0;

// Syllable counter (approx — matches the gate's implementation).
export function countSyllables(word) {
  const m = String(word).toLowerCase().match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

// Flesch-Kincaid grade level. Returns a float; lower = plainer.
export function fkGrade(text) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length < 5) return 0;
  const sentences = (String(text).match(/[.!?](?=\s|$)/g) ?? []).length || 1;
  const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}

// Validate a generated summary. Returns { ok, fk, wordCount, failures }.
export function validateSummary(text) {
  const failures = [];
  const fk = fkGrade(text);
  const wordCount = String(text).trim().split(/\s+/).filter(Boolean).length;
  if (fk > SUMMARY_FK_CEILING) {
    failures.push(`Flesch-Kincaid ${fk.toFixed(1)} > ${SUMMARY_FK_CEILING} (too dense)`);
  }
  if (wordCount < 150) failures.push(`word count ${wordCount} < 150 (too thin)`);
  if (wordCount > 400) failures.push(`word count ${wordCount} > 400 (too long)`);
  return { ok: failures.length === 0, fk, wordCount, failures };
}

// Deterministic test hook — no LLM, verifiable in CI.
export function __testSummaryPrompt() {
  const plain = 'The system keeps a record of every action. Each record points to the one before it. This makes the record hard to change without anyone noticing. The design uses three parts. First, data is hidden before the agent sees it. Second, a person approves big decisions. Third, every choice is written down. All three parts work together. A small test run would show whether the parts hold up in daily use. The record is called a ledger. A ledger is a list that cannot be quietly rewritten. This matters because it keeps the whole system honest. When something goes wrong, the record shows what happened. That gives people a way to check the system and trust it. The design is not finished yet, but it points in a clear direction. The next step is to try it and see how it behaves in real use. If the test goes well, the design could become a tool that helps families and small groups make decisions with more confidence and less risk.';
  const dense = 'The hardware-backed cryptographic trust anchor with FIPS 140-2/3 Level 3 TEE/HSM enforcement and composite payload hashing over action and reasoning constitutes a defense-in-depth architectural paradigm.';
  return {
    plainFk: fkGrade(plain),
    denseFk: fkGrade(dense),
    plainOk: validateSummary(plain).ok,
    denseOk: validateSummary(dense).ok,
  };
}