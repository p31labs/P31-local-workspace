import type { BrainDump, Constraint, KnownAsset, OpenQuestion, Artifact, Gap, BrainDumpBlocker, DesiredEndState, BrainDumpMetadata } from '../types/brain-dump.js';
import { validateBrainDump, createDefaultBrainDump } from './schema.js';

export function parseMarkdownToBrainDump(markdown: string, operatorName: string): BrainDump {
  const bd = createDefaultBrainDump(operatorName);
  const lines = markdown.split('\n');

  let inSection = '';
  let currentList: string[] = [];
  let currentText: string[] = [];
  let inGapsSubsection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.match(/^#\s+🧠\s+Brain\s+Dump/)) {
      const match = trimmed.match(/Brain\s+Dump[\s–-]+\s*(.+)/i);
      if (match) bd.projectName = match[1].trim();
      continue;
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      if (currentList.length > 0 || currentText.length > 0) {
        processSection(inSection, currentList, currentText, bd, inGapsSubsection);
        currentList = [];
        currentText = [];
        inGapsSubsection = false;
      }
      const text = trimmed.replace(/^#+\s+/, '');
      if (text.includes('1.1') || text.includes('Core Problem')) inSection = 'CoreProblem';
      else if (text.includes('1.2') || text.includes('Current State')) inSection = 'Current State';
      else if (text.includes('1.3') || text.includes('Constraints')) inSection = 'Constraints';
      else if (text.includes('1.4') || text.includes('Desired End State')) inSection = 'Desired End State';
      else if (text.includes('1.5') || text.includes('Known Assets')) inSection = 'Known Assets';
      else if (text.includes('1.6') || text.includes('Open Questions')) inSection = 'Open Questions';
      else inSection = text.split(' ')[0];
      continue;
    }

    if (trimmed.toLowerCase().startsWith('known gaps') || trimmed.toLowerCase().startsWith('gaps / blockers')) {
      inGapsSubsection = true;
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('  - ')) {
      if (currentText.length > 0) {
        processSection(inSection, currentList, currentText, bd, inGapsSubsection);
        currentList = [];
        currentText = [];
        inGapsSubsection = false;
      }
      currentList.push(trimmed.replace(/^(\s*-\s*)/, ''));
    } else if (trimmed === '') {
      if (currentList.length > 0 || currentText.length > 0) {
        processSection(inSection, currentList, currentText, bd, inGapsSubsection);
        currentList = [];
        currentText = [];
        inGapsSubsection = false;
      }
    } else if (!trimmed.startsWith('#') && !trimmed.match(/^\d+\.\d/)) {
      currentText.push(trimmed);
    }
  }

  if (currentList.length > 0 || currentText.length > 0) {
    processSection(inSection, currentList, currentText, bd, inGapsSubsection);
  }

  bd.metadata.capturedAt = new Date().toISOString();
  return validateBrainDump(bd);
}

function processSection(section: string, list: string[], text: string[], bd: BrainDump, inGapsSubsection: boolean): void {
  switch (section) {
    case 'CoreProblem':
      if (!bd.coreProblem) {
        bd.coreProblem = [...text, ...list].join(' ').trim();
      }
      break;
    case 'Current State': {
      for (const item of list) {
        const isGap = inGapsSubsection || item.toLowerCase().includes('gap') || item.toLowerCase().includes('blocker') || item.toLowerCase().includes('missing') || item.toLowerCase().includes('needs');
        if (isGap) {
          bd.currentState.gaps.push({ description: item, severity: 'high' });
        } else {
          const statusMatch = item.match(/\((\w+)\)$/);
          const status = statusMatch ? statusMatch[1].toLowerCase() as Artifact['status'] : 'seed';
          const clean = item.replace(/\(\w+\)$/, '').trim();
          const parts = clean.split(/[:\-]/).map(s => s.trim()).filter(Boolean);
          bd.currentState.artifacts.push({
            path: parts[0] || clean,
            description: parts[1] || clean,
            status,
          });
        }
      }
      for (const t of text) {
        const isGap = inGapsSubsection || t.toLowerCase().includes('gap') || t.toLowerCase().includes('blocker') || t.toLowerCase().includes('missing');
        if (isGap) {
          bd.currentState.gaps.push({ description: t, severity: 'high' });
        } else {
          bd.currentState.artifacts.push({ path: t, description: t, status: 'seed' });
        }
      }
      break;
    }
    case 'Constraints':
      for (const rule of list) {
        bd.constraints.push({
          id: `C${bd.constraints.length + 1}`,
          rule: rule.replace(/\|.*$/, '').trim(),
          severity: rule.toLowerCase().includes('non-negotiable') || rule.toLowerCase().includes('zero') || rule.toLowerCase().includes('never') ? 'non-negotiable' : 'strong',
        });
      }
      break;
    case 'Desired End State': {
      const combined = [...text, ...list].join(' ').trim();
      bd.desiredEndState.description = combined;
      const targetMatch = combined.match(/convergence\s+target[:\s]+(.+?)(?:\s*[\.,]|$)/i);
      if (targetMatch) {
        bd.desiredEndState.convergenceTarget = targetMatch[1].trim();
      } else if (combined.length > 0) {
        bd.desiredEndState.convergenceTarget = combined.split(/[\s,]+/).slice(0, 3).join(' ');
      }
      break;
    }
    case 'Known Assets':
      for (const name of list) {
        bd.knownAssets.push({
          name: name.replace(/\.\s*$/, ''),
          description: name.replace(/\.\s*$/, ''),
        });
      }
      break;
    case 'Open Questions':
      for (const q of list) {
        const priority = q.includes('critical') ? 'critical' : q.includes('high') ? 'high' : 'medium';
        bd.openQuestions.push({
          id: `Q${bd.openQuestions.length + 1}`,
          question: q.replace(/^\[(\w+)\]\s*/, '').replace(/^Q\d+:\s*/, ''),
          priority,
        });
      }
      break;
  }
}

export function parseJsonToBrainDump(json: string, operatorName: string): BrainDump {
  const parsed = JSON.parse(json);
  const bd = createDefaultBrainDump(operatorName);
  Object.assign(bd, parsed);
  bd.metadata = { ...bd.metadata, capturedAt: new Date().toISOString() };
  return validateBrainDump(bd);
}

export { createDefaultBrainDump };
