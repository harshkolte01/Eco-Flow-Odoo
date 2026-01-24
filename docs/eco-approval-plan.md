# ECO Approval Plan

## Summary
- Captures the next implementation plan for ECO approvals, apply logic, and enforcement.

## Plan
1) Add approval/validation endpoints and stage transitions (approvalRequired-aware).
2) Apply ECOs to master data on final stage (new versions when versionUpdate=true, otherwise update current version).
3) Enforce active-only product/BoM selection server-side and keep archived read-only visibility.
4) Add audit logging for ECO lifecycle and version activation changes.
