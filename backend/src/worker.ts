import dotenv from 'dotenv';
dotenv.config();

import { logger } from './utils/logger';
import { validateWorkerEnv } from './config/env';

validateWorkerEnv();
import { emailWorker } from './workers/emailWorker';
import { indexWorker } from './workers/indexWorker';

logger.info('Workers started successfully');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server and workers');
  await emailWorker.close();
  await indexWorker.close();
  process.exit(0);
});
