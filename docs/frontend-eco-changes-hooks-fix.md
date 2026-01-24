# Frontend ECO Changes Hooks Fix

## Summary
- Removed conditional hook usage in `EcoChangesView` by replacing `useMemo` with pure helper functions.
- Prevented hook order changes when rendering product vs BoM diff views.

## Files Touched
- `frontend/components/EcoChangesView.tsx`
