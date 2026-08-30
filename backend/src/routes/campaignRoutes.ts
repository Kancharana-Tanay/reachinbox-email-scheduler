import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { createCampaign, getCampaigns } from '../controllers/campaignController';
import { idempotencyMiddleware } from '../middleware/idempotencyMiddleware';

export const campaignRoutes = Router();

campaignRoutes.use(requireAuth);

campaignRoutes.post('/', idempotencyMiddleware, createCampaign);
campaignRoutes.get('/', getCampaigns);
