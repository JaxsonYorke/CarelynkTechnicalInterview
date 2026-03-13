import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'caregiver' | 'care_seeker';
  };
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`${err.statusCode} - ${err.message}`);
    const response: Record<string, unknown> = {
      success: false,
      error: {
        message: err.message,
      },
    };
    if (err.details) {
      (response.error as Record<string, unknown>).details = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof Error) {
    logger.error(`Unhandled error: ${err.message}\n${err.stack}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    });
    return;
  }

  logger.error(`Unknown error: ${err}`);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
    },
  });
};

export const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
