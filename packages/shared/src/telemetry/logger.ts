/**
 * P31 Labs Structured Logger - Pino Integration
 * 
 * Provides structured JSON logging across all Node.js and browser environments.
 * Supports dynamic log level via localStorage (p31:loglevel) synced with
 * p31:progressive-disclosure feature flag.
 */

import pino from 'pino';

// Log level storage key
const LOG_LEVEL_KEY = 'p31:loglevel';
const PROGRESSIVE_DISCLOSURE_KEY = 'p31:progressive-disclosure';

// Get dynamic log level from localStorage
function getLogLevel(): string {
  if (typeof window === 'undefined') return 'info';
  return localStorage.getItem(LOG_LEVEL_KEY) || 'info';
}

// Sync log level with progressive disclosure
function syncWithProgressiveDisclosure(): void {
  if (typeof window === 'undefined') return;
  
  const pd = localStorage.getItem(PROGRESSIVE_DISCLOSURE_KEY);
  if (pd === 'true') {
    // Minimal logging in reduced disclosure mode
    localStorage.setItem(LOG_LEVEL_KEY, 'warn');
  }
}

// Create the logger instance
const logger = pino({
  level: getLogLevel(),
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Set log level and persist to localStorage
export function setLogLevel(level: string): void {
  logger.level = level;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOG_LEVEL_KEY, level);
  }
}

// Get current log level
export function getLogLevelValue(): string {
  return logger.level;
}

// Initialize browser-specific listeners
function initBrowserListeners(): void {
  if (typeof window === 'undefined') return;
  
  // Sync on load
  syncWithProgressiveDisclosure();
  
  // Listen for log level changes
  window.addEventListener('storage', (e) => {
    if (e.key === LOG_LEVEL_KEY) {
      logger.level = e.newValue || 'info';
    }
    if (e.key === PROGRESSIVE_DISCLOSURE_KEY) {
      syncWithProgressiveDisclosure();
    }
  });
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  initBrowserListeners();
}

// Export standard logger methods
export const p31Logger = {
  trace: logger.trace.bind(logger),
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  fatal: logger.fatal.bind(logger),
  child: logger.child.bind(logger),
  level: logger.level,
  setLevel: setLogLevel,
  getLevel: getLogLevelValue,
  syncProgressiveDisclosure: syncWithProgressiveDisclosure,
};

export default p31Logger;
