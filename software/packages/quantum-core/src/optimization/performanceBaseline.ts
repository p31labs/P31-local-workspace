/**
 * P31 Labs: Quantum Performance Baseline System
 * ---------------------------------------------------------
 * Establishes performance baselines for quantum computing operations
 * and provides comprehensive monitoring capabilities.
 */

import { IBMQuantumClient, QuantumJobOptions } from '../ibmQuantumBridge';
import { generateQuantumSafeHash } from '../pqcPrimitives';

export interface PerformanceMetrics {
  timestamp: string;
  operation: string;
  duration: number;
  backend: string;
  shots: number;
  circuitComplexity: number;
  success: boolean;
  error?: string;
}

export interface BaselineConfig {
  measurementPeriod: number; // milliseconds
  sampleSize: number;
  warmupRuns: number;
  backends: string[];
  circuitTypes: string[];
}

export class PerformanceBaseline {
  private client: IBMQuantumClient;
  private metrics: PerformanceMetrics[] = [];
  private baselineData: Map<string, number[]> = new Map();
  private config: BaselineConfig;

  constructor(apiToken?: string, config?: Partial<BaselineConfig>) {
    this.client = new IBMQuantumClient(apiToken);
    this.config = {
      measurementPeriod: 60000, // 1 minute
      sampleSize: 10,
      warmupRuns: 3,
      backends: ['ibmq_qasm_simulator', 'ibmq_quito', 'ibmq_belem'],
      circuitTypes: ['bell', 'qrng', 'teleportation'],
      ...config
    };
  }

  /**
   * Establish performance baselines for all quantum operations
   */
  async establishBaselines(): Promise<Map<string, { mean: number; stdDev: number; min: number; max: number }>> {
    console.log('🚀 Establishing quantum performance baselines...');
    
    const results = new Map<string, number[]>();

    for (const backend of this.config.backends) {
      for (const circuitType of this.config.circuitTypes) {
        const key = `${backend}_${circuitType}`;
        const measurements: number[] = [];

        console.log(`📊 Measuring ${circuitType} on ${backend}...`);

        // Warmup runs
        for (let i = 0; i < this.config.warmupRuns; i++) {
          await this.measureCircuitPerformance(circuitType, backend, 1024);
        }

        // Actual measurements
        for (let i = 0; i < this.config.sampleSize; i++) {
          const duration = await this.measureCircuitPerformance(circuitType, backend, 1024);
          measurements.push(duration);
          
          // Wait between measurements to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        results.set(key, measurements);
        this.baselineData.set(key, measurements);
      }
    }

    // Calculate statistics
    const statistics = new Map<string, { mean: number; stdDev: number; min: number; max: number }>();
    results.forEach((measurements, key) => {
      const stats = this.calculateStatistics(measurements);
      statistics.set(key, stats);
    });

    console.log('✅ Performance baselines established');
    return statistics;
  }

  /**
   * Measure circuit performance and return duration in milliseconds
   */
  private async measureCircuitPerformance(circuitType: string, backend: string, shots: number): Promise<number> {
    const startTime = Date.now();

    try {
      let circuit: string;

      switch (circuitType) {
        case 'bell':
          circuit = `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
`;
          break;
        case 'qrng':
          circuit = `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[8];
creg c[8];
h q[0];
h q[1];
h q[2];
h q[3];
h q[4];
h q[5];
h q[6];
h q[7];
measure q[0] -> c[0];
measure q[1] -> c[1];
measure q[2] -> c[2];
measure q[3] -> c[3];
measure q[4] -> c[4];
measure q[5] -> c[5];
measure q[6] -> c[6];
measure q[7] -> c[7];
`;
          break;
        case 'teleportation':
          circuit = `
OPENQASM 3.0;
include "qelib1.inc";
qreg q[3];
creg c[3];
h q[1];
cx q[1], q[2];
h q[0];
cx q[0], q[1];
h q[0];
measure q[0] -> c[0];
measure q[1] -> c[1];
if (c[1] == 1) x q[2];
if (c[0] == 1) z q[2];
measure q[2] -> c[2];
`;
          break;
        default:
          throw new Error(`Unknown circuit type: ${circuitType}`);
      }

      const options: QuantumJobOptions = {
        backend,
        shots
      };

      const jobId = await this.client.submitJob(circuit, options);
      const result = await this.client.pollJobStatus(jobId, 300000); // 5 minute timeout

      const duration = Date.now() - startTime;

      const metric: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        operation: `quantum_${circuitType}`,
        duration,
        backend,
        shots,
        circuitComplexity: this.calculateCircuitComplexity(circuit),
        success: result.status === 'COMPLETED'
      };

      this.metrics.push(metric);
      return duration;

    } catch (error) {
      const duration = Date.now() - startTime;
      const metric: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        operation: `quantum_${circuitType}`,
        duration,
        backend,
        shots,
        circuitComplexity: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.metrics.push(metric);
      throw error;
    }
  }

  /**
   * Calculate circuit complexity based on gate count
   */
  private calculateCircuitComplexity(circuit: string): number {
    const gates = ['h', 'cx', 'cz', 'x', 'y', 'z', 'rx', 'ry', 'rz', 'u1', 'u2', 'u3'];
    let complexity = 0;

    gates.forEach(gate => {
      const regex = new RegExp(`\\b${gate}\\b`, 'g');
      const matches = circuit.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Calculate statistical measures for performance data
   */
  private calculateStatistics(data: number[]): { mean: number; stdDev: number; min: number; max: number } {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);

    return { mean, stdDev, min, max };
  }

  /**
   * Monitor current performance against baselines
   */
  async monitorPerformance(): Promise<{ status: string; deviations: any[] }> {
    const deviations: any[] = [];
    const currentMetrics = new Map<string, number>();

    // Collect current performance data
    for (const backend of this.config.backends) {
      for (const circuitType of this.config.circuitTypes) {
        const key = `${backend}_${circuitType}`;
        const duration = await this.measureCircuitPerformance(circuitType, backend, 1024);
        currentMetrics.set(key, duration);
      }
    }

    // Compare against baselines
    this.baselineData.forEach((baseline, key) => {
      const current = currentMetrics.get(key);
      if (current) {
        const stats = this.calculateStatistics(baseline);
        const deviation = (current - stats.mean) / stats.stdDev;

        if (Math.abs(deviation) > 2) { // 2 standard deviations threshold
          deviations.push({
            key,
            current,
            baseline: stats.mean,
            deviation,
            status: Math.abs(deviation) > 3 ? 'CRITICAL' : 'WARNING'
          });
        }
      }
    });

    const status = deviations.length === 0 ? 'HEALTHY' : 
                   deviations.some(d => d.status === 'CRITICAL') ? 'CRITICAL' : 'WARNING';

    return { status, deviations };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalMeasurements: this.metrics.length,
      successfulMeasurements: this.metrics.filter(m => m.success).length,
      failedMeasurements: this.metrics.filter(m => !m.success).length,
      averageDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
      baselineData: Object.fromEntries(this.baselineData),
      recentMetrics: this.metrics.slice(-20) // Last 20 measurements
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

export default PerformanceBaseline;