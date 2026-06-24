import type { PassportDocument, PassportProfileId, FieldGroup, GenesisAttestation, PassportSignature, P31Keypair } from '@p31/shared/cognitive-passport';
import { normalize } from '@p31/shared/cognitive-passport';
import { computeGenesisHash } from '@p31/shared/cognitive-passport';
import { signPassport } from '@p31/shared/cognitive-passport';

export type ExportFormat = 'json' | 'yaml' | 'pdf' | 'signed';

export interface ExportOptions {
  format: ExportFormat;
  profile?: PassportProfileId;
  sign?: boolean;
  keypair?: P31Keypair;
}

export class PassportDocumentManager {
  private draft: Partial<PassportDocument> = {};
  private completedSteps: string[] = [];
  private keypair: P31Keypair | null = null;

  constructor() {
    this.draft = {
      schema_version: 'p31.cognitivePassport/1.1.0',
      audience_matrix_version: '1.0.0',
      profile: 'public' as PassportProfileId,
      fields: {},
    };
  }

  getField<T>(group: FieldGroup): T | undefined {
    return this.draft.fields?.[group] as T | undefined;
  }

  setField(group: FieldGroup, value: unknown): void {
    if (!this.draft.fields) this.draft.fields = {};
    (this.draft.fields as Record<string, unknown>)[group] = value;
  }

  markStepComplete(step: string): void {
    if (!this.completedSteps.includes(step)) {
      this.completedSteps.push(step);
    }
  }

  getCompletedSteps(): string[] {
    return [...this.completedSteps];
  }

  isStepComplete(step: string): boolean {
    return this.completedSteps.includes(step);
  }

  getCompletionPercentage(totalSteps: number): number {
    if (totalSteps === 0) return 0;
    return Math.round((this.completedSteps.length / totalSteps) * 100);
  }

  setProfile(profile: PassportProfileId): void {
    this.draft.profile = profile;
  }

  setKeypair(keypair: P31Keypair): void {
    this.keypair = keypair;
  }

  private getSortableFields(): Record<string, unknown> {
    const fields = { ...(this.draft.fields ?? {}) } as Record<string, unknown>;
    return Object.keys(fields)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = fields[key];
        return acc;
      }, {});
  }

  async exportJson(opts: ExportOptions): Promise<string> {
    const payload = {
      schema_version: this.draft.schema_version,
      audience_matrix_version: this.draft.audience_matrix_version,
      profile: opts.profile ?? this.draft.profile,
      fields: this.getSortableFields(),
    };

    const genesis = await computeGenesisHash(payload);

    const document: Record<string, unknown> = {
      ...payload,
      provenance: genesis,
    };

    if (opts.sign && this.keypair) {
      const signature = await signPassport(
        document,
        this.keypair.privateKey,
        this.keypair.publicKey,
      );
      document.provenance = { ...genesis, signed_by: signature };
    }

    return JSON.stringify(document, null, 2);
  }

  async exportYaml(opts: ExportOptions): Promise<string> {
    const json = await this.exportJson(opts);
    const doc = JSON.parse(json);
    const fields = doc.fields ?? {};

    let yaml = `---\n`;
    yaml += `schema_version: ${doc.schema_version}\n`;
    yaml += `audience_matrix_version: ${doc.audience_matrix_version}\n`;
    yaml += `profile: ${doc.profile}\n`;
    yaml += `genesis:\n`;
    yaml += `  hash_sha256: ${doc.provenance.hash_sha256}\n`;
    yaml += `  iso_timestamp: ${doc.provenance.iso_timestamp}\n`;
    if (doc.provenance.signed_by) {
      yaml += `  signed_by:\n`;
      yaml += `    ed25519: ${doc.provenance.signed_by.ed25519?.slice(0, 32)}...\n`;
      yaml += `    key_fingerprint: ${doc.provenance.signed_by.key_fingerprint}\n`;
    }
    yaml += `---\n\n`;

    for (const [group, value] of Object.entries(fields)) {
      if (!value) continue;
      yaml += `## ${group}\n`;
      yaml += `${formatYamlValue(value, '  ')}\n`;
    }

    return yaml;
  }

  async exportPdf(_opts: ExportOptions): Promise<Uint8Array> {
    throw new Error('PDF export not yet implemented — use P31 Forge');
  }

  async export(opts: ExportOptions): Promise<string | Uint8Array> {
    switch (opts.format) {
      case 'json': return this.exportJson(opts);
      case 'yaml': return this.exportYaml(opts);
      case 'pdf': return this.exportPdf(opts);
      case 'signed': return this.exportJson({ ...opts, sign: true, format: 'json' });
      default: throw new Error(`Unknown format: ${opts.format}`);
    }
  }

  toJSON(): Partial<PassportDocument> {
    return { ...this.draft };
  }

  load(data: Partial<PassportDocument>): void {
    this.draft = normalize(data);
  }

  getFieldCount(): number {
    return Object.keys(this.draft.fields ?? {}).length;
  }
}

function formatYamlValue(value: unknown, indent: string): string {
  if (value === null || value === undefined) return `${indent}null\n`;
  if (typeof value === 'string') return `${indent}"${value.replace(/"/g, '\\"')}"\n`;
  if (typeof value === 'number' || typeof value === 'boolean') return `${indent}${value}\n`;
  if (Array.isArray(value)) {
    return value.map(item => `${indent}- ${formatYamlValue(item, indent + '  ').trim()}`).join('\n') + '\n';
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${indent}${k}: ${formatYamlValue(v, indent + '  ').trim()}`)
      .join('\n') + '\n';
  }
  return `${indent}${String(value)}\n`;
}
