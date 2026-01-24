# ECO Create Workflow Duplicate Start Fix

## Summary
- Prevented auto-create from firing when editing an existing draft ECO to avoid unintended duplicate drafts.
- Ensured draft loading, save, and start actions reuse the existing ECO id when reopening a draft.
- Synced ECO id after patch operations to keep modal state consistent during edit flows.

## Files Touched
- `frontend/components/EcoCreateModal.tsx`
