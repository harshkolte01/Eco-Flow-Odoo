# ECO Approval Rules Draft Evaluation & Assignment Fixes

**Date**: January 25, 2026  
**Purpose**: Align approval rules with ECO draft data, stabilize dynamic approver assignments, and tighten admin configuration integrity.

## Summary
- Approval rule evaluation now uses ECO draft data (productChange/bomDraft) with OR/AND logic support.
- Dynamic rule approvers are persisted per ECO stage to avoid mid-stage rule drift.
- Admin rule/stage configuration is validated to prevent unsupported fields and non-approval stages.
- UI updates align with supported fields and restrict approver selection to approver/admin roles.

## Backend Changes
- **Rule evaluation context**: New draft-based context for `eco`, `product`, `bom`, and `changes` fields; OR/AND logic supported.  
  - File: `backend/src/modules/approval-rules/rule-evaluation.service.js`
- **Validation + normalization**: Approval rule conditions normalized to string values; stageIds validated to approval-required stages; approvers validated as approver/admin.  
  - File: `backend/src/modules/approval-rules/approval-rules.service.js`
- **Supported fields**: Centralized allowed field list and operators.  
  - File: `backend/src/modules/approval-rules/rule-fields.js`
- **Dynamic approver persistence**: New `EcoApproverAssignment` model with snapshot assignments per ECO stage.  
  - File: `backend/prisma/schema.prisma`
- **Rule integration**: Assignments created once per stage; approval checks use persisted assignments when available.  
  - File: `backend/src/modules/approval-rules/rule-integration.helper.js`
- **Stage integrity**: Stage deletion blocked when referenced by approval rules.  
  - File: `backend/src/modules/stages/stages.service.js`
- **Approver role enforcement**: Stage approver assignment enforces approver/admin role.  
  - File: `backend/src/modules/stages/approvers.service.js`
- **User lookup**: Role included in lookup payload for UI filtering.  
  - File: `backend/src/modules/users/users.service.js`
- **Approval de-dupe**: Avoid duplicate approvals per user/stage, update pending -> approved.  
  - File: `backend/src/modules/ecos/ecos.service.js`

## Frontend Changes
- **Condition fields updated**: UI fields now match supported backend fields; unsupported field fallback shown.  
  - File: `frontend/components/approval-rules/ConditionBuilder.tsx`
- **Approval rule stages**: Only approval-required stages shown for selection.  
  - File: `frontend/components/approval-rules/RuleForm.tsx`
- **Approver filtering**: Rule/stage approver selection only shows approver/admin users (fallback if role missing).  
  - Files: `frontend/components/approval-rules/ApproverSelector.tsx`, `frontend/app/settings/eco-stages/[id]/page.tsx`
- **Condition normalization**: API client coerces arrays/booleans to strings for backend compatibility.  
  - File: `frontend/lib/api/approvalRulesClient.ts`
- **RuleCondition type**: Field value supports booleans for UI state.  
  - File: `frontend/lib/types/approvalRules.ts`

## Notes / Follow-ups
- Run Prisma migration for the new `EcoApproverAssignment` model.
- Verify rule behavior using draft-only fields: `product.*`, `bom.*`, and `changes.*`.
- Ensure rule evaluation logs match current stage approvals.
