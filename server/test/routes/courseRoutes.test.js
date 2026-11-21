import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import courseRoutes from '../../routes/courseRoutes.js';
import Course from '../../models/Course.js';
import Group from '../../models/Group.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/courses', courseRoutes);
app.use(errorHandler);

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const makeUser = (role, email) =>
  User.create({ name: email.split('@')[0], email, password: 'Password1', role, status: 'active' });

describe('GET /api/courses/:id', () => {
  let admin, teacher, otherTeacher, student, course;

  beforeEach(async () => {
    admin = await makeUser('admin', 'c-admin@example.com');
    teacher = await makeUser('teacher', 'c-teacher@example.com');
    otherTeacher = await makeUser('teacher', 'c-teacher2@example.com');
    student = await makeUser('student', 'c-student@example.com');
    course = await Course.create({ title: 'React (Pro)', description: 'd', category: 'Frontend' });

    await Group.create({ name: 'R1', course: 'react (pro)', teacher: teacher._id, students: [student._id] });
    await Group.create({ name: 'R2', course: 'React (Pro) ', teacher: otherTeacher._id, students: [] });
    await Group.create({ name: 'Other', course: 'Vue', teacher: teacher._id, students: [student._id] });
  });

  const get = (user, id = course._id) =>
    request(app).get(`/api/courses/${id}`).set('Authorization', `Bearer ${tokenFor(user)}`);

  it('lists every group of the course for an admin', async () => {
    const res = await get(admin);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('React (Pro)');
    expect(res.body.data.groups.map((g) => g.name)).toEqual(['R1', 'R2']);
    expect(res.body.data.groups[0].studentCount).toBe(1);
    expect(res.body.data.groups[0].students).toBeUndefined();
  });

  it('shows teachers and students only their own groups', async () => {
    const teacherRes = await get(teacher);
    expect(teacherRes.body.data.groups.map((g) => g.name)).toEqual(['R1']);

    const otherRes = await get(otherTeacher);
    expect(otherRes.body.data.groups.map((g) => g.name)).toEqual(['R2']);

    const studentRes = await get(student);
    expect(studentRes.body.data.groups.map((g) => g.name)).toEqual(['R1']);
  });

  it('returns 404 for a malformed id', async () => {
    const res = await get(admin, 'not-an-id');

    expect(res.statusCode).toBe(404);
  });
});
