import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const emails = await prisma.emailJob.findMany({
      where: { 
        campaign: { userId },
        status: 'SCHEDULED'
      },
      include: {
        sender: { select: { email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 100, // pagination could be added
    });
    res.json(emails);
  } catch (err) {
    logger.error({ err: err }, 'Failed to get scheduled emails');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const emails = await prisma.emailJob.findMany({
      where: { 
        campaign: { userId },
        status: { in: ['SENT', 'FAILED'] }
      },
      include: {
        sender: { select: { email: true } },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
    res.json(emails);
  } catch (err) {
    logger.error({ err: err }, 'Failed to get sent emails');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelEmail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req.user as any)?.id;

    // We must ensure the email job belongs to the user and is SCHEDULED
    const job = await prisma.emailJob.findFirst({
      where: { id, campaign: { userId }, status: 'SCHEDULED' },
    });

    if (!job) {
      return res.status(404).json({ error: 'Scheduled email not found or cannot be cancelled' });
    }

    // Atomic update to avoid race conditions with worker
    const updated = await prisma.emailJob.updateMany({
      where: { id, status: 'SCHEDULED' },
      data: { status: 'CANCELLED' },
    });

    if (updated.count === 0) {
      return res.status(409).json({ error: 'Email has already started processing or was cancelled' });
    }

    // Note: The worker checks the DB status before processing, 
    // but we can also optionally remove it from BullMQ here if we have the reference.
    // For simplicity, the worker verifying status = SCHEDULED is safe enough.

    res.json({ success: true });
  } catch (err) {
    logger.error({ err: err }, 'Failed to cancel email');
    res.status(500).json({ error: 'Internal server error' });
  }
};
