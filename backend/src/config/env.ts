import { logger } from '../utils/logger';

export function validateServerEnv() {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'ELASTICSEARCH_URL',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'FRONTEND_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET',
    'SLACK_CALLBACK_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(`Missing required server environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export function validateWorkerEnv() {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'ELASTICSEARCH_URL',
    'ENCRYPTION_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(`Missing required worker environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
