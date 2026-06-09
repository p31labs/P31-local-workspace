# Deep Research Prompt: Discord Bot Application Registration

## Context
We're trying to register Discord slash commands for the P31 Mesh Discord bot but encountering "Unknown Application" errors (code 10002). We've verified:
- Bot Token: (use environment variable DISCORD_BOT_TOKEN)
- Application ID: 148563425438060148
- Public Key: 3f60816b9da49cd9548097574df1f6f1a707daa3d6af77e7902ac8ece05401be

## Research Questions

### 1. Discord API Authentication
- Why does the API return "Unknown Application" for a valid Application ID?
- What are the correct HTTP headers and authentication for registering slash commands?
- Is there a scope/permission issue with the bot token?

### 2. Application vs Bot Distinction
- What's the difference between "Application ID" and "Bot User ID"?
- How do you register commands to an application vs a bot?
- Does the bot need to be in a server first before commands can be registered?

### 3. Common Causes of "Unknown Application" (10002)
- Invalid OAuth2 tokens
- Application not created properly
- Bot not activated/enabled
- API endpoint differences between legacy and new Discord API

### 4. Alternative Registration Methods
- Using the Discord Developer Portal UI to register commands manually
- Using a different API endpoint
- Generating an OAuth2 token with proper scopes

## Expected Deliverable
A comprehensive analysis of:
1. Root cause of the 10002 error
2. Step-by-step solution to register the slash commands
3. Alternative approaches if the primary method fails

## Constraints
- Must use official Discord Developer documentation
- Must reference current Discord API (v10)
- Must work with the provided credentials if possible