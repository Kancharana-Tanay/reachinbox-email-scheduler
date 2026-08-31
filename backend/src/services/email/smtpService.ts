import nodemailer from 'nodemailer';
import { Sender, EmailJob } from '@prisma/client';
import { decrypt } from '../../utils/encryption';

export const sendEmail = async (sender: Sender, emailJob: EmailJob): Promise<string> => {
  const decryptedPassword = decrypt(sender.encryptedSmtpPassword);

  const transporter = nodemailer.createTransport({
    host: sender.smtpHost,
    port: sender.smtpPort,
    secure: sender.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: sender.smtpUsername,
      pass: decryptedPassword,
    },
  });

  const info = await transporter.sendMail({
    from: `"${sender.name}" <${sender.email}>`,
    to: emailJob.recipient,
    subject: emailJob.subject,
    text: emailJob.body,
    html: `<p>${emailJob.body.replace(/\n/g, '<br>')}</p>`,
  });

  return info.messageId;
};
