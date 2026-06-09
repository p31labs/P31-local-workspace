import { Message } from 'discord.js';

export interface CommandContext {
  message: Message;
  args: string[];
  prefix: string;
  apiUrls: {
    bonding: string;
    nodeOne: string;
    spoon: string;
    telemetry: string;
    nodeOneStatus: string;
    cortex: string;
  };
  timeout: number;
}

export interface P31Command {
  name: string;
  description: string;
  aliases?: string[];
  usage: string;
  execute(context: CommandContext): Promise<void>;
}

export interface CommandRegistry {
  commands: Map<string, P31Command>;
  register(command: P31Command): void;
  get(name: string): P31Command | undefined;
  getAll(): P31Command[];
}

export function createCommandRegistry(): CommandRegistry {
  const commands = new Map<string, P31Command>();

  return {
    commands,

    register(command: P31Command): void {
      this.commands.set(command.name.toLowerCase(), command);
      if (command.aliases) {
        for (const alias of command.aliases) {
          this.commands.set(alias.toLowerCase(), command);
        }
      }
    },

    get(name: string): P31Command | undefined {
      return this.commands.get(name.toLowerCase());
    },

    getAll(): P31Command[] {
      // Return unique commands only (dedupe aliases)
      const uniqueCommands = new Map<string, P31Command>();
      for (const cmd of this.commands.values()) {
        if (!uniqueCommands.has(cmd.name.toLowerCase())) {
          uniqueCommands.set(cmd.name.toLowerCase(), cmd);
        }
      }
      return Array.from(uniqueCommands.values());
    }
  };
}

export function parseArgs(message: string, prefix: string): string[] {
  const content = message.slice(prefix.length).trim();
  return content.split(/\s+/).filter(Boolean);
}

export function getApiUrls(): {
  bonding: string;
  nodeOne: string;
  spoon: string;
  telemetry: string;
  nodeOneStatus: string;
  cortex: string;
} {
  return {
    bonding: process.env.BONDING_API_URL || 'https://bonding.p31ca.org/api',
    nodeOne: process.env.NODE_ONE_API_URL || 'http://localhost:3001/api',
    spoon: process.env.SPOON_API_URL || 'https://phosphorus31.org/api/spoons',
    telemetry: process.env.TELEMETRY_API_URL || '',
    nodeOneStatus: process.env.NODE_ONE_STATUS_URL || 'http://localhost:3001/status',
    cortex: process.env.CORTEX_API_URL || 'https://p31-cortex.workers.dev'
  };
}

export function getTimeout(): number {
  return parseInt(process.env.RESPONSE_TIMEOUT_MS || '5000', 10);
}

export function getPrefix(): string {
  return process.env.BOT_PREFIX || 'p31';
}