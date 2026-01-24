# ECO Start Transaction Timeout Fix

## Summary
- Increased the interactive transaction timeout for starting ECOs to avoid premature rollback.
- Kept the ECO start flow atomic while allowing heavier draft initialization to complete.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
