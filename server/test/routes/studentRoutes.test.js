import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import studentRoutes from '../../routes/studentRoutes.js';
import Group from '../../models/Group.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/students', studentRoutes);
app.use(errorHandler);

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const makeUser = (role, email, name = email.split('@')[0]) =>
  User.create({ name, email, password: 'Password1', role, status: 'active' });

describe('Students API', () => {
  let admin, teacher, otherTeacher, alice, bob, carol, loner;
  let groupA, groupB, groupC;

  beforeEach(async () => {
    admin = await makeUser('admin', 'st-admin@example.com');
    teacher = await makeUser('teacher', 'st-teacher@example.com');
    otherTeacher = await makeUser('teacher', 'st-teacher2@example.com');
    alice = await makeUser('student', 'alice@example.com', 'Alice');
    bob = await makeUser('student', 'bob@example.com', 'Bob');
    carol = await makeUser('student', 'carol@example.com', 'Carol');
    loner = await makeUser('student', 'loner@example.com', 'Loner');

    groupA = await Group.create({ name: 'Alpha', course: 'C', teacher: teacher._id, students: [alice._id, bob._id] });
    groupB = await Group.create({ name: 'Beta', course: 'C', teacher: teacher._id, students: [alice._id] });
    groupC = await Group.create({ name: 'Gamma', course: 'C', teacher: otherTeacher._id, students: [carol._id] });
  });

  const get = (user, query = '') =>
    request(app).get(`/api/students${query}`).set('Authorization', `Bearer ${tokenFor(user)}`);

  it('shows an admin every student with their group names', async () => {
    const res = await get(admin, '?limit=50&sort=name&order=asc');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((s) => s.name)).toEqual(['Alice', 'Bob', 'Carol', 'Loner']);
    const alicesRow = res.body.data[0];
    expect(alicesRow.groups.map((g) => g.name)).toEqual(['Alpha', 'Beta']);
    expect(alicesRow.group).toBe('Alpha, Beta');
    expect(res.body.data[3].group).toBeNull();
    expect(res.body.data[3].groups).toEqual([]);
    expect(res.body.meta).toEqual({ page: 1, limit: 50, total: 4, pages: 1, active: 4, recent: 4 });
  });

  it('counts active and recent students across all pages, not just the current one', async () => {
    await User.updateOne({ _id: bob._id }, { status: 'inactive' });
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await User.collection.updateOne({ _id: carol._id }, { $set: { createdAt: old } });

    const res = await get(admin, '?limit=1');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ total: 4, pages: 4, active: 3, recent: 3 });

    const scoped = await get(teacher, '?limit=1');
    expect(scoped.body.meta).toMatchObject({ total: 2, active: 1, recent: 2 });
  });

  it('limits a teacher to students of the groups they teach', async () => {
    const res = await get(teacher, '?limit=50&sort=name&order=asc');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((s) => s.name)).toEqual(['Alice', 'Bob']);
    expect(res.body.meta.total).toBe(2);
  });

  it('filters by groupId', async () => {
    const res = await get(admin, `?groupId=${groupB._id}`);

    expect(res.body.data.map((s) => s.name)).toEqual(['Alice']);
  });

  it('does not let a teacher list a group they do not teach via groupId', async () => {
    const res = await get(teacher, `?groupId=${groupC._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('treats search as plain text', async () => {
    const res = await get(admin, '?search=(');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('hides students outside the teacher groups on the detail endpoints', async () => {
    const detail = await get(teacher, `/${carol._id}`);
    const stats = await get(teacher, `/${carol._id}/attendance-stats`);
    const own = await get(teacher, `/${alice._id}`);

    expect(detail.statusCode).toBe(404);
    expect(stats.statusCode).toBe(404);
    expect(own.statusCode).toBe(200);
  });

  it('keeps students out of the list', async () => {
    const res = await get(alice);

    expect(res.statusCode).toBe(403);
  });
});
