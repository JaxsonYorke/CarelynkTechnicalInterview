import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

export function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API version endpoint
  app.get('/api/version', (_req, res) => {
    res.status(200).json({ version: '1.0.0' });
  });

  // API routes (includes auth, seekers, caregivers, jobs)
  app.use('/api', apiRoutes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export async function startServer(): Promise<void> {
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}
