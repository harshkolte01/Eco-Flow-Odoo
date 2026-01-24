# ECO Approval Workflow Implementation

This document summarizes the changes made to implement the ECO approval workflow, specifically focusing on the Approver role and the transition of changes to master data.

## Key Changes

### Backend
- **ECO Service (`backend/src/modules/ecos/ecos.service.js`)**:
    - Implemented `approveEco`, `rejectEco`, and `validateEco` logic.
    - Implemented `applyEcoChanges` to transform approved ECOs into new `ProductVersion` or `BomVersion`.
    - Integrated `AuditLog` for all workflow transitions.
    - Integrated `VersionActivationLog` for tracking version changes during application.
    - Enhanced `getEcoBomDraft` to return base version data for visual diffing.
- **ECO Controller (`backend/src/modules/ecos/ecos.controller.js`)**:
    - Added controllers for approval-related actions.
- **ECO Routes (`backend/src/modules/ecos/ecos.routes.js`)**:
    - Defined new endpoints: `POST /api/ecos/:id/approve`, `POST /api/ecos/:id/reject`, and `POST /api/ecos/:id/validate`.

### Frontend
- **EcoChangesView (`frontend/components/EcoChangesView.tsx`)**:
    - New component for visual side-by-side diffing of Product and BoM changes.
    - Uses color coding (Green for additions/increases, Red for reductions/removals).
- **Dashboard (`frontend/app/page.tsx`)**:
    - Added a "Pending Approvals" section for `approver` and `admin` roles to highlight ECOs awaiting action.
- **EcoCreateModal (`frontend/components/EcoCreateModal.tsx`)**:
    - Updated to include workflow action buttons (Approve, Reject, Validate).
    - Integrated `EcoChangesView` for reviewing proposed changes once an ECO is started.
    - Enhanced to show ECO details and stage information.

## Workflow Summary
1. **New**: Engineering creates and saves ECO draft.
2. **In Progress**: Engineering clicks "Start". ECO moves to the "Approval" stage.
3. **Approval**: Approver/Admin reviews changes in `EcoChangesView` and clicks "Approve" or "Reject".
4. **Done**: If approved, ECO moves to "Done" stage, and changes are automatically applied to Master Data.
5. **Applied**: ECO status becomes `applied`, and new versions of Products/BoMs are activated while old versions are archived.

## Data Consistency
- All changes are tracked via `AuditLog`.
- Version transitions are logged in `VersionActivationLog`.
- `versionUpdate` flag on ECO determines whether to create a new version number or update the existing one.
