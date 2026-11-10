# CampusFind — Smart Lost and Found Management System

A beginner-friendly, full-stack desktop application built with **React**, **Electron**, **Node.js/Express**, and **PostgreSQL**. Designed for campus communities to report lost belongings, list found items, receive automatic match recommendations, file ownership claims, and mark items returned.

---

## 🏗️ Architecture & Technology Stack

- **Desktop Framework**: Electron 32 (with isolated context bridge & secure preload)
- **Frontend**: React 18 + Vite (SPA with clean responsive styling and Toast notifications)
- **Backend API**: Node.js + Express (RESTful architecture, JWT authentication, bcrypt hashing)
- **Database**: PostgreSQL 14+ (relational schema, foreign keys, indexes, triggers)

---

## 📁 Project Structure

```text
campusfind/
├── backend/
│   ├── src/
│   │   ├── db.js          # PostgreSQL connection pool and query utility
│   │   ├── auth.js        # Auth middleware, validation, register/login/profile routes
│   │   ├── items.js       # Items CRUD, search & filter, categories & locations lookup
│   │   ├── claims.js      # Ownership claims lifecycle (file, review, approve/reject)
│   │   ├── activity.js    # Dashboard stats, matching queries, notifications, admin panel
│   │   ├── matcher.js     # Rule-based matching engine (category, location, date, text)
│   │   └── server.js      # Express server initialization and route mounting
│   └── tests/             # Automated Jest + Supertest suites (27 tests)
├── frontend/
│   ├── src/
│   │   ├── context/       # AuthContext for login/session state
│   │   ├── components/    # AppLayout (sidebar and topbar navigation)
│   │   ├── pages/         # Dashboard, ItemsPage, NewItem, ItemDetail, ActivityPage, AuthPage, ProfilePage, AdminPage
│   │   ├── styles/        # Global CSS system
│   │   ├── utils/         # Axios API instance with automatic JWT header attachment
│   │   ├── App.jsx        # Route definitions and authorization guards
│   │   └── main.jsx       # React application entry point
│   ├── index.html
│   └── vite.config.js
├── electron/
│   ├── main.js            # Electron window management
│   └── preload.js         # Context bridge exposing safe platform APIs
└── database/
    ├── schema.sql         # Database tables, constraints, indexes and triggers
    └── seed.sql           # Initial categories, locations, and sample test accounts
```

---

## 🚀 Getting Started

### 1. Database Setup

Ensure PostgreSQL is running locally, then create and seed the database:

```bash
psql -U <your_postgres_user> -c "CREATE DATABASE campusfind;"
psql -U <your_postgres_user> -d campusfind -f database/schema.sql
psql -U <your_postgres_user> -d campusfind -f database/seed.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```
The REST API will start on `http://localhost:3001`.

### 3. Frontend / Desktop Setup

In a new terminal:

```bash
cd frontend
npm install

# Run web version with Vite:
npm run dev

# Or launch Electron desktop application:
npm run electron:dev
```

---

## 🧪 Testing

Run all automated unit and integration tests:

```bash
cd backend
npm test
```

All 27 test cases test:
- User registration, duplicate checks, login, and JWT authorization
- Item creation, keyword/category filtering, and deletion
- Ownership claims filing, receiving, and resolution
- Rule-based matching engine scores across date, location, category, and text

---

## 🔑 Demo Credentials

- **Admin Account**: `admin@campusfind.edu` / `Admin@123`
- **Student Account**: `aarav@campus.edu` / `Test@123`

