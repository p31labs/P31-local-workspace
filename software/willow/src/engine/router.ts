export type Screen = 'MENU' | 'MOOD' | 'GAMES' | 'MEMORY' | 'BUBBLES' | 'DRAW' | 'VOICE' | 'FAMILY';

export function pushScreen(stack: Screen[], screen: Screen): Screen[] {
  return [...stack, screen];
}

export function popScreen(stack: Screen[]): Screen[] {
  return stack.length > 1 ? [...stack.slice(0, -1)] : stack;
}

export function currentScreen(stack: Screen[]): Screen {
  return stack[stack.length - 1] ?? 'MENU';
}

export function canPop(stack: Screen[]): boolean {
  return stack.length > 1;
}
