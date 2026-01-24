# Authentication & Authorization Implementation

## Overview

This document describes the complete authentication and role-based authorization system implemented for the ECOFlow backend. The system uses JWT tokens, bcrypt password hashing, and Prisma ORM with PostgreSQL.

## System Architecture

### Technology Stack
- **JWT (JSON Web Tokens)**: Token-based authentication
- **bcryptjs**: Password hashing with 10 salt rounds
- **Prisma**: Database ORM for PostgreSQL
- **Express**: Web framework with custom middleware

### Security Features
- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Role-based access control (RBAC)
- Secure token verification
- Prevention of self-role changes (admins cannot change their own role)
- Generic "Invalid credentials" error messages (no user enumeration)

## Role System

### Four Roles

1. **engineering** (Default for new signups)
   - Can create ECO drafts
   - Can edit own ECO drafts (status: draft or in_progress)
   - Read-only access to active master data
   
2. **approver**
   - Can approve/reject ECOs
   - Can view ECO details and diffs
   - Read-only access to active data
   
3. **operations**
   - Read-only access to:
     - Active products
     - Active BOMs
     - Approved/applied ECOs
   
4. **admin**
   - Full access to all endpoints
   - Can manage users (list, update roles)
   - Can edit active master data (emergency fixes)
   - Can override ECO workflows

### Role Seeding

Roles are seeded via `prisma/seed.js`:

```bash
npm run prisma:seed
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user (automatically assigned 'engineering' role).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `password`: Required, min 8 characters, must contain letters and numbers

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "engineering",
      "createdAt": "2026-01-24T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400`: Validation failed
- `409`: Email already registered
- `500`: Engineering role not found (run seed script)

**cURL Example:**
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "engineering"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials (user not found OR password mismatch)

**cURL Example:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

#### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "engineering",
      "createdAt": "2026-01-24T...",
      "updatedAt": "2026-01-24T..."
    }
  }
}
```

**Errors:**
- `401`: Missing/invalid/expired token
- `404`: User not found (deleted after token issued)

**cURL Example:**
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### User Management Endpoints (Admin Only)

#### GET /api/users
List all users with optional filtering and pagination.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `role` (optional): Filter by role (engineering, approver, operations, admin)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "engineering",
        "createdAt": "2026-01-24T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Errors:**
- `401`: Not authenticated
- `403`: Not admin role

**cURL Example:**
```bash
# List all users
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by role with pagination
curl -X GET "http://localhost:5001/api/users?role=engineering&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

#### PATCH /api/users/:id/role
Update a user's role (admin only, cannot change own role).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "roleName": "approver"
}
```

**Validation:**
- `roleName`: Must be one of: engineering, approver, operations, admin
- Cannot change own role (403 error)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 5,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "approver",
      "updatedAt": "2026-01-24T..."
    }
  }
}
```

**Errors:**
- `400`: Invalid roleName or userId
- `401`: Not authenticated
- `403`: Not admin OR trying to change own role
- `404`: User or role not found

**cURL Example:**
```bash
curl -X PATCH http://localhost:5001/api/users/5/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "approver"}'
```

---

## JWT Token Structure

### Payload
```json
{
  "userId": 1,
  "role": "engineering",
  "email": "john@example.com",
  "iat": 1706091234,
  "exp": 1706696034
}
```

### Configuration
- **Secret**: Stored in `JWT_SECRET` environment variable (256-bit)
- **Expiry**: `JWT_EXPIRES_IN=7d` (configurable)
- **Algorithm**: HS256 (default)

### Token Usage
Include in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Middleware

### Authentication Middleware

#### `requireAuth`
Location: `src/middlewares/auth.middleware.js`

Validates JWT token and attaches user info to `req.user`:
```javascript
req.user = {
  id: 1,
  role: "engineering",
  email: "john@example.com"
}
```

**Usage:**
```javascript
router.get('/protected', requireAuth, handler);
```

---

#### `requireRole(...allowedRoles)`
Location: `src/middlewares/auth.middleware.js`

Checks if user's role is in allowed roles. Must be used AFTER `requireAuth`.

**Usage:**
```javascript
// Single role
router.get('/admin-only', requireAuth, requireRole('admin'), handler);

// Multiple roles
router.post('/approve', requireAuth, requireRole('admin', 'approver'), handler);
```

---

### Error Handler Middleware

Location: `src/middlewares/error.handler.js`

Centralized error handling for:
- Prisma errors (P2002, P2025, P2003)
- JWT errors (JsonWebTokenError, TokenExpiredError)
- Validation errors
- Custom application errors

**Usage:**
Add as last middleware in `index.js`:
```javascript
app.use(errorHandler);
```

---

### Validation Middleware

Location: `src/middlewares/validate.middleware.js`

Generic request validation using schemas.

**Usage:**
```javascript
const schema = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 8 }
};

router.post('/signup', validate(schema), handler);
```

**Validation Rules:**
- `required`: Field must be present and non-empty
- `type`: 'email' (validates email format)
- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `enum`: Value must be in array
- `validator`: Custom validation function

---

## File Structure

