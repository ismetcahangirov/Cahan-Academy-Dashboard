import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const { verifyIdTokenMock } = vi.hoisted(() => ({ verifyIdTokenMock: vi.fn() }));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdTokenMock;
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const googlePayload = (overrides = {}) => ({
  getPayload: () => ({
    email: 'google@example.com',
    email_verified: true,
    name: 'Google User',
    picture: 'https://example.com/a.png',
    sub: 'google-sub-1',
    ...overrides,
  }),
});

const PENDING_MESSAGE = 'Your account is waiting for admin approval.';

describe('POST /api/auth/google', () => {
  beforeEach(() => {
    verifyIdTokenMock.mockReset();
    verifyIdTokenMock.mockResolvedValue(googlePayload());
  });

  it('creates a new Google user as pending and does not log them in', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'cred' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe(PENDING_MESSAGE);
    expect(res.body.data).toBeUndefined();

    const user = await User.findOne({ email: 'google@example.com' });
    expect(user.status).toBe('pending');
    expect(user.role).toBe('student');
    expect(user.googleId).toBe('google-sub-1');
  });

  it('gives the same pending answer as password login', async () => {
    await User.create({ name: 'P', email: 'pending@example.com', password: 'Password1', status: 'pending' });
    const login = await request(app).post('/api/auth/login').send({ email: 'pending@example.com', password: 'Password1' });

    const google = await request(app).post('/api/auth/google').send({ credential: 'cred' });
    expect(google.statusCode).toBe(login.statusCode);
    expect(google.body.message).toBe(login.body.message);
  });

  it('still logs in an existing active user', async () => {
    await User.create({ name: 'Active', email: 'google@example.com', password: 'Password1', status: 'active' });

    const res = await request(app).post('/api/auth/google').send({ credential: 'cred' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    const user = await User.findOne({ email: 'google@example.com' });
    expect(user.googleId).toBe('google-sub-1');
  });

  it('rejects an unverified Google email', async () => {
    verifyIdTokenMock.mockResolvedValue(googlePayload({ email_verified: false }));

    const res = await request(app).post('/api/auth/google').send({ credential: 'cred' });

    expect(res.statusCode).toBe(401);
    expect(await User.countDocuments()).toBe(0);
  });
});
