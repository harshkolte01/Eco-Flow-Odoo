# Agent Context: Login ID Auth Update

## Summary

- Added `loginId` to the User schema and created a migration with backfill + unique index.
- Updated backend auth validation, service, and controller to accept loginId for login/signup and return it in responses.
- Updated frontend AuthContext and auth pages (login/signup/dashboard) to use loginId, plus a forgot-password stub page.
- Updated docs to reflect new API contracts and UI changes.

## Key Files

- backend/prisma/schema.prisma
- backend/prisma/migrations/20250101000005_add_login_id_to_user/migration.sql
- backend/src/modules/auth/auth.validation.js
- backend/src/modules/auth/auth.service.js
- backend/src/modules/auth/auth.controller.js
- frontend/context/AuthContext.tsx
- frontend/app/login/page.tsx
- frontend/app/signup/page.tsx
- frontend/app/page.tsx
- frontend/app/forgot-password/page.tsx
- docs/frontend-auth-integration.md
- docs/login-id-auth-implementation.md
