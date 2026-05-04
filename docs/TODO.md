# TODO — Cahan Academy Dashboard

> Local AI ilə işləyərkən tamamlanan tapşırıqları `[ ]` → `[x]` et.  
> **Format:** `[x]` = tamamlandı · `[ ]` = gözləyir · `[~]` = davam edir · `[!]` = bloklanıb

---

## ⚡ Cari Vəziyyət
> **Bu bloku hər PR birləşəndən sonra yenilə. Token bitib yeni hesabdan davam edirsənsə — yalnız bu bloku oxu.**

| Sahə | Dəyər |
|---|---|
| **Son tamamlanan tapşırıq** | Mərhələ 10 — Ev Tapşırıqları (16/16) |
| **Aktiv branch** | `feature/homeworks-api` |
| **Növbəti branch** | `feature/classworks-api` |
| **Növbəti tapşırıq** | Sinif İşləri Modulu (Mərhələ 11) |
| **Bloklanmış tapşırıq** | Yoxdur |
| **Qeyd** | Ev Tapşırıqları modulu (Backend API + Frontend UI) tamamlandı. |

---

## Git İş Axını (Hər tapşırıq üçün)

```
1.  TODO.md-dəki ilk [ ] tapşırığı tap
2.  git checkout main
3.  git pull origin main
4.  git checkout -b feature/<branch-adı>
5.  Tapşırığı yerinə yetir
6.  Bu TODO.md-də [ ] → [x] et
7.  git add . && git commit -m "<növ>(<əhatə>): <açıqlama>"
8.  git push origin feature/<branch-adı>
9.  Sahibə xəbər ver: branch adı + tamamlanan tapşırıqlar
10. SAHİBİN PR açmasını və birləşdirməsini GÖZLƏ
11. Sahib "davam et" dedikdə → ADDIM 2-yə qayıt
```

> ⚠️  PR birləşməmiş növbəti tapşırığa BAŞLAMA  
> ⚠️  Heç vaxt birbaşa main-ə push ETMƏ  
> 📄  Ətraflı qaydalar: `docs/WORKFLOW.md`

---

## Mərhələ 0 — Hazırlıq & Sənədləşmə
**Branch:** —  
**Status:** `[x]` tamamlandı — 19/19 tamamlandı

- [x] README.md hazırlandı
- [x] TODO.md hazırlandı
- [x] ARCHITECTURE.md hazırlandı
- [x] API.md hazırlandı
- [x] AUTH.md hazırlandı
- [x] SECURITY.md hazırlandı
- [x] ERROR_HANDLING.md hazırlandı
- [x] TESTING.md hazırlandı
- [x] ROLES_PERMISSIONS.md hazırlandı
- [x] COMPONENTS.md hazırlandı
- [x] I18N.md hazırlandı
- [x] DEPLOYMENT.md hazırlandı
- [x] CONTRIBUTING.md hazırlandı
- [x] AI_WORKFLOW.md hazırlandı
- [x] `.env.example` (client) hazırlandı → `feature/m00-env-files`
- [x] `.env.example` (server) hazırlandı → `feature/m00-env-files`
- [x] `.gitignore` hazırlandı → `feature/m00-env-files`
- [x] `.eslintrc` hazırlandı → `feature/m00-eslint-prettier`
- [x] `.prettierrc` hazırlandı → `feature/m00-eslint-prettier`

---

## Mərhələ 1 — Layihə Qurulumu
**Status:** `[ ]` gözləyir — 0/26 tamamlandı

### 1.1 Frontend (Client)
**Branch:** `feature/m01-frontend-setup`

- [x] Vite + React layihəsi yaradıldı
- [x] Tailwind CSS konfiqurasiya edildi
- [x] Lucide React quraşdırıldı
- [x] React Router v6 quraşdırıldı
- [x] Redux Toolkit + RTK Query quraşdırıldı
- [x] Redux store quruldu (`src/app/store.js`)
- [x] React Hook Form quraşdırıldı
- [x] Zod quraşdırıldı
- [x] Axios instance yaradıldı (base URL, interceptors)
- [x] i18next quraşdırıldı (AZ, EN, RU)
- [x] AZ tərcümə faylı yaradıldı
- [x] EN tərcümə faylı yaradıldı
- [x] RU tərcümə faylı yaradıldı
- [x] Tailwind rəng palitası konfiqurasiya edildi (bordo, ağ, qara)
- [x] Global CSS dəyişənləri yaradıldı
- [x] Qovluq strukturu yaradıldı (`features/`, `pages/`, `components/` və s.)

