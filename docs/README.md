# Academy Dashboard — Layihə Sənədləşməsi

> **Versiya:** 1.0.0  
> **Status:** Planlaşdırma mərhələsi  
> **Son yenilənmə:** 2026  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)

---

## Layihə haqqında

Academy Dashboard — tədris müəssisələri üçün hazırlanmış tam funksional idarəetmə panelidir. Sistem üç fərqli rol üçün optimallaşdırılmış interfeyslər təqdim edir: **Admin**, **Müəllim** və **Tələbə**.

Layihə **Frontend** və **Backend** olmaqla iki hissədən ibarətdir.

---

## Texnologiya Yığımı

### Frontend

| Texnologiya | Versiya | Məqsəd |
|---|---|---|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool |
| Tailwind CSS | 3+ | Styling |
| Lucide React | latest | İkon kitabxanası |
| React Router | 6+ | Routing |
| Redux Toolkit | 2+ | State management |
| RTK Query | 2+ | Server state + API çağırışları |
| React Hook Form | 7+ | Form idarəsi |
| Zod | 3+ | Schema validation |
| Axios | 1+ | HTTP client |
| i18next | latest | Çoxdilli dəstək (AZ, EN, RU) |

### Backend

| Texnologiya | Versiya | Məqsəd |
|---|---|---|
| Node.js | 20+ | Runtime mühit |
| Express.js | 4+ | Web framework |
| MongoDB | 7+ | Verilənlər bazası |
| Mongoose | 8+ | ODM (Object Document Mapper) |
| JSON Web Token (JWT) | 9+ | Autentifikasiya |
| bcryptjs | 2+ | Şifrə hashlanması |
| Nodemailer | 6+ | Email göndərmə (dəvətlər) |
| Multer | 1+ | Fayl yükləmə |
| Express Validator | 7+ | Request validasiyası |
| Helmet | 7+ | HTTP security headers |
| CORS | 2+ | Cross-Origin idarəsi |
| Morgan | 1+ | HTTP request logging |
| dotenv | 16+ | Mühit dəyişənləri |
| Rate Limiter Flexible | 3+ | Rate limiting |

---

## Rəng Palitası

```css
/* Əsas rənglər */
--color-primary:    #800020;   /* Bordo */
--color-primary-dark: #5a0016; /* Tünd bordo */
--color-primary-light: #a3002a;/* Açıq bordo */
--color-white:      #FFFFFF;   /* Ağ */
--color-black:      #0A0A0A;   /* Qara */
--color-gray-50:    #F9F9F9;
--color-gray-100:   #F0F0F0;
--color-gray-200:   #E0E0E0;
--color-gray-700:   #444444;
--color-gray-900:   #1A1A1A;
```

---

## Rolllar

| Rol | Səlahiyyətlər |
|---|---|
| **Admin** | Tam idarəetmə: istifadəçilər, qruplar, dərslər, imtahanlar, statistika |
| **Müəllim** | Öz dərslərini, tapşırıqlarını, tələbələrini idarə edir |
| **Tələbə** | Öz cədvəlini, tapşırıqlarını, nəticələrini görür |

---

## Dil Dəstəyi

- **AZ** — Azərbaycan dili (default)
- **EN** — İngilis dili
- **RU** — Rus dili

---

## Layout Strukturu

### Desktop
```
┌─────────────────────────────────────┐
│  Sidebar (açıq/bağlı)  │  Main Area │
│  [Logo]                │            │
│  [Nav Items]           │  Content   │
│  [User Info]           │            │
└─────────────────────────────────────┘
```

### Mobil
```
┌─────────────────┐
│   Main Area     │
│   Content       │
│                 │
├─────────────────┤
│  Bottom Tabs    │
└─────────────────┘
```

---

## Səhifələr

| Səhifə | Yol | Rolllar |
|---|---|---|
| Login | `/login` | Hamı |
| Register | `/register` | Hamı |
| Dashboard | `/dashboard` | Admin, Müəllim, Tələbə |
| Dəvətlər | `/invitations` | Admin |
| Müəllimlər | `/teachers` | Admin |
| Tələbələr | `/students` | Admin, Müəllim |
| Cədvəl | `/schedule` | Hamı |
| Qruplar | `/groups` | Admin, Müəllim |
| Tapşırıqlar (ev) | `/homeworks` | Admin, Müəllim, Tələbə |
| Sinif işi | `/classworks` | Admin, Müəllim, Tələbə |
| İmtahanlar | `/exams` | Hamı |
| Profil | `/profile` | Hamı |
| Parametrlər | `/settings` | Hamı |

