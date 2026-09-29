/**
 * spec-yaml — load DomainSpec (govern generate) and EnterpriseSpec
 * (govern compose) from YAML. Uses the `yaml` package (hoisted in the
 * monorepo). YAML is the authoring format — JSON is the runtime format.
 */
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { DomainSpec, EnterpriseSpec } from './spec.js';

export function loadSpecFromYaml(path: string): DomainSpec {
  const raw = readFileSync(path, 'utf8');
  const spec = parseYaml(raw) as DomainSpec;
  if (!spec?.domain || !spec?.canonicalSource?.path) {
    throw new Error(`spec error: ${path} is not a domain spec (missing domain / canonicalSource.path)`);
  }
  if (!Array.isArray(spec.gates) || spec.gates.length === 0) {
    throw new Error(`spec error: ${path} declares no gates`);
  }
  return spec;
}

export function loadEnterpriseFromYaml(path: string): EnterpriseSpec {
  const raw = readFileSync(path, 'utf8');
  const spec = parseYaml(raw) as EnterpriseSpec;
  if (!spec?.name || !Array.isArray(spec?.domains)) {
    throw new Error(`spec error: ${path} is not an enterprise spec (missing name / domains)`);
  }
  if (!Array.isArray(spec?.interDomainContracts)) {
    throw new Error(`spec error: ${path} declares no inter-domain contracts`);
  }
  return spec;
}