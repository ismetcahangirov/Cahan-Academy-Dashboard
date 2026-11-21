import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import quizRoutes from '../../routes/quizRoutes.js';
import Quiz from '../../models/Quiz.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import Notification from '../../models/Notification.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/quizzes', quizRoutes);
app.use(errorHandler);

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const makeUser = (name, role) => User.create({
  name,
  email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
  password: 'Password1',
  role,
  status: 'active',
});

const questions = [
  { text: 'MC', type: 'multiple-choice', options: ['a', 'b', 'c', 'd'], correctAnswer: '1', points: 2 },
  { text: 'TF', type: 'true-false', options: ['Düzdür', 'Səhvdir'], correctAnswer: 'true', points: 1 },
];

describe('Quiz API', () => {
  let admin, teacher, otherTeacher, student, otherStudent;
  let group, otherGroup, quiz, otherQuiz;

  beforeEach(async () => {
    admin = await makeUser('Quiz Admin', 'admin');
    teacher = await makeUser('Quiz Teacher', 'teacher');
    otherTeacher = await makeUser('Other Teacher', 'teacher');
    student = await makeUser('Quiz Student', 'student');
    otherStudent = await makeUser('Other Student', 'student');

    group = await Group.create({ name: 'G1', course: 'C', teacher: teacher._id, students: [student._id, otherStudent._id] });
    otherGroup = await Group.create({ name: 'G2', course: 'C', teacher: otherTeacher._id, students: [] });

    quiz = await Quiz.create({ title: 'Quiz 1', description: 'd', group: group._id, teacher: teacher._id, questions });
    otherQuiz = await Quiz.create({ title: 'Quiz 2', description: 'd', group: otherGroup._id, teacher: otherTeacher._id, questions });
  });

  const ids = (q) => q.questions.map((x) => x._id.toString());

  describe('GET /api/quizzes access', () => {
    it('student sees only own groups, even with a foreign groupId', async () => {
      const res = await request(app)
        .get(`/api/quizzes?groupId=${otherGroup._id}`)
        .set('Authorization', `Bearer ${tokenFor(student)}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(0);

      const own = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${tokenFor(student)}`);
      expect(own.body.data.map((q) => q.title)).toEqual(['Quiz 1']);
    });

    it('student gets no correct answers and only own attempt', async () => {
      await Quiz.updateOne({ _id: quiz._id }, {
        $push: { attempts: { student: otherStudent._id, answers: [], score: 3, totalPoints: 3 } },
      });

      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${tokenFor(student)}`);
      const single = await request(app)
        .get(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(student)}`);

      for (const q of [res.body.data[0], single.body.data]) {
        expect(q.questions).toHaveLength(2);
        q.questions.forEach((x) => expect(x).not.toHaveProperty('correctAnswer'));
        expect(q.attempts).toHaveLength(0);
      }
    });

    it('student cannot open a quiz of another group', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${otherQuiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(student)}`);
      expect(res.statusCode).toBe(403);
    });

    it('teacher sees only quizzes of groups they teach, with correct answers', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`);
      expect(res.body.data.map((q) => q.title)).toEqual(['Quiz 1']);
      expect(res.body.data[0].questions[0].correctAnswer).toBe('1');

      const foreign = await request(app)
        .get(`/api/quizzes?groupId=${otherGroup._id}`)
        .set('Authorization', `Bearer ${tokenFor(teacher)}`);
      expect(foreign.body.data).toHaveLength(0);
    });

    it('admin sees all quizzes', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${tokenFor(admin)}`);
      expect(res.body.data).toHaveLength(2);
    });

    it('teacher cannot create a quiz for a group they do not teach', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send({ title: 'Nope', description: 'd', group: otherGroup._id, questions });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/quizzes/:id', () => {
    it('keeps stored correct answers when the edit sends undefined / "undefined"', async () => {
      const [mc, tf] = ids(quiz);
      const res = await request(app)
        .put(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send({
          title: 'Quiz 1 edited',
          questions: [
            { _id: mc, text: 'MC edited', type: 'multiple-choice', options: ['a', 'b', 'c', 'd'], correctAnswer: 'undefined', points: 2 },
            { _id: tf, text: 'TF', type: 'true-false', options: ['Düzdür', 'Səhvdir'], points: 1 },
          ],
        });

      expect(res.statusCode).toBe(200);
      const saved = await Quiz.findById(quiz._id);
      expect(saved.questions.map((q) => q.correctAnswer)).toEqual(['1', 'true']);
      expect(saved.questions[0].text).toBe('MC edited');
      expect(ids(saved)).toEqual([mc, tf]);
    });

    it('applies an explicitly changed correct answer', async () => {
      const [mc, tf] = ids(quiz);
      await request(app)
        .put(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send({
          questions: [
            { _id: mc, text: 'MC', type: 'multiple-choice', options: ['a', 'b', 'c', 'd'], correctAnswer: '3', points: 2 },
            { _id: tf, text: 'TF', type: 'true-false', correctAnswer: 'false', points: 1 },
          ],
        });
      const saved = await Quiz.findById(quiz._id);
      expect(saved.questions.map((q) => q.correctAnswer)).toEqual(['3', 'false']);
    });

    it('rejects a new multiple-choice question without a correct answer', async () => {
      const res = await request(app)
        .put(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send({ questions: [{ text: 'New', type: 'multiple-choice', options: ['a', 'b'], correctAnswer: 'undefined' }] });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/quizzes/:id/submit', () => {
    it('grades multiple-choice and true/false', async () => {
      const [mc, tf] = ids(quiz);
      const res = await request(app)
        .post(`/api/quizzes/${quiz._id}/submit`)
        .set('Authorization', `Bearer ${tokenFor(student)}`)
        .send({ answers: { [mc]: '1', [tf]: 'true' } });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.score).toBe(3);
      expect(res.body.data.totalPoints).toBe(3);
    });

    it('accepts the array payload with numeric index and boolean', async () => {
      const [mc, tf] = ids(quiz);
      const res = await request(app)
        .post(`/api/quizzes/${quiz._id}/submit`)
        .set('Authorization', `Bearer ${tokenFor(student)}`)
        .send({ answers: [{ questionId: mc, selectedOption: 1 }, { questionId: tf, selectedOption: false }] });

      expect(res.body.data.score).toBe(2);
      expect(res.body.data.answers.map((a) => a.isCorrect)).toEqual([true, false]);
    });

    it('allows only one attempt, also for concurrent requests', async () => {
      const [mc] = ids(quiz);
      const send = () => request(app)
        .post(`/api/quizzes/${quiz._id}/submit`)
        .set('Authorization', `Bearer ${tokenFor(student)}`)
        .send({ answers: { [mc]: '1' } });

      const [a, b] = await Promise.all([send(), send()]);
      expect([a.statusCode, b.statusCode].sort()).toEqual([200, 400]);
      const saved = await Quiz.findById(quiz._id);
      expect(saved.attempts).toHaveLength(1);
    });

    it('rejects a student outside the quiz group', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${otherQuiz._id}/submit`)
        .set('Authorization', `Bearer ${tokenFor(student)}`)
        .send({ answers: {} });
      expect(res.statusCode).toBe(403);
    });

    it('teacher sees attempts with student names', async () => {
      const [mc] = ids(quiz);
      await request(app)
        .post(`/api/quizzes/${quiz._id}/submit`)
        .set('Authorization', `Bearer ${tokenFor(student)}`)
        .send({ answers: { [mc]: '1' } });

      const res = await request(app)
        .get(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(teacher)}`);
      expect(res.body.data.attempts).toHaveLength(1);
      expect(res.body.data.attempts[0].student.name).toBe('Quiz Student');
      expect(res.body.data.attempts[0].score).toBe(2);
    });
  });

  describe('notifications', () => {
    it('notifies group students when a quiz is created', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${tokenFor(teacher)}`)
        .send({ title: 'Fresh', description: 'd', group: group._id, questions });

      expect(res.statusCode).toBe(201);
      const notes = await Notification.find({ type: 'quiz' });
      expect(notes.map((n) => n.recipient.toString()).sort())
        .toEqual([student._id.toString(), otherStudent._id.toString()].sort());
    });
  });
});
