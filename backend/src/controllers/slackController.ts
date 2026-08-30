import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import axios from 'axios';

export const getSlackStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const connection = await prisma.slackConnection.findUnique({
      where: { userId },
    });
    res.json({ connected: !!connection, workspaceName: connection?.workspaceName });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const disconnectSlack = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    await prisma.slackConnection.delete({ where: { userId } });
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.json({ success: true }); // Already not connected
    }
    logger.error({ err: err }, 'Failed to disconnect slack');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Slack OAuth Callback (handled directly in routes if needed, or here)
export const handleSlackCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const userId = (req.user as any)?.id;

  if (!code || !userId) {
    return res.redirect(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : 'http://localhost:5173/dashboard');
  }

  try {
    const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_CALLBACK_URL || 'http://localhost:4000/api/slack/callback'
      }
    });

    const { ok, access_token, team } = tokenResponse.data;

    if (ok && access_token) {
      await prisma.slackConnection.upsert({
        where: { userId },
        update: {
          accessTokenEncrypted: access_token,
          workspaceId: team.id,
          workspaceName: team.name,
        },
        create: {
          userId,
          accessTokenEncrypted: access_token,
          workspaceId: team.id,
          workspaceName: team.name,
        }
      });
    } else {
      logger.error({ err: tokenResponse.data }, 'Slack oauth failed');
    }
  } catch (err) {
    logger.error({ err: err }, 'Slack oauth request failed');
  }

  res.redirect(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : 'http://localhost:5173/dashboard');
};

export const getSlackConnectUrl = (req: Request, res: Response) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_CALLBACK_URL || 'http://localhost:4000/api/slack/callback';
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=chat:write&redirect_uri=${redirectUri}`;
  res.json({ url });
};
