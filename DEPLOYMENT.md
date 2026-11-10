# CampusFind — Production Deployment Guide

This guide covers step-by-step instructions for deploying CampusFind to production:
- **Hosted Database**: Render PostgreSQL (or Neon / Supabase)
- **Hosted Backend**: Render (Node.js & Express REST API)
- **Hosted Frontend**: Vercel (React + Vite SPA)
- **Desktop Application**: Electron (connecting to local or hosted backend)

---

## 📋 Architectural Overview

```
                        ┌───────────────────────────────────┐
                        │       Vercel (Frontend SPA)       │
                        │   https://campusfind.vercel.app   │
                        └─────────────────┬─────────────────┘
                                          │
                         Rewrites /api/*  │ (CORS configured)
                                          ▼
                        ┌───────────────────────────────────┐
                        │      Render (Express Backend)     │
                        │ https://campusfind-api.onrender.com│
                        └─────────────────┬─────────────────┘
                                          │
                           SSL connection │ DATABASE_URL
                                          ▼
                        ┌───────────────────────────────────┐
                        │     Render PostgreSQL Database    │
                        │       (Tables, Indexes, Seed)     │
                        └───────────────────────────────────┘
```

---

## 1. 🗄️ Database Setup (Render PostgreSQL)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **PostgreSQL**.
3. Configure the database:
   - **Name**: `campusfind-db`
   - **Database**: `campusfind`
   - **User**: `campusfind_user`
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore).
   - **Plan**: Free (or Starter).
4. Click **Create Database**.
5. Once created, locate the **External Database URL** (e.g., `postgresql://campusfind_user:password@dpg-xxx.oregon-postgres.render.com/campusfind`).
6. Initialize the database schema and safe production seeds from your terminal:
   ```bash
   psql "<EXTERNAL_DATABASE_URL>?sslmode=require" -f database/init_production.sql
   psql "<EXTERNAL_DATABASE_URL>?sslmode=require" -f database/seed_production.sql
   ```
   > 🔒 **Security Notice**: `seed_production.sql` seeds only official categories and locations. It does **not** insert any demo credentials or test accounts.

---

## 2. 🚀 Backend Deployment (Render Web Service)

1. In the Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name**: `campusfind-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node src/server.js`)
   - **Plan**: Free
4. Add the following **Environment Variables** in Render:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production security checks |
   | `DATABASE_URL` | `postgresql://...` | Internal/External Database URL from Step 1 |
   | `JWT_SECRET` | *(Generate a 32+ char secret)* | Generate using `openssl rand -base64 32` |
   | `JWT_EXPIRES_IN` | `7d` | Token expiration time |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend domain(s) for CORS |
5. Click **Deploy Web Service**.
6. Verify the deployment:
   ```bash
   curl https://campusfind-backend.onrender.com/api/health
   # Returns: {"status":"ok","time":"..."}
   ```

---

## 3. 🌐 Frontend Deployment (Vercel)

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your `campusfind` Git repository.
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (or select root if using repository root `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Configure the API rewrite:
   - Open `frontend/vercel.json` and replace `https://campusfind-backend.onrender.com` with your actual Render backend URL:
     ```json
     {
       "rewrites": [
         {
           "source": "/api/(.*)",
           "destination": "https://<your-actual-render-backend-url>/api/$1"
         },
         {
           "source": "/(.*)",
           "destination": "/index.html"
         }
       ]
     }
     ```
6. Click **Deploy**.
7. Copy your Vercel production URL (e.g., `https://campusfind.vercel.app`) and update the `FRONTEND_URL` environment variable in your **Render backend** to allow CORS.

---

## 4. 💻 Electron Desktop Application

Electron retains full local development support and adds an optional hosted mode.

### Mode A: Local Development (Default)
Runs local Vite dev server and local Express backend:
```bash
./start.sh
```

### Mode B: Desktop Window Connected to Hosted Web Version
Loads your live production Vercel app inside the Electron native frame:
```bash
CAMPUSFIND_WEB_URL="https://campusfind.vercel.app" npm run electron
```
*(or via the frontend directory: `CAMPUSFIND_WEB_URL="https://campusfind.vercel.app" npm run electron`)*

### Mode C: Desktop Window with Local Bundled Dist + Hosted API
Uses local packaged UI assets while communicating with the remote Render API:
```bash
CAMPUSFIND_API_URL="https://campusfind-backend.onrender.com/api" npm run electron
```

---

## 🔒 Security Checklist

- [x] **No Secrets in Source Control**: Verified `.gitignore` blocks `.env`, `*.env`, and credentials.
- [x] **Strict Production JWT**: The backend rejects startup in `production` if `JWT_SECRET` is missing or shorter than 32 characters.
- [x] **Safe Student Registration**: Registration forces `role = 'student'`, preventing privilege escalation to `admin`.
- [x] **Admin Route Protection**: All `/api/admin/*` routes require authenticated tokens with `role === 'admin'`.
- [x] **CORS Origin Whitelist**: Restricts cross-origin requests to configured domains in production.
- [x] **TLS/SSL Verification**: Connects to remote PostgreSQL via SSL without disabling global Node certificate verification.
- [x] **Zero Hardcoded Passwords**: Production seed script (`seed_production.sql`) includes zero hardcoded student or admin credentials.

---

## 🛠️ Local Verification & Testing

Before deploying, run the full verification locally:
```bash
# 1. Run all backend tests (29 tests)
cd backend && npm test

# 2. Run frontend production build
cd ../frontend && npm run build
```
EOF

