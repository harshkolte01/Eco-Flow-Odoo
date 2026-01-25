# Password Reset & Change Implementation Plan

**Date:** January 25, 2026  
**Status:** Ready for Implementation  
**Objective:** Implement secure password management without affecting existing data

---

## 📋 Executive Summary

Add two complementary features to the authentication system:

1. **Change Password** - Authenticated users change their password (requires old password verification)
2. **Forgot Password/Reset** - Public self-service password reset via email token verification

Both features integrate seamlessly with the existing authentication system with **zero breaking changes** to existing data.

---

## 🔍 Current System Analysis

### Backend Architecture
- **Framework:** Express.js on Node.js
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT-based (7-day expiry, HS256)
- **Password:** bcryptjs hashing (10 salt rounds)
- **Structure:** Modular (auth, users modules)

### Current State
✅ Existing auth endpoints:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me

❌ Missing endpoints:
- POST /api/auth/change-password
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### User Model (Current)
```prisma
model User {
  id           Int       @id @default(autoincrement())
  loginId      String    @unique
  email        String    @unique
  passwordHash String    // 60-char bcrypt hash
  roleId       Int
  // ... other fields
}
```

**Finding:** passwordHash field exists, is properly used, and ready for updates.

### Frontend State
- ✅ Login page: Fully functional with proper validation
- ❌ Forgot-password page: Exists but is placeholder (says "coming soon")
- ❌ Change-password page: Doesn't exist

---

## 🎯 Implementation Strategy

### **Two Workflows**

#### **Workflow 1: Change Password (Authenticated Users)**
```
User logged in → Click "Change Password" 
  → Enter old password + new password (2x) 
  → Verify old password matches current
  → Hash new password
  → Update database
  → Success! (auto-logout or stay logged in)
```

**Access Control:** Requires valid JWT token  
**Validation:** Old password must be correct  
**Constraint:** Cannot reuse same password

#### **Workflow 2: Forgot Password (Public Users)**
```
User on login page → "Forgot Password?" 
  → Step 1: Enter email
  → Step 2: Receive reset token (via email or display)
  → Step 3: Enter token + new password (2x)
  → Verify token exists, not expired, not used
  → Hash new password
  → Mark token as used
  → Success! Redirect to login
```

**Access Control:** Public (no token required)  
**Token Security:** Hashed, 1-hour expiry, one-time use  
**Email Handling:** MVP returns token to frontend

---

## 🔧 Technical Implementation

### Phase 1: Database Changes

#### New Table: PasswordResetToken

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Token stored as bcrypt hash (not plaintext)
  token     String    @unique
  
  // Security fields
  expiresAt DateTime
  usedAt    DateTime?  // NULL = unused, SET = used once
  createdAt DateTime   @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}
```

#### Update User Model

```prisma
model User {
  // ... existing fields
  passwordResetTokens PasswordResetToken[]
  lastPasswordChangeAt DateTime?  // For auditing
}
```

**Impact:** ✅ Zero breaking changes - additive only

---

### Phase 2: Backend Implementation

#### A. Password Validation Service
**File:** `backend/src/utils/passwordValidator.js`

```javascript
// Check password strength
validatePassword(password) → { isValid, errors[] }

// Requirements:
// - Min 8 characters
// - Contains letter (a-z, A-Z)
// - Contains number (0-9)
// - Optional: Special characters encouraged
```

#### B. Token Management Service
**File:** `backend/src/utils/tokenGenerator.js`

```javascript
generateResetToken()      // 256-bit random hex
hashToken(token)          // bcrypt hash for storage
verifyToken(raw, hash)    // Compare tokens
getTokenExpiry(hours)     // Calculate expiration time
```

#### C. Auth Service Methods
**File:** `backend/src/modules/auth/auth.service.js` (extend existing)

```javascript
// Change password - requires old password verification
changePassword(userId, oldPassword, newPassword)

// Request reset - generates token, stores in DB
requestPasswordReset(email)

// Reset password - validates token, updates password
resetPassword(email, resetToken, newPassword)
```

#### D. Validation Schemas
**File:** `backend/src/modules/auth/auth.validation.js` (extend existing)

```javascript
changePasswordSchema    // Validates old/new/confirm
forgotPasswordSchema    // Validates email
resetPasswordSchema     // Validates email/token/new password
```

#### E. API Controllers & Routes
**File:** `backend/src/modules/auth/auth.controller.js` (extend existing)

```javascript
// POST /api/auth/change-password (protected)
// POST /api/auth/forgot-password (public)
// POST /api/auth/reset-password (public)
```

---

### Phase 3: Frontend Implementation

#### A. Change Password Page
**File:** `frontend/app/change-password/page.tsx` (new)

```typescript
// Protected page (requires authentication)
// 3 password inputs: old, new, confirm
// Password strength indicator
// Show/hide password toggles
// Submit → POST to /api/auth/change-password
// On success → redirect to dashboard
```

#### B. Forgot Password Page
**File:** `frontend/app/forgot-password/page.tsx` (replace existing)

```typescript
// Public page - 3-step wizard

// Step 1: Email input
// Step 2: Token input (paste from email)
// Step 3: New password (2x confirm)

