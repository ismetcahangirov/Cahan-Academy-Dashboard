# ARCHITECTURE.md — Texniki Arxitektura

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Ümumi Baxış

Layihə **client-server** arxitekturasına əsaslanır. Frontend və Backend tam ayrılmış, bir-biri ilə yalnız **REST API** vasitəsilə əlaqə saxlayır.

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│         React 18 + Vite + Redux Toolkit                 │
│                   localhost:5173                        │
└─────────────────────┬───────────────────────────────────┘
                      │  HTTP / REST API (Axios)
                      │  JWT Bearer Token
                      ▼
┌─────────────────────────────────────────────────────────┐
│                        SERVER                           │
│            Node.js + Express.js                         │
│                   localhost:5000                        │
└─────────────────────┬───────────────────────────────────┘
                      │  Mongoose ODM
                      ▼
┌─────────────────────────────────────────────────────────┐
│                      DATABASE                           │
│                  MongoDB Atlas                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Arxitekturası

### 2.1 Texnologiya Seçiminin Əsaslandırılması

| Texnologiya | Niyə seçildi |
|---|---|
| **React 18** | Komponent bazlı UI, geniş ekosistem |
| **Vite** | Sürətli HMR, optimallaşdırılmış build |
| **Redux Toolkit** | Mürəkkəb state idarəsi, RTK Query ilə API inteqrasiyası |
| **RTK Query** | Caching, refetching, loading/error state-ləri avtomatik |
| **Tailwind CSS** | Utility-first, responsive design, az custom CSS |
| **Lucide React** | Yüngül, konsistent, SVG əsaslı ikonlar |
| **React Hook Form + Zod** | Performanslı formalar, type-safe validasiya |
| **i18next** | React-ə tam inteqrasiya, namespace dəstəyi |

---

### 2.2 Qovluq Strukturu

```
client/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── store.js               ← Redux store
│   │   └── rootReducer.js         ← Bütün reducer-lərin birləşməsi
│   │
│   ├── assets/
│   │   ├── fonts/
│   │   └── images/
│   │
│   ├── components/
│   │   ├── common/                ← Hər yerdə istifadə olunan
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   │
│   │   ├── layout/                ← Layout komponentləri
│   │   │   ├── AppLayout.jsx      ← Ana layout wrapper
│   │   │   ├── Sidebar.jsx        ← Desktop sidebar
│   │   │   ├── BottomTabs.jsx     ← Mobil tab bar
│   │   │   ├── Header.jsx         ← Yuxarı header
│   │   │   └── ProtectedRoute.jsx ← Auth qoruması
│   │   │
│   │   └── ui/                    ← Xüsusi UI elementləri
│   │       ├── StatCard.jsx
│   │       ├── PageHeader.jsx
│   │       ├── SearchBar.jsx
│   │       └── LanguageSwitcher.jsx
│   │
│   ├── features/                  ← Redux slices + RTK Query APIs
│   │   ├── auth/
│   │   │   ├── authSlice.js       ← Token, user, isAuthenticated
│   │   │   ├── authApi.js         ← RTK Query endpoints
│   │   │   └── authHelpers.js
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboardSlice.js
│   │   │   └── dashboardApi.js
│   │   │
│   │   ├── teachers/
│   │   │   ├── teachersSlice.js
│   │   │   └── teachersApi.js
│   │   │
│   │   ├── students/
│   │   │   ├── studentsSlice.js
│   │   │   └── studentsApi.js
│   │   │
│   │   ├── groups/
│   │   │   ├── groupsSlice.js
│   │   │   └── groupsApi.js
│   │   │
│   │   ├── schedule/
│   │   │   ├── scheduleSlice.js
│   │   │   └── scheduleApi.js
│   │   │
│   │   ├── homeworks/
│   │   │   ├── homeworksSlice.js
│   │   │   └── homeworksApi.js
│   │   │
│   │   ├── classworks/
│   │   │   ├── classworksSlice.js
│   │   │   └── classworksApi.js
│   │   │
│   │   ├── exams/
│   │   │   ├── examsSlice.js
│   │   │   └── examsApi.js
│   │   │
│   │   └── invitations/
│   │       ├── invitationsSlice.js
│   │       └── invitationsApi.js
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   │
│   │   ├── DashboardPage.jsx
│   │   ├── TeachersPage.jsx
│   │   ├── StudentsPage.jsx
│   │   ├── GroupsPage.jsx
│   │   ├── SchedulePage.jsx
│   │   ├── HomeworksPage.jsx
│   │   ├── ClassworksPage.jsx
│   │   ├── ExamsPage.jsx
│   │   ├── InvitationsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── hooks/                     ← Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useRole.js
│   │   └── useDebounce.js
│   │
│   ├── utils/
│   │   ├── axiosInstance.js       ← Axios konfiqurasiyası + interceptors
│   │   ├── formatDate.js
│   │   ├── formatters.js
│   │   └── constants.js
│   │
│   ├── i18n/
│   │   ├── index.js               ← i18next konfiqurasiyası
│   │   ├── az.json
│   │   ├── en.json
│   │   └── ru.json
│   │
│   ├── styles/
│   │   └── globals.css            ← CSS dəyişənləri + Tailwind import
│   │
│   ├── App.jsx                    ← Router + layout
│   └── main.jsx                   ← Entry point, Provider-lər
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

### 2.3 Redux Store Arxitekturası

```
store
├── auth            ← { user, token, isAuthenticated, isLoading }
├── dashboard       ← { stats, recentActivity }
├── teachers        ← { filters, selectedTeacher }
├── students        ← { filters, selectedStudent }
├── groups          ← { filters, selectedGroup }
├── schedule        ← { currentWeek, filters }
├── homeworks       ← { filters, selectedHomework }
├── classworks      ← { filters, selectedClasswork }
├── exams           ← { filters, selectedExam }
└── invitations     ← { filters }

