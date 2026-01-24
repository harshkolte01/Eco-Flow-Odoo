# ECO Approval Workflow Implementation

## Summary
- Enabled approval review access for in-progress ECOs and enforced approver/admin-only validate.
- Switched ECO start to advance to the next configured stage and made final-stage approval apply changes immediately.
- Tightened base-version resolution to active-only and recorded apply audit logs with the acting approver.
- Updated ECO review UI to open in-progress items and render diff views with add/remove/change indicators.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
- `frontend/components/EcoListPanel.tsx`
- `frontend/app/page.tsx`
- `frontend/components/EcoChangesView.tsx`
