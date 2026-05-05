import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import scheduleRoutes from '../../routes/scheduleRoutes.js';
import Schedule from '../../models/Schedule.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/schedule', scheduleRoutes);
app.use(errorHandler);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('Schedule API', () => {
  let adminToken, studentToken, teacherToken, teacherId, studentId, groupId, scheduleId;

  beforeEach(async () => {
    // Create an admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin5@example.com',
      password: 'Password1',
      role: 'admin',
      status: 'active'
    });
    adminToken = generateToken(admin._id);

    // Create a regular user
    const student = await User.create({
      name: 'Student User',
      email: 'student5@example.com',
      password: 'Password1',
      role: 'student',
      status: 'active'
    });
    studentId = student._id;
    studentToken = generateToken(studentId);

    // Create a teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher5@example.com',
      password: 'Password1',
      role: 'teacher',
      status: 'active'
    });
    teacherId = teacher._id;
    teacherToken = generateToken(teacherId);

    // Create a group
    const group = await Group.create({
      name: 'Test Group 5',
      course: 'Test Course 5',
      teacher: teacherId,
      students: [studentId]
    });
    groupId = group._id;

    const schedule = await Schedule.create({
      group: groupId,
      teacher: teacherId,
      subject: 'Math',
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '12:00',
      room: '101'
    });
    scheduleId = schedule._id;
  });

  describe('GET /api/schedule', () => {
    it('should get schedule', async () => {
      const res = await request(app)
        .get('/api/schedule')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/schedule', () => {
    it('should create schedule entry if teacher', async () => {
      const res = await request(app)
        .post('/api/schedule')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          group: groupId,
          teacher: teacherId,
          subject: 'Physics',
          dayOfWeek: 2,
          startTime: '10:00',
          endTime: '12:00',
          room: '102'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject).toBe('Physics');
    });

    it('should fail to create schedule entry if student', async () => {
      const res = await request(app)
        .post('/api/schedule')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          group: groupId,
          teacher: teacherId,
          subject: 'Chemistry',
          dayOfWeek: 3,
          startTime: '10:00',
          endTime: '12:00',
          room: '103'
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PUT /api/schedule/:id', () => {
    it('should update schedule entry if teacher', async () => {
      const res = await request(app)
        .put(`/api/schedule/${scheduleId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ room: '105' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.room).toBe('105');
    });
  });
});
