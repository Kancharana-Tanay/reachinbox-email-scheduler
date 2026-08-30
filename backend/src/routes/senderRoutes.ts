import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getSenders } from '../controllers/senderController';

export const senderRoutes = Router();

senderRoutes.use(requireAuth);

senderRoutes.get('/', getSenders);
