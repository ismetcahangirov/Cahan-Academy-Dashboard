import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import homeworkRoutes from '../../routes/homeworkRoutes.js';
import Homework from '../../models/Homework.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/homeworks', homeworkRoutes);
app.use(errorHandler);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('Homework API', () => {
  let adminToken, studentToken, teacherToken, teacherId, studentId, groupId, homeworkId;

  beforeEach(async () => {
    // Create an admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin3@example.com',
      password: 'Password1',
      role: 'admin',
      status: 'active'
    });
    adminToken = generateToken(admin._id);

    // Create a regular user
    const student = await User.create({
      name: 'Student User',
      email: 'student3@example.com',
      password: 'Password1',
      role: 'student',
      status: 'active'
    });
    studentId = student._id;
    studentToken = generateToken(studentId);

    // Create a teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher3@example.com',
      password: 'Password1',
      role: 'teacher',
      status: 'active'
    });
    teacherId = teacher._id;
    teacherToken = generateToken(teacherId);

    // Create a group
    const group = await Group.create({
      name: 'Test Group 3',
      course: 'Test Course 3',
      teacher: teacherId,
      students: [studentId]
    });
    groupId = group._id;

    const homework = await Homework.create({
      title: 'Initial Homework',
      description: 'Test Description',
      group: groupId,
      teacher: teacherId,
      dueDate: new Date(Date.now() + 86400000)
    });
    homeworkId = homework._id;
  });

  describe('GET /api/homeworks', () => {
    it('should get all homeworks', async () => {
      const res = await request(app)
        .get('/api/homeworks')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/homeworks', () => {
    it('should create homework if teacher', async () => {
      const res = await request(app)
        .post('/api/homeworks')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'New Homework',
          description: 'New Description',
          group: groupId,
          dueDate: new Date(Date.now() + 86400000)
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Homework');
    });

    it('should fail to create homework if student', async () => {
      const res = await request(app)
        .post('/api/homeworks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'New Homework 2',
          description: 'New Description',
          group: groupId
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('POST /api/homeworks/:id/submit', () => {
    it('should submit homework if student', async () => {
      const res = await request(app)
        .post(`/api/homeworks/${homeworkId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ fileUrl: 'http://example.com/file.pdf' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submissions).toContainEqual(
        expect.objectContaining({ student: studentId.toString() })
      );
    });
  });
});
