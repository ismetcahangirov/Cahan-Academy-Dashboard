import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import authRoutes from '../../routes/authRoutes.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn() }));

vi.mock('../../utils/sendEmail.js', async (importOriginal) => ({
  ...(await importOriginal()),
  default: sendEmailMock,
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

describe('Password reset', () => {
  beforeAll(() => {
    process.env.CLIENT_URL = 'https://client.example.com';
  });

  beforeEach(() => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
  });

  const createUser = () => User.create({
    name: 'Reset User',
    email: 'reset@example.com',
    password: 'Password1',
    status: 'active',
  });

  it('emails a reset link and never returns the token', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'Reset@Example.com' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeNull();
    expect(JSON.stringify(res.body)).not.toMatch(/[a-f0-9]{64}/);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const mail = sendEmailMock.mock.calls[0][0];
    expect(mail.email).toBe('reset@example.com');
    const match = mail.html.match(/https:\/\/client\.example\.com\/reset-password\/([a-f0-9]{64})/);
    expect(match).not.toBeNull();

    const stored = await User.findById(user._id);
    expect(stored.resetPasswordToken).toBe(hash(match[1]));
    expect(stored.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
  });

  it('answers the same for an unknown email and sends nothing', async () => {
    await createUser();
    const known = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@example.com' });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });

    expect(unknown.statusCode).toBe(200);
    expect(unknown.body).toEqual(known.body);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it('clears the token and returns 500 when the email cannot be sent', async () => {
    const user = await createUser();
    sendEmailMock.mockRejectedValueOnce(new Error('SMTP down'));

    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@example.com' });

    expect(res.statusCode).toBe(500);
    expect(res.body.data).toBeUndefined();
    const stored = await User.findById(user._id);
    expect(stored.resetPasswordToken).toBeUndefined();
    expect(stored.resetPasswordExpire).toBeUndefined();
  });

  it('resets the password with a valid token and clears it after use', async () => {
    const user = await createUser();
    user.resetPasswordToken = hash('validtoken');
    user.resetPasswordExpire = Date.now() + 60_000;
    await user.save();

    const res = await request(app).post('/api/auth/reset-password/validtoken').send({ password: 'NewPassword2' });
    expect(res.statusCode).toBe(200);

    const stored = await User.findById(user._id).select('+password');
    expect(await stored.matchPassword('NewPassword2')).toBe(true);
    expect(stored.resetPasswordToken).toBeUndefined();
    expect(stored.resetPasswordExpire).toBeUndefined();

    const reuse = await request(app).post('/api/auth/reset-password/validtoken').send({ password: 'Another3' });
    expect(reuse.statusCode).toBe(400);
  });

  it('rejects an expired token and a weak password', async () => {
    const user = await createUser();
    user.resetPasswordToken = hash('expiredtoken');
    user.resetPasswordExpire = Date.now() - 1000;
    await user.save();

    const expired = await request(app).post('/api/auth/reset-password/expiredtoken').send({ password: 'NewPassword2' });
    expect(expired.statusCode).toBe(400);

    user.resetPasswordToken = hash('freshtoken');
    user.resetPasswordExpire = Date.now() + 60_000;
    await user.save();

    const weak = await request(app).post('/api/auth/reset-password/freshtoken').send({ password: 'abcdef' });
    expect(weak.statusCode).toBe(400);
    const stored = await User.findById(user._id).select('+password');
    expect(await stored.matchPassword('Password1')).toBe(true);
  });
});
