# ECO Draft Changes UI + API

## Summary
- Added product and BoM draft change endpoints under `/api/ecos/:id/draft/*` to store ECO edits separately from master data.
- Wired the ECO create modal to load and save draft changes based on ECO type.
- Added draft change fields for product pricing/name/attachments and BoM component/operation edits.

## Files Touched
- `backend/src/modules/ecos/ecos.routes.js`
- `backend/src/modules/ecos/ecos.controller.js`
- `backend/src/modules/ecos/ecos.service.js`
- `frontend/components/EcoCreateModal.tsx`
