import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import dashboardRoutes from '../../routes/dashboardRoutes.js';
import User from '../../models/userModel.js';
import Course from '../../models/Course.js';
import Notification from '../../models/Notification.js';

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
