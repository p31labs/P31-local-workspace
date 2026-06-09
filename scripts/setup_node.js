const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env');
let envData = '';

console.log("==================================================");
console.log("🔺 P31 ANDROMEDA: SOVEREIGN NODE INITIALIZATION");
console.log("==================================================");
console.log("This wizard will configure your local ecosystem.\n");

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function runSetup() {
  // 1. Core Configuration
  const nodeName = await askQuestion("Enter your Sovereign Node Name [Node-1]: ") || "Node-1";
  envData += `NODE_NAME=${nodeName}\n`;
  envData += `NODE_ENV=production\n\n`;

  // 2. Discord Integration
  const useDiscord = await askQuestion("Enable Discord Bot & Webhooks? (y/n) [n]: ");
  if (useDiscord.toLowerCase() === 'y') {
    const discordToken = await askQuestion("  -> Enter DISCORD_TOKEN: ");
    const webhookUrl = await askQuestion("  -> Enter DISCORD_WEBHOOK_URL: ");
    envData += `DISCORD_TOKEN=${discordToken}\nDISCORD_WEBHOOK_URL=${webhookUrl}\n\n`;
  }

  // 3. Cloudflare Edge Context
  const useCloudflare = await askQuestion("Connect to Cloudflare Live Edge? (y/n) [n - local only]: ");
  if (useCloudflare.toLowerCase() === 'y') {
    const cfToken = await askQuestion("  -> Enter CLOUDFLARE_API_TOKEN: ");
    const cfAccountId = await askQuestion("  -> Enter CLOUDFLARE_ACCOUNT_ID: ");
    envData += `CLOUDFLARE_API_TOKEN=${cfToken}\nCLOUDFLARE_ACCOUNT_ID=${cfAccountId}\n\n`;
  }

  // Generate the .env file
  fs.writeFileSync(envPath, envData);
  
  console.log("\n✅ Configuration complete. '.env' file generated.");
  console.log("🚀 To start your Sovereign Node, run: docker-compose up -d");
  
  rl.close();
}

runSetup();
