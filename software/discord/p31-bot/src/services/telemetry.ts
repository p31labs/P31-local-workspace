import fetch from 'node-fetch';

export interface TelemetryEvent {
  type: 'command_used' | 'webhook_received' | 'error' | 'fawn_detected' | 'egg_discovery';
  service: string;
  data: Record<string, unknown>;
  timestamp: string;
  anonymousId?: string;
}

export interface TelemetryConfig {
  endpoint: string;
  enabled: boolean;
  timeout: number;
}

class TelemetryService {
  private config: TelemetryConfig;
  private enabled: boolean;

  constructor(endpoint: string = '', enabled: boolean = true, timeout: number = 5000) {
    this.config = {
      endpoint,
      enabled,
      timeout
    };
    this.enabled = enabled && !!endpoint;
  }

  public async track(event: TelemetryEvent): Promise<boolean> {
    if (!this.enabled || !this.config.endpoint) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      console.error('Telemetry error:', error);
      return false;
    }
  }

  public async trackCommand(commandName: string, userId: string, guildId: string): Promise<boolean> {
    return this.track({
      type: 'command_used',
      service: 'p31-discord-bot',
      data: {
        command: commandName,
        userId: this.hashUserId(userId),
        guildId: this.hashUserId(guildId)
      },
      timestamp: new Date().toISOString()
    });
  }

  public async trackWebhook(source: string, eventType: string): Promise<boolean> {
    return this.track({
      type: 'webhook_received',
      service: 'p31-discord-bot',
      data: {
        source,
        eventType
      },
      timestamp: new Date().toISOString()
    });
  }

  public async trackError(errorType: string, message: string, stack?: string): Promise<boolean> {
    return this.track({
      type: 'error',
      service: 'p31-discord-bot',
      data: {
        errorType,
        message,
        stack
      },
      timestamp: new Date().toISOString()
    });
  }

  public async trackFawnDetection(userId: string, confidence: number, patterns: string[]): Promise<boolean> {
    return this.track({
      type: 'fawn_detected',
      service: 'p31-discord-bot',
      data: {
        userId: this.hashUserId(userId),
        confidence,
        patterns
      },
      timestamp: new Date().toISOString()
    });
  }

  public async trackEggDiscovery(userId: string, eggId: string): Promise<boolean> {
    return this.track({
      type: 'egg_discovery',
      service: 'quantum-egg-hunt',
      data: {
        userId: this.hashUserId(userId),
        eggId
      },
      timestamp: new Date().toISOString()
    });
  }

  private hashUserId(userId: string): string {
    // Simple hash for anonymization (not cryptographic)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hashed_${Math.abs(hash).toString(16)}`;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public updateEndpoint(endpoint: string): void {
    this.config.endpoint = endpoint;
    this.enabled = !!endpoint;
  }
}

export default TelemetryService;
export { TelemetryService };