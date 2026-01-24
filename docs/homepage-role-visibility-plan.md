# Homepage Role Visibility Plan

## Requirements Recap
- Engineering: see only their own ECOs.
- Approver: see all ECOs.
- Admin: see all products.
- All roles: see active + archived products.
- Operations: only products on the homepage (no ECO list).

## Plan
1. Enforce ECO visibility on the backend: force `scope=mine` for engineering users; allow `scope=all` for approver/admin; block or ignore ECO listing for operations.
2. Extend `/api/products` to accept `status=active|archived|all` and return combined lists; gate `status=all` to admins.
3. Update the homepage to request ECOs based on role and to skip ECOs for operations; fetch products based on role (admin uses `all`, others use `active,archived`).
4. Add `archived` product badges/labels in the overview UI to distinguish inactive versions.

## Open Questions
- Should admins also see all ECOs by default, or only when explicitly filtered?
