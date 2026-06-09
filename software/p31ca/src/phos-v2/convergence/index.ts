/**
 * PHOS Convergence Checkpoints
 * Weekly integration points for all 8 phases
 */

export { Week1Core } from './week1-core';
export { Week2PersonaVoice } from './week2-persona-voice';
export { Week3RouterVoice } from './week3-router-voice';
export { Week4VisualCore } from './week4-visual-core';
export { Week5MeshVisual } from './week5-mesh-visual';
export { Week6PredictiveAll } from './week6-predictive-all';
export { Week7GuardianAll } from './week7-guardian-all';
export { Week8Final } from './week8-final';

export interface ConvergenceDemo {
  week: number;
  name: string;
  script: string; // Voice command to run
  expectedResult: string;
  phasesRequired: string[];
}

export const CONVERGENCE_DEMOS: ConvergenceDemo[] = [
  {
    week: 1,
    name: 'Core Runtime',
    script: 'PHOS, what is my current persona?',
    expectedResult: 'Shows current Bros persona (default: W.J.)',
    phasesRequired: ['voice', 'bros', 'router']
  },
  {
    week: 2,
    name: 'Voice-Persona Switching',
    script: 'PHOS, switch to S.J. mode',
    expectedResult: 'UI transforms to youth-friendly S.J. persona',
    phasesRequired: ['voice', 'bros']
  },
  {
    week: 3,
    name: 'Voice-Routed Commands',
    script: 'PHOS, check S.J. activity',
    expectedResult: 'Routes to child vertex, shows kid-friendly data',
    phasesRequired: ['voice', 'router']
  },
  {
    week: 4,
    name: '3D Constellation Alpha',
    script: 'PHOS, open the family mesh',
    expectedResult: '3D visualization shows all family members as nodes, live voice moves them',
    phasesRequired: ['voice', 'bros', 'router', 'visual']
  },
  {
    week: 5,
    name: 'Mesh Topology Live',
    script: 'PHOS, show mesh health',
    expectedResult: '3D shows packet flow between family members, real-time routing',
    phasesRequired: ['router', 'visual']
  },
  {
    week: 6,
    name: 'Predictive Suggestions',
    script: 'PHOS, what should I do?',
    expectedResult: 'Suggests activities based on voice patterns, persona, and mesh activity',
    phasesRequired: ['voice', 'bros', 'router', 'visual', 'predictive']
  },
  {
    week: 7,
    name: 'Guardian Dashboard',
    script: 'PHOS, guardian view',
    expectedResult: 'Parent dashboard shows all child PHOS activity across all phases',
    phasesRequired: ['guardian', 'voice', 'bros', 'router', 'visual', 'predictive']
  },
  {
    week: 8,
    name: 'PHOS v2.0 GA',
    script: 'PHOS, full ecosystem',
    expectedResult: 'Complete PHOS — voice, 4 personas, mesh routing, 3D visual, predictive, guardian, cross-platform, memory',
    phasesRequired: ['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory']
  }
];
