# Role Permission Fixes

## Summary
- Restricted ECO creation/editing controls in the UI to engineering/admin users.
- Prevented non-admin users from accessing the settings UI and stage management endpoints.

## Files Touched
- `frontend/app/page.tsx`
- `frontend/components/EcoCreateModal.tsx`
- `frontend/app/settings/page.tsx`
- `backend/src/modules/stages/stages.routes.js`
