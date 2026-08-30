import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo sender...');

  // 1. Create a dummy user if none exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
      }
    });
  }

  // 2. Check env for Sender 1
  if (process.env.SENDER_1_EMAIL && process.env.SENDER_1_SMTP_HOST) {
    await prisma.sender.upsert({
      where: {
        id: 'demo-sender-1' // Not technically valid since id is UUID, but we can query by some unique field if we want.
        // Prisma doesn't have unique on sender email per user by default, but we can just clear existing and create.
      },
      update: {},
      create: {
        userId: user.id,
        name: process.env.SENDER_1_NAME || 'Demo Sender',
        email: process.env.SENDER_1_EMAIL,
        smtpHost: process.env.SENDER_1_SMTP_HOST,
        smtpPort: parseInt(process.env.SENDER_1_SMTP_PORT || '587', 10),
        smtpUsername: process.env.SENDER_1_SMTP_USERNAME || '',
        encryptedSmtpPassword: process.env.SENDER_1_SMTP_PASSWORD || '',
      }
    }).catch(async (e) => {
      // If we don't have a unique constraint, we can just create it if it doesn't exist.
      const existing = await prisma.sender.findFirst({ where: { email: process.env.SENDER_1_EMAIL } });
      if (!existing) {
        await prisma.sender.create({
          data: {
            userId: user!.id,
            name: process.env.SENDER_1_NAME || 'Demo Sender',
            email: process.env.SENDER_1_EMAIL!,
            smtpHost: process.env.SENDER_1_SMTP_HOST!,
            smtpPort: parseInt(process.env.SENDER_1_SMTP_PORT || '587', 10),
            smtpUsername: process.env.SENDER_1_SMTP_USERNAME || '',
            encryptedSmtpPassword: process.env.SENDER_1_SMTP_PASSWORD || '',
          }
        });
      }
    });
    console.log('Seeded Sender 1');
  } else {
    console.log('No SENDER_1_EMAIL found in env, skipping sender seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
