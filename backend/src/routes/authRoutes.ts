import { Router } from 'express';
import passport from 'passport';
import { logger } from '../utils/logger';

export const authRoutes = Router();

authRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

authRoutes.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend dashboard.
    res.redirect(process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : 'http://localhost:5173/dashboard');
  }
);

authRoutes.get('/me', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

authRoutes.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({ success: true });
  });
});
