/**
 * P31 Labs: Quantum System Monitor
 * ---------------------------------------------------------
 * Comprehensive monitoring and observability for quantum computing systems.
 * Provides real-time metrics, alerting, and performance analysis.
 */

import { PerformanceBaseline } from '../optimization/performanceBaseline';
import { QuantumServiceManager } from '../microservices/quantumServiceManager';
import { MLKEM, MLDSA, HybridPQCScheme } from '../pqc/fips203-204';

export interface SystemMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  quantumJobQueue: number;
  activeConnections: number;
  errorRate: number;
  throughput: number;
}

export interface QuantumMetrics {
  timestamp: string;
  backendAvailability: Record<string, boolean>;
  jobCompletionRate: number;
  averageExecutionTime: number;
  circuitComplexityDistribution: Record<string, number>;
  errorRateByBackend: Record<string, number>;
  resourceUtilization: Record<string, number>;
}

export interface SecurityMetrics {
  timestamp: string;
  authenticationAttempts: number;
  failedAuthentications: number;
  quantumKeyRotations: number;
  pqsAlgorithmUsage: Record<string, number>;
  securityIncidents: number;
  complianceScore: number;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  duration: number; // seconds
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
}

export interface DashboardConfig {
  refreshInterval: number;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  metricsToShow: string[];
  alertThresholds: AlertConfig[];
}

export class QuantumSystemMonitor {
  private performanceBaseline: PerformanceBaseline;
  private serviceManager: QuantumServiceManager;
  private metricsHistory: SystemMetrics[] = [];
  private quantumMetricsHistory: QuantumMetrics[] = [];
  private securityMetricsHistory: SecurityMetrics[] = [];
  private alerts: AlertConfig[] = [];
  private dashboardConfig: DashboardConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: Map<string, (alert: any) => void> = new Map();

  constructor(serviceManager: QuantumServiceManager, config?: Partial<DashboardConfig>) {
    this.serviceManager = serviceManager;
    this.performanceBaseline = new PerformanceBaseline();
    this.dashboardConfig = {
      refreshInterval: 30000, // 30 seconds
      timeRange: '1h',
      metricsToShow: ['cpuUsage', 'memoryUsage', 'quantumJobQueue', 'errorRate'],
      alertThresholds: [],
      ...config
    };
  }

