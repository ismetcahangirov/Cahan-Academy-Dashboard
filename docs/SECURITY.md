# SECURITY.md — Təhlükəsizlik Sənədləşməsi

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Təhlükəsizlik Layərləri

```
┌──────────────────────────────────────────────────────┐
│  LAYER 1 — NETWORK                                   │
│  HTTPS, SSL/TLS, Firewall, IP Whitelist (MongoDB)    │
├──────────────────────────────────────────────────────┤
│  LAYER 2 — HTTP                                      │
│  Helmet (security headers), CORS                     │
├──────────────────────────────────────────────────────┤
│  LAYER 3 — RATE LIMITING                             │
│  Brute force, DDoS qoruması                          │
├──────────────────────────────────────────────────────┤
│  LAYER 4 — AUTHENTICATION                            │
│  JWT, bcrypt, httpOnly cookie                        │
├──────────────────────────────────────────────────────┤
│  LAYER 5 — AUTHORIZATION                             │
│  RBAC — Rol əsaslı giriş nəzarəti                   │
├──────────────────────────────────────────────────────┤
│  LAYER 6 — INPUT VALIDATION                          │
│  Express Validator, Zod, Mongoose schema             │
├──────────────────────────────────────────────────────┤
│  LAYER 7 — DATABASE                                  │
│  NoSQL injection qoruması, az imtiyazlı DB user      │
└──────────────────────────────────────────────────────┘
```

---

## 2. HTTP Security Headers — Helmet

Helmet hər HTTP cavabına avtomatik təhlükəsizlik header-ləri əlavə edir.

### Quraşdırma

```bash
npm install helmet
```

### Konfiqurasiya

```javascript
// server.js

const helmet = require('helmet');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "https://accounts.google.com"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", "data:", "https:"],
        connectSrc:  ["'self'", "https://accounts.google.com"],
        frameSrc:    ["https://accounts.google.com"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard:   { action: 'deny' },
    noSniff:      true,
    xssFilter:    true,
    hsts: {
      maxAge:            31536000,
      includeSubDomains: true,
      preload:           true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy:  true,
  })
);
```

### Əlavə olunan Header-lər

| Header | Dəyər | Məqsəd |
|---|---|---|
| `Content-Security-Policy` | Custom | XSS, injection qoruması |
| `X-Frame-Options` | `DENY` | Clickjacking qoruması |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing qoruması |
| `Strict-Transport-Security` | `max-age=31536000` | HTTPS məcburi |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer məhdudlaşdırma |
| `X-Powered-By` | *(silindi)* | Tech stack gizlətmə |

---

## 3. CORS Konfiqurasiyası

```javascript
// config/corsOptions.js

const allowedOrigins = [
  'http://localhost:5173',
  'https://cahanacademy.az',
  'https://www.cahanacademy.az',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS xətası: ${origin} icazəsiz mənbədir`));
    }
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge:         86400,
};

module.exports = corsOptions;
```

```javascript
// server.js
const cors        = require('cors');
const corsOptions = require('./config/corsOptions');

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
```

---

## 4. Rate Limiting

### Quraşdırma

```bash
npm install rate-limiter-flexible
```

### Konfiqurasiya

```javascript
// middleware/rateLimiter.js

const { RateLimiterMemory } = require('rate-limiter-flexible');

const authLimiter = new RateLimiterMemory({
  points:        5,
  duration:      900,
  blockDuration: 900,
});

const apiLimiter = new RateLimiterMemory({
  points:   100,
  duration: 60,
});

const passwordResetLimiter = new RateLimiterMemory({
  points:        3,
  duration:      3600,
  blockDuration: 3600,
});

const rateLimitMiddleware = (limiter) => async (req, res, next) => {
  try {
    await limiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000);
    res.set('Retry-After', retryAfter);
    res.status(429).json({
      success:    false,
      message:    `Çox sorğu göndərdiniz. ${retryAfter} saniyə sonra yenidən cəhd edin.`,
      error:      'RATE_LIMIT_EXCEEDED',
      retryAfter,
    });
  }
};

