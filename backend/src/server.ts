import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { logger } from './utils/logger';
import { validateServerEnv } from './config/env';
import { sessionRedisClient } from './redis/sessionRedisClient';

validateServerEnv();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  // In a real app we'd keep track of the server instance
  // but for simplicity we'll just close the redis client here.
  logger.info('Closing session Redis client...');
  await sessionRedisClient.disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
