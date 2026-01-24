# Login ID Authentication Implementation

## Overview

ECOFlow now uses Login ID based authentication where users log in with a unique Login ID (6-12 characters) instead of their email address.

**Date**: [Implementation Date]
**Status**: Implemented

## What Changed

### Breaking Changes

1. **Login endpoint now uses `loginId` instead of `email`**
   - Old: `POST /api/auth/login` with `{ email, password }`
   - New: `POST /api/auth/login` with `{ loginId, password }`
2. **Signup endpoint now requires `loginId`**
   - Old: `POST /api/auth/signup` with `{ name, email, password }`
   - New: `POST /api/auth/signup` with `{ loginId, name, email, password }`
3. **User response now includes `loginId`**
   - User object structure updated (see below)

## Database Schema Changes

**User Model** (`backend/prisma/schema.prisma`):
- Added `loginId String @unique` field
- Existing fields unchanged: `name`, `email`, `passwordHash`, etc.

**Migration Strategy**:
- Three-step migration: nullable -> backfill -> non-null + unique
- Existing users: loginId auto-generated from email prefix
- Generation rules:
  - Extract characters before @ in email
  - Remove non-alphanumeric chars (keep only a-z, A-Z, 0-9, _, -)
  - Truncate to 12 chars if too long
  - Pad to 6 chars if too short (append "_user")
- Deduplication:
  - If duplicates exist, append an id-based suffix to ensure uniqueness
  - Suffix format: `_` + hex-encoded user id
  - Base portion is truncated to keep the final length within 12 characters

## Response Format

**User Object** (unchanged structure, new field):
```
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "loginId": "johndoe123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "engineering"
    },
    "token": "jwt-token-string"
  }
}
```

Note: Response structure `{ success, data/message }` remains unchanged.

## Login ID Rules

1. Length: 6-12 characters (inclusive)
2. Allowed characters:
   - Letters: a-z, A-Z (case sensitive)
   - Numbers: 0-9
   - Special chars: underscore (_), hyphen (-)
3. Uniqueness: Must be unique across all users
4. Case sensitivity: JohnDoe and johndoe are different login IDs

Examples:
- Valid: john_doe, user123, admin-2024, JohnDoe
- Invalid: john (too short), verylonguserid123 (too long), john.doe (dot not allowed)

## API Endpoints

### POST /api/auth/signup

Register a new user.

Request:
```
{
  "loginId": "johndoe123",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Validation:
- loginId: required, 6-12 chars, a-zA-Z0-9_- only
- name: required, 2-100 chars
- email: required, valid email format
- password: required, 8+ chars, must contain letter + number

Success Response (201):
```
{
  "success": true,
  "data": {
    "user": { "id": 123, "loginId": "johndoe123", "name": "John Doe", "email": "john@example.com", "role": "engineering" },
    "token": "jwt-token"
  }
}
```

Error Responses:
- 409: "Login ID already taken"
- 409: "Email already registered"
- 400: Validation errors

### POST /api/auth/login

Authenticate user with loginId.

Request:
```
{
  "loginId": "johndoe123",
  "password": "password123"
}
```

Success Response (200):
```
{
  "success": true,
  "data": {
    "user": { "id": 123, "loginId": "johndoe123", "name": "John Doe", "email": "john@example.com", "role": "engineering" },
    "token": "jwt-token"
  }
}
```

Error Responses:
- 401: "Invalid credentials" (wrong loginId or password)

### GET /api/auth/me

Get current authenticated user (unchanged behavior, updated response).

Headers: Authorization: Bearer <token>

Success Response (200):
```
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "loginId": "johndoe123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "engineering"
    }
  }
}
```

## Frontend UI Changes

### Login Page (/login)

Fields:
1. Login Id (text input)
2. Password (password input)
3. Forgot Password? (link to /forgot-password)

Validation:
- Login ID: 6-12 chars, alphanumeric + _/-
- Password: 8+ chars

### Signup Page (/signup)

Fields (in order):
1. Login Id (text input)
2. Full Name (text input)
3. Email Id (email input)
4. Password (password input)
5. Re-Enter Password (password input, frontend-only validation)

Validation:
- Login ID: 6-12 chars, alphanumeric + _/-
- Full Name: 2-100 chars
- Email Id: valid email format
- Password: 8+ chars
- Re-Enter Password: must match Password

Note: confirmPassword is validated on frontend but NOT sent to backend.

### Dashboard (/)

User Info Display:
- Login ID
- Full name
- Email address
- Role
- User ID

### Forgot Password Page (/forgot-password)

- Placeholder/stub page
- Message: "Password reset functionality coming soon"
- Link back to login

## Implementation Files

Backend (5 files modified)
1. backend/prisma/schema.prisma - Added loginId field
2. backend/src/modules/auth/auth.validation.js - Updated validation schemas
3. backend/src/modules/auth/auth.service.js - Updated signup/login logic
4. backend/src/modules/auth/auth.controller.js - Updated request handlers
5. Migration file (manual) - Database migration with backfill

Frontend (5 files modified, 1 created)
1. frontend/context/AuthContext.tsx - Updated User type and auth functions
2. frontend/app/login/page.tsx - Updated to use loginId
3. frontend/app/signup/page.tsx - Added loginId and confirmPassword
4. frontend/app/page.tsx - Display loginId on dashboard
5. frontend/app/forgot-password/page.tsx - New stub page

Documentation (2 files)
1. docs/frontend-auth-integration.md - Updated API contracts
2. docs/login-id-auth-implementation.md - This file

## Migration Notes

### For Existing Users

Existing users were auto-assigned loginIds during migration:
- LoginId generated from email prefix (characters before @)
- Sanitized to match allowed character set
- Length adjusted to 6-12 chars
- Duplicates resolved with id-based suffixes

Example migrations:
- john.doe@example.com -> johndoe
- a@example.com -> a_user
- verylongemailprefix@example.com -> verylongema

### For Developers

Migration command:
```
cd backend
npx prisma migrate dev --name add_login_id_to_user
npx prisma generate
```

Fresh dev reset (if no production data):
```
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

## JWT Token

JWT Payload (unchanged from previous implementation):
```
{
  userId: 123,
  role: engineering,
  email: john@example.com
}
```

Note: loginId is NOT included in JWT payload to minimize token size and avoid redundancy.

## Testing Checklist

### Backend

- [ ] Signup with valid loginId succeeds
- [ ] Signup with duplicate loginId returns 409
- [ ] Signup with invalid loginId format returns 400
- [ ] Login with correct loginId + password succeeds
- [ ] Login with wrong loginId returns 401
- [ ] Login with email instead of loginId fails validation
- [ ] /me endpoint returns user with loginId field

### Frontend

- [ ] Login page shows "Login Id" field (not email)
- [ ] Login page has "Forgot Password?" link to /forgot-password
- [ ] Signup page shows fields in correct order
- [ ] Signup validates confirmPassword matches password
- [ ] Signup does not send confirmPassword to backend
- [ ] Dashboard displays loginId
- [ ] Session persists after page refresh

### End-to-End

- [ ] New user can signup with unique loginId
- [ ] User can login with their loginId
- [ ] User data includes loginId in all responses
- [ ] Existing users can login with auto-generated loginIds

## Future Enhancements

- Password reset flow via email
- Allow users to change their loginId (with uniqueness check)
- Real-time loginId availability check on signup form
- Login with email OR loginId (dual authentication)

---

Last Updated: Date
Version: 1.0
