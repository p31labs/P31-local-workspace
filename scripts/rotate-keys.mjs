import { PLATFORM_WORKERS } from '@p31/shared';
import { execSync } from 'child_process';

const SECRET_CHAINS: Record<string, string[]> = {
  'auth-chain': ['p31-auth', 'p31-gateway', 'federation-bridge'],
  'love-chain': ['ledger-bridge', 'creation-accountant', 'care-api', 'care-mesh', 'mcp-x402-gateway'],
  'worker-chain': ['command-center', 'care-api', 'care-mesh'],
};

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function rotateChain(chainName: string, execute: boolean) {
  const workers = SECRET_CHAINS[chainName];
  if (!workers) {
    console.error(`Unknown chain: ${chainName}`);
    console.error(`Available: ${Object.keys(SECRET_CHAINS).join(', ')}`);
    process.exit(1);
  }

  const secret = generateSecret();
  console.log(`\n🔐 Rotating ${chainName} (${workers.length} workers)\n`);
  console.log(`New secret: ${secret}\n`);

  if (!execute) {
    console.log('DRY RUN — use --execute to apply');
    return;
  }

  for (const worker of workers) {
    const cmd = `echo "${secret}" | npx wrangler secret put JWT_SECRET --name ${worker}`;
    console.log(`  → ${worker}`);
    execSync(cmd, { stdio: 'inherit' });
  }

  console.log(`\n✅ ${chainName} rotation complete\n`);
}

const args = process.argv.slice(2);
const chainName = args[0];
const execute = args.includes('--execute');

if (!chainName || chainName === '--help') {
  console.log('Usage: node rotate-keys.mjs <chain-name> [--execute]');
  console.log('Chains:', Object.keys(SECRET_CHAINS).join(', '));
  process.exit(0);
}

rotateChain(chainName, execute);
