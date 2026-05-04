# AUTH.md — Autentifikasiya & Avtorizasiya

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Ümumi Baxış

Sistem iki paralel autentifikasiya üsulunu dəstəkləyir:

| Üsul | Açıqlama |
|---|---|
| **Email + Şifrə** | Klassik qeydiyyat/giriş |
| **Google OAuth 2.0** | Google hesabı ilə bir kliklə giriş |

Hər iki üsul eyni JWT token sistemini istifadə edir.

---

## 2. JWT Token Strategiyası

### 2.1 Token Növləri

```
┌─────────────────────────────────────────────┐
│           ACCESS TOKEN                      │
│  • Müddət: 15 dəqiqə                        │
│  • Yerdə saxlanır: Redux state (memory)     │
│  • Hər API sorğusunda istifadə olunur       │
│  • Header: Authorization: Bearer <token>   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           REFRESH TOKEN                     │
│  • Müddət: 30 gün                           │
│  • Yerdə saxlanır: httpOnly Cookie          │
│  • Yalnız /api/auth/refresh-token-ə gedir  │
│  • Avtomatik access token yeniləmə üçün    │
└─────────────────────────────────────────────┘
```

### 2.2 Token Payload Strukturu

```json
// Access Token Payload
{
  "sub": "64a...",         // User ID (MongoDB ObjectId)
  "email": "ali@...",
  "role": "admin",         // "admin" | "teacher" | "student"
  "iat": 1706789000,       // Yaradılma vaxtı (Unix timestamp)
  "exp": 1706789900        // Bitmə vaxtı
}
```

### 2.3 Token Yaratma (Backend)

```javascript
// utils/generateToken.js

const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub:   user._id,
      email: user.email,
      role:  user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
```

### 2.4 Refresh Token Cookie Konfiqurasiyası

```javascript
// authController.js — login/register cavabında

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,          // JS ilə oxunmur → XSS qoruması
  secure: process.env.NODE_ENV === 'production', // HTTPS only (prod)
  sameSite: 'strict',      // CSRF qoruması
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 gün (ms)
  path: '/api/auth',       // Yalnız auth endpointlərə göndərilir
});
```

---

## 3. Email + Şifrə Axını

### 3.1 Qeydiyyat

```
İstifadəçi
    │  POST /api/auth/register
    │  { name, email, password, confirmPassword }
    ▼
Validasiya
    │  • Bütün sahələr doldurulub?
    │  • Email formatı doğrudurmu?
    │  • Şifrə tələblərə uyğundurmu?
    │  • Şifrələr eynidir?
    ▼
Email Yoxlaması
    │  • Bu email artıq qeydiyyatdan keçibmi? → 409 ALREADY_EXISTS
    ▼
Şifrə Hashlanması
    │  bcrypt.hash(password, 12)
    ▼
User Yaradılması
    │  MongoDB-də yeni User sənədi
    │  role: "student" (default)
    ▼
Token Generasiyası
    │  accessToken  (15 dəq)
    │  refreshToken (30 gün) → httpOnly cookie
    ▼
Cavab 201
    { user, accessToken }
```

### 3.2 Giriş

```
İstifadəçi
    │  POST /api/auth/login
    │  { email, password }
    ▼
User Tapılması
    │  • Bu email mövcuddurmu? → 401 UNAUTHORIZED
    │  • İstifadəçi aktivdirmi? → 403 FORBIDDEN
    ▼
Şifrə Yoxlaması
    │  bcrypt.compare(password, user.password)
    │  Uyğun deyil → 401 UNAUTHORIZED
    ▼
Token Generasiyası
    │  accessToken  (15 dəq)
    │  refreshToken (30 gün) → httpOnly cookie
    ▼
Cavab 200
    { user, accessToken }
```

### 3.3 Token Yeniləmə (Auto Refresh)

```
Axios Interceptor (Frontend)
    │  API sorğusu göndərilir
    ▼
Server → 401 TOKEN_EXPIRED
    │
    ▼
Interceptor xətanı tutur
    │  POST /api/auth/refresh-token
    │  (refreshToken cookie avtomatik göndərilir)
    ▼
Server refresh token-i yoxlayır
    │  Etibarsızdırsa → logout, login səhifəsinə yönləndir
    ▼
Yeni accessToken qaytarılır
    │
    ▼
Orijinal sorğu yenidən göndərilir
    │  yeni access token ilə
    ▼
Nəticə istifadəçiyə çatdırılır
    (istifadəçi heç nə hiss etmir)
```

