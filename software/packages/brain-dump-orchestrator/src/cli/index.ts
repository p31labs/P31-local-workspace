import { Command } from 'commander';
import fs from 'fs';
import { captureInteractive } from '../brain-dump/capture.js';
import { parseMarkdownToBrainDump, parseJsonToBrainDump } from '../brain-dump/index.js';
import { decomposeBrainDump } from '../decomposition/index.js';
import { formatAxesAsMarkdown, formatAxesAsJson, formatAxesDetail } from '../decomposition/formatters.js';
import { BrainDumpOrchestrator, createStatusTracker } from '../orchestration/index.js';
import { GateChecker, ConvergenceReporter } from '../convergence/index.js';
import { SignalEmitter } from '../jitterbug/index.js';

const program = new Command();

program
  .name('brain-dump')
  .description('Jitterbug Quantum Brain Dump orchestrator')
  .version('0.1.0-alpha.0');

program
  .command('capture')
  .description('Capture a brain dump interactively or from file')
  .option('-f, --file <path>', 'Parse existing markdown file instead of interactive')
  .option('-o, --output <path>', 'Output file path', './brain-dump.md')
  .option('--operator <name>', 'Operator name', 'operator')
  .action(async (opts: any) => {
    let bd;
    if (opts.file) {
      const content = fs.readFileSync(opts.file, 'utf-8');
      bd = parseMarkdownToBrainDump(content, opts.operator);
    } else {
      bd = await captureInteractive(opts.operator);
    }
    fs.writeFileSync(opts.output, formatBrainDumpAsMarkdown(bd));
    console.log(`Brain dump written to ${opts.output}`);
  });

program
  .command('decompose')
  .description('Decompose brain dump into parallel axes')
  .argument('<file>', 'Brain dump markdown file')
  .option('-o, --output <path>', 'Output file path', './axes.md')
  .option('--format <type>', 'Output format: markdown or json', 'markdown')
  .action(async (file: string, opts: any) => {
    const content = fs.readFileSync(file, 'utf-8');
    const bd = parseMarkdownToBrainDump(content, 'operator');
    const axes = decomposeBrainDump(bd);
    const output = opts.format === 'json' ? formatAxesAsJson(axes) : formatAxesAsMarkdown(axes) + '\n\n' + formatAxesDetail(axes);
    fs.writeFileSync(opts.output, output);
    console.log(`Decomposed ${axes.length} axes → ${opts.output}`);
  });

program
  .command('run')
  .description('Run all axes in parallel')
  .argument('<axesFile>', 'Axes markdown or json file')
  .option('-c, --concurrency <n>', 'Max parallel agents', '4')
  .option('--adapter <type>', 'Agent runtime: claude-code, cortex-do, llm-generic', 'claude-code')
  .option('--timeout <ms>', 'Per-axis timeout ms', '300000')
  .option('-v, --verbose', 'Show real-time axis status updates', false)
  .action(async (axesFile: string, opts: any) => {
    const content = fs.readFileSync(axesFile, 'utf-8');
    const axes = parseAxesFromMarkdown(content);
    const batchId = `batch-${Date.now()}`;

    const orchestrator = new BrainDumpOrchestrator({
      batchId,
      axes: axes.map((axis: any) => ({
        axisId: axis.id,
        adapter: opts.adapter,
        priority: 0,
        timeoutMs: parseInt(opts.timeout),
      })),
      maxConcurrency: parseInt(opts.concurrency),
      retryPolicy: { maxRetries: 2, backoffMs: 1000, retryableErrors: ['timeout', 'stub'] },
      statusTracker: opts.verbose ? 'in-memory' : undefined,
    });

    console.log(`Launching ${axes.length} axes (concurrency=${opts.concurrency})...`);

    const statuses = new Map<string, string>();

    if (opts.verbose) {
      const interval = setInterval(() => {
        for (const status of orchestrator.getAllStatuses()) {
          const prev = statuses.get(status.axisId);
          if (prev !== status.status) {
            statuses.set(status.axisId, status.status);
            const icon = status.status === 'completed' ? '✅' : status.status === 'failed' ? '❌' : status.status === 'running' ? '🔄' : '⏳';
            console.log(`  ${icon} ${status.axisId}: ${status.status}${status.message ? ` — ${status.message}` : ''}`);
          }
        }
      }, 500);
      // Clear interval on exit
      process.on('exit', () => clearInterval(interval));
    }

    const result = await orchestrator.runAll();

    if (opts.verbose) {
      // final clear
      for (const [id, run] of Object.entries(result.axes)) {
        const prev = statuses.get(id);
        if (prev !== (run.success ? 'completed' : 'failed')) {
          console.log(`  ${run.success ? '✅' : '❌'} ${id}: ${run.statusLine}`);
        }
      }
    } else {
      console.log(`\nOverall: ${result.overallStatus}`);
      for (const [id, run] of Object.entries(result.axes)) {
        console.log(`  ${run.success ? '✅' : '❌'} ${id}: ${run.statusLine}`);
      }
    }
  });

