import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { SubmissionRecord, ApiResponse, BountyClaimedEvent } from './types';
import { watchStellarEvents } from './stellar';
import { openSolutionPR } from './github';
import { validateConfig, Config } from './utils/config';
import { logger } from './utils/logger';
import { handleError, DecryptionError, ValidationError } from './utils/errors';
import { requestIdMiddleware, getRequestId } from './utils/middleware';
import { metrics } from './utils/metrics';
import {
  sanitizeEncryptedCode,
  sanitizeAddress,
  sanitizeHexString,
  validatePayloadSize,
} from './utils/sanitization';
import {
  isValidEncryptedPayload,
  isValidBountyEvent,
  isValidStellarAddress,
  validateHexString,
} from './utils/validation';

let config: Config;
let app: express.Application;
let server: any;

const submissionDatabase: Record<string, SubmissionRecord> = {};
const SUBMISSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 10000;

// Initialize app
function initializeApp(): void {
  app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(requestIdMiddleware);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response): void => {
    res.json(apiResponse<{ status: string }>('success', { status: 'healthy' }, req));
  });

  // Metrics endpoint
  app.get('/metrics', (req: Request, res: Response): void => {
    res.json(apiResponse('success', metrics.getMetrics(), req));
  });

  // POST /api/submissions/upload
  app.post('/api/submissions/upload', (req: Request, res: Response): void => {
    const requestId = getRequestId(req);
    const startTime = Date.now();

    try {
      const { contributorAddress, encryptedCode, iv, authTag } = req.body;

      // Validate presence of required fields
      if (!contributorAddress || !encryptedCode || !iv || !authTag) {
        metrics.recordSubmissionFailed();
        logger.warn(`[${requestId}] Missing required fields`);
        return res.status(400).json(
          apiResponse(
            'error',
            undefined,
            req,
            { code: 'MISSING_FIELDS', message: 'Missing required encryption parameters' }
          )
        );
      }

      // Validate payload size
      validatePayloadSize(req.body);

      // Sanitize inputs
      const sanitizedAddress = sanitizeAddress(contributorAddress);
      const sanitizedCode = sanitizeEncryptedCode(encryptedCode);
      const sanitizedIv = sanitizeHexString(iv, 'iv', 32);
      const sanitizedAuthTag = sanitizeHexString(authTag, 'authTag', 32);

      // Validate Stellar address
      if (!isValidStellarAddress(sanitizedAddress)) {
        metrics.recordSubmissionFailed();
        logger.warn(`[${requestId}] Invalid Stellar address: ${sanitizedAddress}`);
        return res.status(400).json(
          apiResponse(
            'error',
            undefined,
            req,
            { code: 'INVALID_ADDRESS', message: 'Invalid Stellar address format' }
          )
        );
      }

      // Validate encrypted payload structure
      if (
        !isValidEncryptedPayload({
          encryptedCode: sanitizedCode,
          iv: sanitizedIv,
          authTag: sanitizedAuthTag,
        })
      ) {
        metrics.recordSubmissionFailed();
        logger.warn(`[${requestId}] Invalid encrypted payload structure`);
        return res.status(400).json(
          apiResponse(
            'error',
            undefined,
            req,
            { code: 'INVALID_PAYLOAD', message: 'Invalid encrypted payload structure' }
          )
        );
      }

      const key = sanitizedAddress.toLowerCase();
      submissionDatabase[key] = {
        payload: {
          encryptedCode: sanitizedCode,
          iv: sanitizedIv,
          authTag: sanitizedAuthTag,
        },
        createdAt: Date.now(),
      };

      metrics.recordSubmissionReceived();
      const processingTime = Date.now() - startTime;
      metrics.recordProcessingTime(processingTime);

      logger.info(`[${requestId}] Payload buffered for ${sanitizedAddress} (${processingTime}ms)`);

      res.status(200).json(
        apiResponse('success', { status: 'encrypted_payload_buffered' }, req, undefined, requestId)
      );
    } catch (err: any) {
      metrics.recordSubmissionFailed();
      const error = handleError(err);
      logger.error(`[${requestId}] Upload error: ${error.message}`);
      res.status(error.statusCode).json(apiResponse('error', undefined, req, error, requestId));
    }
  });

  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
    const requestId = getRequestId(req);
    const error = handleError(err);
    logger.error(`[${requestId}] Unhandled error: ${error.message}`);
    res.status(error.statusCode).json(apiResponse('error', undefined, req, error, requestId));
  });
}