---

## Sənədlər İndeksi

```
docs/
├── README.md                  ← Bu fayl
├── TODO.md                    ← Tapşırıqlar siyahısı
├── ARCHITECTURE.md            ← Texniki arxitektura
├── API.md                     ← API sənədləşməsi
├── AUTH.md                    ← Autentifikasiya
├── SECURITY.md                ← Təhlükəsizlik
├── ERROR_HANDLING.md          ← Xəta idarəsi
├── TESTING.md                 ← Test strategiyası
├── ROLES_PERMISSIONS.md       ← Rol və icazələr
├── COMPONENTS.md              ← Komponent kataloqu
├── I18N.md                    ← Çoxdilli dəstək
├── DEPLOYMENT.md              ← Deploy
└── CONTRIBUTING.md            ← Töhfə qaydaları
```

---

## Layihə Strukturu

```
Cahan-Academy-Dashboard/
├── client/                        ← Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   └── store.js           ← Redux store konfiqurasiyası
│   │   ├── assets/
│   │   ├── components/            ← Ümumi komponentlər
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── BottomTabs.jsx
│   │   │   │   └── Header.jsx
│   │   │   └── ui/
│   │   ├── features/              ← Redux slices + RTK Query
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── teachers/
│   │   │   ├── students/
│   │   │   ├── groups/
│   │   │   ├── schedule/
│   │   │   ├── homeworks/
│   │   │   ├── classworks/
│   │   │   ├── exams/
│   │   │   └── invitations/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── i18n/
│   │   │   ├── az.json
│   │   │   ├── en.json
│   │   │   └── ru.json
│   │   └── main.jsx
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
├── server/                        ← Backend (Node.js + Express)
│   ├── config/
│   │   ├── db.js                  ← MongoDB bağlantısı
│   │   └── corsOptions.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── teacherController.js
│   │   ├── studentController.js
│   │   ├── groupController.js
│   │   ├── scheduleController.js
│   │   ├── homeworkController.js
│   │   ├── classworkController.js
│   │   ├── examController.js
│   │   └── invitationController.js
│   ├── middleware/
│   │   ├── authMiddleware.js      ← JWT yoxlama
│   │   ├── roleMiddleware.js      ← Rol yoxlama
│   │   ├── errorMiddleware.js     ← Global xəta tutma
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Schedule.js
│   │   ├── Homework.js
│   │   ├── Classwork.js
│   │   ├── Exam.js
│   │   └── Invitation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── scheduleRoutes.js
│   │   ├── homeworkRoutes.js
│   │   ├── classworkRoutes.js
│   │   ├── examRoutes.js
│   │   └── invitationRoutes.js
│   ├── utils/
│   │   ├── sendEmail.js
│   │   ├── generateToken.js
│   │   └── apiResponse.js
│   ├── .env.example
│   ├── server.js                  ← Entry point
│   └── package.json
│
├── docs/                          ← Bütün sənədlər
└── README.md
```

---

## Mühit Dəyişənləri

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/<db_name>?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=30d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Client URL (CORS)
CLIENT_URL=http://localhost:5173
```

---

## Sürətli Başlanğıc

```bash
# Repo-nu klonla
git clone https://github.com/ismetcahangirov/Cahan-Academy-Dashboard.git
cd Cahan-Academy-Dashboard

# ── Backend ──────────────────────────
cd server
npm install
cp .env.example .env
# .env faylını doldur
npm run dev          # localhost:5000

# ── Frontend (yeni terminal) ─────────
cd ../client
npm install
cp .env.example .env
npm run dev          # localhost:5173

# ── Test ─────────────────────────────
npm run test         # unit testlər
npm run test:e2e     # end-to-end testlər

# ── Production Build ──────────────────
cd client && npm run build
cd ../server && npm start
```

---

## Əlaqə

Layihə ilə bağlı suallar üçün: **admin@academy.az**
