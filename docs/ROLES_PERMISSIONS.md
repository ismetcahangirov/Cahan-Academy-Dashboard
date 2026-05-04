# ROLES_PERMISSIONS.md — Rol və İcazələr

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Rol Sisteminə Baxış

```
┌──────────────────────────────────────────────────────────┐
│                        ADMIN                             │
│  Tam idarəetmə: istifadəçilər, qruplar, cədvəl,         │
│  dəvətlər, tapşırıqlar, imtahanlar, statistika          │
├──────────────────────────────────────────────────────────┤
│                       MÜƏLLİM                            │
│  Öz qrupları, tələbələri, tapşırıqları, imtahanları     │
│  idarə edir. Adminə hesabat verir.                       │
├──────────────────────────────────────────────────────────┤
│                       TƏLƏBƏ                             │
│  Öz cədvəlini, tapşırıqlarını, nəticələrini görür.      │
│  Yalnız oxuma + tapşırıq təhvil vermə hüququ.           │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Tam İcazə Matrisi

### 2.1 İstifadəçi İdarəsi

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Bütün müəllimləri gör | ✅ | ❌ | ❌ |
| Müəllim profilini gör | ✅ | ❌ | ❌ |
| Müəllim dəvət et | ✅ | ❌ | ❌ |
| Müəllimi yenilə | ✅ | ❌ | ❌ |
| Müəllimi sil | ✅ | ❌ | ❌ |
| Bütün tələbələri gör | ✅ | ✅ (öz qrupu) | ❌ |
| Tələbə profilini gör | ✅ | ✅ (öz qrupu) | ❌ |
| Tələbə dəvət et | ✅ | ❌ | ❌ |
| Tələbəni yenilə | ✅ | ❌ | ❌ |
| Tələbəni sil | ✅ | ❌ | ❌ |
| Öz profilini gör | ✅ | ✅ | ✅ |
| Öz profilini yenilə | ✅ | ✅ | ✅ |
| Öz şifrəsini dəyiş | ✅ | ✅ | ✅ |
| Avatar yüklə | ✅ | ✅ | ✅ |

### 2.2 Dəvət İdarəsi

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Dəvətlər səhifəsini aç | ✅ | ❌ | ❌ |
| Bütün dəvətləri gör | ✅ | ❌ | ❌ |
| Dəvət göndər (müəllim) | ✅ | ❌ | ❌ |
| Dəvət göndər (tələbə) | ✅ | ❌ | ❌ |
| Dəvəti yenidən göndər | ✅ | ❌ | ❌ |
| Dəvəti ləğv et | ✅ | ❌ | ❌ |
| Dəvəti qəbul et | ✅ | ✅ | ✅ |

### 2.3 Qrup İdarəsi

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Bütün qrupları gör | ✅ | ✅ (öz qrupları) | ✅ (öz qrupu) |
| Qrup detallarını gör | ✅ | ✅ (öz qrupu) | ✅ (öz qrupu) |
| Qrup yarat | ✅ | ❌ | ❌ |
| Qrup adını/müəllimini dəyiş | ✅ | ❌ | ❌ |
| Qrupu sil | ✅ | ❌ | ❌ |
| Qrupa tələbə əlavə et | ✅ | ❌ | ❌ |
| Qrupdan tələbəni çıxar | ✅ | ❌ | ❌ |

### 2.4 Cədvəl İdarəsi

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Bütün cədvəli gör | ✅ | ✅ (öz dərsləri) | ✅ (öz dərsləri) |
| Dərs əlavə et | ✅ | ❌ | ❌ |
| Dərsi yenilə | ✅ | ❌ | ❌ |
| Dərsi sil | ✅ | ❌ | ❌ |

### 2.5 Ev Tapşırıqları

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Tapşırıq siyahısını gör | ✅ | ✅ (öz qrupu) | ✅ (öz qrupu) |
| Tapşırıq yarat | ✅ | ✅ | ❌ |
| Tapşırığı yenilə | ✅ | ✅ (öz tapşırığı) | ❌ |
| Tapşırığı sil | ✅ | ✅ (öz tapşırığı) | ❌ |
| Tapşırıq təhvil ver | ❌ | ❌ | ✅ |
| Bütün teslimləri gör | ✅ | ✅ (öz qrupu) | ❌ |
| Öz teslimini gör | ❌ | ❌ | ✅ |
| Tapşırığı qiymətləndir | ✅ | ✅ (öz qrupu) | ❌ |

### 2.6 Sinif İşləri

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Sinif işi siyahısını gör | ✅ | ✅ (öz qrupu) | ✅ (öz qrupu) |
| Sinif işi yarat | ✅ | ✅ | ❌ |
| Sinif işini yenilə | ✅ | ✅ (öz qrupu) | ❌ |
| Sinif işini sil | ✅ | ✅ (öz qrupu) | ❌ |

### 2.7 İmtahanlar

| Əməliyyat | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| İmtahan siyahısını gör | ✅ | ✅ (öz qrupu) | ✅ (öz qrupu) |
| İmtahan yarat | ✅ | ✅ | ❌ |
| İmtahanı yenilə | ✅ | ✅ (öz imtahanı) | ❌ |
| İmtahanı sil | ✅ | ❌ | ❌ |
| Bütün nəticələri gör | ✅ | ✅ (öz qrupu) | ❌ |
| Öz nəticəsini gör | ❌ | ❌ | ✅ |
| Nəticə daxil et | ✅ | ✅ (öz qrupu) | ❌ |

### 2.8 Dashboard

| Göstərici | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Ümumi müəllim/tələbə/qrup sayı | ✅ | ❌ | ❌ |
| Gözləyən dəvət sayı | ✅ | ❌ | ❌ |
| Öz qrup/tələbə sayı | ❌ | ✅ | ❌ |
| Tamamlanmamış qiymətlər | ❌ | ✅ | ❌ |
| Öz qrupu, orta qiymət | ❌ | ❌ | ✅ |
| Gözləyən tapşırıqlar | ❌ | ❌ | ✅ |
| Yaxınlaşan imtahan | ❌ | ✅ | ✅ |

---

## 3. Naviqasiya — Rola Görə

### Admin
```
Dashboard · Müəllimlər · Tələbələr · Qruplar
Cədvəl · Ev tapşırıqları · Sinif işləri · İmtahanlar
Dəvətlər · Profil · Parametrlər
```

### Müəllim
```
Dashboard · Tələbələr · Qruplar
Cədvəl · Ev tapşırıqları · Sinif işləri · İmtahanlar
Profil · Parametrlər
```

### Tələbə
```
Dashboard · Cədvəl · Ev tapşırıqları · Sinif işləri
İmtahanlar · Profil · Parametrlər
```

---

## 4. Backend — Rol Yoxlama

### Route Qoruması

```javascript
// routes/teacherRoutes.js
router.get('/',        protect, authorize('admin'),            getTeachers);
router.post('/invite', protect, authorize('admin'),            inviteTeacher);
router.put('/:id',     protect, authorize('admin'),            updateTeacher);
router.delete('/:id',  protect, authorize('admin'),            deleteTeacher);

