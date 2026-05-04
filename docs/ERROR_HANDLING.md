# ERROR_HANDLING.md — Xəta İdarəsi

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Ümumi Strategiya

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                              │
│                                                         │
│  Controller → asyncHandler → Global Error Middleware    │
│                                    │                    │
│                              Standart JSON cavab        │
│                    { success, message, error, status }  │
└─────────────────────────────┬───────────────────────────┘
                              │ HTTP Response
┌─────────────────────────────▼───────────────────────────┐
│                    FRONTEND                             │
│                                                         │
│  RTK Query → Axios Interceptor → Redux Error State      │
│                                    │                    │
│                              Toast bildirişi            │
│                              (uğursuzluq mesajı)        │
└─────────────────────────────────────────────────────────┘
```

Qayda sadədir:
- **Backend** — hər xətanı tutur, standart formata salır, JSON qaytarır
- **Frontend** — hər API xətasını emal edir, istifadəçiyə anlaşılan mesaj göstərir

---

## 2. Backend — Xəta Sinifləri

```javascript
// utils/AppError.js

class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode  = statusCode;
    this.errorCode   = errorCode || 'INTERNAL_ERROR';
    this.isOperational = true; // Gözlənilən xəta (proqramçı tərəfindən atılan)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

// İstifadə nümunələri:
// throw new AppError('İstifadəçi tapılmadı', 404, 'NOT_FOUND');
// throw new AppError('Bu əməliyyat üçün icazəniz yoxdur', 403, 'FORBIDDEN');
// throw new AppError('Bu email artıq qeydiyyatdan keçib', 409, 'ALREADY_EXISTS');
```

### Xəta Kodu Sabitleri

```javascript
// utils/errorCodes.js

const ERROR_CODES = {
  // Auth xətaları
  UNAUTHORIZED:        { status: 401, message: 'Giriş üçün autentifikasiya tələb olunur' },
  TOKEN_EXPIRED:       { status: 401, message: 'Token müddəti bitib' },
  INVALID_TOKEN:       { status: 401, message: 'Token etibarsızdır' },
  FORBIDDEN:           { status: 403, message: 'Bu əməliyyat üçün icazəniz yoxdur' },
  ACCOUNT_DISABLED:    { status: 403, message: 'Hesabınız deaktiv edilib' },

  // Resurs xətaları
  NOT_FOUND:           { status: 404, message: 'Sorğulanan məlumat tapılmadı' },
  ALREADY_EXISTS:      { status: 409, message: 'Bu məlumat artıq mövcuddur' },
  INVITATION_EXPIRED:  { status: 410, message: 'Dəvətin müddəti bitib' },

  // Validasiya xətaları
  VALIDATION_ERROR:    { status: 400, message: 'Daxil edilən məlumat yanlışdır' },
  INVALID_PASSWORD:    { status: 400, message: 'Cari şifrə yanlışdır' },

  // Limit xətaları
  RATE_LIMIT_EXCEEDED: { status: 429, message: 'Çox sorğu göndərdiniz' },
  FILE_TOO_LARGE:      { status: 400, message: 'Fayl həcmi həddən böyükdür' },
  INVALID_FILE_TYPE:   { status: 400, message: 'Bu fayl növü dəstəklənmir' },

  // Server xətaları
  INTERNAL_ERROR:      { status: 500, message: 'Server xətası baş verdi' },
  DB_ERROR:            { status: 500, message: 'Verilənlər bazası xətası' },
};

module.exports = ERROR_CODES;
```

---

## 3. Backend — Async Handler Wrapper

Controller-lərdə hər funksiyaya `try/catch` yazmaqdan qaçmaq üçün:

```javascript
// utils/asyncHandler.js

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

// İstifadə nümunəsi — controller-də:
const asyncHandler = require('../utils/asyncHandler');
const AppError     = require('../utils/AppError');

