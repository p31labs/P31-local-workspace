import type { D1Database, PubSub } from './types';

/**
 * P31 Emergency Broadcast System
 * 
 * Real-time emergency broadcast to all connected devices when operator
 * experiences a crisis, using Pub/Sub for instant propagation.
 * 
 * @version 1.0.0
 * @date March 24, 2026
 */

export interface Env {
  EMERGENCY_D1: D1Database;
  EMERGENCY_PUB_SUB: PubSub;
  BRENDA_PHONE: string;
  BRENDA_USER_ID: string;
  OPERATOR_USER_ID: string;
  TWILIO_SID?: string;
  TWILIO_TOKEN?: string;
  TWILIO_PHONE?: string;
}

export interface EmergencyAlert {
  id: string;
  type: 'manual' | 'biometric' | 'location' | 'scheduled';
  severity: 'warning' | 'critical' | 'life-threatening';
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  message: string;
  timestamp: number;
  acknowledgedBy: string[];
  expiresAt: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  priority: number;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyCall: boolean;
}

export interface EmergencyTrigger {
  type: 'manual' | 'biometric' | 'location' | 'scheduled';
  severity: 'warning' | 'critical' | 'life-threatening';
  message?: string;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  userId?: string;
}

// D1 SQL Schema
/*
CREATE TABLE emergency_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT,
  location TEXT,
  timestamp INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  acknowledged_by TEXT DEFAULT '[]'
);

CREATE TABLE emergency_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL,
  notify_sms INTEGER DEFAULT 1,
  notify_email INTEGER DEFAULT 1,
  notify_call INTEGER DEFAULT 0
);
*/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: POST /api/emergency/trigger
    if (pathParts[0] === 'api' && pathParts[1] === 'emergency' && pathParts[2] === 'trigger') {
      if (request.method === 'POST') {
        return this.handleTrigger(request, env);
      }
    }

    // Route: POST /api/emergency/acknowledge
    if (pathParts[0] === 'api' && pathParts[1] === 'emergency' && pathParts[2] === 'acknowledge') {
      if (request.method === 'POST') {
        return this.handleAcknowledge(request, env);
      }
    }

    // Route: GET /api/emergency/status
    if (pathParts[0] === 'api' && pathParts[1] === 'emergency' && pathParts[2] === 'status') {
      if (request.method === 'GET') {
        return this.handleStatus(env);
      }
    }

    // Route: GET /api/emergency/contacts
    if (pathParts[0] === 'api' && pathParts[1] === 'emergency' && pathParts[2] === 'contacts') {
      if (request.method === 'GET') {
        return this.handleContacts(env);
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async handleTrigger(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as EmergencyTrigger;

    if (!body.type || !body.severity) {
      return new Response('Invalid trigger', { status: 400 });
    }

    const alert: EmergencyAlert = {
      id: crypto.randomUUID(),
      type: body.type,
      severity: body.severity,
      location: body.location,
      message: body.message || this.getDefaultMessage(body.severity),
      timestamp: Date.now(),
      acknowledgedBy: [],
      expiresAt: Date.now() + 3600000, // 1 hour
    };

    // Store in D1
    await env.EMERGENCY_D1.prepare(`
      INSERT INTO emergency_alerts (id, type, severity, message, location, timestamp, expires_at, acknowledged_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      alert.id,
      alert.type,
      alert.severity,
      alert.message,
      alert.location ? JSON.stringify(alert.location) : null,
      alert.timestamp,
      alert.expiresAt,
      JSON.stringify([])
    ).run();

    // Broadcast via Pub/Sub
    try {
      await env.EMERGENCY_PUB_SUB.publish('emergency:global', JSON.stringify(alert));

      // Also publish to Brenda
      await env.EMERGENCY_PUB_SUB.publish(
        `emergency:${env.BRENDA_USER_ID}`,
        JSON.stringify(alert)
      );
    } catch (e) {
      console.log('Pub/Sub not configured, skipping broadcast');
    }

    // Send external notifications for critical/life-threatening
    if (alert.severity === 'critical' || alert.severity === 'life-threatening') {
      await this.sendExternalNotifications(alert, env);
    }

    return new Response(JSON.stringify({
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleAcknowledge(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as { alertId: string; userId: string };

    if (!body.alertId || !body.userId) {
      return new Response('Missing alertId or userId', { status: 400 });
    }

    // Get current acknowledged list
    const alert = await env.EMERGENCY_D1.prepare(`
      SELECT acknowledged_by FROM emergency_alerts WHERE id = ?
    `).bind(body.alertId).first<{ acknowledged_by: string }>();

    if (!alert) {
      return new Response('Alert not found', { status: 404 });
    }

    const acknowledged = JSON.parse(alert.acknowledged_by) as string[];
    
    // Add user if not already acknowledged
    if (!acknowledged.includes(body.userId)) {
      acknowledged.push(body.userId);
      
      await env.EMERGENCY_D1.prepare(`
        UPDATE emergency_alerts SET acknowledged_by = ? WHERE id = ?
      `).bind(JSON.stringify(acknowledged), body.alertId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      alertId: body.alertId,
      userId: body.userId,
      acknowledgedBy: acknowledged,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleStatus(env: Env): Promise<Response> {
    // Get active alert (most recent, not expired)
    const alert = await env.EMERGENCY_D1.prepare(`
      SELECT * FROM emergency_alerts 
      WHERE expires_at > ?
      ORDER BY timestamp DESC 
      LIMIT 1
    `).bind(Date.now()).first<EmergencyAlert & { location: string; acknowledged_by: string }>();

    if (!alert) {
      return new Response(JSON.stringify({
        status: 'clear',
        activeAlert: null,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = {
      status: 'active',
      activeAlert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        location: alert.location ? JSON.parse(alert.location) : null,
        timestamp: alert.timestamp,
        expiresAt: alert.expires_at,
        acknowledgedBy: JSON.parse(alert.acknowledged_by),
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async handleContacts(env: Env): Promise<Response> {
    const contacts = await env.EMERGENCY_D1.prepare(`
      SELECT * FROM emergency_contacts ORDER BY priority ASC
    `).all<EmergencyContact & { notify_sms: number; notify_email: number; notify_call: number }>();

    const formatted = (contacts.results || []).map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || null,
      priority: c.priority,
      notifySms: c.notify_sms === 1,
      notifyEmail: c.notify_email === 1,
      notifyCall: c.notify_call === 1,
    }));

    return new Response(JSON.stringify({
      contacts: formatted,
      count: formatted.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async sendExternalNotifications(alert: EmergencyAlert, env: Env): Promise<void> {
    // SMS to Brenda if configured
    if (env.TWILIO_SID && env.TWILIO_TOKEN && env.TWILIO_PHONE && env.BRENDA_PHONE) {
      const message = `P31 EMERGENCY: ${alert.message} - ${alert.location ? `Location: ${alert.location.lat},${alert.location.lng}` : 'No location'}`;

      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: env.BRENDA_PHONE,
              From: env.TWILIO_PHONE,
              Body: message,
            }),
          }
        );

        if (!response.ok) {
          console.error('Twilio SMS failed:', await response.text());
        }
      } catch (error) {
        console.error('Failed to send SMS:', error);
      }
    }
  },

  getDefaultMessage(severity: string): string {
    switch (severity) {
      case 'warning': return 'Operator needs support';
      case 'critical': return 'Operator in distress - please check in';
      case 'life-threatening': return 'EMERGENCY - Operator needs immediate assistance';
      default: return 'Operator alert';
    }
  },
};
