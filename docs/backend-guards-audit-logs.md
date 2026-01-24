# Backend Lifecycle Guards and Granular Audit Logging

Implemented robust guards and enhanced audit logging to ensure data integrity and traceability in the ECOFlow system.

## 1. Lifecycle Guards
Added `updateProductVersion` and `updateBomVersion` in their respective services with strict checks:
- **Restriction:** Direct updates to records with `active` or `archived` status are prohibited.
- **Enforcement:** Any attempt to update non-draft versions results in a `403 Forbidden` error.
- **Purpose:** Ensures that master data changes only occur through the controlled Engineering Change Order (ECO) process.

## 2. Granular Audit Logging
Enhanced `updateEcoProductDraft` in `ecos.service.js` to provide detailed change tracking:
- **Field-Level Diffing:** The system now compares `oldValue` vs `newValue` for each field.
- **Detailed Logs:** `AuditLog` entries now store the specific fields that changed (e.g., `newProductName`, `newSalePrice`) instead of just a generic "updated" action.
- **Traceability:** Provides a clear history of what was proposed during the ECO drafting phase.

## 3. ECO Start Validation
Updated `startEco` to prevent unnecessary processing:
- **Change Detection:** Added logic to compare the ECO draft against the base version.
- **Validation:** If no changes are detected in Product details (Name, Price, Attachments) or BoM (Components, Operations), the ECO cannot be moved to "In Progress".

## 4. Technical Details
- Modified `backend/src/modules/products/products.service.js`
- Modified `backend/src/modules/boms/boms.service.js`
- Modified `backend/src/modules/ecos/ecos.service.js`

These changes strengthen the "Source of Truth" principle by making the active master data immutable to direct API calls.
