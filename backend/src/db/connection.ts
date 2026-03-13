import postgres from 'postgres';
import env from '../config/env';
import logger from '../config/logger';

let sql: postgres.Sql;

export async function initializeDatabase(): Promise<postgres.Sql> {
  try {
    sql = postgres(env.DATABASE_URL);
    
    // Test the connection
    await sql`SELECT 1`;
    
    logger.info('Database connection established');
    return sql;
  } catch (error) {
    logger.error(`Database connection failed: ${error}`);
    throw error;
  }
}

export function getDatabase(): postgres.Sql {
  if (!sql) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sql;
}

export async function closeDatabase(): Promise<void> {
  if (sql) {
    await sql.end();
    logger.info('Database connection closed');
  }
}
