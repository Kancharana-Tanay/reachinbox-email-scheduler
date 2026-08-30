import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found from Google profile'), false);
          }

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: email,
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
              },
            });
          } else if (!user.googleId) {
            // Link google account to existing email
            user = await prisma.user.update({
              where: { email },
              data: {
                googleId: profile.id,
                name: user.name || profile.displayName,
                avatarUrl: user.avatarUrl || profile.photos?.[0]?.value,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          logger.error({ err: error }, 'Google Auth Error:');
          return done(error, false);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth credentials not found. Authentication will fail.');
}
