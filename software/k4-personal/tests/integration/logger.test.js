import { describe, it, expect } from 'vitest';
import { logger } from '../../src/logger';

describe('logger', () => {
  it('exports info,warn,error,debug', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('info does not throw', () => {
    expect(() => logger.info('test')).not.toThrow();
  });

  it('warn does not throw', () => {
    expect(() => logger.warn('test')).not.toThrow();
  });

  it('error does not throw', () => {
    expect(() => logger.error('test')).not.toThrow();
  });

  it('debug does not throw', () => {
    expect(() => logger.debug('test')).not.toThrow();
  });
});
