import { Message, EmbedBuilder } from 'discord.js';
import { CommandContext, P31Command, getApiUrls, getTimeout } from './base';
import { defaultRetryableFetch } from '../services/retryUtility';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime?: number;
  error?: string;
}

interface NodeOneStatus {
  connected: boolean;
  batteryLevel?: number;
  firmwareVersion?: string;
  lastSeen?: string;
}

export class StatusCommand implements P31Command {
  name = 'status';
  description = 'Check Node One/P31 system status';
  aliases = ['check', 'sys'];
  usage = 'status [service]';

  async execute(context: CommandContext): Promise<void> {
    const { message, args, apiUrls, timeout } = context;
    const targetService = args[0]?.toLowerCase();

    const services: ServiceStatus[] = [
      {
        name: 'BONDING',
        url: apiUrls.bonding,
        status: 'offline'
      },
      {
        name: 'Node One',
        url: apiUrls.nodeOneStatus,
        status: 'offline'
      },
      {
        name: 'Spoon API',
        url: apiUrls.spoon,
        status: 'offline'
      }
    ];

    // Ping all services in parallel
    const statusPromises = services.map(service => this.pingService(service, timeout));
    const results = await Promise.all(statusPromises);

    if (targetService) {
      const target = results.find(r => r.name.toLowerCase() === targetService);
      if (target) {
        await this.sendServiceStatus(message, target);
      } else {
        await message.reply(`Unknown service: ${targetService}. Available: bonding, node-one, spoon`);
      }
    } else {
      await this.sendAllStatus(message, results);
    }
  }

  private async pingService(service: ServiceStatus, timeout: number): Promise<ServiceStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const start = Date.now();
      const response = await defaultRetryableFetch.fetchWithRetry(
        service.url,
        {
          signal: controller.signal,
          method: 'HEAD'
        },
        service.name.toLowerCase().replace(/\s+/g, '-')
      );
      const responseTime = Date.now() - start;

      clearTimeout(timeoutId);

      return {
        ...service,
        status: response.ok ? 'online' : 'degraded',
        responseTime
      };
    } catch (error) {
      return {
        ...service,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendServiceStatus(message: Message, service: ServiceStatus): Promise<void> {
    const color = this.getStatusColor(service.status);
    const emoji = this.getStatusEmoji(service.status);

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${service.name} Status`)
      .setColor(color)
      .addFields(
        { name: 'Status', value: service.status.toUpperCase(), inline: true },
        { name: 'Response Time', value: service.responseTime ? `${service.responseTime}ms` : 'N/A', inline: true }
      );

    if (service.error) {
      embed.addFields({ name: 'Error', value: service.error, inline: false });
    }

    await message.reply({ embeds: [embed] });
  }

  private async sendAllStatus(message: Message, services: ServiceStatus[]): Promise<void> {
    const online = services.filter(s => s.status === 'online').length;
    const total = services.length;

    const embed = new EmbedBuilder()
      .setTitle('🔺 P31 System Status')
      .setColor(online === total ? 0x00FF88 : online > 0 ? 0xF59E0B : 0xEF4444)
      .setDescription(`${online}/${total} services online`)
      .addFields(
        ...services.map(service => ({
          name: `${this.getStatusEmoji(service.status)} ${service.name}`,
          value: service.responseTime 
            ? `${service.status.toUpperCase()} • ${service.responseTime}ms`
            : service.error || service.status.toUpperCase(),
          inline: true
        }))
      )
      .setFooter({ text: '🔺 P31 Labs • Cognitive Accessibility Infrastructure' });

    await message.reply({ embeds: [embed] });
  }

  private getStatusColor(status: 'online' | 'offline' | 'degraded'): number {
    switch (status) {
      case 'online':
        return 0x00FF88;
      case 'degraded':
        return 0xF59E0B;
      case 'offline':
        return 0xEF4444;
    }
  }

  private getStatusEmoji(status: 'online' | 'offline' | 'degraded'): string {
    switch (status) {
      case 'online':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'offline':
        return '❌';
    }
  }
}

export default StatusCommand;