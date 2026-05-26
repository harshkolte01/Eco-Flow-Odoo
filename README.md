# EcoFlow Odoo

EcoFlow Odoo is a full-stack engineering change control application for managing products, BoMs, ECO workflows, approvals, reporting, and role-based access.

The repository is split into two runnable apps:

```text
Eco-Flow-Odoo/
  backend/    Express API, Prisma ORM, PostgreSQL schema, auth, workflow modules
  frontend/   Next.js UI for login, products, BoMs, ECOs, reports, and settings
  docs/       Implementation notes and feature-specific documentation
```

## Test Credentials

Use these credentials for the configured test/demo environment. For a fresh local database, make sure this user exists before signing in with it.

```text
Login ID: employee101
Password: Employee101@gmail.com
```

## Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL, JWT auth
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Auth: Login ID and password with JWT bearer tokens

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database

## Quick Start

### 1. Configure the backend

```bash
cd backend
npm install
copy .env.example .env
```

Update `backend/.env` with your database URL and secrets:

```env
PORT=5001
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

Run database migrations and seed data:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Start the API:

```bash
npm run dev
```

The backend runs at `http://localhost:5001`.

### 2. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

If the API is not running on the default backend URL, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## Useful Commands

Backend:

```bash
cd backend
npm run dev
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run start
npm run lint
```

## Main Features

- Login ID based authentication
- Role-based access for engineering, approver, operations, and admin users
- Product and product version browsing
- BoM and BoM version browsing
- ECO draft, start, approval, rejection, and application workflows
- Stage and approver management
- Approval rule management and delegation support
- Audit logs and reporting views
- Password reset and change-password flows

## API Overview

Default API base URL: `http://localhost:5001`

Core routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/products`
- `GET /api/boms`
- `GET /api/ecos`
- `GET /api/reports/*`
- `GET /api/stages`
- `GET /api/approval-rules`
- `GET /api/audit-logs`

Most routes require `Authorization: Bearer <token>`.

## Documentation

More detailed notes are available in:

- `backend/README.md`
- `frontend/README.md`
- `docs/AUTH_QUICK_REFERENCE.md`
- `docs/login-id-auth-implementation.md`
- `docs/APPROVAL_RULES_DEVELOPER_GUIDE.md`
