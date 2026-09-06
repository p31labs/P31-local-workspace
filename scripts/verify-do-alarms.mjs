import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const WORKERS_DIR = join(import.meta.dirname, '..', 'workers');
const errors = [];

function auditDirectory(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const workerDir = join(dir, entry.name);
    const files = readdirSync(workerDir);
    
    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
      const content = readFileSync(join(workerDir, file), 'utf-8');
      
      const setAlarmMatches = content.match(/\.setAlarm\(/g);
      const getAlarmMatches = content.match(/\.getAlarm\(\)/g);
      
      if (setAlarmMatches && (!getAlarmMatches || getAlarmMatches.length < setAlarmMatches.length)) {
        errors.push(`${entry.name}/${file}: setAlarm() found without matching getAlarm() guard`);
      }
      
      if (content.includes('setAlarm(') && content.includes('onStart') && !content.includes('getAlarm()')) {
        errors.push(`${entry.name}/${file}: setAlarm() in onStart() without getAlarm() check — DANGEROUS`);
      }
    }
  }
}

auditDirectory(WORKERS_DIR);

if (errors.length > 0) {
  console.error(`\n🔴 ${errors.length} DO alarm safety issues found:\n`);
  errors.forEach(e => console.error(`  ❌ ${e}`));
  console.error('\nFix: wrap every setAlarm() call with a getAlarm() guard.\n');
  process.exit(1);
}

console.log('\n✅ All DO alarm patterns verified — every setAlarm() has a getAlarm() guard.\n');
