import { Request, Response, NextFunction } from 'express';

const ALWAYS_ALLOWED = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

/**
 * Reads INTERNAL_ALLOWED_IPS from the environment — a comma-separated list of
 * additional IPs that are permitted to call internal endpoints.
 *
 * Example:  INTERNAL_ALLOWED_IPS=203.0.113.10,203.0.113.20
 */
const getAllowedIps = (): string[] => {
  const extra = process.env.INTERNAL_ALLOWED_IPS ?? '';
  const extraList = extra
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  return [...ALWAYS_ALLOWED, ...extraList];
};

const getClientIp = (req: Request): string => {
  // Trust X-Forwarded-For only if running behind a trusted proxy (configurable)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }
  return req.socket.remoteAddress ?? '';
};

export const ipAllowlist = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = getClientIp(req);
  const allowed = getAllowedIps();

  if (allowed.includes(clientIp)) {
    next();
    return;
  }

  console.warn(`[IPAllowlist] Blocked request from ${clientIp}`);
  res.status(403).json({ message: `Forbidden: IP ${clientIp} is not allowed` });
};
