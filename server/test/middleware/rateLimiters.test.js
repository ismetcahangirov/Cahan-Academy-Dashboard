import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { applyRateLimits, API_LIMIT, AUTH_LIMIT } from '../../middleware/rateLimiters.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  applyRateLimits(app);
  app.post('/api/auth/login', (req, res) =>
    req.body.password === 'right' ? res.json({ ok: true }) : res.status(401).json({ ok: false })
  );
  app.post('/api/auth/forgot-password', (req, res) => res.json({ ok: true }));
  app.post('/api/auth/register', (req, res) => res.status(201).json({ ok: true }));
  app.post('/api/auth/register-invitation/:token', (req, res) => res.status(201).json({ ok: true }));
  app.post('/api/auth/reset-password/:token', (req, res) => res.json({ ok: true }));
  app.get('/api/ping', (req, res) => res.json({ ip: req.ip }));
  return app;
};

const repeat = async (n, fn) => {
  const statuses = [];
  for (let i = 0; i < n; i += 1) statuses.push((await fn()).statusCode);
  return statuses;
};

describe('rate limiting', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
  });

  it('trusts exactly one proxy hop so the client IP comes from X-Forwarded-For', async () => {
    expect(app.get('trust proxy')).toBe(1);

    const res = await request(app).get('/api/ping').set('X-Forwarded-For', '203.0.113.7');

    expect(res.body.ip).toBe('203.0.113.7');
  });

  it('lets a busy dashboard session through the general API limit', async () => {
    const statuses = await repeat(300, () => request(app).get('/api/ping'));

    expect(statuses.every((s) => s === 200)).toBe(true);
    expect(API_LIMIT).toBeGreaterThanOrEqual(1000);
  });

  it('does not count successful logins', async () => {
    const statuses = await repeat(AUTH_LIMIT + 10, () =>
      request(app).post('/api/auth/login').send({ password: 'right' })
    );

    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  it('blocks repeated failed logins per client IP only', async () => {
    const attacker = () =>
      request(app).post('/api/auth/login').set('X-Forwarded-For', '198.51.100.1').send({ password: 'wrong' });

    const statuses = await repeat(AUTH_LIMIT + 1, attacker);

    expect(statuses.slice(0, AUTH_LIMIT).every((s) => s === 401)).toBe(true);
    expect(statuses[AUTH_LIMIT]).toBe(429);

    const otherClient = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.2')
      .send({ password: 'right' });
    expect(otherClient.statusCode).toBe(200);
  });

  it.each([
    ['/api/auth/forgot-password'],
    ['/api/auth/register'],
    ['/api/auth/register-invitation/abc'],
    ['/api/auth/reset-password/abc'],
  ])('throttles %s after the strict limit', async (path) => {
    const statuses = await repeat(AUTH_LIMIT + 1, () => request(app).post(path).send({}));

    expect(statuses.slice(0, AUTH_LIMIT).every((s) => s < 400)).toBe(true);
    expect(statuses[AUTH_LIMIT]).toBe(429);
  });

  it('keeps the strict limit off ordinary API routes', async () => {
    await repeat(AUTH_LIMIT + 1, () => request(app).post('/api/auth/forgot-password').send({}));

    const res = await request(app).get('/api/ping');

    expect(res.statusCode).toBe(200);
  });
});