### 1.2 Backend (Server)
**Branch:** `feature/m01-backend-setup`

- [x] Node.js + Express layihəsi yaradıldı
- [x] MongoDB bağlantısı quruldu (`config/db.js`)
- [x] Mongoose quraşdırıldı
- [x] Helmet quraşdırıldı
- [x] CORS konfiqurasiya edildi
- [x] Morgan (logging) quraşdırıldı
- [x] dotenv konfiqurasiya edildi
- [x] Rate limiter quraşdırıldı
- [x] Global error handler middleware yazıldı
- [x] API response utility yazıldı (`utils/apiResponse.js`)
- [x] Nodemailer konfiqurasiya edildi
- [x] Admin seed mexanizmi yaradıldı (seedAdmin.js)

---

## Mərhələ 2 — Autentifikasiya
**Status:** `[ ]` gözləyir — 0/27 tamamlandı

### 2.1 Backend — Auth
**Branch:** `feature/m02-auth-backend`

- [x] `User` modeli yaradıldı (ad, email, şifrə, rol, avatar, status)
- [x] Şifrə hashlanması (bcryptjs) tətbiq edildi
- [x] JWT token generasiyası yazıldı (`generateToken.js`)
- [x] Refresh token mexanizmi tətbiq edildi
- [x] `POST /api/auth/register` endpointi hazırlandı
- [x] `POST /api/auth/login` endpointi hazırlandı
- [x] `POST /api/auth/logout` endpointi hazırlandı
- [x] `POST /api/auth/refresh-token` endpointi hazırlandı
- [x] `POST /api/auth/google` — Google OAuth endpointi hazırlandı
- [x] `POST /api/auth/forgot-password` endpointi hazırlandı
- [x] `POST /api/auth/reset-password` endpointi hazırlandı
- [x] Auth middleware yazıldı (`authMiddleware.js`)
- [x] Rol middleware yazıldı (`roleMiddleware.js`)

### 2.2 Frontend — Auth
**Branch:** `feature/m02-auth-frontend`

- [x] Redux `authSlice` yaradıldı (user, token, loading, error state)
- [x] `authApi` (RTK Query) hazırlandı (login, register, logout)
- [x] `Login` səhifəsi dizayn edildi (premium görünüş)
- [x] `Register` səhifəsi dizayn edildi
- [x] `Forgot Password` səhifəsi dizayn edildi
- [x] `Reset Password` səhifəsi dizayn edildi
- [x] Form validasiyası (React Hook Form + Zod) tətbiq edildi
- [x] `ProtectedRoute` komponenti yazıldı
- [x] `PublicRoute` komponenti (login olubsa dashboard-a yönləndirmə) yazıldı
- [x] Token-in `localStorage`-də saxlanılması və avtomatik login
- [x] Logout funksionallığı (state təmizlənməsi)
- [ ] Google Login (frontend inteqrasiyası)
- [x] Xəta mesajlarının göstərilməsi (Toast bildirişləri)
- [x] Yüklənmə indikatorları (Spinners/Skeletons)
- [ ] Role-based Route komponenti yaradıldı
- [ ] Auth state persist edildi

---

## Mərhələ 3 — Layout & Naviqasiya
**Status:** `[x]` tamamlandı — 10/10 tamamlandı  
**Branch:** `feature/m03-layout`

