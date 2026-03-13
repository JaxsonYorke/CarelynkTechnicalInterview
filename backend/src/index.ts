import env from './config/env';
import logger from './config/logger';
import { initializeDatabase, closeDatabase } from './db/connection';
import { runMigrations } from './db/migrate';
import { startServer } from './app';

async function main(): Promise<void> {
  try {
    logger.info(`Starting Carelynk backend in ${env.NODE_ENV} mode`);

    // Initialize database
    await initializeDatabase();

    // Run migrations
    await runMigrations();

    // Start server
    await startServer();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await closeDatabase();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...');
      await closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

main();
