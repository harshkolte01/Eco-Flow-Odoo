# Eco Approver Assignments Prisma Relation Fix

**Date**: January 25, 2026  
**Context**: Prisma migration failed due to missing back-relations for `EcoApproverAssignment`.

## Fix Applied
- Added relation arrays on `Eco`, `EcoStage`, and `User` to satisfy Prisma relation requirements.

## Files Updated
- `backend/prisma/schema.prisma`
  - `EcoStage`: added `approverAssignments` relation
  - `Eco`: added `approverAssignments` relation
  - `User`: added `ecoApproverAssignments` relation

## Next Step
- Re-run `npx prisma migrate dev` to generate the migration after schema validation passes.
