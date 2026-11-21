import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import homeworkRoutes from '../../routes/homeworkRoutes.js';
import classworkRoutes from '../../routes/classworkRoutes.js';
import Homework from '../../models/Homework.js';
import Classwork from '../../models/Classwork.js';
import Group from '../../models/Group.js';
import Notification from '../../models/Notification.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/homeworks', homeworkRoutes);
app.use('/api/classworks', classworkRoutes);
app.use(errorHandler);

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const makeUser = (role, email) =>
  User.create({ name: email.split('@')[0], email, password: 'Password1', role, status: 'active' });

describe.each([
  { kind: 'homework', base: '/api/homeworks', Model: Homework },
  { kind: 'classwork', base: '/api/classworks', Model: Classwork },
])('$kind access control', ({ kind, base, Model }) => {
  let admin, teacher, otherTeacher, student, classmate, outsider;
  let group, otherGroup, item, otherItem;

  const auth = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

  beforeEach(async () => {
    admin = await makeUser('admin', `${kind}-admin@example.com`);
    teacher = await makeUser('teacher', `${kind}-teacher@example.com`);
    otherTeacher = await makeUser('teacher', `${kind}-teacher2@example.com`);
    student = await makeUser('student', `${kind}-student@example.com`);
    classmate = await makeUser('student', `${kind}-classmate@example.com`);
    outsider = await makeUser('student', `${kind}-outsider@example.com`);

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

    const dueDate = new Date(Date.now() + 86400000);
    item = await Model.create({
      title: 'Task A',
      description: 'Desc',
      group: group._id,
      teacher: teacher._id,
      dueDate,
      submissions: [
        { student: student._id, status: 'submitted', files: ['mine.pdf'] },
        { student: classmate._id, status: 'graded', files: ['theirs.pdf'], grade: 90, feedback: 'Good' },
      ],
    });
    otherItem = await Model.create({
      title: 'Task B',
      description: 'Desc',
      group: otherGroup._id,
      teacher: otherTeacher._id,
      dueDate,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list', () => {
    it('returns a student only their own submission', async () => {
      const res = await request(app).get(base).set(auth(student));

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      const subs = res.body.data[0].submissions;
      expect(subs).toHaveLength(1);
      expect(subs[0].student._id).toBe(student._id.toString());
      expect(JSON.stringify(res.body)).not.toContain('theirs.pdf');
    });

    it('ignores a groupId filter pointing at a group the student is not in', async () => {
      const res = await request(app).get(`${base}?groupId=${otherGroup._id}`).set(auth(student));

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('limits a teacher to the groups they teach', async () => {
      const all = await request(app).get(base).set(auth(teacher));
      const foreign = await request(app).get(`${base}?groupId=${otherGroup._id}`).set(auth(teacher));

      expect(all.body.data.map((x) => x._id)).toEqual([item._id.toString()]);
      expect(all.body.data[0].submissions).toHaveLength(2);
      expect(foreign.body.data).toEqual([]);
    });

    it('lets an admin filter by any group', async () => {
      const res = await request(app).get(`${base}?groupId=${otherGroup._id}`).set(auth(admin));

      expect(res.body.data.map((x) => x._id)).toEqual([otherItem._id.toString()]);
    });
  });

  describe('by id', () => {
    it('rejects a student outside the group and a teacher who does not teach it', async () => {
      const asOutsider = await request(app).get(`${base}/${item._id}`).set(auth(outsider));
      const asOtherTeacher = await request(app).get(`${base}/${item._id}`).set(auth(otherTeacher));

      expect(asOutsider.statusCode).toBe(403);
      expect(asOtherTeacher.statusCode).toBe(403);
    });

    it('returns a group student only their own submission', async () => {
      const res = await request(app).get(`${base}/${item._id}`).set(auth(student));

      expect(res.statusCode).toBe(200);
      expect(res.body.data.submissions).toHaveLength(1);
      expect(res.body.data.submissions[0].student._id).toBe(student._id.toString());
    });
  });

  describe('submit', () => {
    it('rejects a student outside the group', async () => {
      const res = await request(app)
        .post(`${base}/${item._id}/submit`)
        .set(auth(outsider))
        .send({ files: ['x.pdf'] });

      expect(res.statusCode).toBe(403);
    });

    it('does not leak other submissions in the response', async () => {
      const res = await request(app)
        .post(`${base}/${item._id}/submit`)
        .set(auth(student))
        .send({ files: ['new.pdf'] });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.submissions).toHaveLength(1);
      expect(JSON.stringify(res.body)).not.toContain('theirs.pdf');
    });
  });

  describe('grade / update / delete', () => {
    it('rejects students', async () => {
      const grade = await request(app)
        .put(`${base}/${item._id}/grade`)
        .set(auth(student))
        .send({ studentId: student._id.toString(), grade: 100 });
      const update = await request(app).put(`${base}/${item._id}`).set(auth(student)).send({ title: 'X' });
      const del = await request(app).delete(`${base}/${item._id}`).set(auth(student));

      expect([grade.statusCode, update.statusCode, del.statusCode]).toEqual([403, 403, 403]);
    });

    it('rejects a teacher who does not teach the group', async () => {
      const grade = await request(app)
        .put(`${base}/${item._id}/grade`)
        .set(auth(otherTeacher))
        .send({ studentId: student._id.toString(), grade: 100 });
      const update = await request(app).put(`${base}/${item._id}`).set(auth(otherTeacher)).send({ title: 'X' });
      const del = await request(app).delete(`${base}/${item._id}`).set(auth(otherTeacher));

      expect([grade.statusCode, update.statusCode, del.statusCode]).toEqual([403, 403, 403]);
      expect(await Model.countDocuments({ _id: item._id })).toBe(1);
    });

    it('lets the group teacher grade and notifies the student', async () => {
      const res = await request(app)
        .put(`${base}/${item._id}/grade`)
        .set(auth(teacher))
        .send({ studentId: student._id.toString(), grade: 95, feedback: 'Nice' });

      expect(res.statusCode).toBe(200);
      const notes = await Notification.find({ recipient: student._id });
      expect(notes).toHaveLength(1);
      expect(notes[0].type).toBe(kind);
      expect(notes[0].key).toBe(`${kind}Graded`);
      expect(notes[0].params).toEqual({ title: 'Task A', grade: 95 });
      expect(await Notification.countDocuments({ recipient: classmate._id })).toBe(0);
    });

    it('rejects a missing or out-of-range grade without touching the submission', async () => {
      for (const grade of [undefined, '', 'abc', -1, 101]) {
        const res = await request(app)
          .put(`${base}/${item._id}/grade`)
          .set(auth(teacher))
          .send({ studentId: student._id.toString(), grade });
        expect(res.statusCode, String(grade)).toBe(400);
      }
      const fresh = await Model.findById(item._id);
      const mine = fresh.submissions.find((s) => s.student.equals(student._id));
      expect(mine.status).toBe('submitted');
      expect(mine.grade).toBeUndefined();
      expect(await Notification.countDocuments()).toBe(0);
    });
  });

  describe('create', () => {
    const body = () => ({
      title: 'Fresh task',
      description: 'Desc',
      group: group._id.toString(),
      dueDate: new Date(Date.now() + 86400000),
    });

    it('rejects a teacher creating for a group they do not teach', async () => {
      const res = await request(app).post(base).set(auth(otherTeacher)).send(body());

      expect(res.statusCode).toBe(403);
    });

    it('notifies every student of the group', async () => {
      const res = await request(app).post(base).set(auth(teacher)).send(body());

      expect(res.statusCode).toBe(201);
      const notes = await Notification.find({ type: kind });
      const recipients = notes.map((n) => n.recipient.toString());
      expect(recipients.sort()).toEqual([student._id.toString(), classmate._id.toString()].sort());
      expect(notes[0].key).toBe(`${kind}Created`);
      expect(notes[0].params).toEqual({ title: 'Fresh task', group: 'Group A' });
    });

    it('stores the due date sent by the client', async () => {
      const dueDate = '2026-12-01T14:00:00.000Z';
      const res = await request(app).post(base).set(auth(teacher)).send({ ...body(), dueDate });

      expect(res.statusCode).toBe(201);
      expect(new Date(res.body.data.dueDate).toISOString()).toBe(dueDate);
    });

    it('still succeeds when notifications cannot be stored', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Notification, 'create').mockRejectedValue(new Error('db down'));

      const res = await request(app).post(base).set(auth(teacher)).send(body());

      expect(res.statusCode).toBe(201);
    });
  });
});

describe('classwork group size and due date', () => {
  let teacher, student, classmate, group;
  const auth = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

  beforeEach(async () => {
    teacher = await makeUser('teacher', 'cw-size-teacher@example.com');
    student = await makeUser('student', 'cw-size-student@example.com');
    classmate = await makeUser('student', 'cw-size-classmate@example.com');
    group = await Group.create({
      name: 'Group A',
      course: 'Course',
      teacher: teacher._id,
      students: [student._id, classmate._id],
    });
    await Classwork.create({ title: 'CW', description: 'D', group: group._id, teacher: teacher._id });
  });

  it('gives staff the group size and hides the classmates from students', async () => {
    const asTeacher = await request(app).get('/api/classworks').set(auth(teacher));
    const asStudent = await request(app).get('/api/classworks').set(auth(student));

    expect(asTeacher.body.data[0].group.students).toHaveLength(2);
    expect(asStudent.body.data[0].group.name).toBe('Group A');
    expect(asStudent.body.data[0].group.students).toBeUndefined();
  });

  it('updates and clears the due date', async () => {
    const cw = await Classwork.findOne();
    const set = await request(app)
      .put(`/api/classworks/${cw._id}`)
      .set(auth(teacher))
      .send({ dueDate: '2026-12-01T14:00:00.000Z' });
    const keep = await request(app).put(`/api/classworks/${cw._id}`).set(auth(teacher)).send({ title: 'CW 2' });
    const clear = await request(app).put(`/api/classworks/${cw._id}`).set(auth(teacher)).send({ dueDate: '' });

    expect(set.body.data.dueDate).toBe('2026-12-01T14:00:00.000Z');
    expect(keep.body.data.dueDate).toBe('2026-12-01T14:00:00.000Z');
    expect(clear.body.data.dueDate).toBeNull();
  });
});
