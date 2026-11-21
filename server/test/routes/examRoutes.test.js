import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import examRoutes from '../../routes/examRoutes.js';
import Exam from '../../models/Exam.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import Notification from '../../models/Notification.js';
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

    it('rejects scores outside 0-100 and students outside the group', async () => {
      const outsider = await User.create({
        name: 'Outsider', email: 'outsider4@example.com', password: 'Password1', role: 'student', status: 'active'
      });

      const badScore = await request(app)
        .post(`/api/exams/${examId}/results`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ results: [{ student: studentId, score: 150 }] });
      expect(badScore.statusCode).toEqual(400);

      const notInGroup = await request(app)
        .post(`/api/exams/${examId}/results`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ results: [{ student: outsider._id, score: 50 }] });
      expect(notInGroup.statusCode).toEqual(400);
    });

    it('notifies the student whose result was entered', async () => {
      await request(app)
        .post(`/api/exams/${examId}/results`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ results: [{ student: studentId, score: 80 }] });

      const notes = await Notification.find({ recipient: studentId });
      expect(notes).toHaveLength(1);
      expect(notes[0].link).toBe('/exams');
    });
  });

  describe('online exam (grading, visibility, double submit)', () => {
    let liveExamId;

    beforeEach(async () => {
      const exam = await Exam.create({
        title: 'Live Exam',
        date: new Date(Date.now() - 5 * 60 * 1000),
        duration: 60,
        group: groupId,
        teacher: teacherId,
        questions: [
          { text: 'MC', type: 'multiple-choice', options: ['a', 'b', 'c', 'd'], correctAnswer: '2', points: 2 },
          { text: 'TF', type: 'true-false', options: ['Düzdür', 'Səhvdir'], correctAnswer: 'false', points: 1 },
          { text: 'Open', type: 'open-ended', options: [], correctAnswer: '', points: 1 },
        ],
      });
      liveExamId = exam._id;
    });

    const questionIds = async () => {
      const exam = await Exam.findById(liveExamId);
      return exam.questions.map((q) => q._id.toString());
    };

    it('grades multiple-choice and true/false sent as an answer map', async () => {
      const [mc, tf, open] = await questionIds();
      const res = await request(app)
        .post(`/api/exams/${liveExamId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { [mc]: '2', [tf]: 'false', [open]: 'my essay' } });

      expect(res.statusCode).toEqual(200);
      // 3 of 4 points (open-ended is left for the teacher)
      expect(res.body.data.score).toBe(75);

      const saved = await Exam.findById(liveExamId);
      expect(saved.results[0].answers.find((a) => a.questionId.toString() === open).selectedOption).toBe('my essay');
    });

    it('accepts the legacy array payload with numeric indexes and booleans', async () => {
      const [mc, tf] = await questionIds();
      const res = await request(app)
        .post(`/api/exams/${liveExamId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [{ questionId: mc, selectedOption: 2 }, { questionId: tf, selectedOption: false }] });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.score).toBe(75);
    });

    it('gives 0 for wrong answers', async () => {
      const [mc, tf] = await questionIds();
      const res = await request(app)
        .post(`/api/exams/${liveExamId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { [mc]: '1', [tf]: 'true' } });

      expect(res.body.data.score).toBe(0);
    });

    it('rejects a second submission, also when sent concurrently', async () => {
      const [mc] = await questionIds();
      const send = () => request(app)
        .post(`/api/exams/${liveExamId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { [mc]: '2' } });

      const [a, b] = await Promise.all([send(), send()]);
      expect([a.statusCode, b.statusCode].sort()).toEqual([200, 400]);

      const third = await send();
      expect(third.statusCode).toEqual(400);

      const saved = await Exam.findById(liveExamId);
      expect(saved.results).toHaveLength(1);
    });

    it('rejects submission outside the exam time window', async () => {
      const future = await Exam.create({
        title: 'Future', date: new Date(Date.now() + 3600000), duration: 30, group: groupId, teacher: teacherId,
        questions: [{ text: 'Q', type: 'true-false', correctAnswer: 'true' }],
      });
      const past = await Exam.create({
        title: 'Past', date: new Date(Date.now() - 3 * 3600000), duration: 30, group: groupId, teacher: teacherId,
        questions: [{ text: 'Q', type: 'true-false', correctAnswer: 'true' }],
      });

      const early = await request(app)
        .post(`/api/exams/${future._id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
      expect(early.statusCode).toEqual(400);

      const late = await request(app)
        .post(`/api/exams/${past._id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
      expect(late.statusCode).toEqual(400);
    });

    it('never sends correct answers or other students\' results to a student', async () => {
      const other = await User.create({
        name: 'Other', email: 'other4@example.com', password: 'Password1', role: 'student', status: 'active'
      });
      await Group.updateOne({ _id: groupId }, { $push: { students: other._id } });
      await Exam.updateOne({ _id: liveExamId }, { $push: { results: { student: other._id, score: 90 } } });

      const list = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`);
      const single = await request(app)
        .get(`/api/exams/${liveExamId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      for (const exam of [...list.body.data, single.body.data]) {
        exam.questions.forEach((q) => expect(q).not.toHaveProperty('correctAnswer'));
        expect(exam.results).toHaveLength(0);
        expect(exam.group?.students).toBeUndefined();
      }
      const live = list.body.data.find((e) => e._id === liveExamId.toString());
      expect(live.questions).toHaveLength(3);
      expect(JSON.stringify(single.body)).not.toContain('"correctAnswer"');
    });

    it('hides questions from students before the exam starts', async () => {
      const res = await request(app)
        .get(`/api/exams/${examId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.questions).toEqual([]);
    });

    it('keeps correct answers for the teacher and populates group students', async () => {
      const res = await request(app)
        .get(`/api/exams/${liveExamId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.questions[0].correctAnswer).toBe('2');
      expect(res.body.data.group.students[0].name).toBe('Student User');
      expect(res.body.data.group.students[0].email).toBe('student4@example.com');
    });

    it('does not wipe correct answers when an edit omits them', async () => {
      const exam = await Exam.findById(liveExamId);
      const questions = exam.questions.map((q) => ({
        _id: q._id.toString(), text: q.text, type: q.type, options: q.options, points: q.points,
        correctAnswer: 'undefined',
      }));

      const res = await request(app)
        .put(`/api/exams/${liveExamId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ title: 'Renamed', questions });

      expect(res.statusCode).toEqual(200);
      const saved = await Exam.findById(liveExamId);
      expect(saved.title).toBe('Renamed');
      expect(saved.questions.map((q) => q.correctAnswer)).toEqual(['2', 'false', '']);
    });
  });

  describe('notifications', () => {
    it('notifies group students when an exam is created', async () => {
      await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ title: 'Notified', date: new Date(Date.now() + 86400000), duration: 60, group: groupId });

      const notes = await Notification.find({ recipient: studentId });
      expect(notes).toHaveLength(1);
      expect(notes[0].message).toContain('Notified');
    });

    it('still creates the exam when notifications fail', async () => {
      const spy = vi.spyOn(Notification, 'create').mockRejectedValue(new Error('boom'));
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const res = await request(app)
          .post('/api/exams')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({ title: 'No notify', date: new Date(Date.now() + 86400000), duration: 60, group: groupId });
        expect(res.statusCode).toEqual(201);
      } finally {
        spy.mockRestore();
        errSpy.mockRestore();
      }
    });
  });
});
