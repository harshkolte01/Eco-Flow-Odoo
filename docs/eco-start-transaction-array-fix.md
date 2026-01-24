# ECO Start Transaction Array Fix

## Summary
- Removed non-Prisma promises from the $transaction array by performing checks before building Prisma create operations.
- Ensured BOM draft creation uses createMany only when component/operation lists are non-empty.
- Kept ECO status update atomic with draft creation via array transaction.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
