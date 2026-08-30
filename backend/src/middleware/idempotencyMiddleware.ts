import { Request, Response, NextFunction } from 'express';
import { redisConnection } from '../redis/redisClient';
import { logger } from '../utils/logger';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  const userId = (req.user as any)?.id;

  if (!idempotencyKey) {
    return next(); // Proceed normally if no key is provided (though strictly it should be required for production)
  }

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const redisKey = `idempotency:${userId}:${idempotencyKey}`;
  
  try {
    // Attempt to set the key if it does not exist. Expires in 24 hours.
    const setRes = await redisConnection.set(redisKey, 'PROCESSING', 'EX', 86400, 'NX');
    
    if (!setRes) {
      // Key already exists, this is a duplicate request
      return res.status(409).json({ error: 'Duplicate request detected' });
    }

    // Attach something to req so the controller can update the status on success, optional
    next();
  } catch (err) {
    logger.error({ err: err }, 'Redis idempotency error');
    next(); // Fail open or closed depending on requirements. We'll fail open for now.
  }
};
