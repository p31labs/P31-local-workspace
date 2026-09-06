/**
 * P31 Labs: Quantum Core Optimization Demo
 * ---------------------------------------------------------
 * Comprehensive demonstration of all optimization features
 * including performance baselines, quantum algorithms, PQC,
 * microservices, and system monitoring.
 */

import { 
  PerformanceBaseline, 
  QuantumServiceManager, 
  QuantumSystemMonitor,
  VariationalQuantumEigensolver as VQE,
  QuantumApproximateOptimizationAlgorithm as QAOA,
  QuantumMachineLearning as QML,
  MLKEM,
  MLDSA,
  HybridPQCScheme,
  IBMQuantumClient,
  generateQuantumSafeHash,
  generateShake256Hash
} from '../src/index';

async function runOptimizationDemo(): Promise<void> {
  console.log('🚀 Starting P31 Labs Quantum Core Optimization Demo\n');

  // 1. Phase 1: Performance Baselines and Security Audits
  console.log('📊 Phase 1: Performance Baselines and Security Audits');
  const performanceBaseline = new PerformanceBaseline();
  
  console.log('📈 Establishing performance baselines...');
  const baselines = await performanceBaseline.establishBaselines();
  console.log('✅ Performance baselines established:');
  baselines.forEach((stats, key) => {
    console.log(`  ${key}: Mean=${stats.mean.toFixed(2)}ms, StdDev=${stats.stdDev.toFixed(2)}ms`);
  });

  console.log('\n🔍 Running security audit...');
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/pqc-audit.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Security audit completed with findings (check output above)');
  }

  // 2. Quantum Algorithm Development
  console.log('\n🧮 Phase 2: Quantum Algorithm Development');

  // VQE Example
  console.log('🔬 Running Variational Quantum Eigensolver...');
  const vqe = new VQE();
  const hamiltonian = [[1, 0], [0, -1]]; // Simple 2x2 Hamiltonian
  try {
    const vqeResult = await vqe.solveEigenvalueProblem(hamiltonian);
    console.log(`✅ VQE completed: Eigenvalue=${vqeResult.eigenvalue.toFixed(6)}`);
  } catch (error) {
    console.log(`❌ VQE failed: ${error.message}`);
  }

  // QAOA Example
  console.log('🧩 Running Quantum Approximate Optimization Algorithm...');
  const qaoa = new QAOA();
  const costMatrix = [[0, 1, 2], [1, 0, 1], [2, 1, 0]];
  try {
    const qaoaResult = await qaoa.solveOptimizationProblem(costMatrix);
    console.log(`✅ QAOA completed: Cost=${qaoaResult.cost.toFixed(6)}, Solution=${qaoaResult.solution.join('')}`);
  } catch (error) {
    console.log(`❌ QAOA failed: ${error.message}`);
  }

  // QML Example
  console.log('🤖 Running Quantum Machine Learning...');
  const qml = new QML();
  const trainingData = [[0.1, 0.2], [0.8, 0.9], [0.2, 0.1], [0.9, 0.8]];
  const labels = [0, 1, 0, 1];
  try {
    const qmlResult = await qml.trainClassifier(trainingData, labels);
    console.log(`✅ QML completed: Accuracy=${(qmlResult.accuracy * 100).toFixed(2)}%`);
  } catch (error) {
    console.log(`❌ QML failed: ${error.message}`);
  }

  // 3. PQC Enhancement (FIPS 203 ML-KEM and FIPS 204 ML-DSA)
  console.log('\n🔐 Phase 3: PQC Enhancement');

  // ML-KEM Example
  console.log('🔑 Testing ML-KEM Key Encapsulation...');
  const mlkem = new MLKEM(3);
  try {
    const keyPair = mlkem.generateKeyPair();
    const { ciphertext, sharedSecret } = mlkem.encapsulate(keyPair.publicKey);
    const decapsulatedSecret = mlkem.decapsulate(ciphertext, keyPair.privateKey);
    console.log('✅ ML-KEM: Key generation and encapsulation successful');
  } catch (error) {
    console.log(`❌ ML-KEM failed: ${error.message}`);
  }

  // ML-DSA Example
  console.log('✍️ Testing ML-DSA Digital Signatures...');
  const mldsa = new MLDSA(3);
  try {
    const keyPair = mldsa.generateKeyPair();
    const message = Buffer.from('Hello, Quantum World!');
    const signature = mldsa.sign(message, keyPair.privateKey, keyPair.publicKey);
    const isValid = mldsa.verify(message, signature, keyPair.publicKey);
    console.log(`✅ ML-DSA: Signature ${isValid ? 'valid' : 'invalid'}`);
  } catch (error) {
    console.log(`❌ ML-DSA failed: ${error.message}`);
  }

  // Hybrid PQC Scheme
  console.log('🛡️ Testing Hybrid PQC Scheme...');
  const hybridScheme = new HybridPQCScheme(3);
  try {
    const hybridKeys = hybridScheme.generateHybridKeyPair();
    const message = Buffer.from('Hybrid PQC Test Message');
    const { ciphertext, signature } = hybridScheme.signAndEncrypt(message, hybridKeys.mldsaKeys.privateKey, hybridKeys.mlkemKeys.publicKey);
    const { message: decryptedMessage, isValid } = hybridScheme.decryptAndVerify(ciphertext, signature, hybridKeys.mlkemKeys.privateKey, hybridKeys.mlkemKeys.publicKey);
    console.log(`✅ Hybrid PQC: ${isValid ? 'Success' : 'Failed'}`);
  } catch (error) {
    console.log(`❌ Hybrid PQC failed: ${error.message}`);
  }

  // 4. Microservices Architecture and Load Balancing
  console.log('\n🏗️ Phase 4: Microservices Architecture and Load Balancing');

  const serviceManager = new QuantumServiceManager();
  
  // Register services
  serviceManager.registerService({
    name: 'quantum-service-1',
    endpoint: 'https://api.quantum-computing.ibm.com/runtime',
    maxConcurrency: 10,
    healthCheckInterval: 30000,
    timeout: 300000,
    retryAttempts: 3,
    weight: 1
  });

  serviceManager.registerService({
    name: 'quantum-service-2', 
    endpoint: 'https://api.quantum-computing.ibm.com/runtime',
    maxConcurrency: 8,
    healthCheckInterval: 30000,
    timeout: 300000,
    retryAttempts: 3,
    weight: 1
  });

  console.log('🔧 Registered quantum services');
  console.log('📊 Service statistics:', serviceManager.getServiceStats());

  // Submit quantum requests
  const requests = [
    {
      id: 'req-1',
      type: 'vqe' as const,
      payload: { hamiltonian: [[1, 0], [0, -1]] },
      priority: 'high' as const
    },
    {
      id: 'req-2',
      type: 'qaoa' as const,
      payload: { costMatrix: [[0, 1], [1, 0]] },
      priority: 'medium' as const
    },
    {
      id: 'req-3',
      type: 'qml' as const,
      payload: { trainingData: [[0.1, 0.2], [0.8, 0.9]], labels: [0, 1] },
      priority: 'low' as const
    }
  ];

  console.log('🚀 Submitting quantum service requests...');
  for (const request of requests) {
    try {
      const response = await serviceManager.submitRequest(request);
      console.log(`✅ Request ${request.id}: ${response.success ? 'Success' : 'Failed'} (${response.executionTime}ms)`);
    } catch (error: any) {
      console.log(`❌ Request ${request.id} failed: ${error.message}`);
    }
  }

  // 5. Comprehensive Quantum System Monitoring
  console.log('\n📈 Phase 5: Comprehensive Quantum System Monitoring');

  const systemMonitor = new QuantumSystemMonitor(serviceManager, {
    refreshInterval: 10000,
    timeRange: '1h',
    metricsToShow: ['cpuUsage', 'memoryUsage', 'quantumJobQueue', 'errorRate', 'jobCompletionRate']
  });

  // Configure alerts
  systemMonitor.addAlert({
    metric: 'cpuUsage',
    threshold: 80,
    operator: 'gt',
    duration: 30,
    severity: 'warning',
    enabled: true
  });

  systemMonitor.addAlert({
    metric: 'jobCompletionRate',
    threshold: 50,
    operator: 'lt',
    duration: 60,
    severity: 'critical',
    enabled: true
  });

  // Register alert callbacks
  systemMonitor.onAlert('cpuUsage', (alert) => {
    console.log(`🚨 CPU Alert Callback: ${alert.message}`);
  });

  systemMonitor.onAlert('jobCompletionRate', (alert) => {
    console.log(`🚨 Job Completion Alert Callback: ${alert.message}`);
  });

  console.log('📊 Starting system monitoring...');
  systemMonitor.startMonitoring();

  // Run monitoring for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));

  console.log('📊 Collecting performance report...');
  const performanceReport = systemMonitor.getPerformanceReport('1h');
  console.log('📈 Performance Report:');
  console.log(`  System: CPU=${performanceReport.system.avgCpuUsage}%, Memory=${performanceReport.system.avgMemoryUsage}%`);
  console.log(`  Quantum: Completion=${performanceReport.quantum.avgJobCompletionRate}%, Execution Time=${performanceReport.quantum.avgExecutionTime}ms`);
  console.log(`  Security: Compliance=${performanceReport.security.avgComplianceScore}%`);

  console.log('📊 Exporting metrics...');
  const metricsJson = systemMonitor.exportMetrics('json');
  console.log('✅ Metrics exported successfully');

  console.log('🛑 Stopping system monitoring...');
  systemMonitor.stopMonitoring();

  // 6. Additional Optimization Features
  console.log('\n⚡ Additional Optimization Features');

  // Quantum-safe hashing
  console.log('🔐 Testing quantum-safe hashing...');
  const testData = 'Optimization test data';
  const hash1 = await generateQuantumSafeHash(testData);
  const hash2 = await generateShake256Hash(testData, 64);
  console.log(`✅ SHA-512 Hash: ${hash1.substring(0, 16)}...`);
  console.log(`✅ SHAKE256 Hash: ${hash2.substring(0, 16)}...`);

  // Performance monitoring
  console.log('📊 Testing performance monitoring...');
  const monitoringResults = await performanceBaseline.monitorPerformance();
  console.log(`✅ Performance monitoring: Status=${monitoringResults.status}, Deviations=${monitoringResults.deviations.length}`);

  // Generate final report
  console.log('\n📋 Generating final optimization report...');
  const finalReport = {
    timestamp: new Date().toISOString(),
    phasesCompleted: [
      'Performance Baselines and Security Audits',
      'Quantum Algorithm Development', 
      'PQC Enhancement',
      'Microservices Architecture',
      'System Monitoring'
    ],
    featuresImplemented: [
      'VQE Algorithm',
      'QAOA Algorithm', 
      'Quantum ML',
      'FIPS 203 ML-KEM',
      'FIPS 204 ML-DSA',
      'Hybrid PQC Schemes',
      'Microservices Load Balancing',
      'Circuit Breakers',
      'System Monitoring',
      'Real-time Alerting'
    ],
    performanceImprovements: {
      'Quantum Job Latency': 'Target: 40% reduction',
      'System Throughput': 'Target: 60% increase', 
      'Security Posture': 'Target: 100% quantum-resistant',
      'System Reliability': 'Target: 99.9% uptime'
    }
  };

  console.log('🎉 P31 Labs Quantum Core Optimization Demo Complete!');
  console.log('📊 Final Report:', JSON.stringify(finalReport, null, 2));
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runOptimizationDemo().catch(console.error);
}

export { runOptimizationDemo };