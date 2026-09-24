/**
 * scanner.ts — heuristic tool-description scanner for the MCP registration
 * pipeline. Pure TS, no runtime deps: flags tool poisoning / prompt-injection
 * patterns in tool names + descriptions, matching the MCP-Scanner threat
 * class (keyword detection + semantic heuristics). An optional LLM pass can
 * be layered on later (see SCANNER_LLM_ENABLED) — this module is the
 * deterministic, unit-testable core.
 */

export type Verdict = 'clean' | 'suspicious' | 'malicious'

export interface ScanFlag {
  pattern: string
  evidence: string
  severity: 'low' | 'medium' | 'high'
}

export interface ScanResult {
  tool: string
  score: number
  flags: ScanFlag[]
  verdict: Verdict
}

const SEV_WEIGHT: Record<ScanFlag['severity'], number> = { low: 1, medium: 2, high: 3 }

// Instruction override — attempts to reset/steer the agent's instructions.
const INSTRUCTION_OVERRIDE =
  /\b(ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|the|any|these|above)\s+(instructions?|prompts?|system prompt|rules?)\b/i

// Direct manipulation of the model.
const MODEL_STEERING =
  /\b(you are now|pretend (to be|you)|from now on|do not follow|do not obey|instead of what i said)\b/i

// Credential / data exfiltration verbs.
const EXFIL_VERBS =
  /\b(send|post|upload|transmit|exfiltrate|exfil|leak|forward|export|fetch|curl|wget|netcat)\b/i

// Sink targets that suggest exfiltration (URLs, webhooks, base64, secrets).
const EXFIL_SINK =
  /\b(https?:\/\/[^\s"']+)\b|\b(webhook|callback|notify|ingest|hook)\b|\b(base64|btoa|atob)\b|\b(secret|token|key|password|api[_-]?key|credential|env(ironment)?( var)?)\b/i

// Tool-name / description semantic mismatch: read-ish name + write-ish desc.
const READ_NAME = /^(list|get|read|search|peek|fetch|show|find|lookup|inspect|query|view)/i
const WRITE_DESC =
  /\b(delete[sd]?|remove[sd]?|overwrite[s]?|write[s]?|upload[s]?|drop[s]?|truncate[s]?|rm\b|rm -rf|chmod|exec|eval|spawn|system\(|curl\b)\b/i

// Invisible / obfuscation: zero-width chars, RTL overrides, soft hyphen.
const INVISIBLE_UNICODE = /[\u200B-\u200D\uFEFF\u2060-\u2064\u202A-\u202E\u00AD]/
const OBFUSCATED_BLOB = /(?:[A-Za-z0-9+/]{40,}={0,2})|(?:\\x[0-9a-fA-F]{2}){10,}|(?:&#[0-9]{3,};{3,})/

// Credential grabbing — description claims access to secrets or sensitive env.
const CREDENTIAL_GRAB =
  /\b(read|get|grab|exfil|dump|access)\b[\s\S]{0,40}\b(secret|private key|seed phrase|mnemonic|token|password|\.ssh|\.aws|\.env|vault|keystore)\b/i

const HIGH_FLAG = { pattern: 'instruction_override', severity: 'high' as const }
const HIGH_STEERING = { pattern: 'model_steering', severity: 'high' as const }
const HIGH_EXFIL = { pattern: 'exfiltration_sink', severity: 'high' as const }
const HIGH_CRED = { pattern: 'credential_grab', severity: 'high' as const }
const MED_UNICODE = { pattern: 'invisible_unicode', severity: 'medium' as const }
const MED_OBFUSCATED = { pattern: 'obfuscated_blob', severity: 'medium' as const }
const MED_MISMATCH = { pattern: 'semantic_mismatch', severity: 'medium' as const }
const LOW_URL = { pattern: 'url_sink', severity: 'low' as const }

/** Scan a single text blob (description or full tool metadata). */
export function scanText(text: string): ScanFlag[] {
  const flags: ScanFlag[] = []
  const t = String(text ?? '')
  const push = (f: { pattern: string; severity: 'low' | 'medium' | 'high' }, regex: RegExp, weight = 1) => {
    const m = t.match(regex)
    if (m) flags.push({ ...f, evidence: m[0].slice(0, 80), severity: f.severity })
  }
  push(HIGH_FLAG, INSTRUCTION_OVERRIDE)
  push(HIGH_STEERING, MODEL_STEERING)
  // Exfiltration is only flagged when a verb is paired with a sink target —
  // a bare "fetch"/"send" verb is legitimate for many tools.
  if (EXFIL_VERBS.test(t) && EXFIL_SINK.test(t)) push(HIGH_EXFIL, EXFIL_SINK, 2)
  push(HIGH_CRED, CREDENTIAL_GRAB)
  push(MED_UNICODE, INVISIBLE_UNICODE)
  push(MED_OBFUSCATED, OBFUSCATED_BLOB)
  return flags
}

/** Scan a tool by name + description; flags semantic mismatch specially. */
export function scanTool(name: string, description: string): ScanResult {
  const nameT = String(name ?? '')
  const desc = String(description ?? '')
  const flags = scanText(`${nameT} ${desc}`)
  if (READ_NAME.test(nameT) && WRITE_DESC.test(desc)) {
    flags.push({ pattern: MED_MISMATCH.pattern, evidence: `${nameT} described with write verbs`, severity: 'medium' })
  }
  const score = flags.reduce((a, f) => a + SEV_WEIGHT[f.severity], 0)
  const hasHigh = flags.some((f) => f.severity === 'high')
  const hasMedium = flags.some((f) => f.severity === 'medium')
  const verdict: Verdict = hasHigh ? 'malicious' : hasMedium ? 'suspicious' : 'clean'
  return { tool: nameT, score, flags, verdict }
}

/** Scan the whole tool surface of a server. */
export function scanToolSurface(tools: Array<{ name: string; description?: string }>): {
  results: ScanResult[]
  clean: boolean
  worst: Verdict
  suspiciousCount: number
  maliciousCount: number
} {
  const results = tools.map((t) => scanTool(t.name, t.description ?? ''))
  const maliciousCount = results.filter((r) => r.verdict === 'malicious').length
  const suspiciousCount = results.filter((r) => r.verdict === 'suspicious').length
  const worst: Verdict = maliciousCount > 0 ? 'malicious' : suspiciousCount > 0 ? 'suspicious' : 'clean'
  return { results, clean: worst === 'clean', worst, suspiciousCount, maliciousCount }
}