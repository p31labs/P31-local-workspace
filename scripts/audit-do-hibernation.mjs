import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

var WORKERS_DIR = join(import.meta.dirname, '..', 'workers');
var findings = [];

function auditDO(dir) {
  var entries = readdirSync(dir, { withFileTypes: true });
  for (var e of entries) {
    if (!e.isDirectory()) continue;
    var workerDir = join(dir, e.name);
    var files = readdirSync(workerDir);
    for (var f of files) {
      if (!f.endsWith('.ts') && !f.endsWith('.js')) continue;
      var content = readFileSync(join(workerDir, f), 'utf-8');
      
      var hasWebSocket = content.includes('WebSocket') || content.includes('websocket') || content.includes('webSocket');
      var hasHibernationApi = content.includes('state.acceptWebSocket') || content.includes('getWebSockets') || content.includes('Hibernation');
      var hasSetAlarm = content.includes('setAlarm(') || content.includes('.setAlarm(');
      var hasGetAlarmGuard = content.includes('getAlarm');
      var hasOpenConnection = content.includes('fetch(') && !content.includes('ctx.waitUntil');
      
      if (hasWebSocket && !hasHibernationApi) {
        findings.push({ worker: e.name, file: f, issue: 'uses WebSocket without Hibernation API', severity: 'high', savings: 'up to 99% duration cost reduction' });
      }
      if (hasSetAlarm && !hasGetAlarmGuard) {
        findings.push({ worker: e.name, file: f, issue: 'setAlarm() without getAlarm() guard', severity: 'critical', savings: 'prevents $34K alarm loop' });
      }
      if (hasOpenConnection) {
        findings.push({ worker: e.name, file: f, issue: 'potential non-waited async work preventing hibernation', severity: 'medium', savings: 'check ctx.waitUntil usage' });
      }
    }
  }
}

auditDO(WORKERS_DIR);

if (findings.length === 0) {
  console.log('\n✅ All DOs eligible for hibernation. No cost issues found.\n');
  process.exit(0);
}

var critical = findings.filter(function(f) { return f.severity === 'critical'; });
var high = findings.filter(function(f) { return f.severity === 'high'; });
var medium = findings.filter(function(f) { return f.severity === 'medium'; });

console.log('\n🔍 DO Hibernation Audit — ' + findings.length + ' issues found\n');
if (critical.length > 0) {
  console.log('🔴 CRITICAL (' + critical.length + '):');
  critical.forEach(function(f) { console.log('  ' + f.worker + '/' + f.file + ': ' + f.issue); });
}
if (high.length > 0) {
  console.log('\n🟡 HIGH (' + high.length + '):');
  high.forEach(function(f) { console.log('  ' + f.worker + '/' + f.file + ': ' + f.issue + ' — ' + f.savings); });
}
if (medium.length > 0) {
  console.log('\n🟢 MEDIUM (' + medium.length + '):');
  medium.forEach(function(f) { console.log('  ' + f.worker + '/' + f.file + ': ' + f.issue); });
}

console.log('\nHibernation API migration pattern:');
console.log('  // Before: manual WebSocket handling');
console.log('  // After: use state.acceptWebSocket(ws) for automatic hibernation');
console.log('  // https://developers.cloudflare.com/durable-objects/api/hibernatable-websockets/\n');
