import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';
import { redisConnection } from '../../redis/redisClient';
import axios from 'axios';

export const notifyRateLimitReached = async (senderId: string, limit: number, windowStr: string) => {
  try {
    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
      include: { user: { include: { slackConnections: true } } },
    });

    if (!sender) return;

    const slackConn = sender.user.slackConnections[0];
    if (!slackConn) return; // Slack not connected, do nothing, don't crash

    // Redis debounce check
    const hourWindow = new Date().toISOString().substring(0, 13);
    const debounceKey = `rate-limit-notified:${senderId}:${hourWindow}`;

    const setRes = await redisConnection.set(debounceKey, 'NOTIFIED', 'EX', 3600, 'NX');
    if (!setRes) {
      // Already notified this hour
      return;
    }

    const message = `⚠️ *Email rate limit reached*
Sender: ${sender.email}
Limit: ${limit} emails/hour
Current window: ${windowStr}
Jobs will resume in the next available window.`;

    // Attempt to send slack message using the token (which is stored in accessTokenEncrypted)
    // Note: in MVP, we might store plaintext or encrypt. For now, assuming accessTokenEncrypted holds the token.
    const token = slackConn.accessTokenEncrypted; 
    
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: slackConn.userId, // Send to the user who installed it, or a specific channel
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    logger.info(`Slack rate limit notification sent for sender ${senderId}`);
  } catch (err) {
    logger.error({ err: err }, 'Failed to send Slack notification');
    // DO NOT CRASH, email sending must continue
  }
};
