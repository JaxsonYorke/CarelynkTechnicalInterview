import fs from 'fs';
import path from 'path';
import { getDatabase } from './connection';
import logger from '../config/logger';

async function runMigrations(): Promise<void> {
  const db = getDatabase();
  const migrationsDir = path.join(__dirname, 'migrations');

  try {
    // Read all SQL files in migrations directory
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

    if (files.length === 0) {
      logger.info('No migrations to run');
      return;
    }

    for (const file of files.sort()) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Running migration: ${file}`);

      try {
        await db.unsafe(sql);
        logger.info(`✓ Migration ${file} completed successfully`);
      } catch (error) {
        logger.error(`✗ Migration ${file} failed: ${error}`);
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error(`Failed to run migrations: ${error}`);
    throw error;
  }
}

export { runMigrations };
