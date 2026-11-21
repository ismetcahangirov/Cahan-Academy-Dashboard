import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import dashboardRoutes from '../../routes/dashboardRoutes.js';
import User from '../../models/userModel.js';
import Course from '../../models/Course.js';
import Notification from '../../models/Notification.js';
import Group from '../../models/Group.js';
import Attendance from '../../models/Attendance.js';
import { lessonDurationMinutes } from '../../controllers/dashboardController.js';
import { getAcademyNow } from '../../utils/academyTime.js';

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const lastMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 15);
};

describe('Dashboard API', () => {
  let admin, student, adminToken, studentToken;

  beforeEach(async () => {
    admin = await User.create({ name: 'Admin', email: 'admin@dash.com', password: 'Password1', role: 'admin', status: 'active' });
    student = await User.create({ name: 'Student', email: 'student@dash.com', password: 'Password1', role: 'student', status: 'active' });
    adminToken = tokenFor(admin._id);
    studentToken = tokenFor(student._id);
  });

  describe('GET /api/dashboard/stats', () => {
    it('computes admin trends from real month-over-month counts', async () => {
      const course = { description: 'd', category: 'Frontend' };
      const old = await Course.create([{ ...course, title: 'A' }, { ...course, title: 'B' }]);
      await Course.collection.updateMany(
        { _id: { $in: old.map((c) => c._id) } },
        { $set: { createdAt: lastMonth() } }
      );
      await Course.create([{ ...course, title: 'C' }, { ...course, title: 'D' }, { ...course, title: 'E' }]);

      const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses).toEqual({ total: 5, trend: 50 });
      // Nothing was created last month, so there is no honest percentage to show
      expect(res.body.data.groups.trend).toBeNull();
      expect(res.body.data.users.trend).toBeNull();
      expect(res.body.data.learningHours.trend).toBeNull();
    });

    it('does not send placeholder trends to students', async () => {
      const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enrolledGroups.trend).toBeNull();
      expect(res.body.data.myAttendance.trend).toBeNull();
    });
  });

  describe('learning hours', () => {
    // Lesson dates in the academy's current and previous month, stored like the client sends them ("YYYY-MM-DD")
    const lessonDate = (monthsAgo, day) => {
      const [year, month] = getAcademyNow().dateStr.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1 - monthsAgo, day));
    };

    let teacher, otherTeacher, teacherToken;

    beforeEach(async () => {
      teacher = await User.create({ name: 'Teacher', email: 'teacher@dash.com', password: 'Password1', role: 'teacher', status: 'active' });
      otherTeacher = await User.create({ name: 'Other', email: 'other@dash.com', password: 'Password1', role: 'teacher', status: 'active' });
      teacherToken = tokenFor(teacher._id);

      const groupA = await Group.create({
        name: 'A', course: 'C', teacher: teacher._id, students: [student._id],
        schedule: { startTime: '19:00', endTime: '21:00' },
      });
      const groupB = await Group.create({
        name: 'B', course: 'C', teacher: otherTeacher._id,
        schedule: { startTime: '10:00', endTime: '11:30' },
      });
      const groupNoTime = await Group.create({ name: 'N', course: 'C', teacher: otherTeacher._id });

      const lesson = (group, date, status) => ({
        group: group._id,
        date,
        teacher: group.teacher,
        records: status ? [{ student: student._id, status }] : [],
      });
      await Attendance.create([
        lesson(groupA, lessonDate(0, 3), 'present'),
        lesson(groupA, lessonDate(0, 4), 'late'),
        lesson(groupA, lessonDate(1, 3), 'absent'),
        lesson(groupB, lessonDate(0, 5)),
        lesson(groupNoTime, lessonDate(0, 6)),
        lesson(groupNoTime, lessonDate(0, 7)),
      ]);
    });

    it('parses lesson duration from the group schedule', () => {
      expect(lessonDurationMinutes({ startTime: '19:00', endTime: '21:00' })).toBe(120);
      expect(lessonDurationMinutes({ startTime: '9:30', endTime: '11:00' })).toBe(90);
      expect(lessonDurationMinutes({ startTime: '23:00', endTime: '01:00' })).toBe(120);
      expect(lessonDurationMinutes({ startTime: '19:00', endTime: '19:00' })).toBeNull();
      expect(lessonDurationMinutes({ startTime: '25:00', endTime: '26:00' })).toBeNull();
      expect(lessonDurationMinutes({ startTime: 'abc', endTime: '21:00' })).toBeNull();
      expect(lessonDurationMinutes({ startTime: '19:00' })).toBeNull();
      expect(lessonDurationMinutes(undefined)).toBeNull();
    });

    it('sums held lessons x duration for admins and compares with last month', async () => {
      const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // A: 3 lessons x 2h, B: 1 x 1.5h, the group without a schedule adds no hours;
      // this month 2x120 + 90 = 330 min vs last month 120 min
      expect(res.body.data.learningHours).toEqual({ total: 7.5, trend: 175 });
      const activity = res.body.data.monthlyActivity;
      expect(activity).toHaveLength(7);
      expect(activity.at(-1).value).toBe(5);
      expect(activity.at(-2).value).toBe(1);
    });

    it('limits a teacher to the groups they teach', async () => {
      const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.learningHours).toEqual({ total: 6, trend: 100 });
      expect(res.body.data.monthlyActivity.at(-1).value).toBe(2);
    });

    it('counts only lessons a student attended and has no trend without last month hours', async () => {
      const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.learningHours).toEqual({ total: 4, trend: null });
      expect(res.body.data.monthlyActivity.at(-1).value).toBe(2);
      expect(res.body.data.monthlyActivity.at(-2).value).toBe(0);
    });
  });

  describe('GET /api/dashboard/activities', () => {
    it('returns only the current user\'s notifications', async () => {
      await Notification.create([
        { recipient: student._id, title: 'For student', message: 'hello' },
        { recipient: admin._id, title: 'For admin', message: 'hi' },
      ]);

      const studentRes = await request(app).get('/api/dashboard/activities').set('Authorization', `Bearer ${studentToken}`);
      expect(studentRes.status).toBe(200);
      expect(studentRes.body.data.map((a) => a.message)).toEqual(['For student - hello']);

      const adminRes = await request(app).get('/api/dashboard/activities').set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.body.data.map((a) => a.message)).toEqual(['For admin - hi']);
    });
  });
});
