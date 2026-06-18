import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  (req as any).id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getRequestId(req: Request): string {
  return (req as any).id || 'unknown';
}
