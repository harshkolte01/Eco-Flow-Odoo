# Frontend Authentication Integration

## Overview

This document describes the frontend authentication implementation that connects to the EcoFlow backend JWT authentication system.

**Date**: January 24, 2026  
**Backend API**: `http://localhost:5001`  
**Frontend**: Next.js 16 (App Router)

## Recent Changes

### CORS Configuration Added (Jan 24, 2026)
- Installed `cors` package in backend
- Configured CORS middleware in `backend/src/index.js`
- Allows frontend origin `http://localhost:3000`
- Permits `Authorization` and `Content-Type` headers
- This fix resolves the CORS preflight errors when frontend calls backend APIs

## Architecture

### Authentication Flow

1. **Login/Signup**: User submits credentials (loginId + password for login, loginId + name + email + password for signup) → API call → Store JWT token in localStorage → Navigate to dashboard
2. **App Boot**: Check localStorage for token → Call `/api/auth/me` to validate and fetch user → Set authenticated state
3. **Protected Routes**: `ProtectedRoute` component checks auth state → Redirect to `/login` if not authenticated
4. **Logout**: Clear token from localStorage and state → Navigate to `/login`

### Token Storage

- Token is stored in `localStorage` under the key `ecoflow_token`
- Token is sent as Bearer token in `Authorization` header for authenticated requests
- No cookies or credentials are used (Bearer token only)

## Files Added/Modified

### Core Infrastructure

#### `frontend/lib/api.ts`
- **Purpose**: Centralized API fetch helper
- **Features**:
  - Automatic JSON request/response handling
  - Bearer token injection from localStorage
  - Error extraction from backend responses
  - Base URL configuration from `NEXT_PUBLIC_API_URL`
- **Usage**:
  ```typescript
  import { apiFetch } from '@/lib/api';
  
  // With auth (default)
  const response = await apiFetch('/api/users');
  
  // Without auth
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { loginId, password },
    auth: false
  });
  ```

#### `frontend/context/AuthContext.tsx`
- **Purpose**: Global authentication state management
- **State**:
  - `user`: Current user object (id, loginId, name, email, role)
  - `token`: JWT token string
  - `loading`: Hydration/loading state
  - `isAuthenticated`: Boolean computed from user + token
- **Methods**:
  - `login(loginId, password)`: Authenticate user and navigate to dashboard
  - `signup(loginId, name, email, password)`: Register user and navigate to dashboard
  - `logout()`: Clear auth state and navigate to login
  - `refreshMe()`: Fetch current user from `/api/auth/me`
- **Hydration**: On app boot, checks localStorage for token and calls `refreshMe()` to validate
- **Usage**:
  ```typescript
  import { useAuth } from '@/context/AuthContext';
  
  const { user, isAuthenticated, login, logout } = useAuth();
  ```

#### `frontend/components/ProtectedRoute.tsx`
- **Purpose**: Route guard component for authenticated pages
- **Behavior**:
  - Shows loading UI during auth hydration (prevents flash)
  - Redirects to `/login` if not authenticated (after loading completes)
  - Uses `useRouter().replace()` for client-side redirects
- **Usage**:
  ```typescript
  import { ProtectedRoute } from '@/components/ProtectedRoute';
  
  export default function DashboardPage() {
    return (
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    );
  }
  ```

### Pages

#### `frontend/app/login/page.tsx`
- **Fields**: loginId, password
- **Client-side validation**:
  - Login ID length 6-12 characters
  - Login ID allowed characters (letters, numbers, underscores, hyphens)
  - Password min length 8
- **Features**:
  - Loading state during submission
  - Backend error display (inline alert)
  - Auto-redirect to `/` if already authenticated
  - Link to signup page

#### `frontend/app/signup/page.tsx`
- **Fields**: loginId, name, email, password, confirmPassword (frontend-only)
- **Client-side validation**:
  - Login ID length 6-12 characters
  - Login ID allowed characters (letters, numbers, underscores, hyphens)
  - Name length 2-100 characters
  - Email format (regex)
  - Password min length 8
  - Confirm password matches password
