import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import paymentRoutes from '../../routes/paymentRoutes.js';
import Payment from '../../models/Payment.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const day = (d) => new Date(d).toISOString().slice(0, 10);

describe('PUT /api/payments/plan/:id', () => {
  let admin, student, adminToken, planId;

  const createPlan = async (body) => {
    const res = await request(app)
      .post('/api/payments/plan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: student._id, ...body });
    expect(res.status).toBe(201);
    return res.body.data;
  };

  const approve = async (historyId) => {
    const res = await request(app)
      .put(`/api/payments/${planId}/approve/${historyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paidDate: '2026-01-20' });
    expect(res.status).toBe(200);
  };

  const update = (body) =>
    request(app).put(`/api/payments/plan/${planId}`).set('Authorization', `Bearer ${adminToken}`).send(body);

  beforeEach(async () => {
    admin = await User.create({ name: 'Admin', email: 'admin@pay.com', password: 'Password1', role: 'admin', status: 'active' });
    student = await User.create({ name: 'Student', email: 'student@pay.com', password: 'Password1', role: 'student', status: 'active' });
    adminToken = tokenFor(admin._id);

    const plan = await createPlan({ amount: 100, type: 'monthly', startDate: '2026-01-15', endDate: '2026-06-15' });
    planId = plan._id;
    await approve(plan.history[0]._id);
    await approve(plan.history[1]._id);
  });

  it('keeps paid history on a description-only edit', async () => {
    const res = await update({ description: 'Yeni qeyd' });

    expect(res.status).toBe(200);
    const plan = await Payment.findById(planId);
    expect(plan.description).toBe('Yeni qeyd');
    expect(plan.history).toHaveLength(6);
    expect(plan.history.slice(0, 2).map((h) => h.status)).toEqual(['paid', 'paid']);
    expect(plan.history[0].approvedBy.toString()).toBe(admin._id.toString());
    expect(day(plan.history[0].paidDate)).toBe('2026-01-20');
  });

  it('does not regenerate when the same values are sent back unchanged', async () => {
    const before = await Payment.findById(planId);
    const res = await update({ amount: '100', type: 'monthly', startDate: '2026-01-15', endDate: '2026-06-15', description: '' });

    expect(res.status).toBe(200);
    const after = await Payment.findById(planId);
    expect(after.history.map((h) => h._id.toString())).toEqual(before.history.map((h) => h._id.toString()));
    expect(after.history.filter((h) => h.status === 'paid')).toHaveLength(2);
  });

  it('preserves paid entries whose due date survives a schedule change', async () => {
    const res = await update({ amount: 120, endDate: '2026-03-15' });

    expect(res.status).toBe(200);
    const plan = await Payment.findById(planId);
    expect(plan.history.map((h) => day(h.dueDate))).toEqual(['2026-01-15', '2026-02-15', '2026-03-15']);
    expect(plan.history.map((h) => h.status)).toEqual(['paid', 'paid', 'pending']);
    // Paid entries keep the amount that was actually paid; open ones take the new amount
    expect(plan.history.map((h) => h.amount)).toEqual([100, 100, 120]);
    expect(plan.amount).toBe(120);
  });

  it('never drops a paid entry that no longer fits the new schedule', async () => {
    const res = await update({ startDate: '2026-02-15' });

    expect(res.status).toBe(200);
    const plan = await Payment.findById(planId);
    const dueDays = plan.history.map((h) => day(h.dueDate));
    expect(dueDays[0]).toBe('2026-01-15');
    expect(plan.history[0].status).toBe('paid');
    expect(plan.history[1].status).toBe('paid');
    expect(dueDays[1]).toBe('2026-02-15');
    expect(plan.history.filter((h) => h.status === 'paid')).toHaveLength(2);
  });

  it('clears the end date when null is sent', async () => {
    const res = await update({ endDate: null });

    expect(res.status).toBe(200);
    const plan = await Payment.findById(planId);
    expect(plan.endDate).toBeNull();
    expect(plan.history).toHaveLength(24);
    expect(plan.history.filter((h) => h.status === 'paid')).toHaveLength(2);
  });
});