```javascript
// utils/axiosInstance.js (Frontend)

import axios from 'axios';
import { store } from '../app/store';
import { setToken, logout } from '../features/auth/authSlice';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Cookie-lər göndərilsin
});

// Request interceptor — access token əlavə et
axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — token expire olubsa yenilə
let isRefreshing = false;
let failedQueue = [];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        store.dispatch(setToken(newToken));
        failedQueue.forEach((p) => p.resolve(newToken));
        failedQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch {
        failedQueue.forEach((p) => p.reject(error));
        failedQueue = [];
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## 4. Google OAuth 2.0 Axını

### 4.1 Ümumi Axın

```
İstifadəçi "Google ilə daxil ol" düyməsinə basır
    │
    ▼
Google Sign-In popup/redirect açılır
    │
    ▼
İstifadəçi Google hesabını seçir
    │
    ▼
Google → Frontend-ə ID Token qaytarır
    │
    ▼
Frontend → Backend-ə göndərir
    │  POST /api/auth/google
    │  { googleToken: "ya29.a0ARrd..." }
    ▼
Backend Google Token-i doğrulayır
    │  Google API-si ilə verify edilir
    │  { email, name, picture, googleId }
    ▼
İstifadəçi mövcuddurmu?
    ├── Bəli → Login axını
    └── Xeyr → Avtomatik qeydiyyat (rol: "student")
    ▼
JWT Token generasiyası
    │  accessToken + refreshToken cookie
    ▼
Cavab 200
    { user, accessToken }
```

### 4.2 Backend Google Token Doğrulaması

```javascript
// authController.js

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res, next) => {
  try {
    const { googleToken } = req.body;

    // Google token-i doğrula
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub: googleId } = ticket.getPayload();

    // İstifadəçini tap və ya yarat
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        role: 'student',
        password: null, // Google user-lərin şifrəsi olmur
      });
    } else if (!user.googleId) {
      // Mövcud email + şifrə hesabına googleId əlavə et
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız deaktiv edilib',
        error: 'ACCOUNT_DISABLED',
      });
    }

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, { /* ... */ });

    res.status(200).json({
      success: true,
      message: 'Google ilə giriş uğurlu oldu',
      data: { user: { _id: user._id, name, email, role: user.role, avatar: user.avatar }, accessToken },
    });
  } catch (err) {
    next(err);
  }
};
```

### 4.3 Frontend Google Setup

```jsx
// components/auth/GoogleButton.jsx

import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useGoogleAuthMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';

const GoogleButton = () => {
  const dispatch   = useDispatch();
  const [googleAuth, { isLoading }] = useGoogleAuthMutation();

  const handleSuccess = async (credentialResponse) => {
    try {
      const result = await googleAuth({
        googleToken: credentialResponse.credential,
      }).unwrap();
      dispatch(setCredentials(result.data));
    } catch (err) {
      console.error('Google auth xətası:', err);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.error('Google giriş uğursuz oldu')}
      useOneTap
    />
  );
};

export default GoogleButton;
```

```jsx
// main.jsx — Provider qurulumu

import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <App />
</GoogleOAuthProvider>
```

---

## 5. Şifrəni Unutdum Axını

```
İstifadəçi email daxil edir
    │  POST /api/auth/forgot-password
    │  { email }
    ▼
Email tapılıbsa:
    │  • Təsadüfi reset token yaradılır (crypto.randomBytes)
    │  • Token hash-lənərək DB-yə saxlanır
    │  • Bitmə tarixi: 1 saat
    │  • Email göndərilir (Nodemailer)
    ▼
Email linki:
    https://cahanacademy.az/reset-password/<token>
    │
    ▼
İstifadəçi yeni şifrə daxil edir
    │  POST /api/auth/reset-password/:token
    │  { password, confirmPassword }
    ▼
Token yoxlanır:
    │  • DB-də hash-lənmiş token ilə müqayisə
    │  • Müddəti bitibmi?
    ▼
Şifrə yenilənir:
    │  bcrypt.hash(newPassword, 12)
    │  reset token DB-dən silinir
    ▼
Cavab 200 → Login səhifəsinə yönləndir
```

---

## 6. Rol Əsaslı Giriş Nəzarəti (RBAC)

### 6.1 Rollara İcazə Cədvəli

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Müəllim siyahısını gör | ✅ | ❌ | ❌ |
| Müəllim dəvət et | ✅ | ❌ | ❌ |
| Tələbə siyahısını gör | ✅ | ✅ (öz qrupu) | ❌ |
| Tələbə dəvət et | ✅ | ❌ | ❌ |
| Qrup yarat/sil | ✅ | ❌ | ❌ |
| Öz qruplarını gör | ✅ | ✅ | ✅ (öz qrupu) |
| Cədvəl əlavə et/sil | ✅ | ❌ | ❌ |
| Öz cədvəlini gör | ✅ | ✅ | ✅ |
| Tapşırıq yarat | ✅ | ✅ | ❌ |
| Tapşırıq təhvil ver | ❌ | ❌ | ✅ |
| Tapşırıq qiymətləndir | ✅ | ✅ | ❌ |
| İmtahan yarat | ✅ | ✅ | ❌ |
| İmtahan nəticəsi gir | ✅ | ✅ | ❌ |
| Dashboard statistika | ✅ (tam) | ✅ (öz) | ✅ (öz) |
| Dəvətlər səhifəsi | ✅ | ❌ | ❌ |
| Öz profilini yenilə | ✅ | ✅ | ✅ |
| Başqasını sil | ✅ | ❌ | ❌ |

### 6.2 Middleware-lər

```javascript
// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Giriş üçün autentifikasiya tələb olunur',
      error: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'İstifadəçi tapılmadı və ya deaktivdir',
        error: 'UNAUTHORIZED',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token müddəti bitib',
        error: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token etibarsızdır',
      error: 'UNAUTHORIZED',
    });
  }
};

