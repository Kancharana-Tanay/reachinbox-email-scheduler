import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { logger } from './utils/logger';
import { sessionRedisClient } from './redis/sessionRedisClient';
import './auth/passport'; // ensure passport config is loaded

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin: isProduction ? process.env.FRONTEND_URL : (process.env.FRONTEND_URL || 'http://localhost:5173'),
    credentials: true,
  })
);

app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

sessionRedisClient.connect().catch((err) => {
  logger.error({ err }, 'Failed to connect session Redis client');
});

const redisStore = new RedisStore({
  client: sessionRedisClient,
  prefix: 'session:',
});

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: isProduction ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

import { authRoutes } from './routes/authRoutes';
import { campaignRoutes } from './routes/campaignRoutes';
import { emailRoutes } from './routes/emailRoutes';
import { senderRoutes } from './routes/senderRoutes';
import { slackRoutes } from './routes/slackRoutes';
import { serverAdapter } from './routes/bullBoard';

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/slack', slackRoutes);

// Health check endpoint for Render
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Bull Board with Basic Auth
app.use('/admin/queues', (req, res, next) => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (
    login &&
    password &&
    login === process.env.BULL_BOARD_USERNAME &&
    password === process.env.BULL_BOARD_PASSWORD
  ) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
}, serverAdapter.getRouter());

// Error middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err }, "An error occurred");
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export { app };
