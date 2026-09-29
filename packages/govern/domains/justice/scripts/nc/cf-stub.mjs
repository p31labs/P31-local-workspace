// Minimal stand-in for the `cloudflare:workers` DurableObject base class, used
// only so the REAL p31-justice-hub DO handler code can run under plain node.
// Constructor protocol matches the Cloudflare runtime: (state, env), with
// `this.ctx = state`.
export class DurableObject {
  constructor(state, env) {
    this.ctx = state;
    this.env = env;
  }
}