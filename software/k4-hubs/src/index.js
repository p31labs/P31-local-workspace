/**
 * K4-Hubs — Life-context router + HubFusion DO (4 vertex agents + hub fusion reads).
 */
import { HubFusionAgent } from "./hub-fusion-agent.js";
import { handleRequest } from "./router.js";

export { HubFusionAgent };

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
