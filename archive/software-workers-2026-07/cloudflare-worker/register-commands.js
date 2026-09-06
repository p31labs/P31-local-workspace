// Register Discord slash commands
// Run: node register-commands.js

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const APP_ID = '1485634254380601485';

const commands = [
  {
    name: 'ping-mesh',
    description: 'Check mesh topology status',
    type: 1
  },
  {
    name: 'spoon-check',
    description: 'Check node spoon economy',
    type: 1,
    options: [
      {
        name: 'node',
        description: 'Node ID to check',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'ground-status',
    description: 'Check ground/stabilization status',
    type: 1
  },
  {
    name: 'ark-access',
    description: 'Check ARK access eligibility',
    type: 1
  },
  {
    name: 'ark-download',
    description: 'Download ARK files (if eligible)',
    type: 1
  },
  {
    name: 'announce',
    description: 'Post a sovereignty announcement',
    type: 1,
    options: [
      {
        name: 'message',
        description: 'The announcement message',
        type: 3,
        required: true
      }
    ]
  }
];

async function registerCommands() {
  console.log('Registering Discord slash commands...');
  
  for (const cmd of commands) {
    const response = await fetch(
      `https://discord.com/api/v10/applications/${APP_ID}/commands`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cmd)
      }
    );
    
    if (response.ok) {
      console.log(`✅ Registered: /${cmd.name}`);
    } else {
      const error = await response.text();
      console.log(`❌ Failed /${cmd.name}: ${error}`);
    }
  }
  
  console.log('Done!');
}

registerCommands();