import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userRoutes from '../../routes/userRoutes.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use(errorHandler);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('User API', () => {
  let adminToken, userToken, adminId, userId;

  beforeEach(async () => {
    // Create an admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password1',
      role: 'admin',
      status: 'active'
    });
    adminId = admin._id;
    adminToken = generateToken(adminId);

    // Create a regular user
    const user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'Password1',
      role: 'student',
      status: 'active'
    });
    userId = user._id;
    userToken = generateToken(userId);
  });

  describe('GET /api/users/profile', () => {
    it('should get current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Regular User');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update current user profile', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated User' });

      console.log('PUT /api/users/profile RESPONSE:', res.body);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated User');
    });
  });

  describe('GET /api/users', () => {
    it('should get all users if admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toBeInstanceOf(Array);
      expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter users by status if admin', async () => {
      await User.create({
        name: 'Pending User',
        email: 'pending-filter@example.com',
        password: 'Password1',
        role: 'student',
        status: 'pending'
      });

      const res = await request(app)
        .get('/api/users?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].status).toBe('pending');
    });

    it('should fail if not admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user role if admin', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'teacher' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.role).toBe('teacher');
    });

    it('should approve pending user if admin', async () => {
      const pendingUser = await User.create({
        name: 'Approve User',
        email: 'approve@example.com',
        password: 'Password1',
        role: 'student',
        status: 'pending'
      });

      const res = await request(app)
        .put(`/api/users/${pendingUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('active');
    });

    it('should fail to update user if not admin', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });

      expect(res.statusCode).toEqual(403);
    });
  });
});