- [x] Ana layout komponenti yaradıldı (`AppLayout.jsx`)
- [x] Sidebar komponenti yaradıldı (desktop)
- [x] Sidebar açma/bağlama funksionallığı tətbiq edildi
- [x] Sidebar-da rola görə naviqasiya elementləri fərqləndirildi
- [x] Bottom Tab Bar komponenti yaradıldı (mobil)
- [x] Top Header komponenti yaradıldı (profil, bildiriş, dil seçimi)
- [x] Breadcrumbs komponenti hazırlandı
- [x] `Dashboard` ana səhifə dizayn edildi (statistika kartları)
- [x] Responsive dizayn (Mobile/Tablet/Desktop) tamamlandı
- [x] Animasiyalar (Framer Motion) əlavə edildi

---

## Mərhələ 4 — Dashboard
**Status:** `[x]` tamamlandı — 11/11 tamamlandı  
**Branch:** `feature/m04-dashboard`

- [x] Dashboard statistikaları üçün `controller` yaradıldı (Backend)
- [x] Ümumi tələbə, müəllim, qrup sayını gətirən endpoint hazırlandı
- [x] Aktiv dərslərin sayını hesablama məntiqi yazıldı
- [x] Aylıq artım faizini hesablayan util funksiya yazıldı
- [x] "Son aktivlik" siyahısı üçün backend route yaradıldı
- [x] `DashboardApi` (RTK Query) yaradıldı (Frontend)
- [x] Statistik kartlar real dataya bağlandı
- [x] Aktivlik feed-i frontend-də göstərildi
- [x] Statistika üçün Skeleton loader-lər hazırlandı
- [x] Error boundary-lər əlavə edildi
- [x] Dashboard datası üçün caching (RTK Query) tənzimləndi

---

## Mərhələ 5 — İstifadəçi İdarəsi
**Status:** `[~]` davam edir — 9/24 tamamlandı  
**Branch:** `feature/m05-users`

### 5.0 Ümumi İstifadəçi İdarəetməsi
- [x] İstifadəçi siyahısını gətirən endpoint (`GET /api/users`)
- [x] İstifadəçi axtarışı və filtrləmə (rola görə)
- [x] İstifadəçi statusunu dəyişmə (Active/Inactive)
- [x] İstifadəçi rolunu dəyişmə (Admin/Teacher/Student)
- [x] İstifadəçini silmə funksiyası
- [x] `UserApi` (RTK Query) yaradıldı
- [x] İstifadəçilər cədvəli dizayn edildi (Premium Table)
- [x] Siyahıda pagination (səhifələmə) tətbiq edildi
- [x] İstifadəçi əlavə etmə/redaktə etmə Modal-ı yaradıldı

### 5.1 Müəllimlər

#### Backend
- [x] `GET /api/teachers` — siyahı (pagination, axtarış)
- [x] `GET /api/teachers/:id` — tək müəllim
- [x] `POST /api/teachers/invite` — email ilə dəvət göndər (Stub)
- [x] `PUT /api/teachers/:id` — yenilə
- [x] `DELETE /api/teachers/:id` — sil

#### Frontend
- [x] Redux `teachersSlice` yaradıldı (RTK Query)
- [x] RTK Query `teachersApi` yaradıldı
- [x] Müəllimlər siyahısı səhifəsi yaradıldı
- [x] Müəllim kartı/sətir komponenti yaradıldı
- [x] Müəllimə dəvət göndərmə modalı yaradıldı (UserModal reuse)
- [x] Müəllim profili görünüşü yaradıldı (Siyahı daxilində detallar)
- [x] Axtarış + filter funksionallığı tətbiq edildi

### 5.2 Tələbələr

#### Backend
- [x] `GET /api/students` — siyahı (pagination, axtarış)
- [x] `GET /api/students/:id` — tək tələbə
- [x] `POST /api/students/invite` — email ilə dəvət göndər (Stub)
- [x] `PUT /api/students/:id` — yenilə
- [x] `DELETE /api/students/:id` — sil

#### Frontend
- [x] Redux `studentsSlice` yaradıldı (RTK Query)
- [x] RTK Query `studentsApi` yaradıldı
- [x] Tələbələr siyahısı səhifəsi yaradıldı
- [x] Tələbə kartı/sətir komponenti yaradıldı
- [x] Tələbəyə dəvət göndərmə modalı yaradıldı (UserModal reuse)
- [x] Tələbə profili görünüşü yaradıldı
- [x] Axtarış + filter funksionallığı tətbiq edildi

