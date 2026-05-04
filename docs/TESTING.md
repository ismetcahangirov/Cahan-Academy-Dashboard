# TESTING.md — Test Strategiyası

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Test Piramidası

```
           /\
          /  \
         / E2E\          ← Az, yavaş, bahalı
        /──────\            (Playwright — kritik axınlar)
       /        \
      /Integration\     ← Orta, API testləri
     /────────────\        (Jest + Supertest)
    /              \
   /   Unit Tests   \   ← Çox, sürətli, ucuz
  /──────────────────\     (Jest / Vitest)
```

| Növ | Alət | Hədəf | Coverage |
|---|---|---|---|
| Unit | Jest (backend), Vitest (frontend) | Funksiyalar, utility-lər, Redux slice-lar | 80%+ |
| Integration | Jest + Supertest | API endpointləri, middleware | 70%+ |
| E2E | Playwright | Kritik istifadəçi axınları | Əsas axınlar |

---

## 2. Backend Test Qurulumu

### Quraşdırma

```bash
cd server
npm install --save-dev jest supertest mongodb-memory-server @types/jest
```

### `package.json` konfiqurasiyası

```json
{
  "scripts": {
    "test":          "jest --runInBand",
    "test:watch":    "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci":       "jest --runInBand --forceExit --coverage"
  },
  "jest": {
    "testEnvironment":  "node",
    "testMatch":        ["**/__tests__/**/*.test.js"],
    "collectCoverageFrom": [
      "controllers/**/*.js",
      "middleware/**/*.js",
      "utils/**/*.js",
      "models/**/*.js"
    ],
    "coverageThreshold": {
      "global": {
        "branches":   70,
        "functions":  80,
        "lines":      80,
        "statements": 80
      }
    },
    "setupFilesAfterFramework": ["<rootDir>/__tests__/setup.js"]
  }
}
```

### Test Setup Faylı

```javascript
// server/__tests__/setup.js

const mongoose           = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Bütün testlərdən əvvəl — in-memory DB başlat
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri   = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Hər testdən sonra — kolleksiyaları təmizlə
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Bütün testlərdən sonra — DB bağla
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

### Test Yardımçı Funksiyaları

```javascript
// server/__tests__/helpers/authHelper.js

const User    = require('../../models/User');
const { generateAccessToken } = require('../../utils/generateToken');

const createUser = async (overrides = {}) => {
  const defaults = {
    name:     'Test İstifadəçi',
    email:    'test@example.com',
    password: 'Test1234!',
    role:     'student',
    isActive: true,
  };
  return User.create({ ...defaults, ...overrides });
};

const createAdmin = (overrides = {}) =>
  createUser({ name: 'Admin', email: 'admin@example.com', role: 'admin', ...overrides });

const createTeacher = (overrides = {}) =>
  createUser({ name: 'Müəllim', email: 'teacher@example.com', role: 'teacher', ...overrides });

const getAuthHeader = (user) => ({
  Authorization: `Bearer ${generateAccessToken(user)}`,
});

module.exports = { createUser, createAdmin, createTeacher, getAuthHeader };
```

---

## 3. Backend — Unit Testlər

### Utility Testləri

```javascript
// server/__tests__/utils/generateToken.test.js

const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');

process.env.JWT_SECRET         = 'test-secret-key-minimum-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum!!';

describe('generateToken utility', () => {
  const mockUser = { _id: '64a123456789', email: 'test@test.com', role: 'admin' };

  describe('generateAccessToken', () => {
    it('düzgün payload ilə token yaratmalıdır', () => {
      const token   = generateAccessToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.sub).toBe(mockUser._id.toString());
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('15 dəqiqəlik token yaratmalıdır', () => {
      const token   = generateAccessToken(mockUser);
      const decoded = jwt.decode(token);
      const diff    = decoded.exp - decoded.iat;

      expect(diff).toBe(15 * 60); // 900 saniyə
    });
  });

  describe('generateRefreshToken', () => {
    it('yalnız sub sahəsi olan token yaratmalıdır', () => {
      const token   = generateRefreshToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      expect(decoded.sub).toBe(mockUser._id.toString());
      expect(decoded.email).toBeUndefined();
    });
  });
});
```

### AppError Testi

```javascript
// server/__tests__/utils/AppError.test.js

const AppError = require('../../utils/AppError');

describe('AppError sinifi', () => {
  it('düzgün xüsusiyyətlər ilə yaradılmalıdır', () => {
    const err = new AppError('Test xətası', 404, 'NOT_FOUND');

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Test xətası');
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.isOperational).toBe(true);
  });

  it('default errorCode INTERNAL_ERROR olmalıdır', () => {
    const err = new AppError('Xəta', 500);
    expect(err.errorCode).toBe('INTERNAL_ERROR');
  });
});
```

### Mongoose Model Testi

```javascript
// server/__tests__/models/User.test.js

