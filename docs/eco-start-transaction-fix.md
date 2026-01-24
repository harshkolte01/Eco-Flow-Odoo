# ECO Start Transaction Fix

## Summary
- Reworked ECO start draft creation to use a single Prisma transaction array instead of interactive transactions.
- Created ECO product/BOM draft records with nested createMany to avoid transaction lifetime issues.
- Preserved draft existence checks and BOM-to-product validation.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
