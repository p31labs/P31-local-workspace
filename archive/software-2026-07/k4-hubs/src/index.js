/**
 * K4-Hubs — Life-context router + HubFusion DO (4 vertex agents + hub fusion reads).
 */
import { HubFusionAgent } from "./hub-fusion-agent.js";
import { handleRequest } from "./router.js";

import { logger } from './logger.js';

export { HubFusionAgent };

export default {
  async fetch(request, env) {
    logger.info('fetch', request.method, new URL(request.url).pathname);
    return handleRequest(request, env);
  },
};