const User = require('../../models/User');

describe('User modeli', () => {
  describe('Validasiya', () => {
    it('tələb olunan sahələr olmadan saxlanmamalıdır', async () => {
      const user = new User({});
      await expect(user.save()).rejects.toThrow();
    });

    it('eyni email ilə iki user yaradılmamalıdır', async () => {
      await User.create({ name: 'User 1', email: 'dup@test.com', password: 'Pass123!', role: 'student' });
      await expect(
        User.create({ name: 'User 2', email: 'dup@test.com', password: 'Pass456!', role: 'student' })
      ).rejects.toThrow();
    });

    it('yanlış rol qəbul edilməməlidir', async () => {
      const user = new User({ name: 'X', email: 'x@test.com', password: 'Pass123!', role: 'superadmin' });
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Şifrə hashlanması', () => {
    it('şifrə saxlanarkən hash edilməlidir', async () => {
      const user = await User.create({
        name: 'Tест', email: 'hash@test.com', password: 'Plain123!', role: 'student',
      });
      expect(user.password).not.toBe('Plain123!');
      expect(user.password).toMatch(/^\$2[ab]\$\d+\$/); // bcrypt formatı
    });

    it('comparePassword düzgün işləməlidir', async () => {
      const user = await User.create({
        name: 'Test', email: 'cmp@test.com', password: 'Correct1!', role: 'student',
      });
      await expect(user.comparePassword('Correct1!')).resolves.toBe(true);
      await expect(user.comparePassword('Wrong111!')).resolves.toBe(false);
    });

    it('toJSON şifrəni gizlətməlidir', async () => {
      const user = await User.create({
        name: 'JSON', email: 'json@test.com', password: 'Pass123!', role: 'student',
      });
      const json = user.toJSON();
      expect(json.password).toBeUndefined();
    });
  });
});
```

---

## 4. Backend — Integration Testləri (API)

### Auth Endpointləri

```javascript
// server/__tests__/controllers/auth.test.js

const request = require('supertest');
const app     = require('../../server');
const User    = require('../../models/User');

describe('Auth API', () => {

  // ── REGISTER ─────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    const validPayload = {
      name:            'Əli Həsənov',
      email:           'ali@test.com',
      password:        'Secure123!',
      confirmPassword: 'Secure123!',
    };

    it('düzgün məlumatla 201 qaytarmalıdır', async () => {
      const res = await request(app).post('/api/auth/register').send(validPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('ali@test.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('təkrarlanan email ilə 409 qaytarmalıdır', async () => {
      await request(app).post('/api/auth/register').send(validPayload);
      const res = await request(app).post('/api/auth/register').send(validPayload);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe('ALREADY_EXISTS');
    });

    it('şifrəsiz 400 qaytarmalıdır', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test', email: 'x@test.com',
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('uyğun olmayan şifrələrlə 400 qaytarmalıdır', async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...validPayload, confirmPassword: 'Different1!',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── LOGIN ────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login Test', email: 'login@test.com',
        password: 'Pass123!', role: 'student',
      });
    });

    it('düzgün giriş ilə token qaytarmalıdır', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com', password: 'Pass123!',
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('yanlış şifrə ilə 401 qaytarmalıdır', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com', password: 'WrongPass1!',
      });
      expect(res.statusCode).toBe(401);
    });

    it('mövcud olmayan email ilə 401 qaytarmalıdır', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'yoxdur@test.com', password: 'Pass123!',
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
```

### Qorunan Route Testləri

```javascript
// server/__tests__/controllers/teachers.test.js

const request = require('supertest');
const app     = require('../../server');
const { createAdmin, createTeacher, createUser, getAuthHeader } = require('../helpers/authHelper');

describe('Teachers API', () => {

  describe('GET /api/teachers', () => {
    it('admin token olmadan 401 qaytarmalıdır', async () => {
      const res = await request(app).get('/api/teachers');
      expect(res.statusCode).toBe(401);
    });

    it('tələbə ilə 403 qaytarmalıdır', async () => {
      const student = await createUser({ email: 'st@test.com' });
      const res = await request(app)
        .get('/api/teachers')
        .set(getAuthHeader(student));
      expect(res.statusCode).toBe(403);
    });

    it('admin ilə müəllim siyahısı qaytarmalıdır', async () => {
      const admin   = await createAdmin({ email: 'adm@test.com' });
      await createTeacher({ email: 't1@test.com' });
      await createTeacher({ email: 't2@test.com' });

      const res = await request(app)
        .get('/api/teachers')
        .set(getAuthHeader(admin));

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('axtarış parametri düzgün işləməlidir', async () => {
      const admin = await createAdmin({ email: 'adm2@test.com' });
      await createTeacher({ name: 'Leyla Məmmədova', email: 'leyla@test.com' });
      await createTeacher({ name: 'Murad Əliyev',   email: 'murad@test.com' });

      const res = await request(app)
        .get('/api/teachers?search=leyla')
        .set(getAuthHeader(admin));

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Leyla Məmmədova');
    });
  });

  describe('POST /api/teachers/invite', () => {
    it('admin müəllimə dəvət göndərə bilməlidir', async () => {
      const admin = await createAdmin({ email: 'inv-adm@test.com' });
      const res   = await request(app)
        .post('/api/teachers/invite')
        .set(getAuthHeader(admin))
        .send({ email: 'newteacher@test.com' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.email).toBe('newteacher@test.com');
    });

    it('müəllim başqasına dəvət göndərə bilməməlidir', async () => {
      const teacher = await createTeacher({ email: 'tch@test.com' });
      const res     = await request(app)
        .post('/api/teachers/invite')
        .set(getAuthHeader(teacher))
        .send({ email: 'other@test.com' });

      expect(res.statusCode).toBe(403);
    });
  });
});
```

### Middleware Testləri

```javascript
// server/__tests__/middleware/authMiddleware.test.js

const request = require('supertest');
const app     = require('../../server');
const { createUser, createAdmin, getAuthHeader } = require('../helpers/authHelper');
const jwt     = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-32-chars-minimum!!';

describe('Auth Middleware', () => {
  it('token olmadan 401 qaytarmalıdır', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('yanlış formatlı token ilə 401 qaytarmalıdır', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'InvalidToken');
    expect(res.statusCode).toBe(401);
  });

  it('müddəti bitmiş token ilə 401 TOKEN_EXPIRED qaytarmalıdır', async () => {
    const user    = await createUser({ email: 'exp@test.com' });
    const expired = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: '0s' });

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('TOKEN_EXPIRED');
  });

  it('etibarlı token ilə keçməlidir', async () => {
    const user = await createUser({ email: 'valid@test.com' });
    const res  = await request(app)
      .get('/api/users/me')
      .set(getAuthHeader(user));

    expect(res.statusCode).toBe(200);
  });
});
```

---

## 5. Frontend Test Qurulumu

### Quraşdırma

```bash
cd client
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react \
  @testing-library/jest-dom @testing-library/user-event msw jsdom
```

### `vite.config.js` konfiqurasiyası

```javascript
// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./src/__tests__/setup.js'],
    coverage: {
      provider:  'v8',
      reporter:  ['text', 'html'],
      threshold: { lines: 80, functions: 80 },
    },
  },
});
```

### Test Setup

```javascript
// client/src/__tests__/setup.js
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(()  => server.listen({ onUnhandledRequest: 'error' }));
afterEach(()  => { cleanup(); server.resetHandlers(); });
afterAll(()   => server.close());
```

### MSW — API Mock Serveri

```javascript
// client/src/__tests__/mocks/handlers.js
import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:5000/api';

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json();

    if (email === 'test@test.com' && password === 'Pass123!') {
      return HttpResponse.json({
        success: true,
        data: {
          user:        { _id: '1', name: 'Test', email, role: 'admin' },
          accessToken: 'mock-token-123',
        },
      });
    }
    return HttpResponse.json(
      { success: false, message: 'Email və ya şifrə yanlışdır', error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }),

  // Teachers
  http.get(`${BASE}/teachers`, () =>
    HttpResponse.json({
      success: true,
      data: [
        { _id: '1', name: 'Leyla Məmmədova', email: 'leyla@test.com', role: 'teacher' },
        { _id: '2', name: 'Murad Əliyev',   email: 'murad@test.com', role: 'teacher' },
      ],
      pagination: { page: 1, limit: 10, total: 2, pages: 1 },
    })
  ),

  // Dashboard stats
  http.get(`${BASE}/dashboard/stats`, () =>
    HttpResponse.json({
      success: true,
      data: { totalTeachers: 12, totalStudents: 145, totalGroups: 8, totalExams: 24 },
    })
  ),
];
```

```javascript
// client/src/__tests__/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers }    from './handlers';

