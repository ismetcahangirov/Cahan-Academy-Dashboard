# TODO — Cahan Academy Dashboard

> Local AI ilə işləyərkən tamamlanan tapşırıqları `[ ]` → `[x]` et.  
> **Format:** `[x]` = tamamlandı · `[ ]` = gözləyir · `[~]` = davam edir · `[!]` = bloklanıb

---

## ⚡ Cari Vəziyyət
> **Bu bloku hər PR birləşəndən sonra yenilə. Token bitib yeni hesabdan davam edirsənsə — yalnız bu bloku oxu.**

| Sahə | Dəyər |
|---|---|
| **Son tamamlanan tapşırıq** | Mərhələ 1.1 — Frontend (Client) qurulumu (16/26) |
| **Aktiv branch** | `feature/m01-frontend-setup` |
| **Növbəti branch** | `feature/m01-backend-setup` |
| **Növbəti tapşırıq** | Node.js + Express layihəsi yaradıldı |
| **Bloklanmış tapşırıq** | Yoxdur |
| **Qeyd** | Mərhələ 1.1 tamamlandı, Mərhələ 1.2-yə keçilir. |

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

- [ ] Node.js + Express layihəsi yaradıldı
- [ ] MongoDB bağlantısı quruldu (`config/db.js`)
- [ ] Mongoose quraşdırıldı
- [ ] Helmet quraşdırıldı
- [ ] CORS konfiqurasiya edildi
- [ ] Morgan (logging) quraşdırıldı
- [ ] dotenv konfiqurasiya edildi
- [ ] Rate limiter quraşdırıldı
- [ ] Global error handler middleware yazıldı
- [ ] API response utility yazıldı (`utils/apiResponse.js`)
- [ ] Nodemailer konfiqurasiya edildi

---

## Mərhələ 2 — Autentifikasiya
**Status:** `[ ]` gözləyir — 0/27 tamamlandı

### 2.1 Backend — Auth
**Branch:** `feature/m02-auth-backend`

- [ ] `User` modeli yaradıldı (ad, email, şifrə, rol, avatar, status)
- [ ] Şifrə hashlanması (bcryptjs) tətbiq edildi
- [ ] JWT token generasiyası yazıldı (`generateToken.js`)
- [ ] Refresh token mexanizmi tətbiq edildi
- [ ] `POST /api/auth/register` endpointi hazırlandı
- [ ] `POST /api/auth/login` endpointi hazırlandı
- [ ] `POST /api/auth/logout` endpointi hazırlandı
- [ ] `POST /api/auth/refresh-token` endpointi hazırlandı
- [ ] `POST /api/auth/google` — Google OAuth endpointi hazırlandı
- [ ] `POST /api/auth/forgot-password` endpointi hazırlandı
- [ ] `POST /api/auth/reset-password` endpointi hazırlandı
- [ ] Auth middleware yazıldı (`authMiddleware.js`)
- [ ] Rol middleware yazıldı (`roleMiddleware.js`)

### 2.2 Frontend — Auth
**Branch:** `feature/m02-auth-frontend`

- [ ] Redux `authSlice` yaradıldı
- [ ] RTK Query `authApi` yaradıldı
- [ ] Login səhifəsi yaradıldı
- [ ] Register səhifəsi yaradıldı
- [ ] Google ilə giriş düyməsi əlavə edildi
- [ ] Google OAuth inteqrasiyası tamamlandı
- [ ] Şifrəni unutdum səhifəsi yaradıldı
- [ ] Şifrə sıfırlama səhifəsi yaradıldı
- [ ] Forma validasiyası (Zod) tətbiq edildi
- [ ] Token saxlama strategiyası tətbiq edildi (httpOnly cookie / localStorage)
- [ ] Axios interceptor ilə auto token refresh tətbiq edildi
- [ ] Protected Route komponenti yaradıldı
- [ ] Role-based Route komponenti yaradıldı
- [ ] Auth state persist edildi

---

## Mərhələ 3 — Layout & Naviqasiya
**Status:** `[ ]` gözləyir — 0/10 tamamlandı  
**Branch:** `feature/m03-layout`

