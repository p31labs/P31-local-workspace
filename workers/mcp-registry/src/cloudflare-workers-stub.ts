/**
 * Vitest-only stub for `cloudflare:workers`. tsc uses the real runtime types;
 * vitest (Node) resolves this alias so the DO class can be loaded in tests.
 */
export class DurableObject<Env = unknown> {
  public ctx: any
  public env: Env
  constructor(ctx: any, env: Env) {
    this.ctx = ctx
    this.env = env
  }
}