import { Queue } from 'bullmq';
import { redisConnection } from '../redis/redisClient';

export const emailQueue = new Queue('email-send', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: parseInt(process.env.MAX_RETRIES || '3', 10),
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const indexQueue = new Queue('email-index', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: parseInt(process.env.MAX_RETRIES || '3', 10),
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});
