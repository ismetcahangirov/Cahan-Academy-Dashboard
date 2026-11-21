import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import teacherRoutes from '../../routes/teacherRoutes.js';
import Group from '../../models/Group.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/teachers', teacherRoutes);
app.use(errorHandler);

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const makeUser = (role, email, name, status = 'active') =>
  User.create({ name, email, password: 'Password1', role, status });

describe('GET /api/teachers', () => {
  let admin, ann, ben;

  beforeEach(async () => {
    admin = await makeUser('admin', 'tc-admin@example.com', 'Admin');
    ann = await makeUser('teacher', 'ann@example.com', 'Ann');
    ben = await makeUser('teacher', 'ben@example.com', 'Ben', 'inactive');
    await makeUser('teacher', 'cid@example.com', 'Cid');
    const s1 = await makeUser('student', 's1@example.com', 'S1');
    const s2 = await makeUser('student', 's2@example.com', 'S2');

    await Group.create({ name: 'G1', course: 'C', teacher: ann._id, students: [s1._id, s2._id] });
    await Group.create({ name: 'G2', course: 'C', teacher: ann._id, students: [s1._id] });
    await Group.create({ name: 'G3', course: 'C', teacher: ben._id, students: [] });
  });

  const get = (user, query = '') =>
    request(app).get(`/api/teachers${query}`).set('Authorization', `Bearer ${tokenFor(user)}`);

  it('returns real group/student counts and totals for all pages', async () => {
    const res = await get(admin, '?limit=2&sort=name&order=asc');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((t) => [t.name, t.groupCount, t.studentCount])).toEqual([
      ['Ann', 2, 2],
      ['Ben', 1, 0],
    ]);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, pages: 2, active: 2, groupsTotal: 3 });
  });

  it('treats search as plain text', async () => {
    const res = await get(admin, '?search=(');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('is admin only', async () => {
    const res = await get(ann);

    expect(res.statusCode).toBe(403);
  });
});
