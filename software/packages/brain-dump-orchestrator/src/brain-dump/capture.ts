import * as fs from 'fs';
import * as readline from 'readline';
import type { BrainDump } from '../types/brain-dump.js';
import { createDefaultBrainDump } from './schema.js';

const PROMPTS: Record<keyof BrainDump, { question: string; multi?: boolean }> = {
  projectName: { question: 'Project name?' },
  coreProblem: { question: 'Core problem / opportunity (one paragraph)?', multi: true },
  currentState: { question: 'Current state artifacts (one per line, format: path | description | status)?', multi: true },
  constraints: { question: 'Constraints & non-negotiables (one per line, format: rule | severity)?', multi: true },
  desiredEndState: { question: 'Desired end state / FRUIT target?' },
  knownAssets: { question: 'Known assets (one per line)?', multi: true },
  openQuestions: { question: 'Open questions / unknowns (one per line)?', multi: true },
  metadata: { question: 'Operator name?' },
};

export async function captureInteractive(operatorName: string = 'operator'): Promise<BrainDump> {
  const bd = createDefaultBrainDump(operatorName);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const question = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

  try {
    bd.projectName = await question(PROMPTS.projectName.question + ' ');
    if (!bd.projectName.trim()) {
      throw new Error('Project name is required');
    }

    bd.coreProblem = await question(PROMPTS.coreProblem.question + '\n');

    const artifactsInput = await question(PROMPTS.currentState.question + '\n');
    bd.currentState.artifacts = parseArtifacts(artifactsInput);

    const constraintsInput = await question(PROMPTS.constraints.question + '\n');
    bd.constraints = parseConstraints(constraintsInput);

    bd.desiredEndState.convergenceTarget = await question(PROMPTS.desiredEndState.question + ' ');
    bd.desiredEndState.description = bd.desiredEndState.convergenceTarget;

    const assetsInput = await question(PROMPTS.knownAssets.question + '\n');
    bd.knownAssets = parseAssets(assetsInput);

    const questionsInput = await question(PROMPTS.openQuestions.question + '\n');
    bd.openQuestions = parseQuestions(questionsInput);

    bd.metadata.capturedAt = new Date().toISOString();
  } finally {
    rl.close();
  }

  return bd;
}

function parseArtifacts(input: string): BrainDump['currentState']['artifacts'] {
  return input.split('\n').filter(line => line.trim()).map(line => {
    const parts = line.split('|').map(p => p.trim());
    return {
      path: parts[0] || '',
      description: parts[1] || '',
      status: (parts[2] as BrainDump['currentState']['artifacts'][0]['status']) || 'seed',
    };
  });
}

function parseConstraints(input: string): BrainDump['constraints'] {
  return input.split('\n').filter(line => line.trim()).map((rule, i) => ({
    id: `C${i + 1}`,
    rule: rule.replace(/\|.*$/, '').trim(),
    severity: rule.includes('non-negotiable') || rule.includes('zero') || rule.includes('never') ? 'non-negotiable' : 'strong',
  }));
}

function parseAssets(input: string): BrainDump['knownAssets'] {
  return input.split('\n').filter(line => line.trim()).map(name => ({
    name,
    description: name,
  }));
}

function parseQuestions(input: string): BrainDump['openQuestions'] {
  return input.split('\n').filter(line => line.trim()).map((question, i) => ({
    id: `Q${i + 1}`,
    question: question.replace(/^\[(\w+)\]\s*/, '').replace(/^Q\d+:\s*/, ''),
    priority: 'medium' as const,
  }));
}
