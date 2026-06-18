import { createRateLimiter } from '../src/utils/rate-limiter';
import { Request, Response, NextFunction } from 'express';

describe('Rate Limiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let nextCalled = false;

  beforeEach(() => {
    mockReq = { ip: '127.0.0.1' };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn(() => {
      nextCalled = true;
    });
    nextCalled = false;
  });

  it('should allow requests within limit', () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 3 });

    limiter(mockReq as Request, mockRes as Response, mockNext);
    limiter(mockReq as Request, mockRes as Response, mockNext);
    limiter(mockReq as Request, mockRes as Response, mockNext);

    expect(nextCalled).toBe(true);
    expect(mockRes.status).not.toHaveBeenCalledWith(429);
  });

  it('should reject requests exceeding limit', () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2 });

    limiter(mockReq as Request, mockRes as Response, mockNext);
    limiter(mockReq as Request, mockRes as Response, mockNext);
    limiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalled();
  });

  it('should differentiate between different IPs', () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1 });

    const req1 = { ip: '127.0.0.1' };
    const req2 = { ip: '192.168.1.1' };

    limiter(req1 as Request, mockRes as Response, mockNext);
    nextCalled = false;
    limiter(req2 as Request, mockRes as Response, mockNext);

    expect(nextCalled).toBe(true);
  });

  it('should support custom key generator', () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxRequests: 2,
      keyGenerator: (req: Request) => (req.body as any)?.userId || 'unknown',
    });

    const req = { body: { userId: 'user123' } };
    limiter(req as Request, mockRes as Response, mockNext);
    limiter(req as Request, mockRes as Response, mockNext);
    limiter(req as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
  });
});
