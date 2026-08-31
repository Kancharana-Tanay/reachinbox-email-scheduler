import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { encrypt } from '../utils/encryption';

export const runSenderSeed = async () => {
  if (process.env.RUN_SENDER_SEED !== 'true') {
    return;
  }

  logger.info('[SenderSeed] Starting production sender seed...');

  const {
    SEED_USER_EMAIL,
    SENDER_1_NAME,
    SENDER_1_EMAIL,
    SENDER_1_SMTP_HOST,
    SENDER_1_SMTP_PORT,
    SENDER_1_SMTP_USERNAME,
    SENDER_1_SMTP_PASSWORD,
  } = process.env;

  if (!SEED_USER_EMAIL) {
    logger.error('[SenderSeed] SEED_USER_EMAIL is missing. Aborting seed.');
    return;
  }

  if (!SENDER_1_EMAIL || !SENDER_1_SMTP_HOST || !SENDER_1_SMTP_PASSWORD) {
    logger.error('[SenderSeed] Sender 1 environment variables are incomplete. Aborting seed.');
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: SEED_USER_EMAIL }
    });

    if (!user) {
      logger.error(`[SenderSeed] User with email ${SEED_USER_EMAIL} not found. Aborting seed. No dummy user will be created.`);
      return;
    }

    const encryptedPassword = encrypt(SENDER_1_SMTP_PASSWORD);

    const existingSender = await prisma.sender.findFirst({
      where: {
        userId: user.id,
        email: SENDER_1_EMAIL,
      }
    });

    if (existingSender) {
      await prisma.sender.update({
        where: { id: existingSender.id },
        data: {
          name: SENDER_1_NAME || 'Demo Sender',
          smtpHost: SENDER_1_SMTP_HOST,
          smtpPort: parseInt(SENDER_1_SMTP_PORT || '587', 10),
          smtpUsername: SENDER_1_SMTP_USERNAME || SENDER_1_EMAIL,
          encryptedSmtpPassword: encryptedPassword,
        }
      });
      logger.info(`[SenderSeed] Successfully updated sender for ${SENDER_1_EMAIL}`);
    } else {
      await prisma.sender.create({
        data: {
          userId: user.id,
          name: SENDER_1_NAME || 'Demo Sender',
          email: SENDER_1_EMAIL,
          smtpHost: SENDER_1_SMTP_HOST,
          smtpPort: parseInt(SENDER_1_SMTP_PORT || '587', 10),
          smtpUsername: SENDER_1_SMTP_USERNAME || SENDER_1_EMAIL,
          encryptedSmtpPassword: encryptedPassword,
        }
      });
      logger.info(`[SenderSeed] Successfully provisioned new sender for ${SENDER_1_EMAIL}`);
    }
  } catch (error) {
    logger.error({ err: error }, '[SenderSeed] Failed to provision sender');
  }
};