module.exports = {
  authRateLimit:          rateLimitMiddleware(authLimiter),
  apiRateLimit:           rateLimitMiddleware(apiLimiter),
  passwordResetRateLimit: rateLimitMiddleware(passwordResetLimiter),
};
```

### Rate Limit Cədvəli

| Endpoint | Limit | Müddət | Blok |
|---|---|---|---|
| `POST /auth/login` | 5 | 15 dəq | 15 dəq |
| `POST /auth/register` | 5 | 15 dəq | 15 dəq |
| `POST /auth/forgot-password` | 3 | 1 saat | 1 saat |
| `POST /auth/reset-password` | 3 | 1 saat | 1 saat |
| `POST /auth/google` | 10 | 15 dəq | 15 dəq |
| Ümumi API | 100 | 1 dəq | — |

---

## 5. Input Validation & Sanitization

### Backend — Express Validator

```javascript
// middleware/validate.js

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Daxil edilən məlumat yanlışdır',
      error:   'VALIDATION_ERROR',
      details: errors.array().map((e) => ({
        field:   e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = { validate };
```

```javascript
// routes/authRoutes.js

const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ad tələb olunur')
    .isLength({ min: 2, max: 50 }).withMessage('Ad 2-50 simvol olmalıdır')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email tələb olunur')
    .isEmail().withMessage('Düzgün email daxil edin')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Şifrə tələb olunur')
    .isLength({ min: 8 }).withMessage('Şifrə minimum 8 simvol olmalıdır')
    .matches(/[A-Z]/).withMessage('Ən az 1 böyük hərf tələb olunur')
    .matches(/[0-9]/).withMessage('Ən az 1 rəqəm tələb olunur'),

  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Şifrələr uyğun deyil'),
];

router.post('/register', authRateLimit, registerValidation, validate, register);
```

### NoSQL Injection Qoruması

```bash
npm install express-mongo-sanitize xss-clean
```

```javascript
// server.js
const mongoSanitize = require('express-mongo-sanitize');
const xss           = require('xss-clean');

// $ və . simvollarını request məlumatlarından silir
app.use(mongoSanitize({ replaceWith: '_' }));

// XSS kodlarını təmizlər
app.use(xss());
```

```
Təhlükəli sorğu nümunəsi:
  { "email": { "$gt": "" } }   →  Bütün userləri qaytara bilər

express-mongo-sanitize sonra:
  { "email": { "_gt": "" } }   →  Zərərsiz hala gəlir
```

### Frontend — Zod Validasiyası

```javascript
// features/auth/authValidation.js
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8,  'Şifrə minimum 8 simvol olmalıdır')
  .max(72, 'Şifrə maksimum 72 simvol ola bilər')
  .regex(/[A-Z]/, 'Ən az 1 böyük hərf tələb olunur')
  .regex(/[a-z]/, 'Ən az 1 kiçik hərf tələb olunur')
  .regex(/[0-9]/, 'Ən az 1 rəqəm tələb olunur');

export const loginSchema = z.object({
  email:    z.string().email('Düzgün email daxil edin'),
  password: z.string().min(1, 'Şifrəni daxil edin'),
});

export const registerSchema = z
  .object({
    name:            z.string().min(2).max(50),
    email:           z.string().email(),
    password:        passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Şifrələr uyğun deyil',
    path:    ['confirmPassword'],
  });
```

---

## 6. Password Hashing

```javascript
// models/User.js
const bcrypt = require('bcryptjs');

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Cavabda şifrəni gizlət
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};
```

| Parametr | Dəyər | Qeyd |
|---|---|---|
| Alqoritm | bcryptjs | bcrypt-in JS implementasiyası |
| Salt rounds | 12 | ~250ms hash vaxtı — brute force üçün çətin |
| Maksimum uzunluq | 72 simvol | bcrypt-in fiziki limiti |

---

## 7. Fayl Yükləmə Təhlükəsizliyi

```javascript
// middleware/uploadMiddleware.js
const multer = require('multer');
const path   = require('path');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE     = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => {
    // Orijinal fayl adını istifadə etmə — path traversal riski
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${req.user._id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  ALLOWED_MIME.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Yalnız JPG, PNG, WEBP formatları icazəlidir'), false);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
```

| Qayda | Dəyər |
|---|---|
| İcazəli formatlar | JPG, PNG, WEBP |
| Maksimum ölçü (avatar) | 2MB |
| Maksimum ölçü (tapşırıq) | 10MB |
| Fayl adı | `userId-timestamp.ext` |
| Saxlama | Server disk (gələcəkdə S3) |

---

## 8. Environment Dəyişənlərinin Təhlükəsizliyi

```bash
# .gitignore
.env
.env.local
.env.production
server/.env
client/.env
```

```bash
# Güclü secret yaratma
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```
Development:   .env faylı (lokal, git-ə getmir)
Production:    Server panel mühit dəyişənləri
               Heç vaxt kod içinə yazılmır
               Heç vaxt loglara çıxarılmır
```

---

## 9. Loglama Qaydaları

```javascript
// OLMAZ
console.log('Şifrə:', password);             // Heç vaxt
console.log('Token:', token);                // Heç vaxt
console.log('Body:', req.body);              // Şifrə ola bilər
console.log('URI:', process.env.MONGO_URI); // Credentials görünür

// OLAR
console.log(`Login cəhdi: ${email}`);
console.log(`Uğursuz giriş IP: ${req.ip}`);
console.log(`User yaradıldı: ${user._id}`);
```

---

## 10. Dependency Audit

```bash
npm audit                              # Yoxla
npm audit fix                          # Avtomatik düzəlt
npm audit --audit-level=high           # CI/CD-də istifadə et
```

| Səviyyə | Hərəkət |
|---|---|
| `info` | İzlə |
| `low` | Növbəti versiyada düzəlt |
| `moderate` | 1 həftə içində düzəlt |
| `high` | 24 saat içində düzəlt |
| `critical` | Dərhal düzəlt, deploy blokla |

---

## 11. Production Yoxlama Siyahısı

```
AUTH & TOKEN
  [ ]  JWT_SECRET minimum 64 simvoldur
  [ ]  JWT_REFRESH_SECRET fərqli və minimum 64 simvoldur
  [ ]  Access token müddəti 15 dəqiqədir
  [ ]  Refresh token httpOnly cookie-dədir
  [ ]  Cookie sameSite=strict, secure=true (production)

HTTP TƏHLÜKƏSİZLİYİ
  [ ]  Helmet aktiv və konfiqurasiya edilib
  [ ]  CORS yalnız icazəli originlərə açıqdır
  [ ]  Rate limiting bütün auth endpointlərindədir
  [ ]  HTTPS məcburi edilib
  [ ]  X-Powered-By header silindi

VERİLƏNLƏR
  [ ]  .env faylı .gitignore-dadır
  [ ]  .env.example-da heç bir real dəyər yoxdur
  [ ]  MongoDB Atlas IP whitelist konfiqurasiya edilib
  [ ]  MongoDB user-in yalnız lazımlı icazəsi var

INPUT
  [ ]  express-mongo-sanitize aktiv
  [ ]  xss-clean aktiv
  [ ]  Bütün route-larda express-validator işlənir
  [ ]  Fayl yükləmələrdə ölçü və format yoxlanır

AUDIT
  [ ]  npm audit --audit-level=high keçilib
  [ ]  Bütün high/critical zəifliklər düzəldilib
  [ ]  CI/CD-də npm audit işləyir
```
