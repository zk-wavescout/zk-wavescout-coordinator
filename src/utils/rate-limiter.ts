import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

export function createRateLimiter(config: RateLimitConfig) {
  const store: RateLimitStore = {};
  const defaultKeyGenerator = (req: Request) => req.ip || 'unknown';
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key]) {
      store[key] = { count: 0, resetTime: now + config.windowMs };
    }

    if (now > store[key].resetTime) {
      store[key] = { count: 0, resetTime: now + config.windowMs };
    }

    store[key].count++;

    if (store[key].count > config.maxRequests) {
      return res.status(429).json({
        status: 'error',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded: ${config.maxRequests} requests per ${config.windowMs}ms`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

export const submissionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const metricsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute
});
