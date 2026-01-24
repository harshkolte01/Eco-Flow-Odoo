# ECO Stage Seeding

## Summary
- Added idempotent ECO stage seeding using `prisma.ecoStage.upsert`.
- Ensures stages: New (1), Approval (2), Done (3) with correct approval flags.
- Preserved existing roles/products/BoM seed logic unchanged.

## Files Touched
- `backend/prisma/seed.js`
