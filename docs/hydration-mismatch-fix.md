# Hydration Mismatch Fix

## Summary
- Added `suppressHydrationWarning` on the root `<body>` to ignore transient DOM attribute differences during hydration (often caused by browser extensions).

## Files Touched
- `frontend/app/layout.tsx`