// Decrypt and dispatch to GitHub once the on-chain event is confirmed
async function handleBountyRelease(event: BountyClaimedEvent): Promise<void> {
  const eventKey = `${event.contributor}_${event.txHash}`;

  // Check for replay attacks
  if (processedEvents.has(eventKey)) {
    logger.warn(`Duplicate event detected (replay protection): ${eventKey}`);
    return;
  }

  processedEvents.add(eventKey);
  if (processedEvents.size > MAX_PROCESSED_EVENTS) {
    const firstKey = Array.from(processedEvents)[0];
    processedEvents.delete(firstKey);
  }

  try {
    // Validate event
    if (!isValidBountyEvent(event)) {
      logger.error(`Invalid bounty event structure: ${JSON.stringify(event)}`);
      metrics.recordSubmissionFailed();
      return;
    }

    const payload = submissionDatabase[event.contributor.toLowerCase()];
    if (!payload) {
      logger.warn(`No payload buffered for contributor: ${event.contributor}`);
      metrics.recordSubmissionFailed();
      return;
    }

    // Check submission expiry
    const age = Date.now() - payload.createdAt;
    if (age > SUBMISSION_TTL_MS) {
      logger.warn(`Submission expired for ${event.contributor} (${age}ms old)`);
      delete submissionDatabase[event.contributor.toLowerCase()];
      metrics.recordSubmissionFailed();
      return;
    }

    const startTime = Date.now();

    // Decrypt
    const salt = config.kdfSalt;
    const key = crypto.scryptSync(event.decryptionKey, salt, 32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.payload.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(payload.payload.authTag, 'hex'));

    let decrypted = decipher.update(payload.payload.encryptedCode, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    metrics.recordDecryptionSuccess();
    logger.info(`Decrypted challenge #${event.challengeId} for ${event.contributor} (tx: ${event.txHash})`);

    // Open PR
    await openSolutionPR(event.challengeId, event.contributor, decrypted);
    metrics.recordPROpened();
    metrics.recordSubmissionProcessed();

    const processingTime = Date.now() - startTime;
    metrics.recordProcessingTime(processingTime);

    logger.info(
      `Challenge #${event.challengeId} processed successfully (${processingTime}ms)`
    );

    // Cleanup
    delete submissionDatabase[event.contributor.toLowerCase()];
    payload.txHash = event.txHash;
  } catch (err: any) {
    metrics.recordDecryptionFailure();
    metrics.recordSubmissionFailed();
    if (err.message.includes('Unsupported state or unable to authenticate data')) {
      logger.error(`Auth tag verification failed for ${event.contributor} — possible tampering`);
    } else {
      logger.error(`Decryption failed: ${err.message}`);
    }
  }
}

// Cleanup expired submissions periodically
function startCleanupTimer(): void {
  setInterval(() => {
    const now = Date.now();
    let count = 0;

    for (const [key, record] of Object.entries(submissionDatabase)) {
      if (now - record.createdAt > SUBMISSION_TTL_MS) {
        delete submissionDatabase[key];
        count++;
      }
    }

    if (count > 0) {
      logger.info(`Cleaned up ${count} expired submissions`);
    }
  }, 60 * 60 * 1000); // Run every hour
}

// Graceful shutdown
function setupGracefulShutdown(): void {
  const signals = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      if (server) {
        server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      }
    });
  });
}

// Start server
async function start(): Promise<void> {
  try {
    config = validateConfig();
    logger.info('Configuration validated');

    initializeApp();
    startCleanupTimer();
    setupGracefulShutdown();

    server = app.listen(config.port, () => {
      logger.info(`ZK-WaveScout Coordinator active on port ${config.port}`);
    });

    watchStellarEvents(config.contractAddress, handleBountyRelease);
  } catch (err: any) {
    logger.error(`Startup failed: ${err.message}`);
    process.exit(1);
  }
}

function apiResponse(
  status: 'success' | 'error',
  data: any = undefined,
  req?: Request,
  error?: { code: string; message: string },
  requestId?: string
): ApiResponse {
  return {
    status,
    data,
    error,
    requestId: requestId || (req ? getRequestId(req) : undefined),
    timestamp: new Date().toISOString(),
  };
}

start();

export { app, config, submissionDatabase };