module.exports = { protect };
```

```javascript
// middleware/roleMiddleware.js

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bu əməliyyat üçün "${roles.join(', ')}" rolu tələb olunur`,
        error: 'FORBIDDEN',
      });
    }
    next();
  };
};

module.exports = { authorize };

// İstifadə nümunəsi:
// router.get('/', protect, authorize('admin'), getTeachers);
// router.get('/', protect, authorize('admin', 'teacher'), getStudents);
```

### 6.3 Frontend Protected Route

```jsx
// components/layout/ProtectedRoute.jsx

import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, accessToken } = useSelector((state) => state.auth);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

// App.jsx-də istifadə:
// <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
//   <Route path="/teachers" element={<TeachersPage />} />
// </Route>
```

---

## 7. Şifrə Siyasəti

### Tələblər

| Tələb | Dəyər |
|---|---|
| Minimum uzunluq | 8 simvol |
| Maksimum uzunluq | 72 simvol (bcrypt limiti) |
| Böyük hərf | Ən az 1 |
| Kiçik hərf | Ən az 1 |
| Rəqəm | Ən az 1 |
| Xüsusi simvol | Tövsiyə olunur |
| Hash alqoritmi | bcryptjs |
| Salt rounds | 12 |

### Zod Şifrə Validasiyası (Frontend)

```javascript
// features/auth/authValidation.js

import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Şifrə minimum 8 simvol olmalıdır')
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
    name:            z.string().min(2, 'Ad minimum 2 simvol olmalıdır').max(50),
    email:           z.string().email('Düzgün email daxil edin'),
    password:        passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifrələr uyğun deyil',
    path:    ['confirmPassword'],
  });
```

---

## 8. Dəvət Sistemi ilə Auth İnteqrasiyası

```
Admin müəllim/tələbənin emailinə dəvət göndərir
    │
    ▼
Sistem unikal token yaradır (uuid v4)
    │  • Token DB-də saxlanır
    │  • Müddət: 48 saat
    │  • Status: "pending"
    ▼
Email göndərilir (Nodemailer)
    │  Link: https://cahanacademy.az/invite/accept/<token>
    ▼
Alıcı linkə keçir
    │  GET /api/invitations/accept/:token
    ▼
Token yoxlanır
    │  • Mövcuddurmu?
    │  • Müddəti bitibmi? → 410 INVITATION_EXPIRED
    │  • Status "pending"dirmi?
    ▼
Register forması açılır
    │  Email avtomatik doldurulur (readonly)
    │  Rol avtomatik təyin edilir (invitation-dan)
    ▼
İstifadəçi qeydiyyatı tamamlayır
    │  POST /api/auth/register
    │  { name, password, invitationToken }
    ▼
Sistem:
    │  • User yaradılır (rol dəvətdəki kimi)
    │  • Invitation status → "accepted"
    │  • İstifadəçi avtomatik login olur
    ▼
Dashboard-a yönləndirilir
```

---

## 9. Auth State — Redux Slice

```javascript
// features/auth/authSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user            = action.payload.user;
      state.accessToken     = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    setToken: (state, action) => {
      state.accessToken = action.payload;
    },
    logout: (state) => {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setToken, logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## 10. Təhlükəsizlik Qeydləri

| Risq | Qoruma üsulu |
|---|---|
| XSS ilə token oğurlanması | Refresh token httpOnly cookie-də saxlanır |
| CSRF hücumu | `sameSite: 'strict'` cookie parametri |
| Brute force | Rate limiting (5 cəhd / 15 dəq) |
| Token saxtalaşdırılması | JWT imzası `JWT_SECRET` ilə yoxlanır |
| Köhnə token istifadəsi | Access token 15 dəqiqə, refresh token 30 gün |
| Zəif şifrə | Zod validasiyası (frontend) + Express Validator (backend) |
| Hesab oğurlanması | Google OAuth 2.0 (Google-un öz təhlükəsizliyi) |
| Şifrə saxlama | Heç vaxt plaintext, yalnız bcrypt hash (12 round) |
