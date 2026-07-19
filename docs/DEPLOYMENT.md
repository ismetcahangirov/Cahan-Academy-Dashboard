# DEPLOYMENT.md — Deploy & CI/CD

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Ümumi Baxış

```
┌─────────────────────────────────────────────────────────┐
│                   GitHub Repository                     │
│            main branch-a push / PR merge                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               GitHub Actions CI/CD                      │
│   Lint → Test → Security Audit → Build → Deploy        │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌───────────────────────┐
│     FRONTEND     │      │       BACKEND         │
│  Vercel / Netlify│      │  Render / Railway /   │
│  Static hosting  │      │  VPS (Ubuntu)         │
└──────────────────┘      └───────────┬───────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │    MongoDB Atlas       │
                          │  (Cloud Database)     │
                          └───────────────────────┘
```

---

## 2. Mühit Fərqləri

| Parametr | Development | Production |
|---|---|---|
| Frontend URL | `localhost:5173` | `cahanacademy.az` |
| Backend URL | `localhost:5000` | `api.cahanacademy.az` |
| MongoDB | Local | Atlas dedicated |
| NODE_ENV | `development` | `production` |
| HTTPS | Xeyr | Bəli (məcburi) |
| Rate limit | Yumşaq | Ciddi |

---

## 3. Production Build

### Frontend

```bash
cd client
npm ci
npm run build
# Çıxış: client/dist/
```

**`vite.config.js` production parametrləri:**

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir:   'dist',
    sourcemap: false,
    minify:   'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux:  ['@reduxjs/toolkit', 'react-redux'],
          ui:     ['lucide-react'],
        },
      },
    },
  },
});
```

### Backend

```bash
cd server
npm ci --only=production
node server.js
# və ya PM2 ilə:
pm2 start server.js --name "academy-api" --env production
```

### Vercel (Həm Frontend, həm Backend)

Layihə Vercel platformasında serverless funksiyalar (backend) və statik hosting (frontend) kimi deploy olunmuşdur.

**Frontend:**
- Directory: `client`
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

**Backend:**
- Directory: `server`
- Runtime: `Node.js`
- Entry Point: `server.js` (Vercel serverless adapters vasitəsilə)

---

## 4. Environment Dəyişənləri — Production

### Frontend (`client` — Vercel/Netlify panel)

```env
VITE_API_URL=https://api.cahanacademy.az/api
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
```

### Backend (Vercel / Render / VPS)

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/<db_name>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=https://cahan-academy-dashboard.vercel.app
```

---

