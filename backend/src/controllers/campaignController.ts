import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { calculateInitialSchedules } from '../services/scheduler/scheduleStrategy';
import { emailQueue } from '../queues/emailQueue';
import { logger } from '../utils/logger';

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { senderId, subject, body, leads, startTime, delayMs, hourlyLimit } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Validate sender belongs to user
    const sender = await prisma.sender.findFirst({
      where: { id: senderId, userId },
    });

    if (!sender) {
      return res.status(404).json({ error: 'Sender not found or does not belong to you' });
    }

    const parsedStartTime = new Date(startTime);
    if (parsedStartTime.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Start time must be in the future' });
    }

    // Process leads
    const uniqueLeads = Array.from(new Set(leads as string[]));
    const MAX_LEADS = parseInt(process.env.MAX_LEADS_PER_REQUEST || '10000', 10);
    if (uniqueLeads.length > MAX_LEADS) {
      return res.status(400).json({ error: `Cannot exceed ${MAX_LEADS} leads per request` });
    }

    // Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        senderId,
        subject,
        body,
        startTime: parsedStartTime,
        delayMs: delayMs || parseInt(process.env.DEFAULT_EMAIL_DELAY_MS || '2000', 10),
        hourlyLimit: hourlyLimit || parseInt(process.env.DEFAULT_MAX_EMAILS_PER_HOUR || '100', 10),
        status: 'SCHEDULED',
      },
    });

    const schedules = calculateInitialSchedules(
      parsedStartTime,
      campaign.delayMs,
      campaign.hourlyLimit,
      uniqueLeads.length
    );

    const emailJobsData = uniqueLeads.map((recipient, index) => ({
      campaignId: campaign.id,
      senderId: campaign.senderId,
      recipient,
      subject: campaign.subject,
      body: campaign.body,
      sequenceNumber: index + 1,
      scheduledAt: schedules[index],
      status: 'SCHEDULED',
    }));

    await prisma.emailJob.createMany({
      data: emailJobsData,
    });

    // Fetch created jobs to get their IDs
    const createdJobs = await prisma.emailJob.findMany({
      where: { campaignId: campaign.id },
      orderBy: { sequenceNumber: 'asc' },
    });

    // Enqueue jobs to BullMQ
    const bullJobs = createdJobs.map((job: any) => ({
      name: 'send-email',
      data: { emailJobId: job.id },
      opts: {
        jobId: job.id, // Idempotency key for BullMQ
        delay: Math.max(0, job.scheduledAt.getTime() - Date.now()),
      },
    }));

    await emailQueue.addBulk(bullJobs);

    // Update jobs with BullMQ job IDs
    // For simplicity, we assume job.id is the bullJobId since we enforced it.
    await prisma.emailJob.updateMany({
      where: { campaignId: campaign.id },
      data: { bullJobId: 'use-email-job-id' }, 
    });

    res.status(201).json({ message: 'Campaign scheduled', campaignId: campaign.id, count: createdJobs.length });
  } catch (err: any) {
    logger.error({ err: err }, 'Failed to create campaign');
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { name: true, email: true }
        }
      }
    });
    res.json(campaigns);
  } catch (err: any) {
    logger.error({ err: err }, 'Failed to get campaigns');
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
