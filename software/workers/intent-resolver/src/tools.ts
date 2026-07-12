// tools.ts — P31 tool schema for Needle classification.
//
// These definitions are passed to Needle's constrained decoder, which builds
// a character-level trie over tool names and argument keys. Output is always
// syntactically valid JSON referencing one of these tools.

import type { ToolDef } from './needle-engine';

export const P31_TOOLS: ToolDef[] = [
  {
    name: 'oasis_execute',
    description: 'Run a creative game or interactive experience',
  },
  {
    name: 'phos_adopt',
    description: 'Adopt and nurture a digital plant',
  },
  {
    name: 'jitterbug_run',
    description: 'Run a playful movement or dance sequence',
  },
  {
    name: 'phos_learn',
    description: 'Access educational content or tutorials',
  },
  {
    name: 'phos_deploy',
    description: 'Deploy or publish a creation',
  },
  {
    name: 'phos_watch',
    description: 'Monitor or observe system health',
  },
  {
    name: 'healer_remediate',
    description: 'Fix issues or heal system problems',
  },
  {
    name: 'bus_emit',
    description: 'Emit an event to the system bus',
  },
  {
    name: 'phos_rollback',
    description: 'Roll back to a previous state',
  },
];
