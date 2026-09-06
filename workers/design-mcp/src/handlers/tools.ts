export async function handleToggleDrawer(args: { state: 'open' | 'closed', target: string, surfaceId?: string, userId?: string }): Promise<any> {
  return {
    success: true,
    action: 'toggleDrawer',
    target: args.target,
    state: args.state,
    surfaceId: args.surfaceId || null,
    userId: args.userId || null,
  };
}

export async function handleNavigate(args: { href: string, external?: boolean, surfaceId?: string, userId?: string }): Promise<any> {
  return {
    success: true,
    action: 'navigate',
    href: args.href,
    external: args.external || false,
    surfaceId: args.surfaceId || null,
    userId: args.userId || null,
  };
}

export async function handleSetSpoonLevel(args: { level: number, surfaceId?: string, userId?: string }): Promise<any> {
  if (args.level < 0 || args.level > 5) {
    throw new Error('Spoon level must be between 0 and 5');
  }
  return {
    success: true,
    action: 'setSpoonLevel',
    level: args.level,
    surfaceId: args.surfaceId || null,
    userId: args.userId || null,
  };
}
