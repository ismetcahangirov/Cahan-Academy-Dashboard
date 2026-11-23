import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import categoryRoutes from '../../routes/categoryRoutes.js';
import { resetCategoryCache } from '../../controllers/categoryController.js';
import User from '../../models/userModel.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);
app.use(errorHandler);

const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const makeUser = (role, email) =>
  User.create({ name: email.split('@')[0], email, password: 'Password1', role, status: 'active' });

const landingResponse = (status, json) => ({ status, json: async () => json });
const design = { id: 'c1', nameAz: 'Dizayn', nameEn: 'Design', nameRu: 'Дизайн', slug: 'design', createdAt: 'x' };
const body = { nameAz: 'Dizayn', nameEn: 'Design', nameRu: 'Дизайн', slug: 'design' };

describe('/api/categories (landing API proxy)', () => {
  let admin, teacher, fetchMock;
  const auth = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

  beforeEach(async () => {
    resetCategoryCache();
    process.env.LANDING_API_URL = 'https://landing.test/api';
    process.env.LANDING_CATEGORY_TOKEN = 'service-token';
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    admin = await makeUser('admin', 'cat-admin@example.com');
    teacher = await makeUser('teacher', 'cat-teacher@example.com');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.LANDING_CATEGORY_TOKEN;
  });

  it('lists the landing categories for any signed-in role, without the service token', async () => {
    fetchMock.mockResolvedValue(landingResponse(200, { success: true, data: [design] }));
    const res = await request(app).get('/api/categories').set(auth(teacher));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ id: 'c1', nameAz: 'Dizayn', nameEn: 'Design', nameRu: 'Дизайн', slug: 'design' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://landing.test/api/categories');
    expect(init.headers['X-Service-Token']).toBeUndefined();
  });

  it('requires sign-in', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('lets only admins write', async () => {
    const res = await request(app).post('/api/categories').set(auth(teacher)).send(body);
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates through the landing admin endpoint with the service token', async () => {
    fetchMock.mockResolvedValue(landingResponse(201, { success: true, data: design, message: 'ok' }));
    const res = await request(app)
      .post('/api/categories')
      .set(auth(admin))
      .send({ ...body, extra: 'dropped' });
    expect(res.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://landing.test/api/categories/admin');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Service-Token']).toBe('service-token');
    expect(JSON.parse(init.body)).toEqual(body);
  });

  it('passes on a landing 409 (category still has courses)', async () => {
    fetchMock.mockResolvedValue(landingResponse(409, { success: false, message: 'Bu kateqoriyada kurslar var.' }));
    const res = await request(app).delete('/api/categories/c1').set(auth(admin));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/kurslar var/);
  });

  it('answers 503 when the service token is not configured', async () => {
    delete process.env.LANDING_CATEGORY_TOKEN;
    const res = await request(app).put('/api/categories/c1').set(auth(admin)).send(body);
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 502 when the landing API is down', async () => {
    fetchMock.mockRejectedValue(new Error('down'));
    const res = await request(app).get('/api/categories').set(auth(admin));
    expect(res.status).toBe(502);
  });
});
