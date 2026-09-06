// D1 Storage Monitor — checks D1 database sizes across P31 workers
// Usage: node d1-storage-monitor.mjs [--json]

import { execSync } from 'child_process';

const D1_DATABASES = [
  { name: 'p31-status-db', worker: 'status' },
  { name: 'p31-auth', worker: 'auth' },
  { name: 'p31-cortex', worker: 'cortex' },
  { name: 'love-ledger', worker: 'love-ledger' },
  { name: 'k4-cage-db', worker: 'k4-cage' },
  { name: 'sovereign-justice-db', worker: 'sovereign-justice' },
  { name: 'contracts-db', worker: 'contracts' },
  { name: 'governance-db', worker: 'governance' },
  { name: 'buffer-worker-db', worker: 'buffer-worker' },
  { name: 'hrv-coherence-db', worker: 'hrv-coherence' },
];

const FREE_TIER_LIMIT_GB = 10;
const WARNING_THRESHOLD = 0.8; // 80%

async function checkDatabaseSize(dbName, workerDir) {
  try {
    const output = execSync(
      `wrangler d1 execute ${dbName} --remote --command "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"`,
      { cwd: workerDir, encoding: 'utf8' }
    );
    const match = output.match(/\d+/);
    if (match) {
      return { name: dbName, sizeBytes: parseInt(match[0]) };
    }
    return { name: dbName, sizeBytes: null };
  } catch {
    return { name: dbName, sizeBytes: null, error: 'Query failed' };
  }
}

async function main() {
  const results = [];
  let totalBytes = 0;

  for (const db of D1_DATABASES) {
    const result = await checkDatabaseSize(db.name, db.worker);
    results.push(result);
    if (result.sizeBytes) totalBytes += result.sizeBytes;
  }

  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const usagePercent = (totalGB / FREE_TIER_LIMIT_GB) * 100;

  const report = {
    timestamp: new Date().toISOString(),
    databases: results,
    totalSizeGB: totalGB.toFixed(2),
    freeTierLimitGB: FREE_TIER_LIMIT_GB,
    usagePercent: usagePercent.toFixed(1),
    warning: usagePercent > WARNING_THRESHOLD * 100,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('=== P31 D1 Storage Monitor ===');
    console.log(`Total: ${report.totalSizeGB} GB / ${FREE_TIER_LIMIT_GB} GB (${report.usagePercent}%)`);
    console.log('');
    for (const db of results) {
      const sizeMB = db.sizeBytes ? (db.sizeBytes / (1024 * 1024)).toFixed(2) : 'N/A';
      console.log(`  ${db.name}: ${sizeMB} MB`);
    }
    if (report.warning) {
      console.log('\n⚠ WARNING: D1 storage usage exceeds 80% of free tier limit!');
    }
  }
}

main();
