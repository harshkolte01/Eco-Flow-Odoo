# Frontend ECO Save Duplicate Prevent

## Summary
- Prevented auto-create from racing with manual Save/Start to avoid duplicate draft ECOs.
- Shared the in-flight auto-create promise with Save/Start so they reuse the same draft id.
- Added guards to stop overlapping manual create actions.

## Files Touched
- `frontend/components/EcoCreateModal.tsx`
