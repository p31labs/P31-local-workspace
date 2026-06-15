import { DurableObject } from 'cloudflare:workers';

// Minimal BROS signaling stub - customize for your use case
export class BrosSignalingDO extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    return new Response('BROS Signaling Service', { status: 200 });
  }
}

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    return new Response('BROS Worker Template', { status: 200 });
  }
};