RTK Query Cache (avtomatik idarə olunur):
├── authApi
├── dashboardApi
├── teachersApi
├── studentsApi
├── groupsApi
├── scheduleApi
├── homeworksApi
├── classworksApi
├── examsApi
└── invitationsApi
```

---

### 2.4 Data Flow (Məlumat Axını)

```
İstifadəçi Hərəkəti
      │
      ▼
  Component
  (onClick, onChange...)
      │
      ▼
RTK Query Hook
(useGetTeachersQuery,
 useCreateGroupMutation...)
      │
      ├──── Cache var? ──── Bəli ──▶ Cache-dən qaytar
      │
      ▼ Xeyr
  Axios Instance
  (+ JWT header əlavə et)
      │
      ▼
  Express API
  (/api/teachers)
      │
      ▼
  Middleware
  (auth → role → validate)
      │
      ▼
  Controller
      │
      ▼
  Mongoose Model
      │
      ▼
  MongoDB
      │
      ▼
  JSON Response
      │
      ▼
RTK Query Cache
(nəticəni saxla)
      │
      ▼
  Component
  (yenilənir)
```

---

### 2.5 Routing Strukturu

```
/                          → /dashboard (redirect)
/login                     → LoginPage (public)
/register                  → RegisterPage (public)
/invite/accept/:token      → InvitationAcceptPage (public)

── ProtectedRoute ──────────────────────────────
/dashboard                 → DashboardPage       [admin, teacher, student]
/profile                   → ProfilePage         [admin, teacher, student]
/settings                  → SettingsPage        [admin, teacher, student]
/schedule                  → SchedulePage        [admin, teacher, student]
/homeworks                 → HomeworksPage       [admin, teacher, student]
/classworks                → ClassworksPage      [admin, teacher, student]
/exams                     → ExamsPage           [admin, teacher, student]

── AdminRoute ──────────────────────────────────
/teachers                  → TeachersPage        [admin only]
/students                  → StudentsPage        [admin only]
/invitations               → InvitationsPage     [admin only]
/groups                    → GroupsPage          [admin, teacher]

── TeacherRoute ────────────────────────────────
/students                  → StudentsPage        [teacher: öz tələbələri]
/groups                    → GroupsPage          [teacher: öz qrupları]

