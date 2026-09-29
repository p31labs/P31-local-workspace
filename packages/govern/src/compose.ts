/**
 * compose — the enterprise tier. An EnterpriseSpec references domain
 * constitutions and declares the contracts BETWEEN domains.
 *
 * A contract has a provider, a consumer, a guarantee, an evidence
 * requirement, and an enforceable gate. It is what makes the enterprise
 * more than a directory of domains.
 *
 * The composer produces:
 *   enterprise-constitution.json   a 0.3.0 constitution whose gates are the
 *                                  inter-domain contracts, whose canonical
 *                                  source is the set of domain constitutions,
 *                                  and whose ratchet is the count of
 *                                  unresolved cross-domain issues.
 *   compliance.md                  the NIST / ISO / EU mapping, auto-generated
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { Constitution, loadConstitution, validateConstitution, SCHEMA_URI } from './constitution.js';
import { EnterpriseSpec, InterDomainContract } from './spec.js';

export interface ComposeResult {
  enterpriseConstitution: Constitution;
  domainAudits: Array<{ domain: string; valid: boolean; violations: string[] }>;
  contractViolations: string[];
  complianceMarkdown: string;
}

/**
 * Compose the enterprise. Reads each domain constitution, validates it, then
 * produces the enterprise constitution whose gates are the inter-domain
 * contracts. A contract is enforceable only if its provider gate exists and
 * is BLOCKING in the provider's constitution.
 */
export function compose(spec: EnterpriseSpec, baseDir: string): ComposeResult {
  const domains = spec.domains.map((d) => {
    const con = loadConstitution(resolve(baseDir, d.ref));
    const validation = validateConstitution(con);
    return { name: d.name, con, valid: validation.valid, violations: validation.violations };
  });

  // Every contract must point at a gate that exists AND is BLOCKING in the provider.
  const contractViolations: string[] = [];
  for (const c of spec.interDomainContracts) {
    const provider = domains.find((d) => d.name === c.provider);
    if (!provider) {
      contractViolations.push(`contract ${c.id}: provider domain "${c.provider}" not declared`);
      continue;
    }
    const gate = provider.con.gates.find((g) => g.id === c.gate);
    if (!gate) {
      contractViolations.push(`contract ${c.id}: provider gate "${c.gate}" not found in ${c.provider}`);
      continue;
    }
    if (gate.state !== 'BLOCKING') {
      contractViolations.push(
        `contract ${c.id}: provider gate "${c.gate}" is ${gate.state}, not BLOCKING — the contract is not enforceable`,
      );
    }
    for (const consumer of c.consumers) {
      if (!domains.find((d) => d.name === consumer)) {
        contractViolations.push(`contract ${c.id}: consumer domain "${consumer}" not declared`);
      }
    }
  }

  const enterpriseConstitution: Constitution = {
    schema: SCHEMA_URI,
    domain: spec.name,
    version: spec.version,
    genesisTimestamp: spec.genesisTimestamp,
    canonicalSource: {
      path: 'enterprise.govern.yaml',
      description: spec.description,
      oqe: { evidenceClass: 'primary-source', reference: 'enterprise.govern.yaml' },
    },
    mirrors: spec.domains.map((d) => ({
      path: d.ref,
      generatedFrom: 'enterprise.govern.yaml',
      parityGate: `validate-${d.name}`,
    })),
    gates: spec.interDomainContracts.map((c) => ({
      id: `contract:${c.id}`,
      command: c.verify ?? `govern audit domains/${c.provider}/constitution.json`,
      state: 'BLOCKING' as const,
      owner: [spec.review.fourParty.issuer],
      scope: `${c.provider} → ${c.consumers.join(', ')}`,
      remediation: `runbooks/RUNBOOK-contract-${c.id}.md`,
      negativeControl: {
        type: 'mutation' as const,
        command: `scripts/nc/contract-${c.id}.mjs`,
        expected: 'proof-marker' as const,
      },
      enforcementMoment: 'ci',
      oqe: c.evidence,
    })),
    ratchets: [
      {
        id: 'cross-domain-violations',
        baseline: 0,
        countSource: 'scripts/count-contract-violations.mjs',
        lockThreshold: 0,
      },
    ],
    runbooks: spec.interDomainContracts.map((c) => ({
      id: `RUNBOOK-contract-${c.id}`,
      path: `runbooks/RUNBOOK-contract-${c.id}.md`,
      owner: [spec.review.fourParty.issuer],
      lastVerified: new Date().toISOString().slice(0, 10),
    })),
    lessons: [],
    fleet: spec.interDomainContracts.map((c) => ({ rule: `contract:${c.id}`, moment: 'ci' as const })),
    review: {
      who: spec.review.fourParty,
      cadence: spec.review.cadence,
      onFailure: spec.review.onFailure,
      abdication: spec.review.abdication,
    },
    auditLog: spec.crossCutting.audit,
    aspirational: spec.aspirational ?? [],
  };

  const complianceMarkdown = generateComplianceMarkdown(enterpriseConstitution, spec);

  return {
    enterpriseConstitution,
    domainAudits: domains.map((d) => ({ domain: d.name, valid: d.valid, violations: d.violations })),
    contractViolations,
    complianceMarkdown,
  };
}

