# ECO Start Transaction Batch Fix

## Summary
- Replaced the interactive transaction in ECO start with a batch transaction to avoid Prisma transaction invalidation.
- Kept the draft creation, audit log, and ECO stage update atomic in a single transaction.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
