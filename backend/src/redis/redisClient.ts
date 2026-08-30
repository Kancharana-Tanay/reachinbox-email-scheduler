import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  ...(isTLS ? { tls: {} } : {})
});

redisConnection.on('error', (err) => {
  console.error('Redis error:', err);
});
