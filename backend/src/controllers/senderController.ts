import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export const getSenders = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    
    // We only return safe fields, NEVER the password
    const senders = await prisma.sender.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        email: true,
        smtpHost: true,
        smtpPort: true,
        smtpUsername: true,
        createdAt: true,
      }
    });

    res.json(senders);
  } catch (err) {
    logger.error({ err: err }, 'Failed to get senders');
    res.status(500).json({ error: 'Internal server error' });
  }
};
