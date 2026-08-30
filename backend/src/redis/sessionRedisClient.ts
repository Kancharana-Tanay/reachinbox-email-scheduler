import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// node-redis handles tls automatically if url is rediss://
// but we want to make sure we don't accidentally reject unauthorized if self-signed, 
// though the user said "Do not disable TLS certificate verification."
// So we just pass the URL directly.
export const sessionRedisClient = createClient({
  url: redisUrl,
});

sessionRedisClient.on('error', (err) => {
  logger.error({ err }, 'Session Redis Client Error');
});

sessionRedisClient.on('connect', () => {
  logger.info('Session Redis Client Connected');
});
