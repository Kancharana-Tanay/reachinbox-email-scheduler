import dotenv from 'dotenv';
dotenv.config();

import { logger } from './utils/logger';
import { validateServerEnv, validateWorkerEnv } from './config/env';

// 1. Validate environment for both server and worker
validateServerEnv();
validateWorkerEnv();

// 2. Import Express app and BullMQ workers
import { app } from './app';
import { emailWorker } from './workers/emailWorker';
import { indexWorker } from './workers/indexWorker';

const PORT = process.env.PORT || 4000;

// 3. Start the Express API server
const server = app.listen(PORT, () => {
  logger.info(`Production Server running on port ${PORT}`);
  logger.info(`BullMQ Workers started within the same process.`);
});

// 4. Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server and BullMQ workers`);

  server.close(async () => {
    logger.info('HTTP server closed, waiting for active requests to finish...');
    try {
      logger.info('Shutting down BullMQ workers...');
      await emailWorker.close();
      await indexWorker.close();
      logger.info('Workers closed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error occurred during graceful shutdown');
      process.exit(1);
    }
  });

  // Failsafe timeout to force exit if cleanup takes too long
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 20000); // 20 seconds
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
