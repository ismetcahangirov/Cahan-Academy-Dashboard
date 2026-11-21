import rateLimit from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

export const API_LIMIT = 1000;
export const AUTH_LIMIT = 20;

// Endpoints that must resist brute force and abuse (login is limited separately)
export const AUTH_LIMITED_PATHS = [
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/register',
  '/api/auth/register-invitation',
];

const limiter = (limit, message, extra = {}) =>
  rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
    ...extra,
  });

export const applyRateLimits = (app) => {
  // Vercel sits in front of the app: take the client IP from its X-Forwarded-For entry
  app.set('trust proxy', 1);

  // Only failed logins count, so a class logging in from one network is not locked out
  app.use(
    '/api/auth/login',
    limiter(AUTH_LIMIT, 'Çox sayda uğursuz giriş cəhdi. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.', {
      skipSuccessfulRequests: true,
    })
  );
  app.use(
    AUTH_LIMITED_PATHS,
    limiter(AUTH_LIMIT, 'Bu IP-dən çox sayda sorğu. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.')
  );
  app.use(
    '/api',
    limiter(API_LIMIT, 'Çox sayda sorğu göndərildi. Zəhmət olmasa bir az sonra yenidən cəhd edin.')
  );
};
