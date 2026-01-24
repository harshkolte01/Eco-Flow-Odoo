# Homepage Role Visibility Implementation

## Summary
- Enforced role-aware ECO scoping on the backend (engineering sees only their ECOs; operations get none).
- Extended products API to return active/archived lists with admin-only `status=all` support.
- Updated the home page to request ECOs/products by role and to display archived product badges.

## Files Touched
- `backend/src/modules/ecos/ecos.service.js`
- `backend/src/modules/products/products.controller.js`
- `backend/src/modules/products/products.service.js`
- `backend/src/modules/products/products.validation.js`
- `frontend/app/page.tsx`
- `frontend/components/EcoListPanel.tsx`