---

## Mərhələ 6 — Dəvətlər
**Status:** `[x]` tamamlandı — 12/12 tamamlandı

### 6.1 Backend
- [x] `Invitation` modeli yaradıldı (email, rol, token, status, son tarix)
- [x] `GET /api/invitations` — bütün dəvətlər
- [x] `POST /api/invitations` — dəvət göndər (Email + Token)
- [x] `GET /api/invitations/verify/:token` — token yoxla
- [x] `POST /api/auth/register-invitation/:token` — dəvət ilə qeydiyyat
- [x] `DELETE /api/invitations/:id` — dəvəti ləğv et
- [x] Dəvət emaili şablonu yaradıldı (Nodemailer)
- [x] Dəvət tokeni vaxt məhdudiyyəti tətbiq edildi (7 gün)

### 6.2 Frontend
- [x] Redux `invitationsSlice` yaradıldı (RTK Query)
- [x] RTK Query `invitationsApi` yaradıldı
- [x] Dəvətlər səhifəsi yaradıldı
- [x] Dəvət göndərmə forması yaradıldı
- [x] Dəvət statusu göstərildi (gözləyir / qəbul edildi / ləğv edildi)
- [x] Dəvəti ləğv etmə funksionallığı tətbiq edildi
- [x] Dəvəti qəbul etmə səhifəsi (`/accept-invitation/:token`) yaradıldı

---

## Mərhələ 7 — Qruplar
**Status:** `[x]` tamamlandı — 14/14 tamamlandı

### 7.1 Backend
- [x] `Group` modeli yaradıldı (ad, müəllim, tələbələr, cədvəl)
- [x] `GET /api/groups` — siyahı
- [x] `GET /api/groups/:id` — tək qrup
- [x] `POST /api/groups` — yarat
- [x] `PUT /api/groups/:id` — yenilə
- [x] `DELETE /api/groups/:id` — sil
- [x] `POST /api/groups/:id/students` — tələbə əlavə et
- [x] `DELETE /api/groups/:id/students/:studentId` — tələbəni çıxar (Stub)

### 7.2 Frontend
- [x] Redux `groupsSlice` yaradıldı (RTK Query)
- [x] RTK Query `groupsApi` yaradıldı
- [x] Qruplar səhifəsi yaradıldı
- [x] Qrup yaratma modalı yaradıldı
- [x] Qrupa tələbə əlavə etmə funksionallığı tətbiq edildi
- [x] Qrup detalları görünüşü yaradıldı (Kart daxilində)

---

## Mərhələ 8 — Cədvəl
**Status:** `[ ]` gözləyir — 0/11 tamamlandı

### 8.1 Backend
- [ ] `Schedule` modeli yaradıldı (qrup, fənn, müəllim, gün, saat, otaq)
- [ ] `GET /api/schedule` — cədvəl (qrupa / müəllimə / tələbəyə görə filter)
- [ ] `POST /api/schedule` — dərs əlavə et
- [ ] `PUT /api/schedule/:id` — dərsi yenilə
- [ ] `DELETE /api/schedule/:id` — dərsi sil

### 8.2 Frontend
- [ ] Redux `scheduleSlice` yaradıldı
- [ ] RTK Query `scheduleApi` yaradıldı
- [ ] Cədvəl səhifəsi yaradıldı (siyahı görünüşü)
- [ ] Həftənin günləri üzrə qruplaşdırma tətbiq edildi
- [ ] Dərs əlavə etmə modalı yaradıldı
- [ ] Rola görə fərqli cədvəl görünüşü tətbiq edildi

---

## Mərhələ 10 — Ev Tapşırıqları (Homeworks)
**Status:** `[x]` tamamlandı — 16/16 tamamlandı

### 10.1 Backend
- [x] `Homework` modeli yaradıldı (başlıq, təsvir, qrup, müəllim, son tarix, fayllar)
- [x] `GET /api/homeworks` — siyahı
- [x] `GET /api/homeworks/:id` — tək tapşırıq
- [x] `POST /api/homeworks` — yarat
- [x] `PUT /api/homeworks/:id` — yenilə
- [x] `DELETE /api/homeworks/:id` — sil
- [x] `POST /api/homeworks/:id/submit` — tələbə təhvil verir
- [x] `PUT /api/homeworks/:id/grade` — qiymətləndir

