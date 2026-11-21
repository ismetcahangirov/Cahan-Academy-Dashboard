import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import invitationRoutes from '../../routes/invitationRoutes.js';
import authRoutes from '../../routes/authRoutes.js';
import Invitation from '../../models/Invitation.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn() }));

vi.mock('../../utils/sendEmail.js', async (importOriginal) => ({
  ...(await importOriginal()),
  default: sendEmailMock,
}));

const app = express();
app.use(express.json());
app.use('/api/invitations', invitationRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Invitations', () => {
  let adminToken;
  let admin;

  beforeAll(() => {
    process.env.CLIENT_URL = 'https://client.example.com';
  });

  beforeEach(async () => {
    sendEmailMock.mockReset();
    sendEmailMock.mockResolvedValue(undefined);
    admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Password1',
      role: 'admin',
      status: 'active',
    });
    adminToken = tokenFor(admin._id);
  });

  it('generates a token on save', async () => {
    const invitation = await Invitation.create({
      email: 'model@example.com',
      role: 'student',
      invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(invitation.token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates an invitation and emails the accept link', async () => {
    const res = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'Teacher@Example.com', role: 'teacher' });

    expect(res.statusCode).toBe(200);
    const invitation = await Invitation.findOne({ email: 'teacher@example.com' });
    expect(invitation.status).toBe('pending');

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const mail = sendEmailMock.mock.calls[0][0];
    expect(mail.email).toBe('teacher@example.com');
    expect(mail.html).toContain(`https://client.example.com/accept-invitation/${invitation.token}`);
  });

  it('reports a clear error and removes the invitation when the email fails', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('SMTP down'));

    const res = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'fail@example.com', role: 'student' });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/email could not be sent/i);
    expect(await Invitation.countDocuments()).toBe(0);
  });

  it('rejects an invalid role', async () => {
    const res = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'x@example.com', role: 'admin' });

    expect(res.statusCode).toBe(400);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('lets the invitee verify the token and register', async () => {
    const invitation = await Invitation.create({
      email: 'invitee@example.com',
      role: 'teacher',
      invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const verify = await request(app).get(`/api/invitations/verify/${invitation.token}`);
    expect(verify.statusCode).toBe(200);
    expect(verify.body.data).toEqual({ email: 'invitee@example.com', role: 'teacher' });

    const res = await request(app)
      .post(`/api/auth/register-invitation/${invitation.token}`)
      .send({ name: 'Invited Teacher', password: 'Password1' });

    expect(res.statusCode).toBe(201);
    const user = await User.findOne({ email: 'invitee@example.com' });
    expect(user.role).toBe('teacher');
    expect(user.status).toBe('active');
    expect((await Invitation.findById(invitation._id)).status).toBe('accepted');
  });
});