// POST to /api/auth/forgot-password
// POST to /api/auth/reset-password
// On success → redirect to login with success message
```

#### C. Settings/Profile Updates
Add link to "Change Password" page in user settings/profile menu.

---

## 🔐 Security Specifications

### Password Requirements
- **Length:** Minimum 8 characters
- **Complexity:** Must contain letters AND numbers
- **Validation:** Server-side validation (don't trust client)
- **Strength Meter:** Optional UI indicator

### Token Security
- **Generation:** 256-bit secure random (crypto.randomBytes)
- **Storage:** Bcrypt hashed in database (not plaintext)
- **Expiration:** 1 hour from creation
- **One-Time Use:** Marked with usedAt timestamp
- **Invalidation:** Previous tokens cleared when new reset requested

### Error Handling
- **"User not found"** → Do NOT reveal if email exists (security best practice)
- **"Invalid token"** → Generic message for expired/invalid/used tokens
- **"Invalid credentials"** → For wrong old password
- **"Validation failed"** → Specific field errors only after verification

### Rate Limiting
- **MVP:** None (can add in Phase 2)
- **Recommended Phase 2:** Limit to 5 requests per 15 min per IP

---

## 📊 Data Safety Analysis

### Existing Data Impact
✅ **ZERO Breaking Changes**
- No modification to User table structure
- No change to passwordHash field
- No impact on JWT authentication flow
- All existing passwords remain valid
- New PasswordResetToken table is completely separate

### Migration Strategy
```sql
-- Migration only creates new table, no data changes
CREATE TABLE "PasswordResetToken" (
  id VARCHAR(255) PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "usedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id ON "PasswordResetToken"("userId");
CREATE INDEX idx_expires_at ON "PasswordResetToken"("expiresAt");

-- Optional: Add audit field (non-breaking)
ALTER TABLE "User" ADD COLUMN "lastPasswordChangeAt" TIMESTAMP DEFAULT NULL;
```

### Rollback Safety
- If needed, can delete PasswordResetToken table without affecting User data
- Existing passwords continue to work
- No schema incompatibilities

---

## 🧪 Testing Checklist

### Backend Tests

**Change Password (Authenticated)**
- ✓ Valid old password + new password → Success
- ✓ Invalid old password → Failure (401)
- ✓ Weak new password → Failure with requirements (400)
- ✓ Same old and new password → Failure (400)
- ✓ Passwords don't match → Failure (400)
- ✓ Missing JWT token → Failure (401)

**Forgot Password (Public)**
- ✓ Valid email → Success (don't reveal if email exists)
- ✓ Invalid email format → Failure (400)
- ✓ Non-existent email → Success (same message as valid)
- ✓ Multiple requests → Previous tokens invalidated

**Reset Password (Public)**
- ✓ Valid token + password → Success
- ✓ Expired token → Failure (400)
- ✓ Already used token → Failure (400)
- ✓ Invalid token → Failure (400)
- ✓ Token doesn't match email → Failure (400)
- ✓ Weak password → Failure (400)

### Frontend Tests
- ✓ Form validation on client-side
- ✓ Password visibility toggle
- ✓ Error message display
- ✓ Loading state during API calls
- ✓ Success redirects
- ✓ Links between pages

---

## 📈 Implementation Timeline

| Task | Effort | Duration |
|------|--------|----------|
| Create Prisma migration | 0.5hr | 30min |
| Backend: Services & validators | 3hr | 2-3hr |
| Backend: Controllers & routes | 2hr | 1-2hr |
| Frontend: Change password page | 2hr | 1-2hr |
| Frontend: Forgot password page | 2hr | 1-2hr |
| Integration testing | 2hr | 1-2hr |
| **Total** | **11.5hr** | **7-11hr** |

---

## 🚀 Implementation Decisions (Confirmed)

Based on your input:

1. **Email Handling:** MVP approach
   - Return token in API response to frontend
   - Frontend can display it or mock send email
   - Production: Integrate with SendGrid later

2. **Token Expiration:** 1 hour
   - Standard security practice
   - Balances convenience with security
   - Configurable via .env if needed

3. **Rate Limiting:** Skip for MVP
   - Focus on core features first
   - Add in Phase 2 after testing

4. **Admin Capabilities:** Out of scope
   - Focus on user self-service
   - Admin features in future sprint

---

## 📝 Pre-Implementation Checklist

- [ ] Review this plan with team
- [ ] Get database access for migrations
- [ ] Confirm email service approach (MVP vs production)
- [ ] Schedule implementation: Start backend, then frontend
- [ ] Plan testing environment setup
- [ ] Prepare staging deployment checklist

---

## 🔄 Post-Implementation Tasks

**Phase 2 Enhancements:**
- [ ] Add rate limiting (5 req/15min per IP)
- [ ] Integrate with email service (SendGrid)
- [ ] Add password history tracking
- [ ] Implement admin force-reset capability
- [ ] Add MFA support (optional)
- [ ] Enhanced audit logging

---

## 📚 Key Files to Modify/Create

**Backend:**
- Create: `src/utils/passwordValidator.js`
- Create: `src/utils/tokenGenerator.js`
- Modify: `src/modules/auth/auth.service.js`
- Modify: `src/modules/auth/auth.validation.js`
- Modify: `src/modules/auth/auth.controller.js`
- Modify: `src/modules/auth/auth.routes.js`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/[timestamp]_add_password_reset/`

**Frontend:**
- Create: `app/change-password/page.tsx`
- Modify: `app/forgot-password/page.tsx`
- Modify: Settings/Profile page (add link)

---

## ✅ Key Principles

1. **Zero Data Loss** - No existing records modified
2. **Backward Compatible** - All existing auth flows work unchanged
3. **Security First** - Strong hashing, token management, error handling
4. **User Friendly** - Clear validation messages and workflows
5. **Production Ready** - Proper error handling and logging

---

**Status:** ✅ Ready for Implementation  
**Next:** Proceed with Phase 1 (Database Schema) when ready
