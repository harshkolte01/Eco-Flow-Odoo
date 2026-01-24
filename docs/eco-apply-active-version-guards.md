# ECO Apply Active Version Guards

## Summary
- Enforced that apply uses an active base product/BoM version to prevent stale ECOs from applying over archived data.
- Safeguarded BoM apply paths to handle empty component/operation sets without Prisma update errors.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
