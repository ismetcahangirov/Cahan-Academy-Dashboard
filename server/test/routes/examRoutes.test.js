import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import examRoutes from '../../routes/examRoutes.js';
import Exam from '../../models/Exam.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/exams', examRoutes);
app.use(errorHandler);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('Exam API', () => {
  let adminToken, studentToken, teacherToken, teacherId, studentId, groupId, examId;

  beforeEach(async () => {
    // Create an admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin4@example.com',
      password: 'Password1',
      role: 'admin',
      status: 'active'
    });
    adminToken = generateToken(admin._id);

    // Create a regular user
    const student = await User.create({
      name: 'Student User',
      email: 'student4@example.com',
      password: 'Password1',
      role: 'student',
      status: 'active'
    });
    studentId = student._id;
    studentToken = generateToken(studentId);

    // Create a teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher4@example.com',
      password: 'Password1',
      role: 'teacher',
      status: 'active'
    });
    teacherId = teacher._id;
    teacherToken = generateToken(teacherId);

    // Create a group
    const group = await Group.create({
      name: 'Test Group 4',
      course: 'Test Course 4',
      teacher: teacherId,
      students: [studentId]
    });
    groupId = group._id;

    const exam = await Exam.create({
      title: 'Initial Exam',
      date: new Date(Date.now() + 86400000),
      duration: 90,
      group: groupId,
      teacher: teacherId
    });
    examId = exam._id;
  });

  describe('GET /api/exams', () => {
    it('should get all exams', async () => {
      const res = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/exams', () => {
    it('should create exam if teacher', async () => {
      const res = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'New Exam',
          date: new Date(Date.now() + 86400000),
          duration: 90,
          group: groupId
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Exam');
    });

    it('should fail to create exam if student', async () => {
      const res = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'New Exam 2',
          date: new Date(Date.now() + 86400000),
          duration: 90,
          group: groupId
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('POST /api/exams/:id/results', () => {
    it('should add exam results if teacher', async () => {
      const res = await request(app)
        .post(`/api/exams/${examId}/results`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          results: [{ student: studentId, score: 95 }]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