// try/catch yoxdur — asyncHandler xətanı tutub next()-ə ötürür
exports.getTeachers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: 'teacher' });

  if (!teachers.length) {
    throw new AppError('Müəllim tapılmadı', 404, 'NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Müəllimlər uğurla əldə edildi',
    data:    teachers,
  });
});
```

---

## 4. Backend — Global Xəta Middleware

Express-in son middleware-i — bütün xətaları mərkəzləşdirilmiş şəkildə emal edir:

```javascript
// middleware/errorMiddleware.js

const AppError = require('../utils/AppError');

// Mongoose xəta növlərini AppError-a çevir
const handleCastError = (err) =>
  new AppError(`Yanlış dəyər: ${err.path} = ${err.value}`, 400, 'VALIDATION_ERROR');

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(
    `Bu ${field} artıq istifadədədir`,
    409,
    'ALREADY_EXISTS'
  );
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(messages.join('. '), 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Token etibarsızdır. Yenidən daxil olun.', 401, 'INVALID_TOKEN');

const handleJWTExpired = () =>
  new AppError('Token müddəti bitib.', 401, 'TOKEN_EXPIRED');

// Development-də tam məlumat, production-da minimal məlumat
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success:    false,
    message:    err.message,
    error:      err.errorCode || 'INTERNAL_ERROR',
    statusCode: err.statusCode || 500,
    stack:      err.stack,       // Stack trace yalnız dev-də
  });
};

const sendErrorProd = (err, res) => {
  // Gözlənilən (operasional) xəta — mesajı istifadəçiyə göstər
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success:    false,
      message:    err.message,
      error:      err.errorCode,
      statusCode: err.statusCode,
    });
  }

  // Gözlənilməyən xəta — stack trace-i gizlət
  console.error('KRİTİK XƏTA:', err);
  return res.status(500).json({
    success:    false,
    message:    'Xidmət müvəqqəti olaraq əlçatmazdır',
    error:      'INTERNAL_ERROR',
    statusCode: 500,
  });
};

// Ana error handler
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  let error = { ...err, message: err.message };

  // Mongoose xəta növlərini tanı və çevir
  if (err.name === 'CastError')              error = handleCastError(err);
  if (err.code  === 11000)                   error = handleDuplicateKey(err);
  if (err.name === 'ValidationError')        error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError')      error = handleJWTError();
  if (err.name === 'TokenExpiredError')      error = handleJWTExpired();

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;
```

```javascript
// server.js — ən sonda qeydiyyatdan keçir
const globalErrorHandler = require('./middleware/errorMiddleware');

// ... bütün route-lardan SONRA
app.use(globalErrorHandler);

// 404 — mövcud olmayan route
app.all('*', (req, res, next) => {
  next(new AppError(`${req.originalUrl} tapılmadı`, 404, 'NOT_FOUND'));
});
```

---

## 5. Backend — Standart API Cavab Utility

```javascript
// utils/apiResponse.js

const successResponse = (res, { message = 'Uğurlu', data = null, statusCode = 200, pagination = null }) => {
  const response = { success: true, message, data };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const errorResponse = (res, { message = 'Xəta baş verdi', error = 'INTERNAL_ERROR', statusCode = 500 }) => {
  return res.status(statusCode).json({ success: false, message, error, statusCode });
};

module.exports = { successResponse, errorResponse };

// Controller-də istifadə:
const { successResponse } = require('../utils/apiResponse');

exports.getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find();
  successResponse(res, {
    message:    'Qruplar əldə edildi',
    data:       groups,
    statusCode: 200,
  });
});
```

---

## 6. Frontend — RTK Query Xəta İdarəsi

### RTK Query Xəta Strukturu

```javascript
// RTK Query xəta obyekti:
{
  status: 403,
  data: {
    success:    false,
    message:    'Bu əməliyyat üçün icazəniz yoxdur',
    error:      'FORBIDDEN',
    statusCode: 403,
  }
}
```

### Xəta Mesajı Çıxarma Utility

```javascript
// utils/errorParser.js

