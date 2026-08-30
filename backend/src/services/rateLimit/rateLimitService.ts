import { redisConnection } from '../../redis/redisClient';
import { logger } from '../../utils/logger';

// 1. Minimum Delay Coordination
// Uses a simple atomic set NX PX (or similar) or just stores the timestamp of when the sender is next free.
// Concept: GET current next-send-time. If in past, set to now + delay. If in future, set to current + delay.
// We'll use a Lua script for atomicity.

const delayScript = `
  local key = KEYS[1]
  local delayMs = tonumber(ARGV[1])
  local nowMs = tonumber(ARGV[2])
  
  local currentNextSend = redis.call('GET', key)
  if currentNextSend == false then
    -- No previous send, safe to send now, reserve next slot
    redis.call('SET', key, nowMs + delayMs)
    return nowMs
  end
  
  local currentNextSendNum = tonumber(currentNextSend)
  if currentNextSendNum <= nowMs then
    -- Previous send was long ago, safe to send now, reserve next slot
    redis.call('SET', key, nowMs + delayMs)
    return nowMs
  else
    -- We must wait until currentNextSendNum
    -- DO NOT mutate the key! Let the worker wait and check again when it wakes up.
    return currentNextSendNum
  end
`;

export const enforceMinimumDelay = async (senderId: string, delayMs: number): Promise<{ delayMs: number }> => {
  try {
    const key = `sender-next-send:${senderId}`;
    const nowMs = Date.now();
    
    // Evaluate Lua script
    const nextAllowedSendMs = await redisConnection.eval(delayScript, 1, key, delayMs.toString(), nowMs.toString());
    
    const waitTime = Number(nextAllowedSendMs) - nowMs;
    
    if (waitTime <= 0) {
      return { delayMs: 0 }; // Allowed to send immediately
    } else {
      return { delayMs: waitTime }; // Must delay
    }
  } catch (err) {
    logger.error({ err: err }, 'Error enforcing minimum delay');
    return { delayMs: 0 }; // fail open if redis fails, or could fail closed
  }
};


// 2. Hourly Rate Limit
// Uses a fixed window counter. `email-rate:{senderId}:{YYYYMMDDHH}`

export const enforceRateLimit = async (senderId: string, hourlyLimit: number): Promise<{ allowed: boolean, nextWindowMs?: number }> => {
  try {
    const now = new Date();
    const hourString = now.toISOString().substring(0, 13); // e.g. "2023-10-27T14"
    const key = `email-rate:${senderId}:${hourString}`;
    
    const count = await redisConnection.incr(key);
    if (count === 1) {
      await redisConnection.expire(key, 3600); // 1 hour expiration
    }

    if (count > hourlyLimit) {
      // Calculate next window MS
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0); // start of next hour
      const nextWindowMs = nextHour.getTime();
      return { allowed: false, nextWindowMs };
    }

    return { allowed: true };
  } catch (err) {
    logger.error({ err: err }, 'Error enforcing hourly rate limit');
    return { allowed: true }; // fail open
  }
};
