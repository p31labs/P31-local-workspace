import type { Axis } from '../types/axis.js';
import type { ConvergenceResult, AxisConvergenceStatus, GateCheckResult, ConvergenceBlocker } from '../types/convergence.js';
import type { OrchestrationResult } from '../types/orchestration.js';

export class GateChecker {
  checkAll(axes: Axis[], result: OrchestrationResult): ConvergenceResult {
    const axisStatuses: AxisConvergenceStatus[] = axes.map((axis) => {
      const runResult = result.axes[axis.id];
      const checks: GateCheckResult[] = axis.convergenceGate.checks.map((check) => {
        const passed = runResult?.success ?? false;
        return {
          checkId: check.id,
          passed,
          evidence: passed ? runResult?.filesWritten?.join(', ') : undefined,
          error: passed ? undefined : 'Axis execution failed or files not written',
        };
      });

      const status = checks.every((c) => c.passed) ? 'PASS' : 'FAIL';
      return {
        axisId: axis.id,
        status,
        checks,
        notes: status === 'FAIL' ? `${checks.filter((c) => !c.passed).length} gate(s) failed` : undefined,
      };
    });

    const blockers: ConvergenceBlocker[] = [];
    for (const status of axisStatuses) {
      if (status.status === 'FAIL') {
        blockers.push({
          axisId: status.axisId,
          type: 'quality',
          severity: 'high',
          description: `${status.checks.filter((c) => !c.passed).length} convergence gate(s) failed`,
        });
      }
    }

    return {
      overall: axisStatuses.every((s) => s.status === 'PASS') ? 'PASS' : 'FAIL',
      checkedAt: new Date().toISOString(),
      axes: axisStatuses,
      blockers,
      nextSteps: computeNextSteps(axisStatuses, blockers),
    };
  }
}

function computeNextSteps(statuses: AxisConvergenceStatus[], blockers: ConvergenceBlocker[]): string[] {
  if (statuses.every((s) => s.status === 'PASS')) {
    return ['All axes converged — proceed to merge and deploy'];
  }
  const steps: string[] = [];
  const failedAxes = statuses.filter((s) => s.status === 'FAIL');
  if (failedAxes.length <= 2) {
    steps.push(`Re-run failed axes: ${failedAxes.map((s) => s.axisId).join(', ')}`);
  } else {
    steps.push('More than 2 axes failed — re-decompose problem into smaller axes');
  }
  if (blockers.some((b) => b.type === 'timeout')) {
    steps.push('Increase timeout for affected axes or reduce concurrency');
  }
  return steps;
}

export class ConvergenceReporter {
  formatReport(result: ConvergenceResult, batchId: string): string {
    let report = `## ✅ Convergence Gate — Batch ${batchId}\n\n`;
    report += `**Date:** ${result.checkedAt.split('T')[0]}\n\n`;
    report += `**Overall Convergence:** ${result.overall === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;
    report += '**Axis Status:**\n\n';
    report += '| Axis | Status | Notes |\n';
    report += '|------|--------|-------|\n';
    for (const axis of result.axes) {
      report += `| ${axis.axisId} | ${axis.status === 'PASS' ? '✅' : '❌'} ${axis.status} | ${axis.notes || ''} |\n`;
    }
    if (result.blockers.length > 0) {
      report += '\n**Blockers:**\n\n';
      for (const blocker of result.blockers) {
        report += `- [${blocker.severity?.toUpperCase() || 'HIGH'}] ${blocker.axisId || 'global'}: ${blocker.description}\n`;
      }
    }
    if (result.nextSteps.length > 0) {
      report += '\n**Next Steps:**\n\n';
      for (const step of result.nextSteps) {
        report += `- ${step}\n`;
      }
    }
    return report;
  }
}