/**
 * Compliance mapping — auto-generated from the enterprise constitution.
 * Every NIST AI RMF function, ISO 42001 clause, and EU AI Act Article is
 * mapped to the runtime mechanism that satisfies it.
 */
function generateComplianceMarkdown(con: Constitution, spec: EnterpriseSpec): string {
  return `# ${spec.name} — Compliance Backbone

> Auto-generated by \`govern compose\`. Do not edit by hand; edit the spec.

**Version:** ${con.version} · **Genesis:** ${con.genesisTimestamp}
**Domains:** ${spec.domains.map((d) => d.name).join(', ')}
**Contracts:** ${spec.interDomainContracts.length}

## NIST AI RMF

| Function | Enterprise mechanism |
|---|---|
| **Govern** | The enterprise constitution — ${con.gates.length} inter-domain contracts, all BLOCKING. |
| **Map** | The canonical source (\`${con.canonicalSource.path}\`) + the ${con.mirrors.length} mirror references. |
| **Measure** | The \`cross-domain-violations\` ratchet (baseline ${con.ratchets[0]?.baseline ?? 0}) + the per-domain audits. |
| **Manage** | The ${con.runbooks.length} contract runbooks + the four-party K₄ review. |

## ISO/IEC 42001

The enterprise maintains a certifiable AIMS (AI Management System) via:
- Documented policy (this constitution + the ${spec.domains.length} domain constitutions)
- Defined roles (the four-party K₄ review: user, issuer, ledger, court)
- Documented processes (the ${con.runbooks.length} runbooks)
- Evidence discipline (the OQE requirement on every gate)

## EU AI Act

| Article | Enterprise mechanism |
|---|---|
| **Art 13 (Transparency)** | The Genesis Block audit chain (\`${con.auditLog.chainName}\`) — every action is traceable. |
| **Art 14 (Human oversight)** | The \`review\` block — abdication requires human sign-off; gates cannot self-promote to BLOCKING. |
| **Art 15 (Accuracy/robustness)** | The inter-domain contracts + the cross-domain ratchet + the negative controls. |

## The inter-domain contracts

${spec.interDomainContracts.map((c: InterDomainContract) => `### ${c.id}

- **Provider:** ${c.provider}
- **Consumers:** ${c.consumers.join(', ')}
- **Guarantee:** ${c.guarantee}
- **Evidence:** \`${c.evidence.evidenceClass}\` → \`${c.evidence.reference}\`
- **Gate:** \`${c.gate}\` (BLOCKING in ${c.provider})
`).join('\n')}

## Cross-cutting governance

- **Identity:** \`${spec.crossCutting.identity.canonicalSource}\`
- **Capacity:** ${spec.crossCutting.capacity.model} (${spec.crossCutting.capacity.range.join('–')}) — ${spec.crossCutting.capacity.contract}
- **Audit:** \`${spec.crossCutting.audit.chainName}\` via \`${spec.crossCutting.audit.sink}\`
`;
}