// routes/studentRoutes.js
router.get('/',        protect, authorize('admin', 'teacher'), getStudents);
router.post('/invite', protect, authorize('admin'),            inviteStudent);

// routes/homeworkRoutes.js
router.get('/',                    protect,                              getHomeworks);
router.post('/',                   protect, authorize('admin','teacher'),createHomework);
router.post('/:id/submit',         protect, authorize('student'),        submitHomework);
router.put('/:id/grade/:studentId',protect, authorize('admin','teacher'),gradeHomework);
```

### Controller-də Data Filterlənməsi

```javascript
// controllers/studentController.js — müəllim yalnız öz qrupunu görür

exports.getStudents = asyncHandler(async (req, res) => {
  let filter = { role: 'student' };

  if (req.user.role === 'teacher') {
    const myGroups   = await Group.find({ teacher: req.user._id }).select('students');
    const studentIds = myGroups.flatMap((g) => g.students);
    filter._id       = { $in: studentIds };
  }

  if (req.query.search) {
    filter.$or = [
      { name:  { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const [students, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  successResponse(res, {
    data:       students,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
```

```javascript
// controllers/homeworkController.js — rola görə data filteri

exports.getHomeworks = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === 'teacher') {
    filter.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    const group = await Group.findOne({ students: req.user._id });
    if (!group) return successResponse(res, { data: [] });
    filter.group = group._id;
  }
  // Admin: filter yoxdur

  const homeworks = await Homework.find(filter)
    .populate('group',   'name')
    .populate('teacher', 'name email')
    .lean();

  successResponse(res, { data: homeworks });
});
```

---

## 5. Frontend — Rol Əsaslı UI

### useRole Hook

```javascript
// hooks/useRole.js
import { useSelector } from 'react-redux';

export const useRole = () => {
  const { user } = useSelector((state) => state.auth);
  return {
    role:      user?.role,
    isAdmin:   user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  };
};
```

### Naviqasiya Elementləri

```javascript
// components/layout/navItems.js
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Calendar, ClipboardList, BookMarked, FlaskConical,
  Mail, UserCircle, Settings,
} from 'lucide-react';

export const getNavItems = (role) => [
  { label: 'Dashboard',        path: '/dashboard',   icon: LayoutDashboard, roles: ['admin','teacher','student'] },
  { label: 'Müəllimlər',       path: '/teachers',    icon: Users,           roles: ['admin'] },
  { label: 'Tələbələr',        path: '/students',    icon: GraduationCap,   roles: ['admin','teacher'] },
  { label: 'Qruplar',          path: '/groups',      icon: BookOpen,        roles: ['admin','teacher'] },
  { label: 'Cədvəl',           path: '/schedule',    icon: Calendar,        roles: ['admin','teacher','student'] },
  { label: 'Ev tapşırıqları',  path: '/homeworks',   icon: ClipboardList,   roles: ['admin','teacher','student'] },
  { label: 'Sinif işləri',     path: '/classworks',  icon: BookMarked,      roles: ['admin','teacher','student'] },
  { label: 'İmtahanlar',       path: '/exams',       icon: FlaskConical,    roles: ['admin','teacher','student'] },
  { label: 'Dəvətlər',         path: '/invitations', icon: Mail,            roles: ['admin'] },
  { label: 'Profil',           path: '/profile',     icon: UserCircle,      roles: ['admin','teacher','student'] },
  { label: 'Parametrlər',      path: '/settings',    icon: Settings,        roles: ['admin','teacher','student'] },
].filter((item) => item.roles.includes(role));
```

### Komponentdə İstifadə

```jsx
import { useRole } from '../hooks/useRole';

const HomeworksPage = () => {
  const { isAdmin, isTeacher, isStudent } = useRole();

  return (
    <div>
      {(isAdmin || isTeacher) && (
        <button onClick={openCreateModal}>Tapşırıq yarat</button>
      )}
      {isStudent && (
        <button onClick={openSubmitModal}>Tapşırıq təhvil ver</button>
      )}
    </div>
  );
};
```

---

## 6. Route Qoruması — App.jsx

```jsx
const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"               element={<LoginPage />} />
    <Route path="/register"            element={<RegisterPage />} />
    <Route path="/invite/accept/:token" element={<InvitationAcceptPage />} />

    {/* Hamı üçün */}
    <Route element={<ProtectedRoute allowedRoles={['admin','teacher','student']} />}>
      <Route path="/"           element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard"  element={<DashboardPage />} />
      <Route path="/schedule"   element={<SchedulePage />} />
      <Route path="/homeworks"  element={<HomeworksPage />} />
      <Route path="/classworks" element={<ClassworksPage />} />
      <Route path="/exams"      element={<ExamsPage />} />
      <Route path="/profile"    element={<ProfilePage />} />
      <Route path="/settings"   element={<SettingsPage />} />
    </Route>

    {/* Yalnız admin */}
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route path="/teachers"    element={<TeachersPage />} />
      <Route path="/invitations" element={<InvitationsPage />} />
    </Route>

    {/* Admin + Müəllim */}
    <Route element={<ProtectedRoute allowedRoles={['admin','teacher']} />}>
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/groups"   element={<GroupsPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
```

---

## 7. Xüsusi Qaydalar

### Rol Dəyişdirmə (Admin)

```
Admin istifadəçinin rolunu dəyişdirə bilər (student ↔ teacher)

Məhdudiyyətlər:
  • Admin öz rolunu dəyişdirə bilməz
  • Sistemdə ən azı 1 admin qalmalıdır

Backend yoxlaması:
  if (req.params.id === req.user._id.toString())
    throw new AppError('Öz rolunuzu dəyişdirə bilməzsiniz', 403)

  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount === 1 && targetUser.role === 'admin')
    throw new AppError('Sistemdə ən azı 1 admin olmalıdır', 400)
```

### Hesab Deaktivasiyası

```
Admin istifadəçini deaktiv edə bilər → isActive: false

Nəticə:
  • Mövcud token-ləri etibarsız sayılır
  • Giriş cəhdi → 403 ACCOUNT_DISABLED
  • Email saxlanır (yenidən aktiv etmək mümkün)

Məhdudiyyət:
  • Admin özünü deaktiv edə bilməz
```

---

## 8. Sürətli Keçid Cədvəli

| Xüsusiyyət | Admin | Müəllim | Tələbə |
|---|:---:|:---:|:---:|
| Sidebar elementləri | 11 | 9 | 7 |
| Dashboard məzmunu | Sistem statistikası | Öz statistikası | Şəxsi statistika |
| Müəllimlər səhifəsi | ✅ | ❌ | ❌ |
| Tələbələr səhifəsi | ✅ (hamısı) | ✅ (öz qrupu) | ❌ |
| Qruplar səhifəsi | ✅ (hamısı) | ✅ (öz qrupları) | ❌ |
| Cədvəl | ✅ (hamısı) | ✅ (öz dərsləri) | ✅ (öz dərsləri) |
| Tapşırıq yarat | ✅ | ✅ | ❌ |
| Tapşırıq təhvil ver | ❌ | ❌ | ✅ |
| Tapşırıq qiymətləndir | ✅ | ✅ | ❌ |
| İmtahan yarat | ✅ | ✅ | ❌ |
| İmtahan nəticəsi daxil et | ✅ | ✅ | ❌ |
| Öz nəticəsini gör | ❌ | ❌ | ✅ |
| Dəvət sistemi | ✅ (tam) | ❌ | ❌ |
| Profil + Parametrlər | ✅ | ✅ | ✅ |