## 5. GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd client && npm ci && npm run lint
      - run: cd server && npm ci && npm run lint

  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd server && npm ci && npm run test:ci
        env:
          NODE_ENV:           test
          JWT_SECRET:         ${{ secrets.JWT_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}

  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd client && npm ci && npm run test:coverage

  security:
    name: Security Audit
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd server && npm ci && npm audit --audit-level=high
      - run: cd client && npm ci && npm audit --audit-level=high

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend, security]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Build frontend
        run: cd client && npm ci && npm run build
        env:
          VITE_API_URL:          ${{ secrets.VITE_API_URL }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: client/dist/

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy backend to Render
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
      # Vercel: GitHub inteqrasiyası ilə avtomatik deploy edilir
```

---

## 6. Platform Qurulumu

### Frontend — Vercel

```bash
npm install -g vercel
cd client
vercel --prod
```

**`vercel.json`:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend — Render

**`render.yaml`:**

```yaml
services:
  - type: web
    name: academy-api
    env: node
    region: frankfurt
    plan: starter
    buildCommand: cd server && npm ci --only=production
    startCommand: cd server && node server.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: CLIENT_URL
        value: https://cahanacademy.az
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
```

### Backend — VPS (Ubuntu 22.04)

```bash
# Server hazırlığı
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2

# Repo-nu klonla
git clone https://github.com/ismetcahangirov/Cahan-Academy-Dashboard.git
cd Cahan-Academy-Dashboard/server
npm ci --only=production
nano .env   # Dəyişənləri doldur

# PM2 ilə başlat
pm2 start server.js --name "academy-api" --env production
pm2 save
pm2 startup
```

**Nginx konfiqurasiyası:**

```nginx
# /etc/nginx/sites-available/academy-api

server {
    listen 80;
    server_name api.cahanacademy.az;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.cahanacademy.az;

    ssl_certificate     /etc/letsencrypt/live/api.cahanacademy.az/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cahanacademy.az/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# SSL sertifikat (pulsuz)
sudo certbot --nginx -d api.cahanacademy.az
sudo systemctl reload nginx
```

---

## 7. MongoDB Atlas Qurulumu

```
1. atlas.mongodb.com-da hesab aç
2. Yeni cluster yarat (M0 free tier)
3. Database User yarat:
   - Username: academy_user
   - Password: [güclü şifrə]
   - Role: readWrite → academy_prod
4. Network Access → Production server IP-sini əlavə et
5. Connection string al → MONGO_URI-yə əlavə et
```

**MongoDB İndexlər:**

```javascript
// model fayllarında elan et — başladıqda avtomatik yaradılır

// User.js
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Group.js
groupSchema.index({ teacher: 1 });

// Homework.js
homeworkSchema.index({ group: 1 });
homeworkSchema.index({ teacher: 1 });
homeworkSchema.index({ dueDate: 1 });

// Schedule.js
scheduleSchema.index({ group: 1, dayOfWeek: 1 });

// Invitation.js
invitationSchema.index({ token: 1 });
invitationSchema.index({ email: 1, status: 1 });
```

---

## 8. Health Check Endpointi

```javascript
// routes/healthRoutes.js

const router   = require('express').Router();
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    status:    dbState === 1 ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    db:        dbState === 1 ? 'connected' : 'disconnected',
    env:       process.env.NODE_ENV,
  });
});

module.exports = router;
```

---

## 9. GitHub Secrets Siyahısı

Repo → Settings → Secrets and variables → Actions:

| Secret | Məzmun |
|---|---|
| `JWT_SECRET` | 64 simvollu random string |
| `JWT_REFRESH_SECRET` | Başqa 64 simvollu random string |
| `VITE_API_URL` | `https://api.cahanacademy.az/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google Console-dan |
| `RENDER_DEPLOY_HOOK` | Render → Deploy hook URL |

```bash
# 64 simvollu secret yaratma:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 10. Deploy Sonrası Yoxlama Siyahısı

```
BACKEND
  [ ]  GET /api/health → { status: "ok", db: "connected" }
  [ ]  POST /api/auth/login → 200 OK
  [ ]  HTTPS aktiv: https://api.cahanacademy.az
  [ ]  HTTP → HTTPS yönləndirməsi işləyir
  [ ]  CORS yalnız cahanacademy.az üçün açıqdır
  [ ]  Rate limiting aktiv
  [ ]  X-Powered-By header yoxdur

FRONTEND
  [ ]  https://cahanacademy.az açılır
  [ ]  Login işləyir
  [ ]  Google OAuth işləyir
  [ ]  Dashboard məlumatları yüklənir
  [ ]  Dil dəyişdirici işləyir
  [ ]  Mobil görünüş düzgündür

VERİLƏNLƏR BAZASI
  [ ]  MongoDB Atlas bağlantısı aktiv
  [ ]  İlk admin hesabı avtomatik yaradıldı
  [ ]  ismetcahangirov022@gmail.com ilə giriş yoxlanıldı
  [ ]  İndexlər yaradılıb

TƏHLÜKƏSİZLİK
  [ ]  .env faylları GitHub-da görünmür
  [ ]  SSL sertifikat etibarlıdır
  [ ]  npm audit --audit-level=high keçib
  [ ]  MongoDB Atlas IP whitelist konfiqurasiya edilib
```

---

## 11. Rollback Strategiyası

```bash
# Git ilə rollback
git log --oneline -10             # Son commit-ləri gör
git revert <commit-hash>          # Geri al (yeni commit)
git push origin main

# Render-də: panel → Deploys → əvvəlki deploy → "Rollback"

# PM2 ilə (VPS)
git checkout <previous-tag>
npm ci --only=production
pm2 restart academy-api
```