- [ ] Ana layout komponenti yaradıldı (`AppLayout.jsx`)
- [ ] Sidebar komponenti yaradıldı (desktop)
- [ ] Sidebar açma/bağlama funksionallığı tətbiq edildi
- [ ] Sidebar-da rola görə naviqasiya elementləri fərqləndirildi
- [ ] Bottom Tab Bar komponenti yaradıldı (mobil)
- [ ] Header komponenti yaradıldı
- [ ] Dil seçici komponenti yaradıldı (AZ / EN / RU)
- [ ] İstifadəçi avatar + dropdown yaradıldı
- [ ] Responsive breakpoint-lər tənzimləndi
- [ ] Aktiv naviqasiya elementi vurğulandı

---

## Mərhələ 4 — Dashboard Səhifəsi
**Status:** `[ ]` gözləyir — 0/11 tamamlandı

### 4.1 Backend
**Branch:** `feature/m04-dashboard-backend`

- [ ] Statistika endpointi hazırlandı (`GET /api/dashboard/stats`)
- [ ] Son fəaliyyətlər endpointi hazırlandı
- [ ] Rola görə fərqli statistika qaytarılır

### 4.2 Frontend
**Branch:** `feature/m04-dashboard-frontend`

- [ ] Redux `dashboardSlice` yaradıldı
- [ ] RTK Query `dashboardApi` yaradıldı
- [ ] Ümumi statistika kartları yaradıldı (tələbə sayı, müəllim sayı, qrup sayı, imtahan sayı)
- [ ] Admin dashboard komponenti yaradıldı
- [ ] Müəllim dashboard komponenti yaradıldı
- [ ] Tələbə dashboard komponenti yaradıldı
- [ ] Qrafik / Chart komponenti əlavə edildi
- [ ] Son fəaliyyətlər lenti yaradıldı

---

## Mərhələ 5 — İstifadəçi İdarəsi
**Status:** `[ ]` gözləyir — 0/24 tamamlandı

### 5.1 Müəllimlər

#### Backend
- [ ] `GET /api/teachers` — siyahı (pagination, axtarış)
- [ ] `GET /api/teachers/:id` — tək müəllim
- [ ] `POST /api/teachers/invite` — email ilə dəvət göndər
- [ ] `PUT /api/teachers/:id` — yenilə
- [ ] `DELETE /api/teachers/:id` — sil

#### Frontend
- [ ] Redux `teachersSlice` yaradıldı
- [ ] RTK Query `teachersApi` yaradıldı
- [ ] Müəllimlər siyahısı səhifəsi yaradıldı
- [ ] Müəllim kartı/sətir komponenti yaradıldı
- [ ] Müəllimə dəvət göndərmə modalı yaradıldı
- [ ] Müəllim profili görünüşü yaradıldı
- [ ] Axtarış + filter funksionallığı tətbiq edildi

### 5.2 Tələbələr

#### Backend
- [ ] `GET /api/students` — siyahı (pagination, axtarış)
- [ ] `GET /api/students/:id` — tək tələbə
- [ ] `POST /api/students/invite` — email ilə dəvət göndər
- [ ] `PUT /api/students/:id` — yenilə
- [ ] `DELETE /api/students/:id` — sil

#### Frontend
- [ ] Redux `studentsSlice` yaradıldı
- [ ] RTK Query `studentsApi` yaradıldı
- [ ] Tələbələr siyahısı səhifəsi yaradıldı
- [ ] Tələbə kartı/sətir komponenti yaradıldı
- [ ] Tələbəyə dəvət göndərmə modalı yaradıldı
- [ ] Tələbə profili görünüşü yaradıldı
- [ ] Axtarış + filter funksionallığı tətbiq edildi

---

## Mərhələ 6 — Dəvətlər
**Status:** `[ ]` gözləyir — 0/14 tamamlandı

### 6.1 Backend
- [ ] `Invitation` modeli yaradıldı (email, rol, token, status, son tarix)
- [ ] `GET /api/invitations` — bütün dəvətlər
- [ ] `POST /api/invitations` — dəvət göndər
- [ ] `GET /api/invitations/accept/:token` — dəvəti qəbul et
- [ ] `DELETE /api/invitations/:id` — dəvəti ləğv et
- [ ] Dəvət emaili şablonu yaradıldı (Nodemailer)
- [ ] Dəvət tokeni vaxt məhdudiyyəti tətbiq edildi (24 saat)

