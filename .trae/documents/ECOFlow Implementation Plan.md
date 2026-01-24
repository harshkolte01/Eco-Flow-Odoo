## Current Codebase Review (What’s Already There)
- **Stack**: Next.js (App Router) frontend + Express/Prisma/Postgres backend.
- **Auth/RBAC**: JWT auth middleware exists; roles include `engineering | approver | operations | admin` (seeded).
- **ECO basics**: Draft ECO creation/update + start-to-workflow + stage records exist (`EcoStage`, `Eco`, `EcoApproval`, draft tables for product/BOM changes).
- **Dashboard**: Home page is currently the only “app” page; it loads ECOs + products and shows a “Pending Approvals” section.

## Key Gaps vs Your Spec / Mockup
### 1) Approver review is not production-ready
- The frontend has Approve/Validate/Reject actions and a diff view component.
- The backend **draft diff endpoints enforce `draft` status** (`ensureEcoDraft`), so once an ECO is started (`in_progress`), approvers cannot reliably fetch the diff payload needed for review.
- Approvals are **not assignment-based**: any user with role `approver` can approve any ECO, and there’s no “approval rules” configuration.

### 2) Missing “Master Menu / Navigation” structure
- Mockup expects a left sidebar: Products, BoMs, ECOs, Reports, Settings (Stages + Approval Rules).
- Frontend currently only has `/` plus auth pages; no module pages exist.

### 3) Missing configurable stages + approval rules UI
- Stages exist in DB, but there’s no admin UI/API to configure stages and approval rules.

### 4) Lifecycle enforcement & workflow completeness
- Effective Date behavior (apply now vs schedule) is not clearly enforced.
- Operations role should only see active data; some gating exists, but end-to-end “only active versions usable downstream” needs to be enforced in APIs and UI.

---

## Implementation Plan (Production-Ready, Incremental but Complete)

## A) Stabilize the Approval Workflow Contract (Backend)
1. **Normalize ECO workflow endpoints**
   - Ensure these endpoints exist and are consistent: start, review, approve, validate, reject.
   - Enforce RBAC properly:
     - Engineering/Admin: create/update drafts, edit draft payloads.
     - Approver/Admin: review + approve/reject; optionally validate non-approval stages.
     - Operations: read-only active product/BOM views only.
2. **Add a dedicated “review payload” API**
   - New endpoint: `GET /api/ecos/:id/review` (Approver/Admin)
   - Returns: ECO metadata + base-vs-draft diff (Product and BoM) while ECO is `in_progress`.
   - This avoids relying on draft endpoints that are currently draft-only.
3. **Make stage transitions rule-driven**
   - Introduce Approval Rules (see section C) and enforce them in `approveEco`:
     - Approver can only approve if they are eligible for that stage.
     - Support N-of-M approvals (e.g., 1-of-2, 2-of-3) as a configurable rule.
4. **Fix audit completeness**
   - Ensure AuditLog entries exist for: create, draft updates, start, approvals, rejects, stage changes, apply.

## B) Add Permission-Based Home Page UI (Approver Dashboard)
1. **Role-aware dashboard sections**
   - Engineering: “My Drafts”, “In Progress (Mine)”, quick create ECO.
   - Approver: “My Approval Queue”, “Recently Approved/Rejected”, stage-based filters.
   - Operations: “Active Products Overview” only.
   - Admin: sees global plus configuration shortcuts.
2. **Approver queue correctness**
   - Only show ECOs where:
     - status is `in_progress`,
     - current stage requires approval,
     - and the current user is an eligible approver per rules.
3. **Review UX from homepage**
   - Clicking a queued ECO opens a review experience (modal or dedicated page) that:
     - shows diff payload,
     - shows stage + required approvals progress,
     - has Approve/Reject actions.

## C) Implement “Approval Rules” and “Settings” (Backend + UI)
1. **Data model (Prisma) additions**
   - Add `ApprovalRule` (per stage, optionally per ecoType) with:
     - requiredApprovals (N)
     - selection mode: by role or explicit users
   - Add join table `ApprovalRuleApprover` if using explicit users.
2. **Admin APIs**
   - CRUD for:
     - ECO Stages (name, sequence, approvalRequired)
     - Approval Rules (stageId, ecoType?, requiredApprovals, approvers)
3. **Admin UI pages**
   - `/settings/stages`
   - `/settings/approval-rules`
   - Include safe validations (cannot break ordering if ECOs exist; prevent deleting stages in use).

## D) Finish Remaining Workflows in Your Spec
1. **Versioning & apply behavior**
   - Keep current `versionUpdate` behavior but ensure:
     - when `versionUpdate=true`: create new version, archive old.
     - when `false`: update same version carefully (and log).
2. **Effective Date**
   - If effective date is in the future, mark ECO as approved but “pending effective”, and apply when due (minimal cron/worker approach or a simple on-demand apply endpoint for hackathon).
3. **Lifecycle enforcement**
   - Operations APIs must only return active product versions + active BOM versions.
   - Prevent archived products/versions from being selectable in new ECO/BOM drafts.
4. **Reports module**
   - Add `/reports/ecos` (list + filters) and drill-in comparison view.
   - Add product/BOM history reports (using `VersionActivationLog` + `AuditLog`).

## E) Navigation / Layout to Match Mockup
1. Implement a left sidebar layout with:
   - Products
   - BoMs
   - ECOs
   - Reports
   - Settings (Admin only)
2. Convert current homepage into “Dashboard” content area under this layout.

## Verification Plan (What I’ll Run/Check After Implementation)
- Manual RBAC matrix checks (engineering/approver/operations/admin).
- Approver queue shows only eligible approvals; approve requires assignment.
- ECO diff review works in `in_progress`.
- Stage transitions respect N-of-M rules.
- Apply action creates/archives versions + logs Audit and Activation logs.

## Proposed Build Order (Minimize Risk)
1) Backend review endpoint + approval rule enforcement
2) Approver dashboard UI on `/`
3) Sidebar + route structure
4) Settings (stages + approval rules)
5) Reports + effective-date scheduling

If you confirm this plan, I’ll start with A+B first (because they unblock the approver homepage and make approvals real), then proceed through C–E.