export const server = setupServer(...handlers);
```

---

## 6. Frontend — Unit Testlər

### Redux Slice Testi

```javascript
// client/src/__tests__/features/auth/authSlice.test.js
import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, setToken, logout } from '../../../features/auth/authSlice';

const mockCredentials = {
  user:        { _id: '1', name: 'Test', email: 'test@test.com', role: 'admin' },
  accessToken: 'test-token',
};

describe('authSlice', () => {
  it('initial state düzgün olmalıdır', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setCredentials istifadəçini set etməlidir', () => {
    const state = authReducer(undefined, setCredentials(mockCredentials));
    expect(state.user).toEqual(mockCredentials.user);
    expect(state.accessToken).toBe('test-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('setToken yalnız token-i yeniləməlidir', () => {
    let state = authReducer(undefined, setCredentials(mockCredentials));
    state     = authReducer(state, setToken('new-token'));
    expect(state.accessToken).toBe('new-token');
    expect(state.user).toEqual(mockCredentials.user);
  });

  it('logout state-i sıfırlamalıdır', () => {
    let state = authReducer(undefined, setCredentials(mockCredentials));
    state     = authReducer(state, logout());
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
```

### Utility Funksiya Testi

```javascript
// client/src/__tests__/utils/errorParser.test.js
import { describe, it, expect } from 'vitest';
import { parseApiError }        from '../../../utils/errorParser';

describe('parseApiError utility', () => {
  it('API mesajını qaytarmalıdır', () => {
    const err = { data: { message: 'İcazə yoxdur' }, status: 403 };
    expect(parseApiError(err)).toBe('İcazə yoxdur');
  });

  it('status koduna görə fallback mesaj qaytarmalıdır', () => {
    expect(parseApiError({ status: 404 })).toBe('Axtarılan məlumat tapılmadı');
    expect(parseApiError({ status: 429 })).toBe('Çox sorğu göndərdiniz. Bir az gözləyin.');
    expect(parseApiError({ status: 500 })).toBe('Server xətası. Zəhmət olmasa sonra yenidən cəhd edin.');
  });

  it('naməlum xəta üçün ümumi mesaj qaytarmalıdır', () => {
    expect(parseApiError({})).toBe('Xəta baş verdi');
  });
});
```

---

## 7. Frontend — Komponent Testləri

### Input Komponenti Testi

```javascript
// client/src/__tests__/components/Input.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen }       from '@testing-library/react';
import Input                    from '../../../components/common/Input';

describe('Input komponenti', () => {
  it('label göstərməlidir', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('xəta mesajı göstərməlidir', () => {
    render(<Input label="Email" error="Düzgün email daxil edin" />);
    expect(screen.getByText('Düzgün email daxil edin')).toBeInTheDocument();
  });

  it('xəta olmadan xəta mesajı göstərməməlidir', () => {
    render(<Input label="Email" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
```

### Login Forması Testi

```javascript
// client/src/__tests__/pages/LoginPage.test.jsx
import { describe, it, expect, vi }       from 'vitest';
import { render, screen, waitFor }        from '@testing-library/react';
import userEvent                          from '@testing-library/user-event';
import { Provider }                       from 'react-redux';
import { BrowserRouter }                  from 'react-router-dom';
import { configureStore }                 from '@reduxjs/toolkit';
import LoginPage                          from '../../../pages/auth/LoginPage';
import authReducer                        from '../../../features/auth/authSlice';
import { authApi }                        from '../../../features/auth/authApi';

const renderLogin = () => {
  const store = configureStore({
    reducer: { auth: authReducer, [authApi.reducerPath]: authApi.reducer },
    middleware: (gDM) => gDM().concat(authApi.middleware),
  });
  render(
    <Provider store={store}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </Provider>
  );
  return { store };
};

describe('LoginPage', () => {
  it('login forması render olmalıdır', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/şifrə/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /daxil ol/i })).toBeInTheDocument();
  });

  it('boş formla submit validasiya xətası göstərməlidir', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /daxil ol/i }));
    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument();
    });
  });

  it('düzgün məlumatla uğurlu giriş etməlidir', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i),  'test@test.com');
    await user.type(screen.getByLabelText(/şifrə/i), 'Pass123!');
    await user.click(screen.getByRole('button', { name: /daxil ol/i }));
    await waitFor(() => {
      expect(screen.queryByText(/email.*şifrə yanlış/i)).not.toBeInTheDocument();
    });
  });
});
```

---

## 8. Test Əmrləri

```bash
# ── BACKEND ──────────────────────────────────────────────
cd server