- **Features**:
  - Loading state during submission
  - Backend error display (inline alert, e.g., 409 email already exists)
  - Auto-redirect to `/` if already authenticated
  - Link to login page

#### `frontend/app/page.tsx` (Dashboard)
- **Protection**: Wrapped in `ProtectedRoute`
- **Display**: Login ID, user name, email, role, and user ID
- **Features**:
  - Logout button
  - Success message confirming authentication
- **Access**: Only accessible when authenticated

#### `frontend/app/layout.tsx`
- **Modified**: Wrapped `{children}` with `<AuthProvider>`
- **Purpose**: Makes auth context available to all pages

### Configuration

#### `frontend/.env.local`
- **Updated**: `NEXT_PUBLIC_API_URL=http://localhost:5001` (aligned with backend port)

## Backend API Contract

The frontend expects the following backend endpoints:

### `POST /api/auth/signup`
**Request**:
```json
{
  "loginId": "johndoe123",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
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

### `POST /api/auth/login`
**Request**:
```json
{
  "loginId": "johndoe123",
  "password": "password123"
}
```

**Response** (200):
```json
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

### `GET /api/auth/me`
**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
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

### Error Responses
All error responses include:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing Checklist

### Manual Testing Flows

1. **Signup → Dashboard**
   - Navigate to `/signup`
   - Create new user
   - Verify redirect to `/` dashboard
   - Verify role shows as `engineering`

2. **Logout → Login**
   - From dashboard, click Logout
   - Verify redirect to `/login`
   - Verify token cleared from localStorage

3. **Login with wrong password**
   - Navigate to `/login`
   - Enter valid loginId + wrong password
   - Verify inline error shows backend message
   - Verify form remains usable

4. **Token persistence**
   - Login successfully
   - Open new tab to `/`
   - Verify app calls `/api/auth/me` on boot
   - Verify dashboard shows without login prompt

5. **Auth redirect (logged in)**
   - While authenticated, navigate to `/login` or `/signup`
   - Verify redirect to `/` dashboard

6. **Protected route (logged out)**
   - Logout
   - Navigate directly to `/`
   - Verify redirect to `/login`

## CORS Configuration

**CORS has been configured in the backend** (`backend/src/index.js`) to allow:
- **Origin**: `http://localhost:3000` (configurable via `FRONTEND_URL` env var)
- **Headers**: `Authorization`, `Content-Type`
- **Methods**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- **Credentials**: Enabled

The `cors` package was installed and configured with proper options. No further CORS configuration is needed.

## Future Enhancements

- Token refresh mechanism (before expiry)
- Remember me functionality
- Password reset flow
- Email verification
- Role-based UI rendering
- Persistent "remember me" option (longer token expiry)

## Troubleshooting

### Token not persisting
- Check localStorage in browser DevTools → Application → Local Storage
- Verify key is `ecoflow_token`

### Redirect loop
- Check that `ProtectedRoute` waits for `loading` to complete before redirecting
- Verify login/signup pages check `authLoading` before redirecting

### CORS errors
- Verify backend allows `http://localhost:3000` origin
- Verify backend allows `Authorization` header

### 401 on /me endpoint
- Check token is being sent in `Authorization: Bearer <token>` header
- Verify token is valid (not expired)
- Check backend JWT secret matches

## Notes for Other Agents

- All auth state is managed in `AuthContext` - use the `useAuth()` hook
- All API calls should use `apiFetch()` from `lib/api.ts`
- Protected pages must wrap content in `<ProtectedRoute>`
- Public pages (login/signup) should redirect if already authenticated
- Token is stored in localStorage under `ecoflow_token` key
- Backend API base URL is configured via `NEXT_PUBLIC_API_URL` env var