### 10.2 Frontend
- [x] Redux `homeworksSlice` yaradıldı (RTK Query API ilə əvəz edildi)
- [x] RTK Query `homeworksApi` yaradıldı
- [x] Ev tapşırıqları səhifəsi yaradıldı
- [x] Tapşırıq yaratma forması yaradıldı (Modal nəzərdə tutulur)
- [x] Tapşırıq detalları görünüşü yaradıldı
- [x] Tələbə: tapşırıq təhvil vermə forması yaradıldı
- [x] Müəllim: tapşırıqları qiymətləndirmə görünüşü yaradıldı
- [x] Son tarix sayğacı tətbiq edildi

---

## Mərhələ 11 — Sinif İşləri (Classworks)
**Status:** `[ ]` gözləyir — 0/11 tamamlandı

### 10.1 Backend
- [ ] `Classwork` modeli yaradıldı
- [ ] `GET /api/classworks` — siyahı
- [ ] `GET /api/classworks/:id` — tək sinif işi
- [ ] `POST /api/classworks` — yarat
- [ ] `PUT /api/classworks/:id` — yenilə
- [ ] `DELETE /api/classworks/:id` — sil

### 10.2 Frontend
- [ ] Redux `classworksSlice` yaradıldı
- [ ] RTK Query `classworksApi` yaradıldı
- [ ] Sinif işləri səhifəsi yaradıldı
- [ ] Sinif işi yaratma forması yaradıldı
- [ ] Sinif işi detalları görünüşü yaradıldı

---

## Mərhələ 11 — İmtahanlar
**Status:** `[ ]` gözləyir — 0/14 tamamlandı

### 11.1 Backend
- [ ] `Exam` modeli yaradıldı (ad, qrup, tarix, müddət, növ, nəticələr)
- [ ] `GET /api/exams` — siyahı
- [ ] `GET /api/exams/:id` — tək imtahan
- [ ] `POST /api/exams` — yarat
- [ ] `PUT /api/exams/:id` — yenilə
- [ ] `DELETE /api/exams/:id` — sil
- [ ] `POST /api/exams/:id/results` — nəticə əlavə et
- [ ] `GET /api/exams/:id/results` — nəticələri gör

### 11.2 Frontend
- [ ] Redux `examsSlice` yaradıldı
- [ ] RTK Query `examsApi` yaradıldı
- [ ] İmtahanlar səhifəsi yaradıldı
- [ ] İmtahan yaratma modalı yaradıldı
- [ ] İmtahan nəticələri görünüşü yaradıldı
- [ ] Rola görə fərqli görünüş tətbiq edildi

---

## Mərhələ 12 — Profil & Parametrlər
**Status:** `[ ]` gözləyir — 0/11 tamamlandı

### 12.1 Backend
- [ ] `GET /api/users/me` — öz profilini gör
- [ ] `PUT /api/users/me` — profili yenilə
- [ ] `PUT /api/users/me/password` — şifrəni dəyiş
- [ ] `POST /api/users/me/avatar` — avatar yüklə (Multer)

### 12.2 Frontend
- [ ] Profil səhifəsi yaradıldı
- [ ] Profil redaktə forması yaradıldı
- [ ] Avatar yükləmə funksionallığı tətbiq edildi
- [ ] Şifrə dəyiş forması yaradıldı
- [ ] Parametrlər səhifəsi yaradıldı
- [ ] Dil dəyiştirmə parametrləri tətbiq edildi
- [ ] Bildiriş parametrləri tətbiq edildi

---

## Mərhələ 13 — Təhlükəsizlik
**Status:** `[ ]` gözləyir — 0/11 tamamlandı