npm run test               # Bütün testlər (bir dəfə)
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage hesabatı
npm run test:ci            # CI/CD üçün

# Xüsusi fayl
npx jest auth.test.js
npx jest --testNamePattern="register"

# ── FRONTEND ─────────────────────────────────────────────
cd client

npm run test               # Vitest
npm run test:ui            # Brauzer UI-da
npm run test:coverage      # Coverage hesabatı

# Xüsusi fayl
npx vitest authSlice.test.js
npx vitest --reporter verbose
```

---

## 9. Coverage Hədəfləri

| Modul | Hədəf | Prioritet |
|---|---|---|
| Auth controller | 90%+ | Kritik |
| Auth middleware | 90%+ | Kritik |
| Role middleware | 90%+ | Kritik |
| User model | 85%+ | Yüksək |
| Error middleware | 85%+ | Yüksək |
| Digər controller-lər | 75%+ | Orta |
| Utility funksiyalar | 80%+ | Yüksək |
| Redux slice-lar | 85%+ | Yüksək |
| UI komponentlər | 70%+ | Orta |

---

## 10. CI/CD-də Test

```yaml
# .github/workflows/ci.yml

name: CI

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd server && npm ci
      - run: cd server && npm run test:ci
        env:
          JWT_SECRET:         ${{ secrets.JWT_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
          NODE_ENV:           test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd client && npm ci
      - run: cd client && npm run test:coverage

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd server && npm audit --audit-level=high
      - run: cd client && npm audit --audit-level=high
```

---

## 11. Test Yazma Qaydaları

```
ADLANDIRMA
  ✅  "nə etməlidir" formatında: "uğurlu login 200 qaytarmalıdır"
  ✅  Azərbaycanca və ya İngiliscə — qarışıq olmasın
  ❌  "test1", "foo", "check"

STRUKTURLAŞMA (AAA)
  Arrange  →  Test məlumatlarını hazırla
  Act      →  Tətbiq et (funksiya çağır / button-a bas)
  Assert   →  Nəticəni yoxla

QAYDA
  ✅  Hər test 1 şeyi yoxlasın
  ✅  Testlər bir-birindən müstəqil olsun
  ✅  Real DB əvəzinə mock istifadə et (frontend)
  ✅  In-memory DB istifadə et (backend)
  ❌  Test daxilindən setTimeout istifadə etmə
  ❌  console.log-ları testdə buraxma
```
