/**
 * P31 ORACLE TERMINAL - EXPRESS API SERVER
 * Stack Layer: p31.c (KWAI)
 * Compliance: ADA 508 / 21 CFR §890.3710 / HIPAA Safe Harbor
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Import Services
import { executeOracleSearch } from './services/oracle-rag-service';
import { secureExpendSpoon, getUserState, resetDailySpoons } from './services/resin-state-lock';

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:11434"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'P31 Oracle Terminal',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    compliance: ['ADA 508', '21 CFR §890.3710', 'HIPAA Safe Harbor']
  });
});

// Main Search Endpoint
app.post('/api/oracle/search', async (req: any, res: any) => {
  try {
    const { query, fingerprintHash } = req.body;

    // Input Validation
    if (!query || !fingerprintHash) {
      return res.status(400).json({
        error: 'Missing required fields: query and fingerprintHash'
      });
    }

    if (typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid query format'
      });
    }

    if (typeof fingerprintHash !== 'string' || fingerprintHash.length < 10) {
      return res.status(400).json({
        error: 'Invalid fingerprintHash format'
      });
    }

    // Generate Interaction ID for Idempotency
    const interactionId = uuidv4();

    // Execute Search with Clinical Safety Checks
    const result = await executeOracleSearch(fingerprintHash, interactionId, query.trim());

    // Return Structured Response
    res.json({
      success: true,
      data: {
        answer: result.answer,
        source_link: result.source_link,
        spoons_remaining: result.spoons_remaining,
        search_id: interactionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[ORACLE SEARCH ERROR]', error.message);
    
    // Clinical Safety Responses
    if (error.message.includes('CLINICAL_HALT')) {
      return res.status(429).json({
        success: false,
        error: error.message,
        code: 'CLINICAL_HALT',
        suggestion: 'Please rest and try again tomorrow. Cognitive health is paramount.'
      });
    }

    if (error.message.includes('RATE_LIMIT')) {
      return res.status(429).json({
        success: false,
        error: error.message,
        code: 'RATE_LIMIT',
        suggestion: 'Daily search limit reached. Please rest and try again tomorrow.'
      });
    }

    if (error.message.includes('IDEMPOTENT_REJECT')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'IDEMPOTENT_REJECT',
        suggestion: 'Please wait a moment before submitting another search.'
      });
    }

    // Generic Error Response
    res.status(500).json({
      success: false,
      error: 'The Oracle is currently recalibrating its neural mesh. Please try again later.',
      code: 'SYSTEM_ERROR',
      suggestion: 'If this persists, please contact the engineering team.'
    });
  }
});

// User State Endpoint
app.get('/api/oracle/state/:fingerprintHash', async (req: any, res: any) => {
  try {
    const { fingerprintHash } = req.params;

    if (!fingerprintHash || fingerprintHash.length < 10) {
      return res.status(400).json({
        error: 'Invalid fingerprintHash format'
      });
    }

    const state = await getUserState(`user:${fingerprintHash}`);

    res.json({
      success: true,
      data: {
        spoons: state.spoons,
        search_count: state.searchCount,
        last_reset: state.lastReset,
        last_search: state.lastSearch,
        daily_limit: 20,
        can_search: state.spoons > 0 && state.searchCount < 20
      }
    });

  } catch (error) {
    console.error('[USER STATE ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user state'
    });
  }
});

// Admin Reset Endpoint (for testing)
app.post('/api/oracle/reset/:fingerprintHash', async (req: any, res: any) => {
  try {
    // In production, this would require admin authentication
    const { fingerprintHash } = req.params;

    if (!fingerprintHash || fingerprintHash.length < 10) {
      return res.status(400).json({
        error: 'Invalid fingerprintHash format'
      });
    }

    await resetDailySpoons(`user:${fingerprintHash}`);

    res.json({
      success: true,
      message: 'Daily spoons reset successfully'
    });

  } catch (error) {
    console.error('[RESET ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset daily spoons'
    });
  }
});

// Error Handling Middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('[UNHANDLED ERROR]', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Please try again or contact support if the problem persists'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested Oracle endpoint does not exist'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
🚀 P31 Oracle Terminal Server Started
📍 Port: ${PORT}
🔒 Compliance: ADA 508 / 21 CFR §890.3710 / HIPAA Safe Harbor
🧠 Cognitive Safety: Active
⚡ Spoon Economy: Enabled
🎯 Sovereign RAG: Operational

Available Endpoints:
  GET  /health                    - Health check
  POST /api/oracle/search         - Execute search query
  GET  /api/oracle/state/:hash    - Get user state
  POST /api/oracle/reset/:hash    - Reset daily spoons (admin)

⚠️  Clinical Safety Features:
  - Spoon-based search limits (5 per day)
  - Rate limiting (20 searches per day)
  - Idempotency protection
  - Cognitive overload prevention
  - Local AI processing only (no cloud APIs)
`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;