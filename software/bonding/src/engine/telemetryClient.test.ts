import { describe, it, expect, vi } from 'vitest';
import { telemetry } from './telemetryClient';

describe('TelemetryClient qFactor', () => {
  it('should initialize qFactor to default 0.925', () => {
    expect(telemetry.getQFactor()).toBe(0.925);
  });

  it('should update qFactor monotonically with sensor noise', () => {
    // Mock fetch to avoid network calls
    global.fetch = vi.fn();

    telemetry.updateQFactor(0, 0);
    expect(telemetry.getQFactor()).toBe(0.925);

    telemetry.updateQFactor(1, 0);
    expect(telemetry.getQFactor()).toBeLessThan(0.925);
    expect(telemetry.getQFactor()).toBeGreaterThanOrEqual(0);

    telemetry.updateQFactor(10, 10);
    expect(telemetry.getQFactor()).toBeLessThan(0.925);
    expect(telemetry.getQFactor()).toBeGreaterThanOrEqual(0);

    telemetry.updateQFactor(100, 100); // high noise
    expect(telemetry.getQFactor()).toBe(0); // should clamp to 0
  });

  it('should keep qFactor in [0,1]', () => {
    telemetry.updateQFactor(-1, -1); // negative shouldn't go above 0.925
    expect(telemetry.getQFactor()).toBe(0.925);

    telemetry.updateQFactor(1000, 1000); // very high
    expect(telemetry.getQFactor()).toBe(0);
  });

  it('should publish spoons:update event on update', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    telemetry.updateQFactor(1, 1);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/d1/telemetry'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"eventType":"spoons:update"'),
      })
    );
  });
});