```
backend/
├── .env                          # JWT_SECRET, DATABASE_URL
├── prisma/
│   └── seed.js                   # Role seeding script
├── src/
│   ├── index.js                  # Main app entry
│   ├── config/
│   │   ├── env.js                # Environment validation
│   │   └── database.js           # Prisma singleton
│   ├── middlewares/
│   │   ├── auth.middleware.js    # requireAuth, requireRole
│   │   ├── error.handler.js      # Centralized error handling
│   │   └── validate.middleware.js # Request validation
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js  # HTTP handlers
│   │   │   ├── auth.service.js     # Business logic
│   │   │   ├── auth.routes.js      # Route definitions
│   │   │   └── auth.validation.js  # Validation schemas
│   │   └── users/
│   │       ├── users.controller.js
│   │       ├── users.service.js
│   │       ├── users.routes.js
│   │       └── users.validation.js
│   └── utils/
│       ├── response.js           # Response helpers
│       └── asyncHandler.js       # Async error wrapper
└── docs/
    └── auth-implementation.md    # This file
```

---

## Environment Variables

Required in `backend/.env`:

```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://...

# JWT Configuration
JWT_SECRET=<256-bit-random-string>
JWT_EXPIRES_IN=7d
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Schema

### User Model
```prisma
model User {
  id           Int       @id @default(autoincrement())
  name         String
  email        String    @unique
  passwordHash String
  roleId       Int
  role         Role      @relation(fields: [roleId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### Role Model
```prisma
model Role {
  id    Int    @id @default(autoincrement())
  name  String @unique  // 'engineering', 'approver', 'operations', 'admin'
  users User[]
}
```

---

## Testing the Auth Flow

### 1. Signup
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the returned `token`.

### 2. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 3. Get Current User
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Create Admin User (Manual DB Update)
To test admin endpoints, update a user's role directly in database:

```sql
-- Find the admin role ID
SELECT id FROM "Role" WHERE name = 'admin';

-- Update user to admin (assuming role id is 4)
UPDATE "User" SET "roleId" = 4 WHERE email = 'test@example.com';
```

Then login again to get new token with admin role.

### 5. List Users (Admin Only)
```bash
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 6. Update User Role (Admin Only)
```bash
curl -X PATCH http://localhost:5001/api/users/2/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleName": "approver"}'
```

---

## Future ECO Module Integration

### Example Protected Routes

```javascript
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

// Create ECO (engineering + admin only)
router.post('/ecos', 
  requireAuth, 
  requireRole('engineering', 'admin'), 
  createEcoController
);

// Edit ECO (engineering can edit own, admin can edit any)
router.patch('/ecos/:id', 
  requireAuth, 
  requireRole('engineering', 'admin'),
  checkOwnership, // Custom middleware for ownership check
  updateEcoController
);

// Approve ECO (approver + admin only)
router.post('/ecos/:id/approve', 
  requireAuth, 
  requireRole('approver', 'admin'),
  approveEcoController
);

// View active products (all authenticated users)
router.get('/products', 
  requireAuth, 
  getProductsController
);

// Edit active product (admin only - emergency)
router.patch('/products/:id', 
  requireAuth, 
  requireRole('admin'),
  updateProductController
);
```

### Ownership Check Middleware Example

```javascript
export const checkEcoOwnership = asyncHandler(async (req, res, next) => {
  const ecoId = parseInt(req.params.id);
  const userId = req.user.id;
  const userRole = req.user.role;

  // Admin can edit any ECO
  if (userRole === 'admin') {
    return next();
  }

  // Engineering can only edit their own ECOs
  if (userRole === 'engineering') {
    const eco = await prisma.eco.findUnique({
      where: { id: ecoId },
      select: { raisedById: true, status: true }
    });

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO not found'
      });
    }

    // Check ownership
    if (eco.raisedById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own ECOs'
      });
    }

    // Check status (can only edit draft or in_progress)
    if (!['draft', 'in_progress'].includes(eco.status)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit ECO in current status'
      });
    }

    return next();
  }

  // Other roles cannot edit ECOs
  return res.status(403).json({
    success: false,
    message: 'Insufficient permissions'
  });
});
```

---

## Security Best Practices

### Implemented
✅ Password hashing with bcrypt (10 rounds)  
✅ JWT token expiration (7 days)  
✅ No password in API responses  
✅ Generic error messages (no user enumeration)  
✅ Role-based access control  
✅ Self-role-change prevention for admins  
✅ Input validation on all endpoints  
✅ Centralized error handling  

### Recommended for Production
- [ ] Rate limiting on auth endpoints (express-rate-limit)
- [ ] Refresh token implementation
- [ ] Token revocation/blacklist system
- [ ] HTTPS enforcement
- [ ] CORS configuration
- [ ] Helmet.js security headers
- [ ] Request logging (Winston/Pino)
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts
- [ ] Email verification for signup
- [ ] Password reset flow
- [ ] Two-factor authentication (2FA)

---

## Troubleshooting

### "Engineering role not found" on signup
Run the seed script:
```bash
npm run prisma:seed
```

### "Invalid token" errors
- Check token format: `Bearer <token>`
- Verify JWT_SECRET matches between token creation and verification
- Check token expiration (default 7 days)

### "Insufficient permissions" errors
- Verify user role with `/api/auth/me`
- Check if correct middleware is applied: `requireAuth, requireRole(...)`
- Ensure role names match exactly: 'engineering', 'approver', 'operations', 'admin'

### Database connection errors
- Verify DATABASE_URL in .env
- Check Prisma Client is generated: `npm run prisma:generate`
- Test connection: `curl http://localhost:5001/health`

---

## Summary

This authentication system provides:
- Secure user signup with automatic 'engineering' role assignment
- JWT-based authentication with configurable expiry
- Four-role RBAC system (engineering, approver, operations, admin)
- Admin user management (list users, update roles)
- Extensible middleware for protecting future ECO/product endpoints
- Comprehensive error handling and validation
- Production-ready structure for future enhancements

All endpoints follow RESTful conventions and return consistent JSON responses with `{ success, data/message }` structure.
