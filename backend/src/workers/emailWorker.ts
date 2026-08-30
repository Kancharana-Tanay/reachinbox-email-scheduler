import { Worker, Job, DelayedError } from 'bullmq';
import { redisConnection } from '../redis/redisClient';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/email/smtpService';
import { enforceRateLimit, enforceMinimumDelay } from '../services/rateLimit/rateLimitService';
import { notifyRateLimitReached } from '../services/slack/slackService';
import { indexQueue } from '../queues/emailQueue';

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '8', 10);

export const emailWorker = new Worker(
  'email-send',
  async (job: Job) => {
    const { emailJobId } = job.data;
    
    // 1. Worker Idempotency: Acquire ownership
    const updateResult = await prisma.emailJob.updateMany({
      where: { id: emailJobId, status: 'SCHEDULED' },
      data: { status: 'PROCESSING' }
    });

    if (updateResult.count === 0) {
      // Job might be CANCELLED, already SENT, or PROCESSING by another worker.
      // We can also fetch it to log why it skipped.
      const existingJob = await prisma.emailJob.findUnique({ where: { id: emailJobId } });
      if (existingJob?.status === 'SENT') {
        logger.warn(`Job ${emailJobId} already sent, skipping.`);
      } else {
        logger.warn(`Job ${emailJobId} status is ${existingJob?.status}, skipping processing.`);
      }
      return;
    }

    const emailJob = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
      include: {
        campaign: true,
        sender: true
      }
    });

    if (!emailJob) {
      logger.error(`Job ${emailJobId} not found in database.`);
      return;
    }

    const sender = emailJob.sender;
    const campaign = emailJob.campaign;

    // 2. Minimum Delay Coordination
    const delayAction = await enforceMinimumDelay(sender.id, campaign.delayMs);
    if (delayAction.delayMs > 0) {
      // Reschedule job to delayMs
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'SCHEDULED' }
      });
      await job.moveToDelayed(Date.now() + delayAction.delayMs, job.token!);
      logger.info(`Job ${emailJobId} rescheduled due to minimum delay by ${delayAction.delayMs}ms`);
      throw new DelayedError();
    }

    // 3. Hourly Rate Limit
    const rateLimitCheck = await enforceRateLimit(sender.id, campaign.hourlyLimit);
    if (!rateLimitCheck.allowed) {
      // Reschedule to next window
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'SCHEDULED' }
      });
      await job.moveToDelayed(rateLimitCheck.nextWindowMs!, job.token!);
      logger.info(`Job ${emailJobId} rescheduled to next hourly window due to rate limit`);
      
      const now = new Date();
      const hourStr = `${now.getHours()}:00-${now.getHours() + 1}:00`;
      await notifyRateLimitReached(sender.id, campaign.hourlyLimit, hourStr);
      
      throw new DelayedError();
    }

    // 4. Send Email
    try {
      const messageId = await sendEmail(sender, emailJob);
      
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          providerMessageId: messageId,
          attempts: { increment: 1 }
        }
      });
      logger.info(`Job ${emailJobId} SENT successfully. MsgId: ${messageId}`);
      
      // Enqueue for indexing
      await indexQueue.add('index-email', { emailJobId });
    } catch (sendError: any) {
      logger.error({ err: sendError }, `Failed to send email job ${emailJobId}`);
      
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          attempts: { increment: 1 },
          lastError: sendError.message
        }
      });
      
      // We will let BullMQ handle the retry mechanism if it throws.
      // If retries are exhausted, BullMQ will emit a failed event.
      throw sendError; 
    }
  },
  {
    connection: redisConnection,
    concurrency: concurrency,
  }
);

emailWorker.on('failed', async (job, err) => {
  if (err.name === 'DelayedError') {
    return; // This is a rescheduled job, not a failure
  }
  
  if (job?.data?.emailJobId) {
    logger.error(`Job ${job.data.emailJobId} failed. Err: ${err.message}`);
    // If it's exhausted all retries, BullMQ moves it to failed queue.
    // The attempts logic in bullMQ will trigger this 'failed' event repeatedly on each attempt.
    // To handle permanent failure, we can check if job.attemptsMade >= job.opts.attempts
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      await prisma.emailJob.updateMany({
        where: { id: job.data.emailJobId },
        data: {
          status: 'FAILED',
          failedAt: new Date()
        }
      });
      // Enqueue for indexing on permanent failure
      await indexQueue.add('index-email', { emailJobId: job.data.emailJobId });
    } else {
       // It will be retried, so we revert it back to SCHEDULED so that the worker idempotency passes again
       await prisma.emailJob.updateMany({
         where: { id: job.data.emailJobId },
         data: {
           status: 'SCHEDULED'
         }
       });
    }
  }
});
