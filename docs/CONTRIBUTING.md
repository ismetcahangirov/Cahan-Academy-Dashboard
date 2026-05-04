# CONTRIBUTING.md — Töhfə Qaydaları

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Başlamadan Əvvəl

### Zəruri Alətlər

| Alət | Versiya | Yüklə |
|---|---|---|
| Node.js | 20+ | nodejs.org |
| npm | 10+ | Node ilə gəlir |
| Git | 2.40+ | git-scm.com |
| MongoDB | 7+ (lokal) | mongodb.com |
| VS Code | Son | code.visualstudio.com |

### Tövsiyə Olunan VS Code Genişlənmələri

```
ESLint                  — Lint xətalarını real vaxtda gör
Prettier                — Avtomatik kod formatlaması
Tailwind CSS IntelliSense — Tailwind sinifləri üçün autocomplete
GitLens                 — Git tarixini görüntülə
Thunder Client          — API test (Postman alternativ)
MongoDB for VS Code     — MongoDB sorğuları
```

**`.vscode/settings.json`:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

---

## 2. Layihəni Lokal Qur

```bash
# 1. Fork et (GitHub-da "Fork" düyməsi)

# 2. Klonla
git clone https://github.com/SƏNIN_USERNAME/Cahan-Academy-Dashboard.git
cd Cahan-Academy-Dashboard

# 3. Upstream-i əlavə et (orijinal repo)
git remote add upstream https://github.com/ismetcahangirov/Cahan-Academy-Dashboard.git

# 4. Backend qur
cd server
npm install
cp .env.example .env
# .env faylını doldur (README.md-dəki mühit dəyişənlərinə bax)

# 5. Frontend qur
cd ../client
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

# 6. Serveri başlat
# Terminal 1 — Backend:
cd server && npm run dev

# Terminal 2 — Frontend:
cd client && npm run dev

# 7. Brauzer: http://localhost:5173
```

---

## 3. Branch Strategiyası

```
main
  └── develop
        ├── feature/auth-google-oauth
        ├── feature/homework-submission
        ├── bugfix/schedule-filter
        ├── hotfix/token-refresh
        └── chore/update-dependencies
```

| Branch növü | Prefiks | Nümunə |
|---|---|---|
| Yeni xüsusiyyət | `feature/` | `feature/invitation-system` |
| Xəta düzəltmə | `bugfix/` | `bugfix/login-redirect` |
| Kritik düzəltmə | `hotfix/` | `hotfix/jwt-expiry` |
| Texniki iş | `chore/` | `chore/update-packages` |
| Sənədləşmə | `docs/` | `docs/api-endpoints` |
| Refactoring | `refactor/` | `refactor/auth-slice` |

### Branch Qaydaları

```bash
# Həmişə develop-dan yeni branch aç
git checkout develop
git pull upstream develop
git checkout -b feature/yeni-xususiyyet

# İş bitdikdən sonra
git add .
git commit -m "feat: yeni xüsusiyyət əlavə edildi"
git push origin feature/yeni-xususiyyet
# GitHub-da PR aç: feature/... → develop
```

---

## 4. Commit Mesajı Formatı

**Conventional Commits** standartına uyğun:

```
<növ>(<əhatə>): <qısa təsvir>

[opsional ətraflı açıqlama]

[opsional: BREAKING CHANGE və ya issue ref]
```

### Növlər

| Növ | Nə vaxt | Nümunə |
|---|---|---|
| `feat` | Yeni xüsusiyyət | `feat(auth): google oauth əlavə edildi` |
| `fix` | Xəta düzəltmə | `fix(schedule): gün filteri düzəldildi` |
| `docs` | Sənədləşmə | `docs(api): teacher endpointləri əlavə edildi` |
| `style` | Formatlaşdırma (məntiqi dəyişiklik yox) | `style: prettier formatlaması tətbiq edildi` |
| `refactor` | Yenidən strukturlaşdırma | `refactor(auth): authSlice sadələşdirildi` |
| `test` | Test əlavəsi/düzəltmə | `test(teachers): invite testi əlavə edildi` |
| `chore` | Build, paket, konfiqurasiया | `chore: tailwind v4-ə yüksəldildi` |
| `perf` | Performans yaxşılaşması | `perf(dashboard): stats API cache edildi` |
| `ci` | CI/CD dəyişikliyi | `ci: deploy hook əlavə edildi` |