*                          → NotFoundPage
```

---

### 2.6 Layout Arxitekturası

#### Desktop (≥ 1024px)
```
┌──────────────────────────────────────────────────┐
│ SIDEBAR (280px açıq / 72px bağlı)                │
│  ┌─────────────────┐  ┌────────────────────────┐ │
│  │ Logo + Toggle   │  │ HEADER                 │ │
│  │─────────────────│  │ [Breadcrumb] [Lang][Usr]│ │
│  │ Nav Items       │  │────────────────────────│ │
│  │  Dashboard      │  │                        │ │
│  │  Teachers       │  │   MAIN CONTENT         │ │
│  │  Students       │  │                        │ │
│  │  Groups         │  │                        │ │
│  │  Schedule       │  │                        │ │
│  │  Homeworks      │  │                        │ │
│  │  Classworks     │  │                        │ │
│  │  Exams          │  │                        │ │
│  │  Invitations    │  │                        │ │
│  │─────────────────│  │                        │ │
│  │ User Info       │  │                        │ │
│  └─────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### Mobil (< 1024px)
```
┌──────────────────────┐
│ HEADER               │
│ [Logo]    [Lang][Usr]│
│──────────────────────│
│                      │
│   MAIN CONTENT       │
│                      │
│                      │
│                      │
│──────────────────────│
│ BOTTOM TABS          │
│ [Home][Sched][Prof]  │
└──────────────────────┘
```

---

## 3. Backend Arxitekturası

### 3.1 Qovluq Strukturu

```
server/
├── config/
│   ├── db.js                  ← MongoDB bağlantısı
│   └── corsOptions.js         ← İcazəli originlər
│
├── controllers/               ← İş məntiqi
│   ├── authController.js
│   ├── userController.js
│   ├── teacherController.js
│   ├── studentController.js
│   ├── groupController.js
│   ├── scheduleController.js
│   ├── homeworkController.js
│   ├── classworkController.js
│   ├── examController.js
│   └── invitationController.js
│
├── middleware/
│   ├── authMiddleware.js      ← JWT token yoxlama
│   ├── roleMiddleware.js      ← Rol əsaslı giriş
│   ├── errorMiddleware.js     ← Global xəta tutma
│   ├── rateLimiter.js         ← Rate limiting
│   └── validate.js            ← Request body validasiyası
│
├── models/                    ← Mongoose schema-lar
│   ├── User.js
│   ├── Group.js
│   ├── Schedule.js
│   ├── Homework.js
│   ├── Classwork.js
│   ├── Exam.js
│   └── Invitation.js
│
├── routes/                    ← Express router-lər
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── teacherRoutes.js
│   ├── studentRoutes.js
│   ├── groupRoutes.js
│   ├── scheduleRoutes.js
│   ├── homeworkRoutes.js
│   ├── classworkRoutes.js
│   ├── examRoutes.js
│   └── invitationRoutes.js
│
├── utils/
│   ├── sendEmail.js           ← Nodemailer wrapper
│   ├── generateToken.js       ← JWT token yaratma
│   └── apiResponse.js         ← Standart cavab formatı
│
├── .env.example
├── server.js                  ← Entry point
└── package.json
```

---

### 3.2 Request Lifecycle (Sorğu Həyat Dövrü)

```
HTTP Request
     │
     ▼
Express App (server.js)
     │
     ├── morgan()          ← Loglama
     ├── helmet()          ← Security headers
     ├── cors()            ← CORS yoxlama
     ├── express.json()    ← Body parsing
     ├── rateLimiter()     ← Rate limit yoxlama
     │
     ▼
Route Handler (/api/...)
     │
     ├── authMiddleware    ← JWT yoxla, user-i req-ə əlavə et
     ├── roleMiddleware    ← Rol icazəsini yoxla
     ├── validate()        ← Request body-ni yoxla
     │
     ▼
Controller Function
     │
     ├── Mongoose sorğusu
     ├── İş məntiqi
     └── apiResponse() ilə cavab
           │
           ▼
      HTTP Response
      { success, data, message, pagination }
```

---

### 3.3 Mongoose Data Modelləri

#### User
```js
{
  _id:        ObjectId,
  name:       String (required),
  email:      String (required, unique),
  password:   String (hashed),
  role:       Enum ['admin', 'teacher', 'student'],
  avatar:     String (URL),
  googleId:   String,
  isActive:   Boolean (default: true),
  createdAt:  Date,
  updatedAt:  Date
}
```

