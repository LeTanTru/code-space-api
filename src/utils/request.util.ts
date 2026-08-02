import { Request } from 'express';

export type ClientInfo = {
  ipAddress: string;
  userAgent: string;
};

/**
 * Extracts client IP address (supporting x-forwarded-for proxy header) and User-Agent from Express request
 */
export const extractClientInfo = (req: Request): ClientInfo => {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.ip || req.socket?.remoteAddress || 'Unknown IP';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  return { ipAddress, userAgent };
};
