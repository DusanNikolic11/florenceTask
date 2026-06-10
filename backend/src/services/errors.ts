import { Response } from 'express';

export type ErrorCode = 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'VALIDATION';

const HTTP_STATUS: Record<ErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  VALIDATION: 400,
};

export class ServiceError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const handleError = (err: unknown, res: Response, logLabel: string): void => {
  if (err instanceof ServiceError) {
    res.status(HTTP_STATUS[err.code]).json({ message: err.message });
    return;
  }
  console.error(`[${logLabel}]`, err);
  res.status(500).json({ message: 'Internal server error' });
};
