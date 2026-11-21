import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  const startAs = (user, q) => request(app)
    .post(`/api/quizzes/${q._id}/start`)
    .set('Authorization', `Bearer ${tokenFor(user)}`);

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
      await startAs(student, quiz);

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
    beforeEach(async () => {
      await startAs(student, quiz);
    });

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

  describe('POST /api/quizzes/:id/start (server-side time limit)', () => {
    const backdateStart = (minutesAgo) => Quiz.updateOne(
      { _id: quiz._id, 'starts.student': student._id },
      { $set: { 'starts.$.startedAt': new Date(Date.now() - minutesAgo * 60 * 1000) } }
    );
    const submitAs = (user) => request(app)
      .post(`/api/quizzes/${quiz._id}/submit`)
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ answers: {} });

    it('hides questions until the student starts, then returns them without correct answers', async () => {
      const before = await request(app)
        .get(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(student)}`);
      expect(before.body.data.questions).toEqual([]);
      expect(before.body.data.questionCount).toBe(2);
      expect(before.body.data.startedAt).toBeNull();
      expect(before.body.data).not.toHaveProperty('starts');

      const res = await startAs(student, quiz);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.questions).toHaveLength(2);
      expect(JSON.stringify(res.body)).not.toContain('correctAnswer');
      const startedAt = new Date(res.body.data.startedAt).getTime();
      expect(new Date(res.body.data.endsAt).getTime() - startedAt).toBe(30 * 60 * 1000);

      const after = await request(app)
        .get(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${tokenFor(student)}`);
      expect(after.body.data.questions).toHaveLength(2);
      expect(new Date(after.body.data.startedAt).getTime()).toBe(startedAt);
    });

    it('is refresh-safe: starting again returns the first start time', async () => {
      const first = await startAs(student, quiz);
      await backdateStart(10);
      const second = await startAs(student, quiz);
      const [third, fourth] = await Promise.all([startAs(student, quiz), startAs(student, quiz)]);

      expect(second.statusCode).toBe(200);
      const expected = (await Quiz.findById(quiz._id)).starts[0].startedAt.getTime();
      expect(new Date(second.body.data.startedAt).getTime()).toBe(expected);
      expect(new Date(third.body.data.startedAt).getTime()).toBe(expected);
      expect(new Date(fourth.body.data.startedAt).getTime()).toBe(expected);
      expect(expected).toBeLessThan(new Date(first.body.data.startedAt).getTime());
      expect((await Quiz.findById(quiz._id)).starts).toHaveLength(1);
    });

    it('rejects a submission without a prior start', async () => {
      const res = await submitAs(student);
      expect(res.statusCode).toBe(400);
      expect((await Quiz.findById(quiz._id)).attempts).toHaveLength(0);
    });

    it('accepts a submission within the grace period and rejects one after it', async () => {
      await startAs(student, quiz);
      await backdateStart(31);
      expect((await submitAs(student)).statusCode).toBe(200);

      await startAs(otherStudent, quiz);
      await Quiz.updateOne(
        { _id: quiz._id, 'starts.student': otherStudent._id },
        { $set: { 'starts.$.startedAt': new Date(Date.now() - 33 * 60 * 1000) } }
      );
      const late = await submitAs(otherStudent);
      expect(late.statusCode).toBe(400);
      expect((await Quiz.findById(quiz._id)).attempts).toHaveLength(1);
    });

    it('lets only students of the group start an active quiz once', async () => {
      expect((await startAs(student, otherQuiz)).statusCode).toBe(403);
      expect((await startAs(teacher, quiz)).statusCode).toBe(403);

      await Quiz.updateOne({ _id: quiz._id }, { isActive: false });
      expect((await startAs(student, quiz)).statusCode).toBe(403);
      await Quiz.updateOne({ _id: quiz._id }, { isActive: true });

      await startAs(student, quiz);
      expect((await submitAs(student)).statusCode).toBe(200);
      expect((await startAs(student, quiz)).statusCode).toBe(400);
    });
  });

  describe('answer review and manual grading', () => {
    let gradedQuiz, mc, open;

    const reviewAs = (user, studentId) => request(app)
      .get(`/api/quizzes/${gradedQuiz._id}/attempts/${studentId}`)
      .set('Authorization', `Bearer ${tokenFor(user)}`);
    const gradeAs = (user, grades, studentId = student._id) => request(app)
      .put(`/api/quizzes/${gradedQuiz._id}/attempts/${studentId}/grades`)
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ grades });

    beforeEach(async () => {
      gradedQuiz = await Quiz.create({
        title: 'Essay quiz',
        description: 'd',
        group: group._id,
        teacher: teacher._id,
        questions: [
          { text: 'MC', type: 'multiple-choice', options: ['a', 'b'], correctAnswer: '1', points: 2 },
          { text: 'Explain', type: 'open-ended', points: 3 },
        ],
      });
      [mc, open] = ids(gradedQuiz);
      await startAs(student, gradedQuiz);
      await request(app)
        .post(`/api/quizzes/${gradedQuiz._id}/submit`)
        .set('Authorization', `Bearer ${tokenFor(student)}`)
        .send({ answers: { [mc]: '1', [open]: 'because' } });
    });

    it('shows the teacher each question, the answer, the correct answer and pending open answers', async () => {
      const res = await reviewAs(teacher, student._id);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.student.name).toBe('Quiz Student');
      expect(res.body.data.earnedPoints).toBe(2);
      expect(res.body.data.totalPoints).toBe(5);
      expect(res.body.data.pendingCount).toBe(1);
      expect(res.body.data.answers).toEqual([
        expect.objectContaining({ text: 'MC', answer: '1', correctAnswer: '1', isCorrect: true, awardedPoints: 2, autoGraded: true }),
        expect.objectContaining({ text: 'Explain', answer: 'because', isCorrect: null, awardedPoints: null, points: 3 }),
      ]);
    });

    it('lets the teacher grade open answers within 0..points and recomputes the score', async () => {
      const res = await gradeAs(teacher, [{ questionId: open, points: 2.5 }]);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.earnedPoints).toBe(4.5);
      expect(res.body.data.pendingCount).toBe(0);

      const regraded = await gradeAs(teacher, { [open]: 0 });
      expect(regraded.body.data.earnedPoints).toBe(2);

      const saved = await Quiz.findById(gradedQuiz._id);
      expect(saved.attempts[0].score).toBe(2);
      expect(saved.attempts[0].answers.map((a) => a.awardedPoints)).toEqual([2, 0]);
    });

    it('rejects points out of range, auto-graded questions and empty payloads', async () => {
      expect((await gradeAs(teacher, { [open]: 4 })).statusCode).toBe(400);
      expect((await gradeAs(teacher, { [open]: -1 })).statusCode).toBe(400);
      expect((await gradeAs(teacher, { [open]: '' })).statusCode).toBe(400);
      expect((await gradeAs(teacher, { [mc]: 0 })).statusCode).toBe(400);
      expect((await gradeAs(teacher, {})).statusCode).toBe(400);
      expect((await gradeAs(teacher, { [open]: 1 }, otherStudent._id)).statusCode).toBe(404);

      const saved = await Quiz.findById(gradedQuiz._id);
      expect(saved.attempts[0].score).toBe(2);
    });

    it('allows only the group teacher or an admin to review and grade', async () => {
      expect((await reviewAs(otherTeacher, student._id)).statusCode).toBe(403);
      expect((await gradeAs(otherTeacher, { [open]: 1 })).statusCode).toBe(403);
      expect((await gradeAs(student, { [open]: 3 })).statusCode).toBe(403);
      expect((await reviewAs(admin, student._id)).statusCode).toBe(200);
      expect((await gradeAs(admin, { [open]: 1 })).statusCode).toBe(200);
    });

    it('lets a student see only their own graded answers, without correct answers', async () => {
      const own = await reviewAs(student, student._id);
      expect(own.statusCode).toBe(200);
      expect(JSON.stringify(own.body)).not.toContain('correctAnswer');
      expect(own.body.data.answers[0].isCorrect).toBe(true);

      expect((await reviewAs(otherStudent, student._id)).statusCode).toBe(403);
      expect((await reviewAs(otherStudent, otherStudent._id)).statusCode).toBe(404);
    });

    it('notifies the student only when a grade changes, and survives notification errors', async () => {
      await gradeAs(teacher, { [open]: 3 });
      await gradeAs(teacher, { [open]: 3 });
      const notes = await Notification.find({ recipient: student._id, title: 'Quiz qiymətləndirildi' });
      expect(notes).toHaveLength(1);
      expect(notes[0].message).toContain('5/5');

      const spy = vi.spyOn(Notification, 'create').mockRejectedValue(new Error('boom'));
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const res = await gradeAs(teacher, { [open]: 1 });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.earnedPoints).toBe(3);
      } finally {
        spy.mockRestore();
        errSpy.mockRestore();
      }
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
