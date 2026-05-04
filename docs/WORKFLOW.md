# WORKFLOW.md — AI İş Axını (Hər Task üçün)

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## Bu Fayl Nə Üçündür?

Bu fayl **local AI-a** verilən təlimatdır.  
Hər yeni tapşırığa başlamadan əvvəl bu faylı oxu və **tam olaraq** bu addımları izlə.

---

## Əsas Qayda

```
1 task = 1 branch = 1 PR

Heç vaxt birden çox tapşırığı eyni branch-da etmə.
Heç vaxt birbaşa main və ya develop-a push etmə.
```

---

## Addım-Addım Workflow

### ADDIM 1 — TODO.md-i oxu

```bash
cat docs/TODO.md
```

- `[ ]` işarəli ilk tapşırığı tap
- Hansı mərhələyə aid olduğunu müəyyən et
- Əlaqəli sənədləri oxu (API.md, ARCHITECTURE.md, COMPONENTS.md və s.)

---

### ADDIM 2 — main-i pull et

```bash
git checkout main
git pull origin main
```

> **Niyə?** Həmişə ən son koddan başla. PR birləşdikdən sonra main yenilənir.

---

### ADDIM 3 — Yeni branch yarat

Branch adını tapşırığa uyğun seç:

```bash
# Sintaksis:
git checkout -b <növ>/<qısa-ad>

# Nümunələr:
git checkout -b feature/auth-register
git checkout -b feature/teachers-list
git checkout -b feature/invite-system
git checkout -b bugfix/login-redirect
git checkout -b chore/setup-redux-store
git checkout -b feature/schedule-page
git checkout -b feature/homework-crud
```

**Branch adlandırma qaydaları:**

| Tapşırıq növü | Prefiks |
|---|---|
| Yeni xüsusiyyət | `feature/` |
| Xəta düzəltmə | `bugfix/` |
| Layihə qurulumu | `chore/` |
| Sənədləşmə | `docs/` |
| Refactoring | `refactor/` |

---

### ADDIM 4 — Tapşırığı yerinə yetir

- `TODO.md`-dəki həmin tapşırığın bütün alt-tapşırıqlarını tamamla
- Əlaqəli sənədləri rəhbər tut:
  - Backend tapşırıqları → `API.md`, `ARCHITECTURE.md`, `ERROR_HANDLING.md`
  - Frontend tapşırıqları → `COMPONENTS.md`, `ROLES_PERMISSIONS.md`, `I18N.md`
  - Auth tapşırıqları → `AUTH.md`, `SECURITY.md`
  - Test tapşırıqları → `TESTING.md`

---

### ADDIM 5 — TODO.md-i yenilə

Tamamlanan tapşırıqları işarələ:

```bash
# TODO.md-də [ ] → [x] et
# Nümunə:
# [ ] Redux store quruldu  →  [x] Redux store quruldu
```

Ümumi tərəqqi cədvəlini də yenilə (fayl sonundakı cədvəl).

---

### ADDIM 6 — Commit et

Bütün dəyişiklikləri commit et:

```bash
git add .
git commit -m "<növ>(<əhatə>): <nə edildi>"
```

**Commit mesajı nümunələri:**

```bash
git commit -m "chore(setup): vite react layihəsi yaradıldı"
git commit -m "feat(auth): register endpointi əlavə edildi"
git commit -m "feat(auth): login endpointi əlavə edildi"
git commit -m "feat(teachers): müəllim siyahısı API-si yaradıldı"
git commit -m "feat(ui): teachers səhifəsi komponenti yaradıldı"
git commit -m "fix(schedule): gün filteri düzəldildi"
git commit -m "test(auth): register unit testləri əlavə edildi"
git commit -m "docs(todo): mərhələ 1 tapşırıqları tamamlandı işarələndi"
```

> Bir tapşırıq içində birdən çox commit ola bilər — bu normaldır.  
> Məsələn: backend commit + frontend commit + test commit ayrı-ayrı.

---

### ADDIM 7 — Branch-ı push et

```bash
git push origin <branch-adı>

# Nümunə:
git push origin feature/auth-register
```

---

### ADDIM 8 — Sahibinə xəbər ver

Push etdikdən sonra aşağıdakı formatda xəbər ver:

```
✅ Tapşırıq tamamlandı!

📌 Branch: feature/auth-register
📋 Tamamlanan tapşırıqlar:
   [x] User modeli yaradıldı
   [x] Şifrə hashlanması tətbiq edildi
   [x] POST /api/auth/register endpointi
   [x] POST /api/auth/login endpointi
   [x] Auth middleware yazıldı

🔗 GitHub-da PR aç:
   feature/auth-register → main

PR birləşdikdən sonra növbəti tapşırıq üçün xəbər ver.
```

---

### ADDIM 9 — Sahibi PR açır və birləşdirir

```
Bu addımı SAHİB yerinə yetirir — AI deyil.

Sahibin addımları:
  1. GitHub-da PR aç: branch → main
  2. Dəyişiklikləri nəzərdən keçir
  3. PR-ı birləşdir (Merge)
  4. Branch-ı sil (opsional)
  5. AI-a "PR birləşdi, davam et" de
```

