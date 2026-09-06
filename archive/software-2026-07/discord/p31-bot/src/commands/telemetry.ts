import type { CommandContext, P31Command } from './base';
import TelemetryService from '../services/telemetry';

export class TelemetryCommand implements P31Command {
  name = 'telemetry';
  description = 'Check telemetry service status';
  aliases = ['stats'];
  usage = 'telemetry';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    // Assuming telemetry is accessible, but since it's global, perhaps from index.
    // For simplicity, create new instance or assume.
    const enabled = process.env.TELEMETRY_API_URL ? 'Enabled' : 'Disabled';
    const endpoint = process.env.TELEMETRY_API_URL || 'Not set';

    await message.reply(`📊 Telemetry Status: ${enabled}\nEndpoint: ${endpoint}`);
  }
}