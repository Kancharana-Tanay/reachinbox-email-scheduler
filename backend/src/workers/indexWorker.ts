import { Worker, Job } from 'bullmq';
import { redisConnection } from '../redis/redisClient';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { esClient } from '../db/elasticsearch';

export const indexWorker = new Worker(
  'email-index',
  async (job: Job) => {
    const { emailJobId } = job.data;
    
    const emailJob = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
      include: { campaign: true }
    });

    if (!emailJob) {
      logger.warn(`Job ${emailJobId} not found for indexing`);
      return;
    }

    try {
      await esClient.index({
        index: 'emails',
        id: emailJob.id,
        document: {
          id: emailJob.id,
          userId: emailJob.campaign.userId,
          senderId: emailJob.senderId,
          campaignId: emailJob.campaignId,
          recipient: emailJob.recipient,
          subject: emailJob.subject,
          body: emailJob.body,
          status: emailJob.status,
          scheduledAt: emailJob.scheduledAt,
          sentAt: emailJob.sentAt,
          createdAt: emailJob.createdAt,
        },
      });
      logger.info(`Indexed job ${emailJobId} into Elasticsearch`);
    } catch (err) {
      logger.error({ err: err }, `Failed to index job ${emailJobId}`);
      throw err;
    }
  },
  {
    connection: redisConnection,
  }
);
