/**
 * Ko-fi Webhook Handler
 * Handles supporter tracking and Node verification for Ko-fi donations
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface KofiSupporter {
  id: string;
  name: string;
  email: string;
  amount: number;
  currency: string;
  timestamp: string;
  message?: string;
  is_public: boolean;
  tier_name?: string;
  tier_id?: string;
  custom_tier?: boolean;
  shop_items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface KofiWebhookEvent {
  type: 'Donation' | 'Subscription' | 'Merch' | 'Commission';
  data: {
    donation_id: string;
    timestamp: string;
    full_name: string;
    email: string;
    amount: string;
    currency: string;
    message: string;
    is_public: boolean;
    kofi_transaction_id: string;
    tier_name?: string;
    tier_id?: string;
    custom_tier?: boolean;
    shop_items?: Array<{
      name: string;
      quantity: string;
      price: string;
    }>;
    shipping?: {
      name: string;
      address1: string;
      address2: string;
      city: string;
      state: string;
      country: string;
      zip: string;
    };
  };
}

export interface SupporterNode {
  id: string;
  source: 'kofi';
  identifier: string;
  joinedAt: Date;
  metadata: {
    name: string;
    email: string;
    amount: number;
    currency: string;
    message?: string;
    tier?: string;
    isPublic: boolean;
  };
}

export interface KofiVerification {
  valid: boolean;
  signatureValid: boolean;
  amountThresholdMet: boolean;
  verificationTimestamp: Date;
}

/**
 * Ko-fi Webhook Handler
 */
export class KofiWebhookHandler extends EventEmitter {
  private webhookSecret: string;
  private supporters: Map<string, SupporterNode> = new Map();
  private initialized = false;

