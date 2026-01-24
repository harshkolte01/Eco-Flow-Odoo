# ECOFlow Backend - Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` (already configured)
   - JWT_SECRET is already generated

3. **Seed database with roles:**
   ```bash
   npm run prisma:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:5001`

## Quick Test Commands

### 1. Health Check
```bash
curl http://localhost:5001/health
```

### 2. Signup (Creates user with 'engineering' role)
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the `token` from response.

### 3. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 4. Get Current User (requires token)
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Create Admin User
To test admin endpoints, first create a user, then update their role in database:

```sql
-- In Prisma Studio or psql:
UPDATE "User" 
SET "roleId" = (SELECT id FROM "Role" WHERE name = 'admin') 
WHERE email = 'test@example.com';
```

Then login again to get admin token.

### 6. List Users (admin only)
```bash
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 7. Update User Role (admin only)
```bash
curl -X PATCH http://localhost:5001/api/users/2/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "approver"}'
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user (protected)

### User Management (Admin Only)
- `GET /api/users` - List all users (with pagination)
- `PATCH /api/users/:id/role` - Update user role

## Roles

1. **engineering** - Default role for new signups
2. **approver** - Can approve ECOs
3. **operations** - Read-only access
4. **admin** - Full access including user management

## Documentation

See `docs/auth-implementation.md` for complete documentation including:
- Detailed API reference
- JWT token structure
- Middleware usage
- Security best practices
- Future ECO module integration examples

## Useful Commands

```bash
# Start dev server with auto-reload
npm run dev

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed roles
npm run prisma:seed
```

## Environment Variables

```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://...
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=7d
```

## File Structure

```
backend/
├── src/
│   ├── config/           # Environment and database config
│   ├── middlewares/      # Auth, error handling, validation
│   ├── modules/
│   │   ├── auth/         # Authentication endpoints
│   │   └── users/        # User management endpoints
│   └── utils/            # Response helpers, async handler
├── docs/                 # Complete documentation
└── prisma/               # Database schema and seeds
```

## Next Steps

1. ✅ Auth system is complete
2. Implement ECO module with role-based permissions
3. Implement Products module with role-based permissions
4. Add rate limiting and additional security measures for production