### 6.2 Frontend
- [ ] Redux `invitationsSlice` yaradıldı
- [ ] RTK Query `invitationsApi` yaradıldı
- [ ] Dəvətlər səhifəsi yaradıldı
- [ ] Dəvət göndərmə forması yaradıldı
- [ ] Dəvət statusu göstərildi (gözləyir / qəbul edildi / ləğv edildi)
- [ ] Dəvəti yenidən göndərmə funksionallığı tətbiq edildi
- [ ] Dəvəti ləğv etmə funksionallığı tətbiq edildi

---

## Mərhələ 7 — Qruplar
**Status:** `[ ]` gözləyir — 0/14 tamamlandı

### 7.1 Backend
- [ ] `Group` modeli yaradıldı (ad, müəllim, tələbələr, cədvəl)
- [ ] `GET /api/groups` — siyahı
- [ ] `GET /api/groups/:id` — tək qrup
- [ ] `POST /api/groups` — yarat
- [ ] `PUT /api/groups/:id` — yenilə
- [ ] `DELETE /api/groups/:id` — sil
- [ ] `POST /api/groups/:id/students` — tələbə əlavə et
- [ ] `DELETE /api/groups/:id/students/:studentId` — tələbəni çıxar

### 7.2 Frontend
- [ ] Redux `groupsSlice` yaradıldı
- [ ] RTK Query `groupsApi` yaradıldı
- [ ] Qruplar səhifəsi yaradıldı
- [ ] Qrup yaratma modalı yaradıldı
- [ ] Qrupa tələbə əlavə etmə funksionallığı tətbiq edildi
- [ ] Qrup detalları görünüşü yaradıldı

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

## Mərhələ 9 — Ev Tapşırıqları (Homeworks)
**Status:** `[ ]` gözləyir — 0/16 tamamlandı

### 9.1 Backend
- [ ] `Homework` modeli yaradıldı (başlıq, təsvir, qrup, müəllim, son tarix, fayllar)
- [ ] `GET /api/homeworks` — siyahı
- [ ] `GET /api/homeworks/:id` — tək tapşırıq
- [ ] `POST /api/homeworks` — yarat
- [ ] `PUT /api/homeworks/:id` — yenilə
- [ ] `DELETE /api/homeworks/:id` — sil
- [ ] `POST /api/homeworks/:id/submit` — tələbə təhvil verir
- [ ] `PUT /api/homeworks/:id/grade` — qiymətləndir

### 9.2 Frontend
- [ ] Redux `homeworksSlice` yaradıldı
- [ ] RTK Query `homeworksApi` yaradıldı
- [ ] Ev tapşırıqları səhifəsi yaradıldı
- [ ] Tapşırıq yaratma forması yaradıldı
- [ ] Tapşırıq detalları görünüşü yaradıldı
- [ ] Tələbə: tapşırıq təhvil vermə forması yaradıldı
- [ ] Müəllim: tapşırıqları qiymətləndirmə görünüşü yaradıldı
- [ ] Son tarix sayğacı tətbiq edildi

---

## Mərhələ 10 — Sinif İşləri (Classworks)
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
| 1 — Qurulum | `[~]` davam edir | 62% (16/26) | 26 |
| 2 — Auth | `[ ]` gözləyir | 0% (0/27) | 27 |
| 3 — Layout | `[ ]` gözləyir | 0% (0/10) | 10 |
| 4 — Dashboard | `[ ]` gözləyir | 0% (0/11) | 11 |
| 5 — İstifadəçilər | `[ ]` gözləyir | 0% (0/24) | 24 |
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
| **CƏMI** | | **15% (35/237)** | **237** |

---

> **Qeyd:** Hər tapşırığı tamamladıqdan sonra bu faylı yenilə.  
> Yeni AI sessiyanı başladıqda: **yalnız "Cari Vəziyyət" blokunu oxu** — bu kifayətdir.  
> Local AI ilə işləyərkən: "Bu TODO.md faylına bax, hansı tapşırıq növbəti?" deyə soruşa bilərsən.
