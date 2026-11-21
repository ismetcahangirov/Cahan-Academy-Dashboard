import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import groupRoutes from '../../routes/groupRoutes.js';
import Group from '../../models/Group.js';
import Schedule from '../../models/Schedule.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/groups', groupRoutes);
app.use(errorHandler);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('Group API', () => {
  let adminToken, userToken, teacherToken, adminId, userId, teacherId, groupId;

  beforeEach(async () => {
    // Create an admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin2@example.com',
      password: 'Password1',
      role: 'admin',
      status: 'active'
    });
    adminId = admin._id;
    adminToken = generateToken(adminId);

    // Create a regular user
    const user = await User.create({
      name: 'Regular User',
      email: 'user2@example.com',
      password: 'Password1',
      role: 'student',
      status: 'active'
    });
    userId = user._id;
    userToken = generateToken(userId);

    // Create a teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@example.com',
      password: 'Password1',
      role: 'teacher',
      status: 'active'
    });
    teacherId = teacher._id;
    teacherToken = generateToken(teacherId);

    // Create a group
    const group = await Group.create({
      name: 'Test Group',
      course: 'Test Course',
      teacher: teacherId,
      students: [userId]
    });
    groupId = group._id;
  });

  describe('GET /api/groups', () => {
    it('should get all groups', async () => {
      const res = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/groups', () => {
    it('should create a group if admin', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Group',
          course: 'New Course',
          teacher: teacherId
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Group');
    });

    it('should fail to create group if not admin', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Group 2',
          course: 'New Course'
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update group if admin', async () => {
      const res = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Group' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Group');
    });
  });

  describe('POST /api/groups/:id/students', () => {
    it('should add student to group if admin', async () => {
      const newStudent = await User.create({
        name: 'New Student',
        email: 'newstudent@example.com',
        password: 'Password1',
        role: 'student'
      });

      const res = await request(app)
        .post(`/api/groups/${groupId}/students`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentId: newStudent._id });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students).toContain(newStudent._id.toString());
    });
  });

  describe('GET /api/groups/:id', () => {
    it('lets a member student open the group', async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
    });

    it('rejects a student who is not in the group', async () => {
      const outsider = await User.create({
        name: 'Outsider',
        email: 'outsider@example.com',
        password: 'Password1',
        role: 'student',
        status: 'active'
      });

      const res = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${generateToken(outsider._id)}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('schedule sync', () => {
    it('creates one Monday=0 based entry per day for every stored day spelling', async () => {
      const res = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schedule: {
            repetitionType: 'weekly',
            days: ['Monday', 'Bazar ertəsi', 'Sunday', '2', 'Пятница'],
            startTime: '10:00',
            endTime: '12:00'
          }
        });

      expect(res.statusCode).toEqual(200);
      const entries = await Schedule.find({ group: groupId }).sort('dayOfWeek');
      expect(entries.map((e) => e.dayOfWeek)).toEqual([0, 2, 4, 6]);
    });
  });
});