  /**
   * Start monitoring system
   */
  startMonitoring(): void {
    console.log('📊 Starting quantum system monitoring...');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.updateDashboard();
    }, this.dashboardConfig.refreshInterval);

    // Initial metrics collection
    this.collectMetrics();
  }

  /**
   * Stop monitoring system
   */
  stopMonitoring(): void {
    console.log('🛑 Stopping quantum system monitoring...');
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Collect all system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const systemMetrics = await this.collectSystemMetrics();
      const quantumMetrics = await this.collectQuantumMetrics();
      const securityMetrics = await this.collectSecurityMetrics();

      this.metricsHistory.push(systemMetrics);
      this.quantumMetricsHistory.push(quantumMetrics);
      this.securityMetricsHistory.push(securityMetrics);

      // Keep only last 24 hours of metrics
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.metricsHistory = this.metricsHistory.filter(m => new Date(m.timestamp) > cutoff);
      this.quantumMetricsHistory = this.quantumMetricsHistory.filter(m => new Date(m.timestamp) > cutoff);
      this.securityMetricsHistory = this.securityMetricsHistory.filter(m => new Date(m.timestamp) > cutoff);

      console.log(`📈 Collected metrics: System=${systemMetrics.cpuUsage.toFixed(2)}%, Quantum=${quantumMetrics.jobCompletionRate.toFixed(2)}%, Security=${securityMetrics.complianceScore.toFixed(2)}%`);
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Collect system-level metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    // Simulate system metrics collection
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const diskUsage = Math.random() * 100;
    const networkLatency = Math.random() * 100;
    const quantumJobQueue = Math.floor(Math.random() * 100);
    const activeConnections = Math.floor(Math.random() * 50);
    const errorRate = Math.random() * 10;
    const throughput = Math.random() * 1000;

    return {
      timestamp: new Date().toISOString(),
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkLatency,
      quantumJobQueue,
      activeConnections,
      errorRate,
      throughput
    };
  }

  /**
   * Collect quantum-specific metrics
   */
  private async collectQuantumMetrics(): Promise<QuantumMetrics> {
    const serviceStats = this.serviceManager.getServiceStats();
    const loadBalancingMetrics = this.serviceManager.getLoadBalancingMetrics();

    // Simulate quantum metrics
    const backendAvailability = {
      'ibmq_qasm_simulator': Math.random() > 0.1,
      'ibmq_quito': Math.random() > 0.2,
      'ibmq_belem': Math.random() > 0.15
    };

    const jobCompletionRate = Math.random() * 100;
    const averageExecutionTime = Math.random() * 300000; // 5 minutes max
    const circuitComplexityDistribution = {
      'simple': Math.floor(Math.random() * 50),
      'medium': Math.floor(Math.random() * 30),
      'complex': Math.floor(Math.random() * 20)
    };
    const errorRateByBackend = {
      'ibmq_qasm_simulator': Math.random() * 5,
      'ibmq_quito': Math.random() * 10,
      'ibmq_belem': Math.random() * 8
    };
    const resourceUtilization = {
      'cpu': Math.random() * 100,
      'memory': Math.random() * 100,
      'network': Math.random() * 100
    };

    return {
      timestamp: new Date().toISOString(),
      backendAvailability,
      jobCompletionRate,
      averageExecutionTime,
      circuitComplexityDistribution,
      errorRateByBackend,
      resourceUtilization
    };
  }

  /**
   * Collect security metrics
   */
  private async collectSecurityMetrics(): Promise<SecurityMetrics> {
    // Simulate security metrics
    const authenticationAttempts = Math.floor(Math.random() * 100);
    const failedAuthentications = Math.floor(Math.random() * 10);
    const quantumKeyRotations = Math.floor(Math.random() * 5);
    const pqsAlgorithmUsage = {
      'ML-KEM': Math.floor(Math.random() * 50),
      'ML-DSA': Math.floor(Math.random() * 30),
      'Hybrid': Math.floor(Math.random() * 20)
    };
    const securityIncidents = Math.floor(Math.random() * 3);
    const complianceScore = Math.random() * 100;

    return {
      timestamp: new Date().toISOString(),
      authenticationAttempts,
      failedAuthentications,
      quantumKeyRotations,
      pqsAlgorithmUsage,
      securityIncidents,
      complianceScore
    };
  }

  /**
   * Check alert conditions
   */
  private checkAlerts(): void {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const latestQuantumMetrics = this.quantumMetricsHistory[this.quantumMetricsHistory.length - 1];
    const latestSecurityMetrics = this.securityMetricsHistory[this.securityMetricsHistory.length - 1];

    if (!latestMetrics || !latestQuantumMetrics || !latestSecurityMetrics) {
      return;
    }

    this.alerts.forEach(alert => {
      let value: number;

      switch (alert.metric) {
        case 'cpuUsage':
          value = latestMetrics.cpuUsage;
          break;
        case 'memoryUsage':
          value = latestMetrics.memoryUsage;
          break;
        case 'quantumJobQueue':
          value = latestMetrics.quantumJobQueue;
          break;
        case 'errorRate':
          value = latestMetrics.errorRate;
          break;
        case 'jobCompletionRate':
          value = latestQuantumMetrics.jobCompletionRate;
          break;
        case 'securityIncidents':
          value = latestSecurityMetrics.securityIncidents;
          break;
        case 'complianceScore':
          value = latestSecurityMetrics.complianceScore;
          break;
        default:
          return;
      }

      const conditionMet = this.evaluateCondition(value, alert.operator, alert.threshold);

      if (conditionMet) {
        this.triggerAlert(alert, value);
      }
    });
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(alert: AlertConfig, currentValue: number): void {
    const alertData = {
      id: `alert_${Date.now()}`,
      timestamp: new Date().toISOString(),
      metric: alert.metric,
      currentValue,
      threshold: alert.threshold,
      operator: alert.operator,
      severity: alert.severity,
      message: `${alert.metric} alert: ${currentValue} ${alert.operator} ${alert.threshold}`
    };

    console.log(`🚨 ${alert.severity.toUpperCase()} Alert: ${alertData.message}`);

    // Call registered alert callbacks
    const callback = this.alertCallbacks.get(alert.metric);
    if (callback) {
      callback(alertData);
    }
  }

  /**
   * Update dashboard data
   */
  private updateDashboard(): void {
    // In a real implementation, this would update a web dashboard
    // For now, we'll just log the current state
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const latestQuantumMetrics = this.quantumMetricsHistory[this.quantumMetricsHistory.length - 1];
    const latestSecurityMetrics = this.securityMetricsHistory[this.securityMetricsHistory.length - 1];

    if (latestMetrics && latestQuantumMetrics && latestSecurityMetrics) {
      console.log(`📊 Dashboard Update:`);
      console.log(`  System: CPU=${latestMetrics.cpuUsage.toFixed(1)}%, Memory=${latestMetrics.memoryUsage.toFixed(1)}%`);
      console.log(`  Quantum: Completion=${latestQuantumMetrics.jobCompletionRate.toFixed(1)}%, Queue=${latestMetrics.quantumJobQueue}`);
      console.log(`  Security: Incidents=${latestSecurityMetrics.securityIncidents}, Compliance=${latestSecurityMetrics.complianceScore.toFixed(1)}%`);
    }
  }

  /**
   * Add alert configuration
   */
  addAlert(alert: AlertConfig): void {
    this.alerts.push(alert);
    console.log(`🔔 Added alert for ${alert.metric} (${alert.operator} ${alert.threshold})`);
  }

  /**
   * Remove alert configuration
   */
  removeAlert(metric: string): void {
    this.alerts = this.alerts.filter(alert => alert.metric !== metric);
    console.log(`🔕 Removed alert for ${metric}`);
  }

  /**
   * Register alert callback
   */
  onAlert(metric: string, callback: (alert: any) => void): void {
    this.alertCallbacks.set(metric, callback);
    console.log(`📞 Registered alert callback for ${metric}`);
  }

  /**
   * Get performance report
   */
  getPerformanceReport(timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '1h'): Record<string, any> {
    const cutoff = this.getTimeRangeCutoff(timeRange);
    const filteredMetrics = this.metricsHistory.filter(m => new Date(m.timestamp) > cutoff);
    const filteredQuantumMetrics = this.quantumMetricsHistory.filter(m => new Date(m.timestamp) > cutoff);
    const filteredSecurityMetrics = this.securityMetricsHistory.filter(m => new Date(m.timestamp) > cutoff);

    const avgCpuUsage = filteredMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / filteredMetrics.length;
    const avgMemoryUsage = filteredMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / filteredMetrics.length;
    const avgJobCompletionRate = filteredQuantumMetrics.reduce((sum, m) => sum + m.jobCompletionRate, 0) / filteredQuantumMetrics.length;
    const avgComplianceScore = filteredSecurityMetrics.reduce((sum, m) => sum + m.complianceScore, 0) / filteredSecurityMetrics.length;

    return {
      timeRange,
      system: {
        avgCpuUsage: avgCpuUsage.toFixed(2),
        avgMemoryUsage: avgMemoryUsage.toFixed(2),
        avgErrorRate: (filteredMetrics.reduce((sum, m) => sum + m.errorRate, 0) / filteredMetrics.length).toFixed(2),
        avgThroughput: (filteredMetrics.reduce((sum, m) => sum + m.throughput, 0) / filteredMetrics.length).toFixed(2)
      },
      quantum: {
        avgJobCompletionRate: avgJobCompletionRate.toFixed(2),
        avgExecutionTime: (filteredQuantumMetrics.reduce((sum, m) => sum + m.averageExecutionTime, 0) / filteredQuantumMetrics.length).toFixed(2),
        avgErrorRate: Object.values(filteredQuantumMetrics.reduce((acc, m) => {
          Object.entries(m.errorRateByBackend).forEach(([backend, rate]) => {
            acc[backend] = (acc[backend] || 0) + rate;
          });
          return acc;
        }, {} as Record<string, number>)).reduce((sum, rate) => sum + rate, 0) / Object.keys(filteredQuantumMetrics[0]?.errorRateByBackend || {}).length
      },
      security: {
        avgComplianceScore: avgComplianceScore.toFixed(2),
        totalIncidents: filteredSecurityMetrics.reduce((sum, m) => sum + m.securityIncidents, 0),
        avgAuthAttempts: (filteredSecurityMetrics.reduce((sum, m) => sum + m.authenticationAttempts, 0) / filteredSecurityMetrics.length).toFixed(2)
      }
    };
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): { system: SystemMetrics; quantum: QuantumMetrics; security: SecurityMetrics } {
    return {
      system: this.metricsHistory[this.metricsHistory.length - 1],
      quantum: this.quantumMetricsHistory[this.quantumMetricsHistory.length - 1],
      security: this.securityMetricsHistory[this.securityMetricsHistory.length - 1]
    };
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      systemMetrics: this.metricsHistory,
      quantumMetrics: this.quantumMetricsHistory,
      securityMetrics: this.securityMetricsHistory,
      alerts: this.alerts,
      dashboardConfig: this.dashboardConfig
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for system metrics
      const headers = ['timestamp', 'cpuUsage', 'memoryUsage', 'diskUsage', 'networkLatency', 'quantumJobQueue', 'activeConnections', 'errorRate', 'throughput'];
      const rows = this.metricsHistory.map(m => headers.map(h => m[h as keyof SystemMetrics]).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
  }

  /**
   * Get time range cutoff date
   */
  private getTimeRangeCutoff(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 60 * 60 * 1000);
    }
  }

  /**
   * Health check for monitoring system
   */
  getHealthStatus(): { status: string; lastUpdate: string; activeAlerts: number; systemLoad: string } {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const systemLoad = latestMetrics ? 
      latestMetrics.cpuUsage > 80 ? 'HIGH' : 
      latestMetrics.cpuUsage > 50 ? 'MEDIUM' : 'LOW' : 'UNKNOWN';

    const activeAlerts = this.alerts.filter(alert => {
      const latest = this.metricsHistory[this.metricsHistory.length - 1];
      if (!latest) return false;
      const metricValue = latest[alert.metric as keyof SystemMetrics];
      const numValue = typeof metricValue === 'number' ? metricValue : Number(metricValue) || 0;
      return this.evaluateCondition(numValue, alert.operator, alert.threshold);
    }).length;

    return {
      status: this.monitoringInterval ? 'HEALTHY' : 'STOPPED',
      lastUpdate: latestMetrics?.timestamp || 'Never',
      activeAlerts,
      systemLoad
    };
  }
}

export default QuantumSystemMonitor;