  constructor(webhookSecret?: string) {
    super();
    this.webhookSecret = webhookSecret || process.env.KOFI_WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      console.warn('[KofiWebhookHandler] No Ko-fi webhook secret configured');
    }
  }

  /**
   * Verify Ko-fi webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('[KofiWebhookHandler] No webhook secret configured, skipping signature verification');
      return true;
    }

    const expectedSignature = createHash('md5')
      .update(payload + this.webhookSecret)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Handle incoming Ko-fi webhook
   */
  async handleWebhook(request: Request): Promise<{ success: boolean; message: string }> {
    try {
      const payload = await request.text();
      const signature = request.headers.get('X-Ko-Fi-Signature') || '';

      // Verify signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        console.warn('[KofiWebhookHandler] Invalid webhook signature');
        return { success: false, message: 'Invalid signature' };
      }

      const event: KofiWebhookEvent = JSON.parse(payload);
      
      // Process the event
      await this.processEvent(event);

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('[KofiWebhookHandler] Error processing webhook:', error);
      return { success: false, message: 'Error processing webhook' };
    }
  }

  private async processEvent(event: KofiWebhookEvent): Promise<void> {
    const supporterId = `kofi_${event.data.donation_id}`;
    const supporter: SupporterNode = {
      id: supporterId,
      source: 'kofi',
      identifier: event.data.donation_id,
      joinedAt: new Date(event.data.timestamp),
      metadata: {
        name: event.data.full_name,
        email: event.data.email,
        amount: parseFloat(event.data.amount),
        currency: event.data.currency,
        message: event.data.message || undefined,
        tier: event.data.tier_name || undefined,
        isPublic: event.data.is_public
      }
    };

    // Add or update supporter
    this.supporters.set(supporterId, supporter);

    // Emit events
    this.emit('supporterAdded', supporter);
    this.emit('nodeAdded', {
      id: supporterId,
      source: 'kofi' as const,
      identifier: event.data.donation_id,
      joinedAt: new Date(event.data.timestamp),
      metadata: supporter.metadata
    });

    // Check for milestones
    this.checkMilestones();

    console.log(`[KofiWebhookHandler] New supporter: ${supporter.metadata.name} (${supporter.metadata.amount} ${supporter.metadata.currency})`);
  }

  /**
   * Manually add a supporter (for testing or manual entry)
   */
  addSupporter(supporter: SupporterNode): void {
    this.supporters.set(supporter.id, supporter);
    this.emit('supporterAdded', supporter);
    this.emit('nodeAdded', {
      id: supporter.id,
      source: 'kofi' as const,
      identifier: supporter.identifier,
      joinedAt: supporter.joinedAt,
      metadata: supporter.metadata
    });
    this.checkMilestones();
  }

  /**
   * Remove a supporter
   */
  removeSupporter(supporterId: string): void {
    if (this.supporters.has(supporterId)) {
      this.supporters.delete(supporterId);
      this.emit('supporterRemoved', supporterId);
      this.emit('nodeRemoved', supporterId);
    }
  }

  /**
   * Get all supporters
   */
  getSupporters(): SupporterNode[] {
    return Array.from(this.supporters.values());
  }

  /**
   * Get supporter by ID
   */
  getSupporter(supporterId: string): SupporterNode | null {
    return this.supporters.get(supporterId) || null;
  }

  /**
   * Get supporters by amount threshold
   */
  getSupportersByAmount(minAmount: number): SupporterNode[] {
    return Array.from(this.supporters.values()).filter(s => s.metadata.amount >= minAmount);
  }

  /**
   * Get supporters by date range
   */
  getSupportersByDateRange(startDate: Date, endDate: Date): SupporterNode[] {
    return Array.from(this.supporters.values()).filter(s => 
      s.joinedAt >= startDate && s.joinedAt <= endDate
    );
  }

  /**
   * Verify a supporter's donation
   */
  async verifySupporter(supporterId: string): Promise<KofiVerification> {
    const supporter = this.supporters.get(supporterId);
    
    if (!supporter) {
      return {
        valid: false,
        signatureValid: false,
        amountThresholdMet: false,
        verificationTimestamp: new Date()
      };
    }

    // For now, we assume all stored supporters are valid
    // In a real implementation, you might want to verify against Ko-fi API
    return {
      valid: true,
      signatureValid: true,
      amountThresholdMet: supporter.metadata.amount >= 1, // $1 minimum
      verificationTimestamp: new Date()
    };
  }

  /**
   * Get statistics about supporters
   */
  getStatistics(): {
    totalSupporters: number;
    totalAmount: number;
    averageAmount: number;
    byCurrency: Record<string, number>;
    byTier: Record<string, number>;
  } {
    const supporters = Array.from(this.supporters.values());
    const totalSupporters = supporters.length;
    const totalAmount = supporters.reduce((sum, s) => sum + s.metadata.amount, 0);
    const averageAmount = totalSupporters > 0 ? totalAmount / totalSupporters : 0;

    const byCurrency: Record<string, number> = {};
    const byTier: Record<string, number> = {};

    for (const supporter of supporters) {
      byCurrency[supporter.metadata.currency] = (byCurrency[supporter.metadata.currency] || 0) + 1;
      const tier = supporter.metadata.tier || 'unknown';
      byTier[tier] = (byTier[tier] || 0) + 1;
    }

    return {
      totalSupporters,
      totalAmount,
      averageAmount,
      byCurrency,
      byTier
    };
  }

  /**
   * Export supporters data
   */
  exportSupporters(): string {
    const data = {
      exportDate: new Date().toISOString(),
      totalSupporters: this.supporters.size,
      supporters: Array.from(this.supporters.values()).map(s => ({
        ...s,
        joinedAt: s.joinedAt.toISOString()
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import supporters data
   */
  importSupporters(data: string): void {
    const parsed = JSON.parse(data);
    
    if (!parsed.supporters || !Array.isArray(parsed.supporters)) {
      throw new Error('Invalid supporters data format');
    }

    for (const supporter of parsed.supporters) {
      this.supporters.set(supporter.id, {
        ...supporter,
        joinedAt: new Date(supporter.joinedAt)
      });
    }
  }

  private checkMilestones(): void {
    const count = this.supporters.size;
    
    // Emit milestone events based on supporter count
    if (count === 1) {
      this.emit('milestone', {
        milestone: 1,
        supporterCount: count,
        achievedAt: new Date()
      });
    } else if (count === 10) {
      this.emit('milestone', {
        milestone: 10,
        supporterCount: count,
        achievedAt: new Date()
      });
    } else if (count === 50) {
      this.emit('milestone', {
        milestone: 50,
        supporterCount: count,
        achievedAt: new Date()
      });
    } else if (count === 100) {
      this.emit('milestone', {
        milestone: 100,
        supporterCount: count,
        achievedAt: new Date()
      });
    }
  }

  /**
   * Start the webhook server (Express-compatible)
   */
  createWebhookEndpoint(): (req: any, res: any) => Promise<void> {
    return async (req: any, res: any) => {
      try {
        // Convert Express request to fetch Request
        const payload = JSON.stringify(req.body);
        const signature = req.headers['x-kofi-signature'] || '';
        
        // Create a mock Request object
        const request = new Request('', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Ko-Fi-Signature': signature
          }
        });

        // Override text() method to return our payload
        (request as any).text = async () => payload;

        const result = await this.handleWebhook(request);
        
        if (result.success) {
          res.status(200).json({ message: result.message });
        } else {
          res.status(400).json({ error: result.message });
        }
      } catch (error) {
        console.error('[KofiWebhookHandler] Webhook endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }
}

/**
 * Ko-fi API Client for additional verification
 */
export class KofiApiClient {
  private apiKey: string;
  private baseUrl = 'https://ko-fi.com/api/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KOFI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Ko-fi API key is required. Set KOFI_API_KEY environment variable.');
    }
  }

  /**
   * Get donation by ID
   */
  async getDonation(donationId: string): Promise<any> {
    const url = `${this.baseUrl}/donations/${donationId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ko-fi API error: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get recent donations
   */
  async getRecentDonations(limit: number = 100): Promise<any[]> {
    const url = `${this.baseUrl}/donations?limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Ko-fi API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.donations || [];
  }

  /**
   * Verify donation exists and is valid
   */
  async verifyDonation(donationId: string): Promise<boolean> {
    try {
      await this.getDonation(donationId);
      return true;
    } catch (error) {
      console.warn(`Donation verification failed for ${donationId}:`, error);
      return false;
    }
  }
}

/**
 * Factory functions
 */
export function createKofiWebhookHandler(webhookSecret?: string): KofiWebhookHandler {
  return new KofiWebhookHandler(webhookSecret);
}

export function createKofiApiClient(apiKey?: string): KofiApiClient {
  return new KofiApiClient(apiKey);
}