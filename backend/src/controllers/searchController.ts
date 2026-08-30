import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { esClient } from '../db/elasticsearch';

export const searchEmails = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    try {
      // Attempt Elasticsearch search
      const result = await esClient.search({
        index: 'emails',
        body: {
          query: {
            bool: {
              must: [
                { term: { userId } },
                {
                  multi_match: {
                    query: q,
                    fields: ['recipient', 'subject', 'body', 'status'],
                  },
                },
              ],
            },
          },
        } as any,
      });

      const hits = result.hits.hits.map((hit: any) => hit._source);
      return res.json(hits);
    } catch (esError: any) {
      logger.warn('Elasticsearch search failed, falling back to PostgreSQL', esError.message);
      
      // Fallback to PostgreSQL
      const emails = await prisma.emailJob.findMany({
        where: {
          campaign: { userId },
          OR: [
            { recipient: { contains: q, mode: 'insensitive' } },
            { subject: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
          ],
        },
        include: {
          sender: { select: { email: true } },
        },
        take: 50,
      });

      return res.json(emails);
    }
  } catch (err) {
    logger.error({ err: err }, 'Failed to search emails');
    res.status(500).json({ error: 'Internal server error' });
  }
};
