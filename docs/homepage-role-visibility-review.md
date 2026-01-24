# Homepage Role Visibility Review

## Context
- Reviewed the home page overview behavior for ECOs and products.
- Focused on role-based visibility expectations for engineering, approver, operations, and admin roles.

## Findings
- `frontend/app/page.tsx` always requests `/api/ecos?scope=all`, so every role sees every ECO.
- `backend/src/modules/ecos/ecos.service.js` honors `scope=mine` but does not enforce it by role.
- Product overview items are built from `/api/products?status=active`, which only returns active versions.
- `backend/src/modules/products/products.controller.js` rejects any status besides `active`, so archived products never appear.
- `frontend/components/EcoListPanel.tsx` supports ECO statuses + `active` but has no `archived` state for product items.

## Proposed Plan (high level)
- Add role-aware scoping on `/api/ecos` so engineering users only see their own ECOs (server-enforced).
- Extend `/api/products` to support `status=active|archived|all` with admin-only access for `all`.
- Update the home page to request product statuses based on role and to render archived status badges.
- Confirm whether approvers/operations should see all ECOs, or only their own, before implementing.
