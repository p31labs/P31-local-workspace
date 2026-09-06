# P31 Labs Quantum Core

**Post-Quantum Cryptography and Quantum Computing Bridge for P31 Labs Ecosystem**

## Overview

The P31 Labs Quantum Core provides essential tools for transitioning from classical to quantum-resistant cryptography while enabling seamless integration with quantum computing platforms like IBM Quantum.

## Features

### Post-Quantum Cryptography (PQC) Primitives
- **SHA-512 Hashing**: Upgrade from vulnerable SHA-256 to quantum-resistant SHA-512
- **SHAKE256 XOF**: Extendable-output functions for advanced cryptographic applications
- **Quantum-Safe HMAC**: Message authentication with quantum resistance
- **Enhanced PBKDF2**: Password-based key derivation with increased security
- **Quantum-Safe KDF**: Key derivation using quantum-resistant algorithms
- **Content Addressing**: IPFS-compatible quantum-safe content identifiers
- **Integrity Verification**: Timing-safe quantum-resistant data verification

### IBM Quantum Bridge
- **Job Submission**: Submit OpenQASM circuits to IBM Quantum cloud
- **Result Polling**: Monitor and retrieve quantum computation results
- **Backend Management**: List and query available quantum processors
- **Circuit Templates**: Pre-built quantum circuits for common operations
- **Entanglement Generation**: Bell state and GHZ state creation
- **Quantum Random Number Generation**: True quantum randomness
- **Quantum Teleportation**: Advanced quantum state transfer protocols

## Installation

```bash
npm install @p31/quantum-core
```

## Usage

### Post-Quantum Cryptography

```typescript
import { 
  generateQuantumSafeHash, 
  generateQuantumSafeCID,
  verifyQuantumSafeIntegrity 
} from '@p31/quantum-core';

// Replace vulnerable SHA-256 usage
const data = 'sensitive information';
const hash = generateQuantumSafeHash(data);
console.log('Quantum-safe hash:', hash);

// Generate quantum-safe content identifier
const cid = generateQuantumSafeCID(data);
console.log('Quantum-safe CID:', cid);

// Verify data integrity
const isValid = verifyQuantumSafeIntegrity(data, hash);
console.log('Integrity check:', isValid);
```

### IBM Quantum Bridge

```typescript
import { IBMQuantumClient, QuantumCircuits } from '@p31/quantum-core';

// Initialize quantum client
const quantumClient = new IBMQuantumClient(process.env.IBM_QUANTUM_TOKEN);

// Submit a Bell state circuit for Wonky Sprouts
const bellJobId = await quantumClient.submitBellStateCircuit(1024);
console.log('Bell state job submitted:', bellJobId);

// Poll for results
const results = await quantumClient.pollJobStatus(bellJobId);
console.log('Bell state results:', results);

// Submit custom OpenQASM circuit
const customCircuit = QuantumCircuits.bellState;
const jobId = await quantumClient.submitJob(customCircuit, {
  backend: 'ibmq_qasm_simulator',
  shots: 1024
});
```

## Migration Guide

### Phase 1: Replace SHA-256 Usage

**Before (Vulnerable):**
```typescript
import crypto from 'crypto';
const hash = crypto.createHash('sha256').update(data).digest('hex');
```

**After (Quantum-Safe):**
```typescript
import { generateQuantumSafeHash } from '@p31/quantum-core';
const hash = generateQuantumSafeHash(data);
```

### Phase 2: Upgrade HMAC Operations

**Before (Vulnerable):**
```typescript
import crypto from 'crypto';
const hmac = crypto.createHmac('sha256', key).update(data).digest('hex');
```

**After (Quantum-Safe):**
```typescript
import { generateQuantumSafeHMAC } from '@p31/quantum-core';
const hmac = generateQuantumSafeHMAC(key, data);
```

### Phase 3: Implement Quantum Computing

```typescript
import { IBMQuantumClient } from '@p31/quantum-core';

// For Wonky Sprouts entanglement
const quantumClient = new IBMQuantumClient();
const entanglementJob = await quantumClient.submitBellStateCircuit();
```

## Quantum Circuits

### Bell State (Entanglement)
Creates quantum entanglement between two qubits for Wonky Sprouts synchronization.

### GHZ State
Multi-qubit entanglement for advanced quantum protocols.

### Quantum Random Number Generator
Generates true quantum randomness using superposition.

### Quantum Teleportation
Demonstrates quantum state transfer for advanced protocols.

## Environment Variables

```bash
# IBM Quantum API Token
IBM_QUANTUM_TOKEN=your_ibm_quantum_token_here
```

## Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Lint
```bash
npm run lint
```

## Security Considerations

- All cryptographic operations use quantum-resistant algorithms
- Timing-safe comparison functions prevent side-channel attacks
- Increased iteration counts for key derivation functions
- Secure random number generation with quantum entropy

## Integration with P31 Labs Ecosystem

### Wonky Sprouts
- Quantum entanglement for instant synchronization
- Quantum random number generation for game mechanics
- Post-quantum cryptography for data integrity

### Tetrahedron Protocol
- Quantum state verification
- Post-quantum digital signatures
- Quantum-secure communication channels

### Node Zero
- Quantum-resistant authentication
- Post-quantum encryption for data storage
- Quantum random number generation for security

## Contributing

We welcome contributions to the P31 Labs Quantum Core. Please follow our contribution guidelines and ensure all code passes our security and quality standards.

## License

MIT License - See LICENSE file for details.

## Support

For support and questions about quantum integration in P31 Labs projects, please visit our documentation or contact the development team.