### Nümunələr

```bash
# Yaxşı commit mesajları
git commit -m "feat(teachers): müəllim dəvət sistemi əlavə edildi"
git commit -m "fix(auth): refresh token expire xətası düzəldildi"
git commit -m "docs(api): imtahan endpointləri sənədləşdirildi"
git commit -m "test(auth): login validasiya testləri əlavə edildi"
git commit -m "refactor(schedule): cədvəl filter məntiqi ayrıldı"
git commit -m "chore(deps): axios 1.7.0-a yüksəldildi"

# Pis commit mesajları
git commit -m "düzəltdim"           # Nəyi?
git commit -m "update"              # Nə yeniləndi?
git commit -m "fix bug"             # Hansı bug?
git commit -m "WIP"                 # Tamamlanmamış iş push olunmasın
```

---

## 5. Kod Standartları

### 5.1 Ümumi Qaydalar

```
✅  DRY (Don't Repeat Yourself) — Özünü təkrar etmə
✅  KISS (Keep It Simple) — Sadə saxla
✅  Funksiyalar tək bir şey etsin
✅  Dəyişən adları mənalı olsun
✅  Magic number-lar const kimi tanımla
❌  console.log-ları commit-ə daxil etmə (debugger üçün istifadə et)
❌  Commented-out kod buraxma
❌  TODO olmayan şeyləri TODO kimi buraxma
```

### 5.2 JavaScript / React Qaydaları

```javascript
// ── ADLANDIRMA ──────────────────────────────────────
const userName    = 'ali';        // Dəyişən: camelCase
const MAX_RETRIES = 3;            // Sabit: UPPER_SNAKE_CASE
const UserCard    = () => {};     // Komponent: PascalCase
const useAuth     = () => {};     // Hook: use + PascalCase

// ── FUNKSIYA ─────────────────────────────────────────
// Yaxşı — aydın məqsəd
const getActiveTeachers = (teachers) =>
  teachers.filter((t) => t.isActive);

// Pis — məlum deyil nə edir
const process = (data) => data.filter((x) => x.active);

// ── KOMPONENT ─────────────────────────────────────────
// Yaxşı — aydın strukturlaşdırılmış
const TeacherCard = ({ teacher, onEdit, onDelete }) => {
  const { t }              = useTranslation();
  const { isAdmin }        = useRole();
  const [open, setOpen]    = useState(false);

  const handleDelete = () => {
    setOpen(false);
    onDelete(teacher._id);
  };

  return (
    <div className="...">
      {/* ... */}
    </div>
  );
};

export default TeacherCard;

// ── IMPORT SIRASI ─────────────────────────────────────
// 1. React
import { useState, useEffect } from 'react';
// 2. Üçüncü tərəf kitabxanaları
import { useTranslation } from 'react-i18next';
import { Users }          from 'lucide-react';
// 3. Redux / RTK Query
import { useGetTeachersQuery } from '../features/teachers/teachersApi';
// 4. Lokal komponentlər
import Button    from '../components/common/Button';
import StatCard  from '../components/ui/StatCard';
// 5. Utilities / hooks
import { useRole }       from '../hooks/useRole';
import { parseApiError } from '../utils/errorParser';
// 6. Stillər (lazım olsa)
import './TeachersPage.css';
```

### 5.3 Fayl Strukturu Qaydaları

