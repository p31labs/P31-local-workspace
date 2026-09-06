/**
 * P31 Labs: IBM Quantum Bridge
 * ---------------------------------------------------------
 * A lightweight Node.js client to interface with IBM Quantum's 
 * cloud infrastructure via the Qiskit Runtime REST API.
 */

export interface QuantumJobOptions {
  backend?: string;
  shots?: number;
}

export class IBMQuantumClient {
  private readonly apiToken: string;
  private readonly baseUrl: string = 'https://api.quantum-computing.ibm.com/runtime';

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.IBM_QUANTUM_TOKEN || '';
    if (!this.apiToken) {
      console.warn('⚠️ IBM_QUANTUM_TOKEN is missing. Quantum bridge operating in offline mode.');
    }
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Submits an OpenQASM 3.0 circuit to IBM Quantum for execution.
   * Useful for Wonky Sprouts entanglement generation or Tetrahedron Protocol logic.
   * 
   * @param qasmString - The quantum circuit defined in OpenQASM
   * @param options - Configuration (backend simulator vs actual QPU, shot count)
   * @returns The IBM Quantum Job ID
   */
  async submitJob(qasmString: string, options: QuantumJobOptions = {}): Promise<string> {
    const backend = options.backend || 'ibmq_qasm_simulator';
    const shots = options.shots || 1024;

    try {
      // Note: This matches the general structure of IBM's Runtime API payload.
      // Specific payload structure may vary based on Qiskit Runtime primitives (Sampler/Estimator).
      const response = await fetch(`${this.baseUrl}/jobs`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          program_id: 'sampler', // Using the standard Sampler primitive
          backend: backend,
          params: {
            circuits: [qasmString],
            run_options: { shots }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`IBM Quantum API Error: ${response.statusText}`);
      }

      const data = await response.json() as { id: string };
      return data.id; // Return the Job ID for tracking
    } catch (error) {
      console.error('Failed to submit quantum job:', error);
      throw error;
    }
  }

  /**
   * Polls the status and results of a submitted quantum job.
   * 
   * @param jobId - The ID returned by submitJob
   */
  async getJobResults(jobId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job ${jobId}: ${response.statusText}`);
      }

      return await response.json() as any[];
    } catch (error) {
      console.error(`Failed to fetch results for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Submits a Bell State (Entanglement) circuit for Wonky Sprouts
   * This creates quantum entanglement between two qubits
   */
  async submitBellStateCircuit(shots: number = 1024): Promise<string> {
    const bellStateQASM = `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
`;
    return this.submitJob(bellStateQASM, { shots });
  }

  /**
   * Submits a Quantum Random Number Generator circuit
   * Uses superposition to generate true quantum randomness
   */
  async submitQRNGCircuit(qubits: number = 8, shots: number = 1): Promise<string> {
    let qasm = `OPENQASM 3.0;\ninclude "qelib1.inc";\n`;
    qasm += `qreg q[${qubits}];\n`;
    qasm += `creg c[${qubits}];\n`;
    
    // Put all qubits in superposition
    for (let i = 0; i < qubits; i++) {
      qasm += `h q[${i}];\n`;
    }
    
    // Measure all qubits
    for (let i = 0; i < qubits; i++) {
      qasm += `measure q[${i}] -> c[${i}];\n`;
    }

    return this.submitJob(qasm, { shots });
  }

  /**
   * Submits a Quantum Teleportation circuit
   * Demonstrates quantum state transfer for advanced protocols
   */
  async submitTeleportationCircuit(shots: number = 1024): Promise<string> {
    const teleportationQASM = `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
// Prepare Bell pair between q[1] and q[2]
h q[1];
cx q[1], q[2];
// Prepare state to teleport on q[0]
h q[0];
// Bell measurement
cx q[0], q[1];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];
// Apply corrections
if (c[1] == 1) x q[2];
if (c[0] == 1) z q[2];
measure q[2] -> c[2];
`;
    return this.submitJob(teleportationQASM, { shots });
  }

  /**
   * Polls job status with timeout
   */
  async pollJobStatus(jobId: string, timeout: number = 300000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.getJobResults(jobId);
        
        if (result.status === 'COMPLETED') {
          return result;
        } else if (result.status === 'ERROR') {
          throw new Error(`Job ${jobId} failed: ${result.error}`);
        }
        
        // Wait before polling again
        await new Promise(resolve => (globalThis as any).setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
        throw error;
      }
    }
    
    throw new Error(`Job ${jobId} timed out after ${timeout}ms`);
  }

  /**
   * Lists available backends
   */
  async listBackends(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/backends`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backends: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to list backends:', error);
      throw error;
    }
  }

  /**
   * Gets backend status
   */
  async getBackendStatus(backendName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/backends/${backendName}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backend ${backendName}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get backend status for ${backendName}:`, error);
      throw error;
    }
  }
}

/**
 * Quantum circuit templates for common operations
 */
export const QuantumCircuits = {
  /**
   * Bell State (Entanglement) Circuit
   */
  bellState: `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
`,

  /**
   * GHZ State Circuit (Multi-qubit entanglement)
   */
  ghzState: (qubits: number = 3) => `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[${qubits}];
creg c[${qubits}];
h q[0];
${Array.from({ length: qubits - 1 }, (_, i) => `cx q[${i}], q[${i + 1}];`).join('\n')}
${Array.from({ length: qubits }, (_, i) => `measure q[${i}] -> c[${i}];`).join('\n')}
`,

  /**
   * Quantum Random Number Generator
   */
  qrng: (qubits: number = 8) => `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[${qubits}];
creg c[${qubits}];
${Array.from({ length: qubits }, (_, i) => `h q[${i}];`).join('\n')}
${Array.from({ length: qubits }, (_, i) => `measure q[${i}] -> c[${i}];`).join('\n')}
`,

  /**
   * Quantum Teleportation
   */
  teleportation: `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
// Prepare Bell pair
h q[1];
cx q[1], q[2];
// Prepare state to teleport
h q[0];
// Bell measurement
cx q[0], q[1];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];
// Apply corrections
if (c[1] == 1) x q[2];
if (c[0] == 1) z q[2];
measure q[2] -> c[2];
`
};

export default IBMQuantumClient;