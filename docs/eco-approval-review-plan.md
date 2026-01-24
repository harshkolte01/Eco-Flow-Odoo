# ECO Approval Review + Plan

## Review Findings
- Approval review UI is not reachable for in-progress ECOs because list rows are only clickable for draft items.
- `approvalRequired` is missing from list payloads, so pending approvals never populate.
- Diff view exists (`EcoChangesView`) but is not wired into the approval flow and expects a different response shape than the API returns.
- Draft change GET endpoints require `draft` status, so approvers cannot read diffs once an ECO is in progress.
- Validate action is not role-restricted; backend allows any role to validate.
- Final-stage apply logic is keyed to stage name `Done` and runs outside the stage transition transaction.
- Apply audit log records `raisedById` instead of the approver who applied.

## Plan
1) Backend: allow read-only access to ECO changes for in-progress/approved ECOs, add `approvalRequired` to list select, and align diff response shape.
2) Backend: restrict validate to approver/admin, remove hard-coded stage name for apply, and pass `performedById` into apply audit logging.
3) Frontend: add a review entry point for in-progress ECOs (pending approvals list + detail modal).
4) Frontend: integrate a diff view for approvals with add/remove/unchanged coloring for BoM and side-by-side values for product changes.
5) Enforcement: validate ECO creation/start only against active product/bom versions and reject archived/non-active selections.
6) QA: verify start → approval → apply flow and audit logs for both product and BoM ECOs.

## Files Likely Touched
- `backend/src/modules/ecos/ecos.service.js`
- `backend/src/modules/ecos/ecos.controller.js`
- `backend/src/modules/ecos/ecos.routes.js`
- `frontend/components/EcoCreateModal.tsx`
- `frontend/components/EcoListPanel.tsx`
- `frontend/components/EcoChangesView.tsx`
- `frontend/app/page.tsx`
