# ECO Start Draft Copy

## Summary
- Added ECO start logic to copy the active ProductVersion or BomVersion into ECO draft tables.
- Kept master Product/BOM data unchanged while moving ECO status to in_progress.
- Added validation that BoM belongs to the selected product before copying.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
