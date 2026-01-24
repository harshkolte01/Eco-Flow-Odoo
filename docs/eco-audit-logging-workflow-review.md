# ECO Workflow Audit Logging Review

## Summary
- Added audit logging for ECO creation, draft updates, and ECO header updates.
- Filtered update audit entries to only changed fields for cleaner history.
- Logged ECO starts with the acting user to improve traceability.
- Preserved approval/apply logging and error rollback behavior.

## Files Touched
- `backend/src/modules/ecos/ecos.controller.js`
- `backend/src/modules/ecos/ecos.service.js`