---

### ADDIM 10 — Növbəti tapşırıq üçün ADDIM 2-yə qayıt

```bash
# Sahibdən "davam et" siqnalı aldıqdan sonra:
git checkout main
git pull origin main
# → ADDIM 3-ə keç: yeni branch yarat
```

---

## Tam Dövrə Diaqramı

```
TODO.md oxu
    │
    ▼
git checkout main
git pull origin main
    │
    ▼
git checkout -b feature/tapşırıq-adı
    │
    ▼
Kodu yaz / Tapşırığı tamamla
    │
    ▼
TODO.md yenilə [ ] → [x]
    │
    ▼
git add .
git commit -m "feat: ..."
    │
    ▼
git push origin feature/tapşırıq-adı
    │
    ▼
Sahibə xəbər ver ✅
    │
    ▼
Sahib PR açır və birləşdirir
    │
    ▼
Sahib "davam et" deyir
    │
    ▼
git checkout main && git pull origin main
    │
    ▼ (dövrə başa çatır, yeni tapşırıq üçün yenidən başlayır)
```

---

## Tez-tez Soruşulan Suallar

**S: Eyni tapşırıq üçün bir neçə commit etmək olar?**  
C: Bəli, tövsiyə olunur. Hər məntiqi hissəni ayrı commit et.

**S: PR birləşməmiş yeni tapşırığa başlaya bilərəm?**  
C: Xeyr. Həmişə əvvəlki PR birləşsin, sonra növbəti tapşırığa başla.

**S: Branch-dan branch yaratmaq olarmı?**  
C: Xeyr. Həmişə main-dən yeni branch aç.

**S: Tapşırıq yarımçıq qalıbsa nə etməli?**  
C: `[~]` işarəsi ilə TODO.md-də qeyd et və sahibi məlumatlandır.

**S: Bir tapşırıqda xəta tapıldısa nə etməli?**  
C: Eyni branch-da düzəlt, yenidən commit et, yenidən push et.

---

## Branch Adları — Hazır Siyahı

Aşağıdakı branch adlarını TODO.md mərhələlərinə uyğun istifadə et:

```bash
# Mərhələ 1 — Qurulum
chore/frontend-setup
chore/backend-setup
chore/tailwind-config
chore/redux-store-setup
chore/axios-instance
chore/i18n-setup

# Mərhələ 2 — Auth
feature/auth-user-model
feature/auth-register-login
feature/auth-google-oauth
feature/auth-forgot-password
feature/auth-frontend-pages
feature/auth-protected-routes

# Mərhələ 3 — Layout
feature/layout-sidebar
feature/layout-bottom-tabs
feature/layout-header
feature/layout-app-shell

# Mərhələ 4 — Dashboard
feature/dashboard-api
feature/dashboard-page

# Mərhələ 5 — İstifadəçilər
feature/teachers-api
feature/teachers-frontend
feature/students-api
feature/students-frontend

# Mərhələ 6 — Dəvətlər
feature/invitations-api
feature/invitations-frontend

# Mərhələ 7 — Qruplar
feature/groups-api
feature/groups-frontend

# Mərhələ 8 — Cədvəl
feature/schedule-api
feature/schedule-frontend

# Mərhələ 9 — Ev tapşırıqları
feature/homeworks-api
feature/homeworks-frontend

# Mərhələ 10 — Sinif işləri
feature/classworks-api
feature/classworks-frontend

# Mərhələ 11 — İmtahanlar
feature/exams-api
feature/exams-frontend

# Mərhələ 12 — Profil & Parametrlər
feature/profile-api
feature/profile-frontend

# Mərhələ 13 — Təhlükəsizlik
chore/security-helmet-cors
chore/security-rate-limiting
chore/security-input-validation

# Mərhələ 14 — Testlər
test/backend-auth-tests
test/backend-api-tests
test/frontend-unit-tests
test/frontend-component-tests

# Mərhələ 15 — Deploy
chore/ci-cd-pipeline
chore/production-deploy
```

---

## AI-a Verilən Əmr Şablonu

Hər dəfə yeni tapşırığa başlamaq üçün sahibin deyəcəyi:

```
"TODO.md-ə bax, növbəti tapşırığı götür,
yeni branch aç, tamamla, push et."
```

Və ya PR birləşdikdən sonra:

```
"PR birləşdi. Növbəti tapşırığa keç."
```

---

## Qısa Xatırlatma Kartı

```
┌─────────────────────────────────────────┐
│  HƏR TASK ÜÇÜN:                         │
│                                         │
│  1. cat docs/TODO.md                    │
│  2. git checkout main                   │
│  3. git pull origin main                │
│  4. git checkout -b feature/ad          │
│  5. Kodu yaz                            │
│  6. TODO.md-i yenilə [x]               │
│  7. git add . && git commit -m "..."    │
│  8. git push origin feature/ad          │
│  9. Sahibə xəbər ver ✅                 │
│ 10. Sahibin PR-ı birləşdirməsini gözlə  │
└─────────────────────────────────────────┘
```
