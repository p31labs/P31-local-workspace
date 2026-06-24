/**
 * Convergence Week 1: Core Runtime
 * Voice + Bros + Router integration
 */

import type { PHOSMasterRuntime, ConvergenceReport } from '../master';

export async function Week1Core(master: PHOSMasterRuntime): Promise<ConvergenceReport> {
  const week = 1;
  console.log('[Convergence W1] Core Runtime integration starting...');

  const config = (master as any).config as { version?: string } | undefined;
  const engineVersion = config?.version || 'unknown';

  const report = await master.converge(week);
  const allStates = master.getAllStates();

  const voiceActive = allStates['voice']?.status === 'active';
  const brosActive = allStates['bros']?.status === 'active';
  const routerActive = allStates['router']?.status === 'active';
  const allErrorsZero = Object.values(allStates).every(
    (s: any) => s.errorCount === 0
  );

  const success = voiceActive && brosActive && routerActive && allErrorsZero;

  if (success) {
    console.log(`[Convergence W1] Core Runtime ready (engine v${engineVersion})`);
    console.log(`[Convergence W1] Demo: Say "switch to [name] mode"`);
    console.log(`[Convergence W1] Voice active ${+voiceActive} | Bros active ${+brosActive} | Router active ${+routerActive} | Errors ${allErrorsZero ? '0' : '>0'}`);
  } else {
    console.log('[Convergence W1] Core not ready');
    console.log(`  Voice:    ${allStates['voice']?.status || 'not registered'}`);
    console.log(`  Bros:     ${allStates['bros']?.status || 'not registered'} (${allStates['bros']?.errorCount ?? 0} errors)`);
    console.log(`  Router:   ${allStates['router']?.status || 'not registered'}`);
    console.log(`  Demo:     Say "switch to [name] mode" once all three are active`);
  }

  return report;
}
