# EcoFlow Frontend

Next.js frontend for the EcoFlow engineering change control application. It provides authenticated screens for products, BoMs, ECO workflows, reports, approval rules, stages, and account management.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- JWT bearer token auth stored in `localStorage`

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

The frontend calls the backend at `http://localhost:5001` by default. To use another API URL, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## Scripts

```bash
npm run dev    # Start the Next.js dev server
npm run build  # Build for production
npm run start  # Start the production build
npm run lint   # Run ESLint
```

## App Areas

- `/login` - Login with Login ID and password.
- `/signup` - Register a new account.
- `/forgot-password` - Request a password reset.
- `/reset-password` - Complete a password reset.
- `/change-password` - Change password for the signed-in user.
- `/` - Main dashboard and ECO/product overview.
- `/products` - Product version view.
- `/boms` - BoM version view.
- `/reports` - ECO, product, BoM, active matrix, and archived product reports.
- `/settings` - Admin settings entry point.
- `/settings/eco-stages` - ECO stage and approver management.
- `/settings/approval-rules` - Approval rule management.

## Authentication Flow

The app uses `AuthContext` in `context/AuthContext.tsx`.

- `login(loginId, password)` calls `POST /api/auth/login`.
- `signup(loginId, name, email, password)` calls `POST /api/auth/signup`.
- JWT tokens are stored as `ecoflow_token` in `localStorage`.
- Protected pages use `components/ProtectedRoute.tsx`.
- API calls should use `lib/api.ts` so the bearer token and error handling stay consistent.

## Project Structure

```text
frontend/
  app/          Next.js routes and page components
  components/   Shared UI and workflow components
  context/      React context providers
  hooks/        Shared hooks
  lib/          API client and shared types
  public/       Static assets
```

## Backend Dependency

Run the backend before using protected screens:

```bash
cd ../backend
npm run dev
```

The backend must be reachable at `NEXT_PUBLIC_API_URL` and must allow the frontend origin through CORS.