```
Hər komponent → özünün faylında
Hər page     → pages/ qovluğunda
Hər feature  → features/ altında slice + api faylları

Fayl adlandırma:
  Komponent:   PascalCase  → TeacherCard.jsx
  Hook:        camelCase   → useAuth.js
  Utility:     camelCase   → formatDate.js
  Slice:       camelCase   → teachersSlice.js
  API:         camelCase   → teachersApi.js
  Sabitlər:    camelCase   → constants.js
  Test:        eyni ad     → TeacherCard.test.jsx
```

### 5.4 Backend Qaydaları

```javascript
// ── CONTROLLER STRUKTURU ──────────────────────────────
// Hər controller: asyncHandler + AppError + successResponse

exports.getTeacher = asyncHandler(async (req, res) => {
  const teacher = await User.findOne({
    _id:  req.params.id,
    role: 'teacher',
  }).lean();

  if (!teacher) {
    throw new AppError('Müəllim tapılmadı', 404, 'NOT_FOUND');
  }

  successResponse(res, {
    message: 'Müəllim əldə edildi',
    data:    teacher,
  });
});

// ── MONGOOSE SORĞULARI ────────────────────────────────
// Yaxşı — yalnız lazım olan sahələri seç
await User.find({ role: 'teacher' })
  .select('name email avatar isActive createdAt')
  .lean();                         // .lean() → sürət artımı

// Pis — bütün sahələri çək
await User.find({ role: 'teacher' });

// ── POPULATE ──────────────────────────────────────────
// Yaxşı — yalnız lazım olan sahələri populate et
await Group.find()
  .populate('teacher', 'name email')   // Yalnız name + email
  .lean();

// Pis — tam sənədi populate et
await Group.find().populate('teacher').lean();
```

---

## 6. ESLint & Prettier Konfiqurasiyası

### `.eslintrc.js` (client)

```javascript
module.exports = {
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope':    'off',   // React 17+ üçün lazım deyil
    'react/prop-types':            'warn',
    'no-unused-vars':              ['warn', { argsIgnorePattern: '^_' }],
    'no-console':                  ['warn', { allow: ['warn', 'error'] }],
    'prefer-const':                'error',
    'no-var':                      'error',
  },
};
```

### `.eslintrc.js` (server)

```javascript
module.exports = {
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest' },
  rules: {
    'no-unused-vars':  ['warn', { argsIgnorePattern: '^_' }],
    'no-console':      'off',       // Server-də console.log olar
    'prefer-const':    'error',
    'no-var':          'error',
  },
};
```

### `.prettierrc`

```json
{
  "semi":           true,
  "singleQuote":    true,
  "tabWidth":       2,
  "trailingComma":  "es5",
  "printWidth":     100,
  "bracketSpacing": true,
  "arrowParens":    "always"
}
```

---

## 7. Pull Request Prosesi

### PR Açmadan Əvvəl

```bash
# 1. Upstream-dən son dəyişiklikləri al
git fetch upstream
git rebase upstream/develop

# 2. Testlər keçir
cd server && npm run test
cd client && npm run test

# 3. Lint yoxla
cd server && npm run lint
cd client && npm run lint

# 4. Build yoxla
cd client && npm run build
```

### PR Şablonu

GitHub-da PR açarkən aşağıdakı formatı istifadə et:

```markdown
## Nə dəyişdirildi?
<!-- Əlavə edilən, dəyişdirilən, silinin xüsusiyyətləri qısa açıqla -->

## Niyə?
<!-- Bu dəyişikliyin səbəbi nədir? -->

## Necə test edildi?
- [ ] Unit testlər yazıldı / yeniləndi
- [ ] API manual test edildi
- [ ] UI brauzer(lərdə) test edildi
- [ ] Mobil görünüş yoxlandı

## Screenshot (UI dəyişikliyi varsa)
<!-- Əvvəl / Sonra screenshot əlavə et -->

## İlgili Issue
Closes #<issue-number>
```

### PR Qaydaları

