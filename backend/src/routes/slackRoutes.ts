import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getSlackStatus, disconnectSlack, handleSlackCallback, getSlackConnectUrl } from '../controllers/slackController';

export const slackRoutes = Router();

// Callback does not necessarily require Auth if we pass state, but for MVP we assume cookie session is present during callback.
slackRoutes.get('/callback', handleSlackCallback);

slackRoutes.use(requireAuth);
slackRoutes.get('/status', getSlackStatus);
slackRoutes.post('/disconnect', disconnectSlack);
slackRoutes.get('/connect', getSlackConnectUrl);
