/** Dark operator lane (p31ca hub, static HTML, tooling). Keep in sync with p31-operator-tailwind.js */
export const OPERATOR_LANE = {
  void: '#050505',
  surface: '#161920',
  phosphor: '#00FF88',
  coral: '#cc6247',
  amber: '#FFD700',
  cloud: '#d8d6d0',
} as const;

export type OperatorLaneKey = keyof typeof OPERATOR_LANE;
