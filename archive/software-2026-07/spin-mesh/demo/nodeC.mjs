/**
 * SpIn Mesh Demo — Node C (Carol)
 *
 * Carol owns Elden Ring (game) and wants the Raspberry Pi 400.
 */

import PGLite from '@electric-sql/pglite';
import { initSync } from '../sync/tinybase-sync';
import { generateKeyPair, exportPublicKey, computeSharedSecret } from './x3dh';
import { CONFIG } from './config.mjs';

const USER_ID = CONFIG.USER_ID_C;
const RESOURCE_ID_ELDRING = CONFIG.RESOURCE_ELDRING;
const RESOURCE_ID_RPI = CONFIG.RESOURCE_RPI;
const LOGISTICS_URL = `${CONFIG.LOGISTICS_URL}`; // Logistics DO base URL

async function main() {
  const db = new PGLite('spin-carol.db');
  await db.connect();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS resources (id TEXT PRIMARY KEY, doc JSONB);
    CREATE TABLE IF NOT EXISTS intents (user_id TEXT, resource_id TEXT, desired_resource_id TEXT, PRIMARY KEY(user_id, resource_id));
  `);

  const eldenDoc = {
    "@context": "https://p31.network/spin-context.jsonld",
    id: RESOURCE_ID_ELDRING,
    type: "SpInResource",
    physical_format: "Disc_PS5",
    title: "Elden Ring",
    neuro_metadata: { monotropic_potential: 0.85, executive_function_requirement: "high", multiplayer_anxiety_index: 0.4, stimulation_profile: ["open-world", "combat"] },
    custody_state: "available_for_mesh_swap"
  };
  await db.prepare('INSERT INTO resources VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET doc = $2')
    .bind(RESOURCE_ID_ELDRING, JSON.stringify(eldenDoc)).run();

  await db.prepare(`
    INSERT INTO intents (user_id, resource_id, desired_resource_id)
    VALUES ($1, $2, $3)
    ON CONFLICT(user_id, resource_id) DO UPDATE SET desired_resource_id = $3
  `).bind(USER_ID, RESOURCE_ID_ELDRING, RESOURCE_ID_RPI).run();

  console.log('🔸 Carol: posted intent (Elden Ring → Raspberry Pi 400)');

  initSync({ doUrl: CONFIG.DO_URL, userId: USER_ID, db });

  const waitForCycle = async () => {
    try {
      const res = await fetch(`${CONFIG.DO_URL}/cycles?userId=${USER_ID}`);
      const cycles = await res.json();
      if (cycles.length > 0) return cycles[0];
    } catch (e) { console.error(e); }
    return null;
  };

  let cycle = null;
  while (!cycle) {
    await new Promise(r => setTimeout(r, 3000));
    cycle = await waitForCycle();
  }
  console.log('🔸 Carol: cycle locked!', cycle.cycle_id);

   const handoverId = cycle.cycle_id;
   const expectedResourceIds = [RESOURCE_ID_ELDRING, RESOURCE_ID_RPI]; // What Carol posted

   // 1. Generate ephemeral key pair
   const keyPair = await generateKeyPair();
   const pubKeyBytes = await exportPublicKey(keyPair.publicKey);
   const pubKeyHex = Buffer.from(pubKeyBytes).toString('hex');

   // 2. Submit public key to Logistics DO
   console.log('🔸 Carol: submitting ephemeral public key to Logistics DO');
   const submitResp = await fetch(`${LOGISTICS_URL}/${handoverId}/key`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ handoverId, userId: USER_ID, pubkey: pubKeyHex })
   });
   if (!submitResp.ok) {
     const errorText = await submitResp.text();
     throw new Error(`Key submit failed: ${submitResp.status} ${errorText}`);
   }
   console.log('🔸 Carol: submitted public key');

   // 3. Poll for ready (remote key available)
   console.log('🔸 Carol: waiting for remote public key...');
   const waitReady = async () => {
     const r = await fetch(`${LOGISTICS_URL}/${handoverId}/ready?userId=${USER_ID}`);
     if (!r.ok) {
       const errorText = await r.text();
       throw new Error(`Ready check failed: ${r.status} ${errorText}`);
     }
     const data = await r.json();
     return data.ready ? data : null;
   };

   let ready = null;
   let readyAttempts = 0;
   const MAX_READY_ATTEMPTS = 30; // 30 seconds max wait
   while (!ready && readyAttempts < MAX_READY_ATTEMPTS) {
     try {
       ready = await waitReady();
       if (!ready) {
         readyAttempts++;
         if (readyAttempts % 5 === 0) {
           console.log(`🔸 Carol: still waiting for ready... (${readyAttempts}/${MAX_READY_ATTEMPTS})`);
         }
       }
     } catch (error) {
       console.error('🔸 Carol: error in ready polling:', error.message);
       readyAttempts++;
       if (readyAttempts >= MAX_READY_ATTEMPTS) throw error;
     }
     await new Promise(r => setTimeout(r, 1000));
   }

   if (!ready) {
     throw new Error(`Timeout waiting for ready state after ${MAX_READY_ATTEMPTS} seconds`);
   }

   // Validate ready response
   if (ready.cycleId !== handoverId) {
     throw new Error(`Cycle ID mismatch: expected ${handoverId}, got ${ready.cycleId}`);
   }
   if (!Array.isArray(ready.resourceIds) || ready.resourceIds.length === 0) {
     throw new Error('Invalid or missing resourceIds in ready response');
   }
   // Check that our posted resources are in the response (order may vary)
   const hasExpectedResources = expectedResourceIds.every(expectedId => 
     ready.resourceIds.includes(expectedId)
   );
   if (!hasExpectedResources) {
     throw new Error(`Resource IDs mismatch: expected ${expectedResourceIds.join(',')}, got ${ready.resourceIds.join(',')}`);
   }

   console.log('🔸 Carol: remote public key received');
   console.log(`🔸 Carol: handover details - cycle: ${ready.cycleId}, resources: ${ready.resourceIds.join(', ')}`);

   // 4. Compute shared secret
   const remotePub = new Uint8Array(Buffer.from(ready.remotePubkey, 'hex'));
   const shared = await computeSharedSecret(keyPair.privateKey, remotePub);
   const sharedSecretRaw = await shared.exportKey('raw');
   console.log('🔸 Carol: shared secret derived (size:', sharedSecretRaw.byteLength, 'bytes)');

   // 5. Complete handover
   console.log('🔸 Carol: completing handover...');
   const compResp = await fetch(`${LOGISTICS_URL}/${handoverId}/complete`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ handoverId, userId: USER_ID })
   });
   if (!compResp.ok) {
     const errorText = await compResp.text();
     throw new Error(`Complete failed: ${compResp.status} ${errorText}`);
   }
   const compData = await compResp.json();
   if (compData.ok && compData.completed === 2) { // Expecting 2 participants in 2-party cycle
     console.log('🔸 Carol: handover complete — L.O.V.E. minted');
   } else if (compData.ok) {
     console.log(`🔸 Carol: handover step complete (${compData.completed} participants done)`);
   } else {
     console.error('🔸 Carol: handover failed', compData);
   }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