#### Group
```js
{
  _id:        ObjectId,
  name:       String (required),
  teacher:    ObjectId → User,
  students:   [ObjectId → User],
  isActive:   Boolean,
  createdAt:  Date,
  updatedAt:  Date
}
```

#### Schedule
```js
{
  _id:        ObjectId,
  group:      ObjectId → Group,
  teacher:    ObjectId → User,
  subject:    String,
  dayOfWeek:  Enum [0-6] (0=Bazar, 1=Bazar ertəsi...),
  startTime:  String ('09:00'),
  endTime:    String ('10:30'),
  room:       String,
  createdAt:  Date
}
```

#### Homework
```js
{
  _id:          ObjectId,
  title:        String (required),
  description:  String,
  group:        ObjectId → Group,
  teacher:      ObjectId → User,
  dueDate:      Date,
  attachments:  [String],
  submissions:  [{
    student:    ObjectId → User,
    files:      [String],
    submittedAt: Date,
    grade:      Number,
    feedback:   String
  }],
  createdAt:    Date
}
```

#### Exam
```js
{
  _id:        ObjectId,
  name:       String,
  group:      ObjectId → Group,
  teacher:    ObjectId → User,
  date:       Date,
  duration:   Number (dəqiqə),
  type:       Enum ['written', 'oral', 'online'],
  results:    [{
    student:  ObjectId → User,
    grade:    Number,
    notes:    String
  }],
  createdAt:  Date
}
```

#### Invitation
```js
{
  _id:        ObjectId,
  email:      String,
  role:       Enum ['teacher', 'student'],
  token:      String (unique),
  status:     Enum ['pending', 'accepted', 'cancelled'],
  invitedBy:  ObjectId → User,
  expiresAt:  Date,
  createdAt:  Date
}
```

---

### 3.4 API Cavab Formatı

Bütün endpointlər eyni standart formatda cavab qaytarır:

```json
// Uğurlu cavab
{
  "success": true,
  "message": "Müəllimlər uğurla əldə edildi",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}

// Xəta cavabı
{
  "success": false,
  "message": "Bu əməliyyat üçün icazəniz yoxdur",
  "error": "FORBIDDEN",
  "statusCode": 403
}
```

---

## 4. Təhlükəsizlik Arxitekturası

```
┌─────────────────────────────────────────┐
│              CLIENT                     │
│  • HTTPS only (production)              │
│  • Token: httpOnly cookie               │
│  • XSS protection (React-in sanitasiyası│
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              SERVER                     │
│  • Helmet (security headers)            │
│  • CORS (yalnız icazəli originlər)      │
│  • Rate Limiting (auth: 5/15dəq)        │
│  • JWT (RS256, 15dəq access token)      │
│  • bcryptjs (salt rounds: 12)           │
│  • Input validation (express-validator) │
│  • NoSQL injection qoruması             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              DATABASE                   │
│  • MongoDB Atlas (VPC)                  │
│  • IP whitelist                         │
│  • Encryption at rest                   │
│  • Güclü parol, az imtiyazlı user       │
└─────────────────────────────────────────┘
```

---

## 5. Performans Strategiyası

### Frontend
- **Code splitting** — React.lazy + Suspense ilə səhifə bazlı
- **RTK Query caching** — 60 saniyəlik default cache
- **Debounce** — axtarış inputlarında 300ms
- **Pagination** — bütün siyahılarda (limit: 10/20/50)
- **Image optimization** — lazy loading

### Backend
- **MongoDB indexlər** — tez-tez sorğulanan sahələrə (email, role, group)
- **Pagination** — bütün siyahı endpointlərində
- **Lean queries** — `.lean()` ilə oxuma sorğularında
- **Populate selective** — yalnız lazım olan sahələr populate edilir

---

## 6. Miqyaslanma Planı (Gələcək)

| Addım | Texnologiya | Məqsəd |
|---|---|---|
| Caching | Redis | Session, rate limit, hot data |
| Real-time | Socket.io | Bildirişlər, canlı yeniləmələr |
| File Storage | AWS S3 / Cloudinary | Avatar, tapşırıq faylları |
| Monitoring | Sentry | Xəta izləmə |
| Logging | Winston + CloudWatch | Server logları |