program
  .command('resume')
  .description('Resume only failed axes from a previous batch')
  .argument('<batchId>', 'Batch ID from a previous run')
  .option('-v, --verbose', 'Show real-time axis status updates', false)
  .action(async (batchId: string, opts: any) => {
    const orchestrator = new BrainDumpOrchestrator({
      batchId,
      axes: [], // Axes state is preserved in tracker
      maxConcurrency: 4,
      retryPolicy: { maxRetries: 2, backoffMs: 1000, retryableErrors: ['timeout', 'stub'] },
      statusTracker: opts.verbose ? 'in-memory' : undefined,
    });

    console.log(`Resuming failed axes for batch ${batchId}...`);
    const result = await orchestrator.resumeFailed();
    console.log(`\nOverall: ${result.overallStatus}`);
    for (const [id, run] of Object.entries(result.axes)) {
      console.log(`  ${run.success ? '✅' : '❌'} ${id}: ${run.statusLine}`);
    }
  });

program
  .command('converge')
  .description('Run convergence gate check')
  .argument('<axesFile>', 'Axes file')
  .option('--result <json>', 'Orchestration result JSON')
  .option('--rollback', 'Auto-refactor failed axes', false)
  .action(async (axesFile: string, opts: any) => {
    const content = fs.readFileSync(axesFile, 'utf-8');
    const axes = parseAxesFromMarkdown(content);
    const result = JSON.parse(opts.result || '{}');
    const checker = new GateChecker();
    const convergence = checker.checkAll(axes, result);
    const reporter = new ConvergenceReporter();
    console.log(reporter.formatReport(convergence, axesFile));
    if (convergence.overall === 'FAIL' && opts.rollback) {
      console.log('\n⚠️  Rollback mode enabled — re-run failed axes with focused feedback');
    }
  });

program
  .command('status')
  .description('Show axis statuses')
  .argument('<batchId>', 'Batch ID from run command')
   .action(async (batchId: string) => {
     const tracker = createStatusTracker('in-memory');
    const entries = await tracker.read(batchId);
    if (entries.length === 0) {
      console.log('No status entries found for', batchId);
      return;
    }
    for (const entry of entries) {
      console.log(`[${entry.status}] ${entry.axisId}: ${entry.message || ''}`);
    }
  });

function formatBrainDumpAsMarkdown(bd: any): string {
  let md = `# 🧠 Brain Dump – ${bd.projectName}\n\n`;
  md += `### 1.1 The Core Problem / Opportunity\n${bd.coreProblem}\n\n`;
  md += '### 1.2 Current State (What exists today)\n\n';
  if (bd.currentState) {
    if (bd.currentState.artifacts?.length) {
      md += '**Artifacts:**\n';
      for (const a of bd.currentState.artifacts) md += `- ${a.path}: ${a.description} (${a.status})\n`;
      md += '\n';
    }
    if (bd.currentState.gaps?.length) {
      md += '**Gaps:**\n';
      for (const g of bd.currentState.gaps) md += `- ${g.description} (${g.severity})\n`;
      md += '\n';
    }
    if (bd.currentState.blockers?.length) {
      md += '**Blockers:**\n';
      for (const b of bd.currentState.blockers) md += `- ${b.description} [${b.type}]\n`;
      md += '\n';
    }
  }
  md += '### 1.3 Constraints & Non-Negotiables\n\n';
  for (const c of bd.constraints) md += `- ${c.rule} [${c.severity}]\n`;
  md += '\n### 1.4 Desired End State (The "FRUIT" / Convergence Target)\n\n';
  md += `${bd.desiredEndState?.description || 'Not specified'}\n`;
  md += `Target: ${bd.desiredEndState?.targetStage || 'unknown'}\n\n`;
  md += '### 1.5 Known Assets (What we already have)\n\n';
  for (const a of bd.knownAssets) md += `- ${a.name}: ${a.description}\n`;
  md += '\n### 1.6 Open Questions / Unknowns\n\n';
  for (const q of bd.openQuestions) md += `- [${q.priority}] ${q.id}: ${q.question}\n`;
  return md;
}

function parseAxesFromMarkdown(content: string): any[] {
  const axes: any[] = [];
  const lines = content.split('\n');
  let currentAxis: any = null;
  for (const line of lines) {
    const axisMatch = line.match(/^\|\s*([A-Za-z])\s*\|/);
    if (axisMatch) {
      if (currentAxis) axes.push(currentAxis);
      currentAxis = {
        id: `axis-${axisMatch[1].toLowerCase()}`,
        letter: axisMatch[1].toUpperCase(),
        name: axisMatch[1].toUpperCase(),
        focusArea: '',
        agentRole: '',
        deliverable: [],
        convergenceGate: { checks: [] },
        complexity: 'medium',
        dependencies: [],
        status: 'pending',
      };
    }
  }
  if (currentAxis) axes.push(currentAxis);
  if (axes.length === 0 && content.includes('| Axis |')) {
    const tableLines = lines.filter(l => l.startsWith('|') && !l.includes('---'));
    for (const line of tableLines) {
      const parts = line.split('|').map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 4) {
        axes.push({
          id: `axis-${parts[0].toLowerCase()}`,
          letter: parts[0].toUpperCase(),
          name: parts[0].toUpperCase(),
          focusArea: parts[1],
          agentRole: parts[2],
          deliverable: [],
          convergenceGate: { checks: [] },
          complexity: 'medium',
          dependencies: [],
          status: 'pending',
        });
      }
    }
  }
  return axes;
}

program.parse();
