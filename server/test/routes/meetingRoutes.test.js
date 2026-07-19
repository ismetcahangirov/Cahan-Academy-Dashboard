import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import meetingRoutes from '../../routes/meetingRoutes.js';
import Schedule from '../../models/Schedule.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import Meeting from '../../models/Meeting.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/meetings', meetingRoutes);
app.use(errorHandler);

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Meeting API — moderator gate', () => {
  let teacher, student, outsider, admin, group, schedule;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 2026-07-20 06:30Z = 10:30 Asia/Baku (Monday), inside 10:00-12:00.
    vi.setSystemTime(new Date('2026-07-20T06:30:00Z'));

    teacher = await User.create({ name: 'T', email: 't@x.com', password: 'Password1', role: 'teacher', status: 'active' });
    student = await User.create({ name: 'S', email: 's@x.com', password: 'Password1', role: 'student', status: 'active' });
    outsider = await User.create({ name: 'O', email: 'o@x.com', password: 'Password1', role: 'student', status: 'active' });
    admin = await User.create({ name: 'A', email: 'a@x.com', password: 'Password1', role: 'admin', status: 'active' });
    group = await Group.create({ name: 'G', course: 'C', teacher: teacher._id, students: [student._id] });
    schedule = await Schedule.create({
      group: group._id, teacher: teacher._id, subject: 'Math',
      repetitionType: 'weekly', dayOfWeek: 0, startTime: '10:00', endTime: '12:00', type: 'online',
    });
  });

  afterEach(() => { vi.useRealTimers(); });

  const join = (tok, body = {}) =>
    request(app).post(`/api/meetings/join-or-create/${schedule._id}`).set('Authorization', `Bearer ${tok}`).send(body);
  const start = (tok, id) =>
    request(app).post(`/api/meetings/${id}/start`).set('Authorization', `Bearer ${tok}`);

  it('teacher opens the room and is marked host', async () => {
    const res = await join(token(teacher._id));
    expect(res.statusCode).toBe(200);
    expect(res.body.data.roomName).toMatch(/^cahanacademy-/);
    expect(res.body.data.isHost).toBe(true);
    expect(res.body.data.token).toBeNull(); // JWT not configured on the free server
  });

  it('admin is host', async () => {
    const res = await join(token(admin._id));
    expect(res.statusCode).toBe(200);
    expect(res.body.data.isHost).toBe(true);
  });

  it('student is blocked until the host has started', async () => {
    await join(token(teacher._id)); // host opens the room (startedAt still null)
    const before = await join(token(student._id));
    expect(before.statusCode).toBe(403);
  });

  it('student can join after the host starts the meeting', async () => {
    const t = await join(token(teacher._id));
    const meetingId = t.body.data.meetingId;
    expect((await start(token(teacher._id), meetingId)).statusCode).toBe(200);

    const s = await join(token(student._id));
    expect(s.statusCode).toBe(200);
    expect(s.body.data.isHost).toBe(false);
    expect(s.body.data.roomName).toBe(t.body.data.roomName);
  });

  it('student cannot start the meeting', async () => {
    const t = await join(token(teacher._id));
    expect((await start(token(student._id), t.body.data.meetingId)).statusCode).toBe(403);
  });

  it('outsider is forbidden', async () => {
    expect((await join(token(outsider._id))).statusCode).toBe(403);
  });

  it('rejects a non-online schedule', async () => {
    schedule.type = 'offline'; await schedule.save();
    expect((await join(token(teacher._id))).statusCode).toBe(400);
  });

  it('forbids joining before the time window', async () => {
    vi.setSystemTime(new Date('2026-07-20T03:00:00Z')); // 07:00 Baku, before 09:50
    expect((await join(token(teacher._id))).statusCode).toBe(403);
  });

  it('is idempotent for the host: same room, one Meeting doc', async () => {
    const r1 = await join(token(teacher._id));
    const r2 = await join(token(teacher._id));
    expect(r1.body.data.roomName).toBe(r2.body.data.roomName);
    expect(await Meeting.countDocuments({ schedule: schedule._id })).toBe(1);
  });

  it('issues a moderator JWT for the host when JWT is configured', async () => {
    process.env.JITSI_JWT_APP_ID = 'app';
    process.env.JITSI_JWT_SECRET = 'sec';
    try {
      const res = await join(token(teacher._id));
      expect(typeof res.body.data.token).toBe('string');
      const decoded = jwt.verify(res.body.data.token, 'sec');
      expect(decoded.context.user.moderator).toBe(true);
    } finally {
      delete process.env.JITSI_JWT_APP_ID;
      delete process.env.JITSI_JWT_SECRET;
    }
  });
});
