import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getScheduledEmails, getSentEmails, cancelEmail } from '../controllers/emailController';
import { searchEmails } from '../controllers/searchController'; // We will create this next

export const emailRoutes = Router();

emailRoutes.use(requireAuth);

emailRoutes.get('/scheduled', getScheduledEmails);
emailRoutes.get('/sent', getSentEmails);
emailRoutes.get('/search', searchEmails);
emailRoutes.post('/:id/cancel', cancelEmail);