export const parseApiError = (error) => {
  // RTK Query / Axios xətası
  if (error?.data?.message)   return error.data.message;
  if (error?.message)         return error.message;

  // HTTP status koduna görə fallback mesaj
  const statusMessages = {
    400: 'Daxil edilən məlumat yanlışdır',
    401: 'Giriş üçün yenidən daxil olun',
    403: 'Bu əməliyyat üçün icazəniz yoxdur',
    404: 'Axtarılan məlumat tapılmadı',
    409: 'Bu məlumat artıq mövcuddur',
    422: 'Məlumat emalı mümkün olmadı',
    429: 'Çox sorğu göndərdiniz. Bir az gözləyin.',
    500: 'Server xətası. Zəhmət olmasa sonra yenidən cəhd edin.',
  };

  return statusMessages[error?.status] || 'Xəta baş verdi';
};
```

### Komponentdə İstifadə

```jsx
// pages/TeachersPage.jsx

import { useGetTeachersQuery } from '../features/teachers/teachersApi';
import { parseApiError }       from '../utils/errorParser';
import Spinner                 from '../components/common/Spinner';
import EmptyState              from '../components/common/EmptyState';

const TeachersPage = () => {
  const { data, isLoading, isError, error } = useGetTeachersQuery();

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50">
        {parseApiError(error)}
      </div>
    );
  }

  if (!data?.data?.length) {
    return <EmptyState message="Hələ müəllim əlavə edilməyib" />;
  }

  return <div>{/* siyahı */}</div>;
};
```

---

## 7. Frontend — Toast Bildiriş Sistemi

### Quraşdırma

```bash
npm install react-hot-toast
```

### Setup

```jsx
// main.jsx
import { Toaster } from 'react-hot-toast';

<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      borderRadius: '8px',
      fontFamily:   'inherit',
    },
    success: {
      style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
    },
    error: {
      duration: 5000,
      style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
    },
  }}
/>
```

### Toast Utility

```javascript
// utils/toast.js
import toast from 'react-hot-toast';

export const showSuccess = (message) => toast.success(message);
export const showError   = (message) => toast.error(message);
export const showLoading = (message) => toast.loading(message);
export const showInfo    = (message) => toast(message, { icon: 'ℹ️' });
export const dismissToast = (id)     => toast.dismiss(id);
```

### Mutation-larda İstifadə

```jsx
// pages/TeachersPage.jsx

import { useInviteTeacherMutation } from '../features/teachers/teachersApi';
import { showSuccess, showError }   from '../utils/toast';
import { parseApiError }            from '../utils/errorParser';

