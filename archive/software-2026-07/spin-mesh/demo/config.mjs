export const CONFIG = {
  // Set these to the deployed Matchmaking DO and Logistics DO URLs
  DO_URL: process.env.DO_URL || 'http://localhost:8787',
  LOGISTICS_URL: process.env.LOGISTICS_URL || 'http://localhost:8788',

  USER_ID_A: 'alice-demo',
  USER_ID_B: 'bob-demo',
  USER_ID_C: 'carol-demo',

  RESOURCE_ZELDA: 'urn:uuid:zelda-minish-cap-1111',
  RESOURCE_RPI: 'urn:uuid:raspberry-pi-400-3333',
  RESOURCE_ELDRING: 'urn:uuid:elden-ring-2222',
};
