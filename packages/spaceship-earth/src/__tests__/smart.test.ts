/**
 * @file __tests__/smart.test.ts — SMART Notification Logic Tests
 * 
 * Validates source→node mapping, axis routing, pulse events, countdown sets.
 */

import { describe, it, expect } from 'vitest';
import {
  sourceToGraphNodes,
  sourceToAxis,
  notificationToPulse,
  shouldPulse,
  COUNTDOWN_NODES,
  VERTICES,
  type NotificationSource,
} from '@p31/shared';

describe('SMART Notification Logic', () => {
  describe('Source → Graph Nodes Mapping', () => {
    it('maps spoon → Body axis nodes', () => {
      const nodes = sourceToGraphNodes('spoon');
      expect(nodes).toContain('spoon-budget');
      expect(nodes).toContain('exec-dys');
      expect(nodes).toContain('audhd');
    });

    it('maps love → Mesh axis nodes', () => {
      const nodes = sourceToGraphNodes('love');
      expect(nodes).toContain('love-econ');
      expect(nodes).toContain('bonding-game');
      expect(nodes).toContain('bonding-quest');
    });

    it('maps mesh → bonding/peer nodes', () => {
      const nodes = sourceToGraphNodes('mesh');
      expect(nodes).toContain('bonding-mp');
      expect(nodes).toContain('tyler');
      expect(nodes).toContain('robby');
    });

    it('maps system → Forge infrastructure', () => {
      const nodes = sourceToGraphNodes('system');
      expect(nodes).toContain('relay');
      expect(nodes).toContain('cloudflare');
      expect(nodes).toContain('node-one');
    });

    it('maps crisis → Shield + decoherence', () => {
      const nodes = sourceToGraphNodes('crisis');
      expect(nodes).toContain('decoherence');
      expect(nodes).toContain('court-vexatious');
      expect(nodes).toContain('opm-deadline');
    });

    it('maps court → legal nodes', () => {
      const nodes = sourceToGraphNodes('court');
      expect(nodes).toContain('court-mar12');
      expect(nodes).toContain('court-contempt');
    });

    it('all mapped nodes exist in VERTICES', () => {
      const nodeIds = new Set(VERTICES.map((v) => v.id));
      const sources: NotificationSource[] = ['spoon', 'love', 'mesh', 'system', 'app', 'assistant', 'crisis', 'court', 'opm', 'ssa', 'kids', 'bonding'];
      sources.forEach((source) => {
        const nodes = sourceToGraphNodes(source);
        nodes.forEach((nodeId) => {
          expect(nodeIds.has(nodeId), `Node "${nodeId}" from source "${source}" must exist in VERTICES`).toBe(true);
        });
      });
    });
  });

  describe('Source → Axis Routing', () => {
    it('routes spoon → Body', () => {
      expect(sourceToAxis('spoon')).toBe('Body');
    });

    it('routes love → Mesh', () => {
      expect(sourceToAxis('love')).toBe('Mesh');
    });

    it('routes system → Forge', () => {
      expect(sourceToAxis('system')).toBe('Forge');
    });

    it('routes court → Shield', () => {
      expect(sourceToAxis('court')).toBe('Shield');
    });

    it('routes crisis → Body', () => {
      expect(sourceToAxis('crisis')).toBe('Body');
    });
  });

  describe('Notification → Pulse Event', () => {
    it('spoon notifications produce warm pulse', () => {
      const pulse = notificationToPulse('spoon');
      expect(pulse.color).toBe('#ffaa44');
      expect(pulse.intensity).toBe(0.7);
      expect(pulse.burstType).toBe('spoon');
      expect(pulse.nodeIds).toContain('spoon-budget');
    });

    it('love notifications produce pink pulse', () => {
      const pulse = notificationToPulse('love');
      expect(pulse.color).toBe('#ff44aa');
      expect(pulse.intensity).toBe(0.8);
      expect(pulse.burstType).toBe('love');
    });

    it('crisis notifications produce high-intensity red pulse', () => {
      const pulse = notificationToPulse('crisis');
      expect(pulse.color).toBe('#ff4466');
      expect(pulse.intensity).toBe(1.0);
      expect(pulse.burstType).toBe('crisis');
    });

    it('system notifications produce teal pulse', () => {
      const pulse = notificationToPulse('system');
      expect(pulse.color).toBe('#44ffaa');
      expect(pulse.burstType).toBe('system');
    });
  });

  describe('Countdown Pulse Set', () => {
    it('COUNTDOWN_NODES includes deadline nodes', () => {
      expect(COUNTDOWN_NODES.has('kids-bash')).toBe(true);
      expect(COUNTDOWN_NODES.has('opm-deadline')).toBe(true);
      expect(COUNTDOWN_NODES.has('court-mar12')).toBe(true);
    });

    it('shouldPulse returns true for countdown nodes', () => {
      const node = VERTICES.find((v) => v.id === 'kids-bash')!;
      expect(shouldPulse(node)).toBe(true);
    });

    it('shouldPulse returns true for crisis state', () => {
      const node = VERTICES.find((v) => v.state === 'crisis')!;
      expect(shouldPulse(node)).toBe(true);
    });

    it('shouldPulse returns false for operational nodes', () => {
      const node = VERTICES.find((v) => v.state === 'operational' && !COUNTDOWN_NODES.has(v.id))!;
      expect(shouldPulse(node)).toBe(false);
    });
  });
});
