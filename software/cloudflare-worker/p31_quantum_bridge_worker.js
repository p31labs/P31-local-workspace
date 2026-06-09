/**
 * P31 Labs: Quantum Bridge Worker
 * ---------------------------------------------------------
 * Acts as a global edge-api for the IBM Quantum Runtime.
 * Allows the mesh to submit and monitor quantum circuits via the AT edge.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const authHeader = request.headers.get("Authorization");

    const IBM_API_TOKEN = env.IBM_QUANTUM_TOKEN;
    const IBM_BASE_URL = "https://api.quantum-computing.ibm.com/runtime";

    // 1. Job Submission Route
    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const { qasm, backend = "ibmq_qasm_simulator", shots = 1024 } = await request.json();

        const response = await fetch(`${IBM_BASE_URL}/jobs`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${IBM_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            program_id: "sampler",
            backend: backend,
            params: {
              circuits: [qasm],
              run_options: { shots }
            }
          })
        });

        const data = await response.json();
        return new Response(JSON.stringify({ status: "submitted", jobId: data.id }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }

    // 2. Job Result Route
    if (request.method === "GET" && url.pathname.startsWith("/result/")) {
      const jobId = url.pathname.split("/").pop();
      try {
        const response = await fetch(`${IBM_BASE_URL}/jobs/${jobId}`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${IBM_API_TOKEN}` }
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }

    return new Response("🔺 P31 Quantum Bridge: Online.", { status: 200 });
  }
};
