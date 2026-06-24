#!/usr/bin/env ts-node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { getPHOSConfig, PHOSMasterRuntime } from '../p31ca/src/phos-v2/master';
import { Week1Core } from '../p31ca/src/phos-v2/convergence';
import { runWeek2Convergence } from '../p31ca/src/phos-v2/convergence';
import { runWeek3Convergence } from '../p31ca/src/phos-v2/convergence';
import { runWeek4Convergence } from '../p31ca/src/phos-v2/convergence';
import { runWeek5Convergence } from '../p31ca/src/phos-v2/convergence';
import { runWeek6Convergence } from '../p31ca/src/phos-v2/convergence';
import { runWeek7Convergence } from '../p31ca/src/phos-v2/convergence';
import { runWeek8Convergence } from '../p31ca/src/phos-v2/convergence';

interface Args {
  week: number;
  config?: string;
  outputDir?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {
    week: 1,
    outputDir: './.p31/convergence'
  };
   
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--week' && i + 1 < args.length) {
      parsed.week = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--config' && i + 1 < args.length) {
      parsed.config = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      parsed.outputDir = args[i + 1];
      i++;
    }
  }
   
  return parsed;
}

async function loadConfig(configPath: string | undefined): Promise<any> {
  if (!configPath) {
    return { version: '1.0.0', convergenceWeek: 1, phases: {}, features: {} };
  }
   
  try {
    const content = readFileSync(resolve(configPath), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error);
    process.exit(1);
  }
}

async function runConvergence(week: number, config: any): Promise<any> {
  const master = new PHOSMasterRuntime(config);
   
  // Register all phases with the master
  const phaseRegistrations = [
    { id: 'voice', phaseClass: () => import('../p31ca/src/phos-v2/phase1-voice/VoicePhase').then(m => m.VoicePhase) },
    { id: 'bros', phaseClass: () => import('../p31ca/src/phos-v2/phase2-bros/BrosPhase').then(m => m.BrosPhase) },
    { id: 'router', phaseClass: () => import('../p31ca/src/phos-v2/phase3-router/RouterPhase').then(m => m.RouterPhase) },
    { id: 'visual', phaseClass: () => import('../p31ca/src/phos-v2/phase4-visual/VisualPhase').then(m => m.VisualPhase) },
    { id: 'predictive', phaseClass: () => import('../p31ca/src/phos-v2/phase5-predictive/PredictivePhase').then(m => m.PredictivePhase) },
    { id: 'guardian', phaseClass: () => import('../p31ca/src/phos-v2/phase6-guardian/GuardianPhase').then(m => m.GuardianPhase) },
    { id: 'bridge', phaseClass: () => import('../p31ca/src/phos-v2/phase7-bridge/BridgePhase').then(m => m.BridgePhase) },
    { id: 'memory', phaseClass: () => import('../p31ca/src/phos-v2/phase8-memory/MemoryPhase').then(m => m.MemoryPhase) }
  ];
   
  for (const reg of phaseRegistrations) {
    try {
      const PhaseClass = (await reg.phaseClass()).default || (await reg.phaseClass());
      const phase = new PhaseClass();
      await phase.initialize(config);
      master.registerPhase(phase);
      phase.activate();
    } catch (error) {
      console.warn(`Failed to register phase ${reg.id}:`, error);
    }
  }
   
  // Run the appropriate convergence function
  switch (week) {
    case 1:
      return await Week1Core(master);
    case 2:
      return await runWeek2Convergence(master, {
        voicePhaseId: 'voice',
        brosPhaseId: 'bros',
        testPhrases: ['Switch to S.J. mode', 'Let me talk to C.J.', 'W.J., what do you think?', 'Switch back to dad'],
        expectedPersonaSwitches: [
          { phrase: 'Switch to S.J. mode', expectedPersona: 'sj' as const },
          { phrase: 'Let me talk to C.J.', expectedPersona: 'cj' as const },
          { phrase: 'W.J., what do you think?', expectedPersona: 'wj' as const },
          { phrase: 'Switch back to dad', expectedPersona: 'wij' as const }
        ]
      });
    case 3:
      return await runWeek3Convergence(master);
    case 4:
      return await runWeek4Convergence(master);
    case 5:
      return await runWeek5Convergence(master);
    case 6:
      return await runWeek6Convergence(master);
    case 7:
      return await runWeek7Convergence(master);
    case 8:
      return await runWeek8Convergence(master, { enableAllPhases: true });
    default:
      throw new Error(`Unsupported week: ${week}`);
  }
}

async function main() {
  const args = parseArgs();
   
  console.log(`Running convergence week ${week}...`);
  if (args.config) {
    console.log(`Using config: ${args.config}`);
  }
   
  try {
    const config = await loadConfig(args.config);
    config.convergenceWeek = args.week;
   
    const report = await runConvergence(args.week, config);
   
    // Output to stdout
    console.log(JSON.stringify(report, null, 2));
   
    // Write to file
    const outputDir = resolve(args.outputDir);
    mkdirSync(outputDir, { recursive: true });
    const outputFile = resolve(outputDir, `week${args.week}.json`);
    writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`\nReport written to: ${outputFile}`);
   
  } catch (error) {
    console.error('Convergence runner failed:', error);
    process.exit(1);
  }
}

main();