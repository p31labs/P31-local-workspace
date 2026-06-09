#!/usr/bin/env node
// Kenosis mesh test harness: post an INIT to Root and observe leaf aggregation

const fetch = typeof globalThis.fetch === 'function'
  ? globalThis.fetch
  : require('node-fetch');

const WORKER_URL = "https://kenosis-mesh.trimtab-signal.workers.dev";
const ROOT_BEARER_TOKEN = "kenosis-1743586400";

async function testMesh() {
  console.log("🟢 INITIATING KENOSIS MESH TEST...");

  const envelope = {
    id: "init-" + Date.now(),
    from: "OPERATOR",
    to: "R",
    type: "init",
    payload: { command: "VERIFY_K4_INTEGRITY" },
    timestamp: Date.now()
  };

  try {
    const resp = await fetch(WORKER_URL + "/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ROOT_BEARER_TOKEN}`
      },
      body: JSON.stringify(envelope)
    });

    const data = await resp.json();
    console.log("Root response:", data);
  } catch (error) {
    console.error("Mesh test error:", error);
  }
}

testMesh();