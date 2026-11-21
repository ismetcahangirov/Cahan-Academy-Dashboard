import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import attendanceRoutes from '../../routes/attendanceRoutes.js';
import Attendance from '../../models/Attendance.js';
import Group from '../../models/Group.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/attendance', attendanceRoutes);
app.use(errorHandler);

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const makeUser = (role, email) =>
  User.create({ name: email.split('@')[0], email, password: 'Password1', role, status: 'active' });

const DATE = '2026-11-20';

describe('Attendance API access control', () => {
  let admin, teacher, otherTeacher, student, classmate, outsider;
  let group, otherGroup;

  beforeEach(async () => {
    admin = await makeUser('admin', 'att-admin@example.com');
    teacher = await makeUser('teacher', 'att-teacher@example.com');
    otherTeacher = await makeUser('teacher', 'att-teacher2@example.com');
    student = await makeUser('student', 'att-student@example.com');
    classmate = await makeUser('student', 'att-classmate@example.com');
    outsider = await makeUser('student', 'att-outsider@example.com');

    group = await Group.create({
      name: 'Group A',
      course: 'Course',
      teacher: teacher._id,
      students: [student._id, classmate._id],
    });
    otherGroup = await Group.create({
      name: 'Group B',
      course: 'Course',
      teacher: otherTeacher._id,
      students: [outsider._id],
    });
  });

  const payload = (overrides = {}) => ({
    group: group._id.toString(),
    date: DATE,
    topic: 'Topic',
    records: [
      { student: student._id.toString(), status: 'present' },
      { student: classmate._id.toString(), status: 'absent' },
    ],
    ...overrides,
  });

  describe('POST /api/attendance', () => {
    it('rejects a student writing attendance for their own group', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(student)}`)
        .send(payload({ records: [{ student: student._id.toString(), status: 'present' }] }));

      expect(res.statusCode).toBe(403);
      expect(await Attendance.countDocuments()).toBe(0);
    });

    it('rejects a teacher writing attendance for a group they do not teach', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(otherTeacher)}`)
        .send(payload());

      expect(res.statusCode).toBe(403);
    });

    it('lets the group teacher write attendance', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send(payload());

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
    });

    it('lets an admin write attendance', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(admin)}`)
        .send(payload());

      expect(res.statusCode).toBe(200);
    });

    it('rejects records for students outside the group', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send(payload({ records: [{ student: outsider._id.toString(), status: 'present' }] }));

      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for an unknown group instead of crashing', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send(payload({ group: 'not-an-id' }));

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/attendance', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send(payload());
    });

    it('shows a student only their own record', async () => {
      const res = await request(app)
        .get(`/api/attendance?group=${group._id}&date=${DATE}`)
        .set('Authorization', `Bearer ${tokenFor(student)}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records).toHaveLength(1);
      expect(res.body.data.records[0].student._id).toBe(student._id.toString());
    });

    it('rejects a student reading another group', async () => {
      const res = await request(app)
        .get(`/api/attendance?group=${group._id}&date=${DATE}`)
        .set('Authorization', `Bearer ${tokenFor(outsider)}`);

      expect(res.statusCode).toBe(403);
    });

    it('rejects a teacher reading a group they do not teach', async () => {
      const res = await request(app)
        .get(`/api/attendance?group=${group._id}&date=${DATE}`)
        .set('Authorization', `Bearer ${tokenFor(otherTeacher)}`);

      expect(res.statusCode).toBe(403);
    });

    it('shows the group teacher every record', async () => {
      const res = await request(app)
        .get(`/api/attendance?group=${group._id}&date=${DATE}`)
        .set('Authorization', `Bearer ${tokenFor(teacher)}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
    });
  });

  describe('GET /api/attendance/stats/:groupId', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send(payload());
    });

    it('counts only the student their own records', async () => {
      const res = await request(app)
        .get(`/api/attendance/stats/${group._id}`)
        .set('Authorization', `Bearer ${tokenFor(student)}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([{ _id: 'present', count: 1 }]);
    });

    it('rejects students and teachers outside the group', async () => {
      const asOutsider = await request(app)
        .get(`/api/attendance/stats/${group._id}`)
        .set('Authorization', `Bearer ${tokenFor(outsider)}`);
      const asOtherTeacher = await request(app)
        .get(`/api/attendance/stats/${group._id}`)
        .set('Authorization', `Bearer ${tokenFor(otherTeacher)}`);

      expect(asOutsider.statusCode).toBe(403);
      expect(asOtherTeacher.statusCode).toBe(403);
    });
  });
});