```
✅  Hər PR — tək bir xüsusiyyət və ya düzəltmə
✅  PR başlığı Conventional Commits formatında olsun
✅  Bütün CI yoxlamaları keçsin (lint, test, build)
✅  Ən az 1 review alınsın (layihə böyüdükcə)
✅  Konfliktlər həll edilsin
❌  1000+ sətir dəyişiklik olan PR açma — bölüşdür
❌  "WIP" PR-ları draft kimi aç
❌  Testlər olmadan yeni feature PR-ı açma
```

---

## 8. Issue Bildirmə

### Bug Report

```markdown
**Başlıq:** [BUG] Qısa təsvir

**Mühit:**
- OS: Windows 11
- Brauzer: Chrome 120
- Node.js: 20.11.0

**Gözlənilən davranış:**
Nə olmalı idi?

**Faktiki davranış:**
Nə baş verdi?

**Addımlar:**
1. /teachers-ə get
2. "Dəvət göndər" düyməsinə bas
3. ...

**Screenshot / Xəta mesajı:**
```

### Feature Request

```markdown
**Başlıq:** [FEATURE] Qısa təsvir

**Problem:**
Bu xüsusiyyət olmadan nə çətinlik yaşanır?

**Həll:**
Nə istəyirsən?

**Alternativlər:**
Başqa həll yolları düşünübsünmü?
```

---

## 9. Kod Review Qaydaları

### Reviewer olaraq

```
✅  Konstruktiv rəy ver — "Bu şəkildə daha yaxşı olar" (niyəsini izah et)
✅  Kiçik məsələlər üçün "nit:" prefiksi istifadə et
✅  Yaxşı işi qiymətləndir
✅  Suallar ver, ittiham etmə
✅  48 saat içində review et
❌  "Bu yanlışdır" demə — niyə yanlışdır, nə düzgündür?
❌  Şəxsiləşdirmə
```

### Nümunə Review Şərhləri

```
// Blocker (birləşmə dayandırılır)
"Bu endpoint-də auth middleware yoxdur — istənilən
 istifadəçi teacher silə bilər."

// Suggestion (birləşməni bloklamır)
"nit: Bu funksiya teacher.js-ə köçürülə bilər —
 daha aydın olardı. Sənin seçimdir."

// Sual
"Bu pattern-i burada niyə seçdin? Başqa yanaşma
 düşünmüşdünsə maraqlı olardı."

// Qiymətləndirmə
"Çox təmiz həll! Bu error handling pattern-i
 hər yerdə tətbiq etmək istəyirik."
```

---

## 10. Versiya Nömrələmə

**Semantic Versioning (SemVer):** `MAJOR.MINOR.PATCH`

| Dəyişiklik | Versiya | Nümunə |
|---|---|---|
| Breaking change | MAJOR artır | `1.0.0 → 2.0.0` |
| Yeni xüsusiyyət | MINOR artır | `1.0.0 → 1.1.0` |
| Bug fix | PATCH artır | `1.0.0 → 1.0.1` |

```bash
# Release tag yaratma
git tag -a v1.1.0 -m "feat: imtahan sistemi əlavə edildi"
git push origin v1.1.0
```

---

## 11. Sürətli Keçid

| Ehtiyac | Fayl |
|---|---|
| Yeni API endpointi | `API.md` → `server/routes/` → `server/controllers/` |
| Yeni səhifə | `ARCHITECTURE.md` → `client/src/pages/` |
| Yeni komponent | `COMPONENTS.md` → `client/src/components/` |
| Yeni tərcümə açarı | `I18N.md` → `az.json`, `en.json`, `ru.json` |
| Xəta idarəsi | `ERROR_HANDLING.md` |
| Test yazmaq | `TESTING.md` |
| Deploy etmək | `DEPLOYMENT.md` |
| İcazə yoxlamaq | `ROLES_PERMISSIONS.md` |
| TODO yeniləmək | `TODO.md` |
