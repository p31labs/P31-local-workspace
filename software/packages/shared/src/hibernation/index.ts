/**
 * Hibernation API - Cloudflare Durable Objects
 * 
 * BROS Architecture: I. Routing Engine - Zero-State Telemetry
 * 
 * Provides hibernation capabilities for Durable Objects:
 * - Sleep when dormant (zero compute cost)
 * - Wake instantly on crisis ping
 * - State persistence via deserializeAttachment
 */

export {
  HibernatableDurableObject,
  HibernationAPI,
  trackWebSocketActivity,
  trackHttpActivity,
  createHibernationAwareHandler,
} from './hibernation';

export type {
  HibernationAttachment,
  HibernationStats,
  HibernationOptions,
} from './hibernation';
