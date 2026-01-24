# ECO Approval Apply Transaction Fix

## Summary
- Increased interactive transaction timeout for apply to avoid Prisma P2028 errors during large BoM updates.
- Added safe rollback to return ECOs to the previous in-progress stage if apply fails after final approval/validation.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