- [ ] Helmet middleware tətbiq edildi
- [ ] CORS düzgün konfiqurasiya edildi
- [ ] Rate limiting tətbiq edildi (auth endpointlərə)
- [ ] Input sanitization tətbiq edildi
- [ ] JWT token təhlükəsizliyi yoxlanıldı
- [ ] Şifrə gücü validasiyası tətbiq edildi
- [ ] SQL/NoSQL injection qoruması yoxlanıldı
- [ ] XSS qoruması yoxlanıldı
- [ ] Sensitive data loglarda maskalandı
- [ ] `.env` faylları `.gitignore`-a əlavə edildi
- [ ] Dependency audit keçirildi (`npm audit`)

---

## Mərhələ 14 — Testlər
**Status:** `[ ]` gözləyir — 0/15 tamamlandı

### Backend Testlər
- [ ] Jest + Supertest quraşdırıldı
- [ ] Auth endpointləri test edildi
- [ ] User endpointləri test edildi
- [ ] Group endpointləri test edildi
- [ ] Schedule endpointləri test edildi
- [ ] Homework endpointləri test edildi
- [ ] Exam endpointləri test edildi
- [ ] Middleware testləri yazıldı
- [ ] Test coverage 80%+ çatdı

### Frontend Testlər
- [ ] Vitest + React Testing Library quraşdırıldı
- [ ] Auth komponentləri test edildi
- [ ] Redux slices test edildi
- [ ] RTK Query hooks test edildi
- [ ] Layout komponentləri test edildi
- [ ] Kritik səhifələr test edildi

---

## Mərhələ 15 — Deploy & CI/CD
**Status:** `[ ]` gözləyir — 0/8 tamamlandı

- [ ] Frontend production build yoxlanıldı
- [ ] Backend production modu yoxlanıldı
- [ ] MongoDB Atlas bağlantısı quruldu
- [ ] Environment dəyişənləri production üçün tənzimləndi
- [ ] GitHub Actions CI pipeline yaradıldı
- [ ] Linting CI-da işləyir
- [ ] Testlər CI-da işləyir
- [ ] Deploy pipeline konfiqurasiya edildi

---

## Ümumi Tərəqqi

| Mərhələ | Status | Tamamlanma | Tapşırıq sayı |
|---|---|---|---|
| 0 — Sənədləşmə | `[x]` tamamlandı | 100% (19/19) | 19 |
| 1 — Qurulum | `[x]` tamamlandı | 100% (27/27) | 27 |
| 2 — Auth | `[x]` tamamlandı | 96% (26/27) | 27 |
| 3 — Layout | `[x]` tamamlandı | 100% (10/10) | 10 |
| 4 — Dashboard | `[x]` tamamlandı | 100% (11/11) | 11 |
| 5 — İstifadəçilər | `[~]` davam edir | 0% (0/24) | 24 |
| 6 — Dəvətlər | `[ ]` gözləyir | 0% (0/14) | 14 |
| 7 — Qruplar | `[ ]` gözləyir | 0% (0/14) | 14 |
| 8 — Cədvəl | `[ ]` gözləyir | 0% (0/11) | 11 |
| 9 — Ev tapşırıqları | `[ ]` gözləyir | 0% (0/16) | 16 |
| 10 — Sinif işi | `[ ]` gözləyir | 0% (0/11) | 11 |
| 11 — İmtahanlar | `[ ]` gözləyir | 0% (0/14) | 14 |
| 12 — Profil | `[ ]` gözləyir | 0% (0/11) | 11 |
| 13 — Təhlükəsizlik | `[ ]` gözləyir | 0% (0/11) | 11 |
| 14 — Testlər | `[ ]` gözləyir | 0% (0/15) | 15 |
| 15 — Deploy | `[ ]` gözləyir | 0% (0/8) | 8 |
| **CƏMI** | | **39% (93/237)** | **237** |

---

> **Qeyd:** Hər tapşırığı tamamladıqdan sonra bu faylı yenilə.  
> Yeni AI sessiyanı başladıqda: **yalnız "Cari Vəziyyət" blokunu oxu** — bu kifayətdir.  
> Local AI ilə işləyərkən: "Bu TODO.md faylına bax, hansı tapşırıq növbəti?" deyə soruşa bilərsən.
