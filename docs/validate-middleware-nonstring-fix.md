# Validate Middleware Non-String Fix

## Summary
- Updated validation to treat strings and non-strings safely without calling `.trim()` on numbers/booleans.
- Preserved string behavior for required checks and email validation.
- Added inline sanity-check comments to document expected behavior.

## Files Touched
- `backend/src/middlewares/validate.middleware.js`