const TeachersPage = () => {
  const [inviteTeacher, { isLoading }] = useInviteTeacherMutation();

  const handleInvite = async (email) => {
    try {
      await inviteTeacher({ email }).unwrap();
      showSuccess('Dəvət emaili uğurla göndərildi');
    } catch (err) {
      showError(parseApiError(err));
    }
  };

  return (
    <button onClick={() => handleInvite('muellim@example.com')} disabled={isLoading}>
      {isLoading ? 'Göndərilir...' : 'Dəvət göndər'}
    </button>
  );
};
```

---

## 8. Frontend — Error Boundary

React komponent ağacında render xətalarını tutur:

```jsx
// components/common/ErrorBoundary.jsx

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Xətanı loglama servisinə göndər (Sentry, vs.)
    console.error('ErrorBoundary xəta tutdu:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Xəta baş verdi
            </h2>
            <p className="text-gray-500 mb-6">
              Səhifə yüklənərkən problem yarandı.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Yenidən yüklə
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
```

```jsx
// main.jsx — ən yuxarı səviyyədə əhat et
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## 9. Frontend — Form Xəta Göstərmə

```jsx
// components/common/Input.jsx

const Input = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      className={`
        w-full px-3 py-2 rounded-lg border outline-none transition
        ${error
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
          : 'border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'
        }
      `}
      {...props}
    />
    {error && (
      <span className="text-xs text-red-600 mt-0.5">{error}</span>
    )}
  </div>
);

export default Input;
```

```jsx
// pages/auth/LoginPage.jsx — React Hook Form + Zod
import { useForm }       from 'react-hook-form';
import { zodResolver }   from '@hookform/resolvers/zod';
import { loginSchema }   from '../../features/auth/authValidation';
import Input             from '../../components/common/Input';

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data) => { /* ... */ };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Şifrə"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      <button type="submit">Daxil ol</button>
    </form>
  );
};
```

---

## 10. Xəta Ssenariləri və Həlləri

| Ssenairi | Backend Davranışı | Frontend Davranışı |
|---|---|---|
| Yanlış email/şifrə | `401 UNAUTHORIZED` | Toast: "Email və ya şifrə yanlışdır" |
| Token expire olub | `401 TOKEN_EXPIRED` | Axios interceptor → auto refresh |
| Refresh token da expire | `401` | Logout → login səhifəsi |
| İcazəsiz giriş | `403 FORBIDDEN` | Toast: "İcazəniz yoxdur" |
| Resurs tapılmadı | `404 NOT_FOUND` | EmptyState komponenti |
| Artıq mövcuddur | `409 ALREADY_EXISTS` | Toast: "Bu məlumat artıq mövcuddur" |
| Validasiya xətası | `400 VALIDATION_ERROR` | Form altında xəta mesajları |
| Rate limit aşıldı | `429` | Toast: "Çox sorğu. X saniyə gözləyin" |
| Server xətası | `500 INTERNAL_ERROR` | Toast: "Server xətası. Sonra cəhd edin" |
| Şəbəkə xətası | Network Error | Toast: "İnternet bağlantısını yoxlayın" |
| Fayl çox böyük | `400 FILE_TOO_LARGE` | Toast: "Fayl 2MB-dan böyük ola bilməz" |
| Dəvət vaxtı bitib | `410 INVITATION_EXPIRED` | Xəta səhifəsi + yeni dəvət istə |

---

## 11. Network Xəta Tutma (Axios)

```javascript
// utils/axiosInstance.js — response interceptor əlavə hissəsi

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Şəbəkə xətası (internet yoxdur, server çatışmır)
    if (!error.response) {
      showError('İnternet bağlantısını yoxlayın');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // 401 → token refresh (AUTH.md-dəki interceptor-da idarə olunur)
    if (status === 401) { /* ... */ }

    // 403 → icazə yoxdur
    if (status === 403) {
      showError(data?.message || 'Bu əməliyyat üçün icazəniz yoxdur');
    }

    // 429 → rate limit
    if (status === 429) {
      const seconds = error.response.headers['retry-after'] || 60;
      showError(`Çox sorğu göndərdiniz. ${seconds} saniyə sonra cəhd edin.`);
    }

    // 500 → server xətası
    if (status >= 500) {
      showError('Server xətası baş verdi. Zəhmət olmasa sonra yenidən cəhd edin.');
    }

    return Promise.reject(error);
  }
);
```

---

## 12. Xəta Loglama (Production)

```javascript
// server.js — process səviyyəsində tutulmamış xətalar

// Promise rejection-ları tut
process.on('unhandledRejection', (err) => {
  console.error('TUTULMAYAN PROMISE REJECTİON:', err.name, err.message);
  // Serveri səliqəli bağla
  server.close(() => process.exit(1));
});

// Sinxron istisnaları tut
process.on('uncaughtException', (err) => {
  console.error('TUTULMAYAN İSTİSNA:', err.name, err.message);
  process.exit(1);
});

// SIGTERM — Docker/Kubernetes üçün
process.on('SIGTERM', () => {
  console.log('SIGTERM alındı. Server bağlanır...');
  server.close(() => {
    console.log('Proses sonlandı.');
  });
});
```
