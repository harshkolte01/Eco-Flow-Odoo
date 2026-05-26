# EcoFlow Backend

Express API for EcoFlow's engineering change control workflows. It handles authentication, user roles, products, BoMs, ECO workflows, approval rules, reporting, audit logs, and email-assisted password reset flows.

## Tech Stack

- Node.js with Express
- Prisma ORM with PostgreSQL
- JWT bearer authentication
- bcrypt password hashing
- Nodemailer for password reset email delivery

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
copy .env.example .env
```

Update `.env`:

```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=EcoFlow
```

Generate the Prisma client, run migrations, and seed development data:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Start the development API:

```bash
npm run dev
```

The API runs at `http://localhost:5001`.

## Scripts

```bash
npm run dev              # Start API with nodemon
npm run start            # Start API with node
npm run build            # Deployment placeholder
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run local Prisma migrations
npm run prisma:seed      # Seed roles, stages, products, BoMs, and sample data
npm run prisma:studio    # Open Prisma Studio
```

## Health Check

```bash
curl http://localhost:5001/health
```

Successful response includes `status: "ok"` and `database: "connected"`.

## Authentication

The app uses Login ID based authentication. Users sign in with `loginId`, not email.

Signup creates a user with the default `engineering` role:

```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "john101",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "TestPass123"
  }'
```

Login returns a JWT token:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "john101",
    "password": "TestPass123"
  }'
```

Use the returned token for protected requests:

```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Roles

- `engineering`: Default role for new signups.
- `approver`: Can participate in approval workflows.
- `operations`: Read-focused operational access.
- `admin`: Full management access, including users, stages, and settings.

## Main API Areas

- `POST /api/auth/signup` - Register a user.
- `POST /api/auth/login` - Authenticate and receive a token.
- `GET /api/auth/me` - Get the current authenticated user.
- `POST /api/auth/change-password` - Change the current user's password.
- `POST /api/auth/forgot-password` - Request a password reset token.
- `POST /api/auth/reset-password` - Reset a password using a token.
- `GET /api/users` - List users, admin only.
- `GET /api/users/lookup` - Lookup users for assignment workflows.
- `PATCH /api/users/:id/role` - Update a user's role, admin only.
- `GET /api/products` - List products and versions.
- `GET /api/boms` - List BoMs and versions.
- `GET /api/ecos` - List ECO records.
- `POST /api/ecos` - Create an ECO draft.
- `GET /api/reports/*` - Reporting endpoints.
- `GET /api/stages` - ECO stage management.
- `GET /api/approval-rules` - Approval rule management.
- `GET /api/delegations` - Approval delegation management.
- `GET /api/audit-logs` - Audit history.

Most endpoints require `Authorization: Bearer <token>`.

## Admin Testing

To test admin-only endpoints, promote a local user after signup:

```sql
UPDATE "User"
SET "roleId" = (SELECT id FROM "Role" WHERE name = 'admin')
WHERE "loginId" = 'john101';
```

Then log in again to receive a token with the updated role.

## Project Structure

```text
backend/
  api/                 Vercel serverless entrypoint
  docs/                Backend-specific notes
  prisma/              Prisma schema, migrations, and seed script
  src/
    config/            Environment and Prisma client setup
    middlewares/       Auth, validation, and error handling
    modules/           Feature modules and route handlers
    utils/             Shared helpers and services
```

## Related Documentation

- `../docs/AUTH_QUICK_REFERENCE.md`
- `../docs/login-id-auth-implementation.md`
- `../docs/email-service-setup.md`
- `../docs/APPROVAL_RULES_DEVELOPER_GUIDE.md`
