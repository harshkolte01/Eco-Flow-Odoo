# Authentication Quick Reference Guide

## File Locations

### Core Auth Module
- `/backend/src/modules/auth/auth.controller.js` - HTTP handlers (signup, login, me)
- `/backend/src/modules/auth/auth.service.js` - Business logic & JWT generation
- `/backend/src/modules/auth/auth.routes.js` - Route definitions
- `/backend/src/modules/auth/auth.validation.js` - Input validation schemas

### User Management
- `/backend/src/modules/users/users.controller.js` - User endpoints
- `/backend/src/modules/users/users.service.js` - User business logic
- `/backend/src/modules/users/users.routes.js` - User routes
- `/backend/src/modules/users/users.validation.js` - User validation

### Middleware
- `/backend/src/middlewares/auth.middleware.js` - JWT verification & role-based access
- `/backend/src/middlewares/validate.middleware.js` - Request validation
- `/backend/src/middlewares/error.handler.js` - Error handling

### Configuration
- `/backend/src/config/env.js` - Environment configuration
- `/backend/src/config/database.js` - Prisma client singleton

### Database
- `/backend/prisma/schema.prisma` - Prisma schema (User & Role models)

---

## Key Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| jsonwebtoken | JWT token creation & verification | ^9.0.3 |
| bcryptjs | Password hashing | ^3.0.3 |
| @prisma/client | Database ORM | ^5.22.0 |
| express | Web framework | ^4.18.2 |
| cors | CORS middleware | ^2.8.6 |

---

## Authentication Endpoints

### Public Endpoints

```
POST /api/auth/signup
Body: { loginId, name, email, password }
Response: 201 { user, token }

POST /api/auth/login
Body: { loginId, password }
Response: 200 { user, token }
```

### Protected Endpoints (Require Bearer Token)

```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: 200 { user }

GET /api/users (admin only)
Response: 200 { users, pagination }

GET /api/users/lookup (engineering/approver/admin)
Response: 200 { users }

PATCH /api/users/:id/role (admin only)
Body: { roleName }
Response: 200 { user }
```

---

## Quick Implementation Facts

### Password Handling
- **Hashing**: bcryptjs with 10 salt rounds
- **Storage**: `User.passwordHash` in database
- **Validation**: Min 8 chars, must have letter + number
- **Comparison**: bcrypt.compare() during login

### JWT Configuration
- **Algorithm**: HS256 (HMAC-SHA256)
- **Secret**: From JWT_SECRET env variable
- **Expiry**: 7 days (configurable via JWT_EXPIRES_IN)
- **Payload**: `{ userId, role, email }`

### Database
- **User Fields**: id, loginId, name, email, passwordHash, roleId, createdAt, updatedAt
- **Unique Constraints**: loginId, email
- **Foreign Key**: roleId → Role.id
- **Available Roles**: engineering, approver, operations, admin

### Login ID Rules
- Length: 6-12 characters
- Characters: a-z, A-Z, 0-9, underscore (_), hyphen (-)
- Case-sensitive
- Must be unique

---

## Currently NOT Implemented

- Password reset/forgot password flow
- Change password endpoint
- Email verification
- Token refresh mechanism
- Rate limiting / brute force protection
- Account lockout after failed attempts
- Password expiration policy
- Two-factor authentication
- Logout endpoint (frontend only)

---

## Security Status

### Implemented
✅ Password hashing (bcryptjs)  
✅ JWT token signing  
✅ CORS protection  
✅ SQL injection prevention (Prisma ORM)  
✅ Role-based access control  
✅ Generic error messages  

### Missing
⚠️ Rate limiting  
⚠️ Password reset flow  
⚠️ Email verification  
⚠️ Account lockout  
⚠️ Password expiration  
⚠️ 2FA  

---

## Environment Variables Required

```
DATABASE_URL=postgresql://...
JWT_SECRET=min-32-characters-recommended
PORT=5001 (optional, default)
NODE_ENV=development (optional, default)
JWT_EXPIRES_IN=7d (optional, default)
FRONTEND_URL=http://localhost:3000 (optional, default)
```

---

## Common Use Cases

### Prevent Self-Role Change
Location: `users.service.js` line 86  
Check: `if (userId === currentUserId) throw error`

### Attach User to Request
Location: `auth.middleware.js` requireAuth  
Sets: `req.user = { id, role, email }`

### Validate User Input
Location: `validate.middleware.js`  
Schema-based validation with custom validators

### Format User Response
Location: `auth.service.js` formatUserResponse()  
Excludes: passwordHash, rawPassword, etc.

---

## Testing Quick Commands

```bash
# Signup
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"loginId":"john_doe","name":"John Doe","email":"john@example.com","password":"MyPass123"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginId":"john_doe","password":"MyPass123"}'

# Get Current User (replace TOKEN with actual JWT)
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Get Users (admin only, replace TOKEN with admin JWT)
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer TOKEN"
```

---

## Related Documentation

- `AUTHENTICATION_AUDIT_AND_FINDINGS.md` - Comprehensive audit report
- `docs/login-id-auth-implementation.md` - LoginId feature details
- `docs/frontend-auth-integration.md` - Frontend integration guide

