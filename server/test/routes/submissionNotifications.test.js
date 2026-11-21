import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import homeworkRoutes from '../../routes/homeworkRoutes.js';
import classworkRoutes from '../../routes/classworkRoutes.js';
import examRoutes from '../../routes/examRoutes.js';
import quizRoutes from '../../routes/quizRoutes.js';
import Homework from '../../models/Homework.js';
import Classwork from '../../models/Classwork.js';
import Exam from '../../models/Exam.js';
import Quiz from '../../models/Quiz.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import Notification from '../../models/Notification.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/homeworks', homeworkRoutes);
app.use('/api/classworks', classworkRoutes);
app.use('/api/exams', examRoutes);
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
];

describe('Teacher notifications on student submissions', () => {
  let admin, teacher, student, group;

  beforeEach(async () => {
    admin = await makeUser('Sub Admin', 'admin');
    teacher = await makeUser('Sub Teacher', 'teacher');
    student = await makeUser('Aysel Mammadova', 'student');
    group = await Group.create({ name: 'G1', course: 'C', teacher: teacher._id, students: [student._id] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const asStudent = (req) => req.set('Authorization', `Bearer ${tokenFor(student)}`);
  const teacherNotifications = () => Notification.find({ recipient: teacher._id }).lean();

  const createHomework = () => Homework.create({
    title: 'Landing page',
    description: 'd',
    group: group._id,
    teacher: admin._id,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  it('notifies the group teacher (not the creator) once per homework submission', async () => {
    const hw = await createHomework();

    const res = await asStudent(request(app).post(`/api/homeworks/${hw._id}/submit`)).send({ links: ['https://x.dev'] });
    expect(res.statusCode).toBe(200);

    const notes = await teacherNotifications();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      sender: student._id,
      type: 'homework',
      link: '/homeworks',
      key: 'homeworkSubmitted',
      params: { student: 'Aysel Mammadova', title: 'Landing page' },
    });
    expect(await Notification.countDocuments({ recipient: admin._id })).toBe(0);
  });

  it('does not notify when a homework submission is withdrawn', async () => {
    const hw = await createHomework();
    await asStudent(request(app).post(`/api/homeworks/${hw._id}/submit`)).send({ links: ['https://x.dev'] });
    await Notification.deleteMany({});

    const res = await asStudent(request(app).delete(`/api/homeworks/${hw._id}/submit`));
    expect(res.statusCode).toBe(200);
    expect(await Notification.countDocuments({})).toBe(0);
  });

  it('notifies the group teacher on classwork submission', async () => {
    const cw = await Classwork.create({ title: 'Flexbox', description: 'd', group: group._id, teacher: teacher._id });

    const res = await asStudent(request(app).post(`/api/classworks/${cw._id}/submit`)).send({ links: ['https://x.dev'] });
    expect(res.statusCode).toBe(200);

    const notes = await teacherNotifications();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      type: 'classwork',
      link: '/classworks',
      key: 'classworkSubmitted',
      params: { student: 'Aysel Mammadova', title: 'Flexbox' },
    });
  });

  it('does not notify when a classwork submission is withdrawn', async () => {
    const cw = await Classwork.create({ title: 'Flexbox', description: 'd', group: group._id, teacher: teacher._id });
    await asStudent(request(app).post(`/api/classworks/${cw._id}/submit`)).send({ links: ['https://x.dev'] });
    await Notification.deleteMany({});

    const res = await asStudent(request(app).delete(`/api/classworks/${cw._id}/submit`));
    expect(res.statusCode).toBe(200);
    expect(await Notification.countDocuments({})).toBe(0);
  });

  it('notifies the group teacher on exam submission, and not for a rejected second one', async () => {
    const exam = await Exam.create({
      title: 'Midterm',
      date: new Date(Date.now() - 5 * 60 * 1000),
      duration: 60,
      group: group._id,
      teacher: teacher._id,
      questions,
    });
    const [q] = exam.questions.map((x) => x._id.toString());
    const send = () => asStudent(request(app).post(`/api/exams/${exam._id}/submit`)).send({ answers: { [q]: '1' } });

    expect((await send()).statusCode).toBe(200);
    expect((await send()).statusCode).toBe(400);

    const notes = await teacherNotifications();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      link: '/exams',
      key: 'examSubmitted',
      params: { student: 'Aysel Mammadova', title: 'Midterm' },
    });
  });

  it('notifies the group teacher on quiz submission', async () => {
    const quiz = await Quiz.create({ title: 'JS basics', description: 'd', group: group._id, teacher: teacher._id, questions });
    await asStudent(request(app).post(`/api/quizzes/${quiz._id}/start`));
    const [q] = quiz.questions.map((x) => x._id.toString());

    const res = await asStudent(request(app).post(`/api/quizzes/${quiz._id}/submit`)).send({ answers: { [q]: '1' } });
    expect(res.statusCode).toBe(200);

    const notes = await teacherNotifications();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({
      type: 'quiz',
      link: '/quizzes',
      key: 'quizSubmitted',
      params: { student: 'Aysel Mammadova', title: 'JS basics' },
    });
  });

  it('still accepts the submission when the notification cannot be stored', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Notification, 'create').mockRejectedValue(new Error('db down'));
    const hw = await createHomework();

    const res = await asStudent(request(app).post(`/api/homeworks/${hw._id}/submit`)).send({ links: ['https://x.dev'] });
    expect(res.statusCode).toBe(200);
    expect((await Homework.findById(hw._id)).submissions).toHaveLength(1);
  });

  it('still accepts the submission when the teacher lookup fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const quiz = await Quiz.create({ title: 'JS basics', description: 'd', group: group._id, teacher: teacher._id, questions });
    await asStudent(request(app).post(`/api/quizzes/${quiz._id}/start`));
    vi.spyOn(Group, 'findById').mockImplementation(() => {
      throw new Error('db down');
    });

    const res = await asStudent(request(app).post(`/api/quizzes/${quiz._id}/submit`)).send({ answers: {} });
    expect(res.statusCode).toBe(200);
    expect(await Quiz.countDocuments({ 'attempts.student': student._id })).toBe(1);
    expect(await Notification.countDocuments({})).toBe(0);
  });
});
