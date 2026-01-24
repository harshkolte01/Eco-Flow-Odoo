# Phase 2: Approval Rules Frontend Implementation Plan

**Date**: January 25, 2026  
**Status**: 🟡 **IN PROGRESS - Starting Phase 2**  
**Estimated Duration**: 1-2 weeks  
**Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS

---

## Overview

Phase 2 focuses on building a user-friendly admin dashboard for managing approval rules. The backend (Phase 1) is 100% complete and production-ready. This phase creates the UI components and pages to manage rules, conditions, approvers, and delegations.

---

## Architecture Overview

### Frontend Structure
```
frontend/
├── app/
│   └── settings/
│       ├── layout.tsx                          (EXISTING - will extend)
│       └── approval-rules/                     (NEW)
│           ├── page.tsx                        (Rule List)
│           ├── create/
│           │   └── page.tsx                    (Create Rule Form)
│           ├── [id]/
│           │   ├── page.tsx                    (View Rule Details)
│           │   └── edit/
│           │       └── page.tsx                (Edit Rule Form)
│           └── delegations/
│               └── page.tsx                    (Delegation Manager)
│
├── components/approval-rules/                  (NEW)
│   ├── RuleList.tsx                           (List table with filters)
│   ├── RuleForm.tsx                           (Create/Edit form)
│   ├── ConditionBuilder.tsx                   (Condition UI)
│   ├── ApproverSelector.tsx                   (Multi-select approvers)
│   ├── DelegationManager.tsx                  (Delegation UI)
│   ├── RuleHistory.tsx                        (Audit trail viewer)
│   └── RulePreview.tsx                        (Rule details view)
│
├── hooks/                                      (NEW)
│   └── useApprovalRules.ts                    (Custom hooks for rules)
│
├── lib/api/                                   (NEW)
│   └── approvalRulesClient.ts                 (API client)
│
└── types/                                      (NEW)
    └── approvalRules.ts                       (TypeScript types)
```

---

## Detailed Implementation Plan

### Phase 2.1: Foundation & Navigation (Day 1)

#### Task 1: Update Settings Navigation
**File**: `frontend/app/settings/layout.tsx`

Add Approval Rules link to the settings sidebar:
```typescript
<li>
  <Link
    href="/settings/approval-rules"
    className="block rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
  >
    <div className="flex items-center gap-3">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {/* Shield/Rules icon */}
      </svg>
      <span>Approval Rules</span>
    </div>
  </Link>
</li>
```

#### Task 2: Create TypeScript Types
**File**: `frontend/lib/types/approvalRules.ts`

```typescript
export enum RuleOperator {
  GT = 'GT',
  LT = 'LT',
  EQ = 'EQ',
  GTE = 'GTE',
  LTE = 'LTE',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
}

export enum RuleType {
  STAGE_RULE = 'stage_rule',
  CONDITION_RULE = 'condition_rule',
}

export interface RuleCondition {
  id?: string;
  fieldName: string;
  operator: RuleOperator;
  fieldValue: string | string[];
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleApprover {
  userId: number;
  approvalCategory: 'required' | 'optional';
  canDelegate?: boolean;
  escalationThresholdDays?: number;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description?: string;
  ruleType: RuleType;
  priority: number;
  isActive: boolean;
  stageIds: number[];
  conditions: RuleCondition[];
  approvers: RuleApprover[];
  createdAt: string;
  updatedAt: string;
}

export interface Delegation {
  id: string;
  fromUserId: number;
  toUserId: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'revoked' | 'expired';
}
```

#### Task 3: Create API Client
**File**: `frontend/lib/api/approvalRulesClient.ts`

Wrapper around fetch/axios to interact with backend:
```typescript
export const approvalRulesClient = {
  // Rules
  listRules: (filters?: any) => GET /api/approval-rules,
  getRule: (id: string) => GET /api/approval-rules/:id,
  createRule: (data: ApprovalRule) => POST /api/approval-rules,
  updateRule: (id: string, data: Partial<ApprovalRule>) => PATCH /api/approval-rules/:id,
  deleteRule: (id: string) => DELETE /api/approval-rules/:id,
  
  // Conditions
  addCondition: (ruleId: string, condition: RuleCondition) => POST ...,
  updateCondition: (ruleId: string, conditionId: string, condition: RuleCondition) => PATCH ...,
  deleteCondition: (ruleId: string, conditionId: string) => DELETE ...,
  
  // Approvers
  addApprover: (ruleId: string, approver: RuleApprover) => POST ...,
  removeApprover: (ruleId: string, userId: number) => DELETE ...,
  updateApprover: (ruleId: string, userId: number, approver: Partial<RuleApprover>) => PATCH ...,
  
  // History & Evaluation
  getRuleHistory: (id: string) => GET /api/approval-rules/:id/history,
  testRule: (ruleId: string, mockData: any) => POST /api/approval-rules/:ruleId/test,
  evaluateRulesForEco: (ecoId: number) => POST /api/approval-rules/evaluate,
  
  // Delegations
  listDelegations: (filters?: any) => GET /api/delegations,
  createDelegation: (data: Delegation) => POST /api/delegations,
  revokeDelegation: (id: string) => PATCH /api/delegations/:id/revoke,
  deleteDelegation: (id: string) => DELETE /api/delegations/:id,
};
```

#### Task 4: Create Custom Hooks
**File**: `frontend/hooks/useApprovalRules.ts`

```typescript
export function useApprovalRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRules = async (filters?: any) => {
    // Fetch and set rules
  };

  const createRule = async (data: ApprovalRule) => {
    // Create rule with validation
  };

  const updateRule = async (id: string, data: Partial<ApprovalRule>) => {
    // Update rule
  };

  const deleteRule = async (id: string) => {
    // Delete rule with confirmation
  };

  return {
    rules,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  };
}
```

---

### Phase 2.2: Core List & Filtering Components (Days 2-3)

#### Task 5: Create RuleList Component
**File**: `frontend/components/approval-rules/RuleList.tsx`

Features:
- Display rules in table format
- Filter by: name, ruleType, isActive, stageId
- Search functionality
- Pagination (10, 25, 50 items per page)
- Sort by: name, priority, createdAt
- Action buttons: View, Edit, Delete
- Bulk actions (select multiple)

Columns:
| Name | Type | Priority | Stages | Status | Created | Actions |
|------|------|----------|--------|--------|---------|---------|

#### Task 6: Create Rule List Page
**File**: `frontend/app/settings/approval-rules/page.tsx`

```typescript
export default function ApprovalRulesPage() {
  // Page layout with:
  // - Header with "Create Rule" button
  // - Filter sidebar (optional)
  // - RuleList component
  // - Empty state if no rules
}
```

#### Task 7: Create Rule Details Page
**File**: `frontend/app/settings/approval-rules/[id]/page.tsx`

Display:
- Rule metadata (name, type, priority)
- Conditions (formatted and readable)
- Approvers list
- Audit trail/history
- Action buttons (Edit, Delete, Test)

---

### Phase 2.3: Form & Input Components (Days 4-5)

#### Task 8: Create RuleForm Component
**File**: `frontend/components/approval-rules/RuleForm.tsx`

Form sections:
1. **Basic Info**
   - Name (required, max 100 chars)
   - Description (optional, max 500 chars)
   - Rule Type (stage_rule or condition_rule) - dropdown
   - Priority (1-100)
   - Active toggle

2. **Stages**
   - Multi-select dropdown for stages
   - Search/filter stages

3. **Conditions Section**
   - Add/remove conditions button
   - ConditionBuilder component for each
   - Logical operators between conditions (AND/OR)

4. **Approvers Section**
   - ApproverSelector component
   - For each approver: approval category, can delegate, escalation days

5. **Preview**
   - RulePreview component showing what rule will trigger

6. **Actions**
   - Save button (with loading state)
   - Cancel button
   - Delete button (on edit only)

#### Task 9: Create ConditionBuilder Component
**File**: `frontend/components/approval-rules/ConditionBuilder.tsx`

For each condition:
- Field name input (with autocomplete suggestions):
  - product.salePrice
  - product.weight
  - product.name
  - eco.type
  - eco.complexity
  - bom.componentCount
  - etc.

- Operator select:
  - GT (Greater Than)
  - LT (Less Than)
  - EQ (Equals)
  - GTE (Greater Than or Equal)
  - LTE (Less Than or Equal)
  - IN (In List)
  - NOT_IN (Not In List)
  - CONTAINS (String contains)
  - NOT_CONTAINS (String not contains)

- Value input (type varies by field):
  - Number field for numeric operators
  - Text field for string operators
  - Multi-select for IN/NOT_IN
  - Date picker for date fields

- Logical operator (AND/OR) - for multi-condition rules

#### Task 10: Create ApproverSelector Component
**File**: `frontend/components/approval-rules/ApproverSelector.tsx`

Multi-select component:
- Search users by name/email
- Select multiple users
- For each selected user:
  - Approval category (required/optional)
  - Can delegate toggle
  - Escalation threshold days input
- Show selected approvers list with remove buttons

---

### Phase 2.4: Advanced Components (Days 6-7)

#### Task 11: Create DelegationManager Component
**File**: `frontend/components/approval-rules/DelegationManager.tsx`

Features:
- List active delegations (table format)
- Create delegation form:
  - From User (current user - auto-filled)
  - To User (select)
  - Start Date (date picker)
  - End Date (date picker)
  - Status (active/revoked/expired)
- Revoke delegation button
- Delete delegation button
- Show expired delegations (toggle)

#### Task 12: Create RuleHistory Component
**File**: `frontend/components/approval-rules/RuleHistory.tsx`

Timeline view of all rule changes:
- Change date/time
- Changed by (user name)
- Action (created, updated, condition_added, condition_removed, approver_added, etc.)
- Details of what changed
- Filter by action type

#### Task 13: Create RulePreview Component
**File**: `frontend/components/approval-rules/RulePreview.tsx`

Display rule in human-readable format:
```
Rule: High-Value Product Changes
Type: Condition Rule
Priority: 10

Applies to stages: Design Review, Engineering Review

Conditions (All must be true - AND logic):
- Product sale price is greater than $5,000
- ECO type is not routine

Approvers:
- User1 (Required) - can delegate
- User2 (Optional) - escalate after 2 days

Last updated: Jan 25, 2026 by Admin User
Version: 2
```

---

### Phase 2.5: Pages & Navigation (Day 8)

#### Task 14: Create Rule Creation Page
**File**: `frontend/app/settings/approval-rules/create/page.tsx`

```typescript
export default function CreateRulePage() {
  // Use RuleForm component in create mode
  // On success: navigate to rule details page
  // On cancel: navigate back to rules list
}
```

#### Task 15: Create Rule Edit Page
**File**: `frontend/app/settings/approval-rules/[id]/edit/page.tsx`

```typescript
export default function EditRulePage({ params }: { params: { id: string } }) {
  // Use RuleForm component in edit mode
  // Load rule data from API
  // Pre-fill form with existing data
  // On success: navigate to rule details page
  // On cancel: navigate back to rule details
}
```

#### Task 16: Create Delegation Page
**File**: `frontend/app/settings/approval-rules/delegations/page.tsx`

```typescript
export default function DelegationsPage() {
  // DelegationManager component
  // List delegations
  // Create/revoke delegations
}
```

---

### Phase 2.6: Integration & Testing (Days 9-10)

#### Task 17: Test All API Integration
- [ ] List rules (filters, pagination, sorting)
- [ ] Create rule with conditions and approvers
- [ ] Edit rule
- [ ] Delete rule
- [ ] Get rule history
- [ ] Test rule with mock ECO data
- [ ] Create delegation
- [ ] List delegations
- [ ] Revoke delegation

#### Task 18: Test Form Validation
- [ ] Required field validation
- [ ] Field length validation
- [ ] Field type validation
- [ ] Condition builder validation
- [ ] Approver selector validation
- [ ] Error messages display

#### Task 19: Test UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states on all buttons
- [ ] Error handling and display
- [ ] Empty states (no rules, no delegations)
- [ ] Confirmation dialogs for destructive actions
- [ ] Success notifications

#### Task 20: Documentation
- [ ] Update user guide with screenshots
- [ ] Document admin UI workflows
- [ ] Add troubleshooting section
- [ ] Create video tutorial outline

---

## Component Details & Props

### RuleForm Props
```typescript
interface RuleFormProps {
  rule?: ApprovalRule;
  mode: 'create' | 'edit';
  onSave: (rule: ApprovalRule) => Promise<void>;
  onCancel: () => void;
  stageOptions: Stage[];
  userOptions: User[];
  loading?: boolean;
}
```

### RuleList Props
```typescript
interface RuleListProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => void;
}
```

### ConditionBuilder Props
```typescript
interface ConditionBuilderProps {
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
  onRemove: () => void;
  fieldOptions: FieldOption[];
}
```

### ApproverSelector Props
```typescript
interface ApproverSelectorProps {
  selectedApprovers: RuleApprover[];
  onApproversChange: (approvers: RuleApprover[]) => void;
  userOptions: User[];
}
```

---

## Styling Approach

**Framework**: Tailwind CSS v4 (existing in project)

**Design System** (matching existing UI):
- Colors: emerald (primary), gray, red (danger), blue (info)
- Spacing: Tailwind default scale
- Border radius: rounded-md, rounded-lg
- Shadows: shadow, shadow-sm, shadow-lg
- Typography: text-sm, text-base, text-lg, font-semibold

**Component Styling Examples**:
```typescript
// Button variants
<button className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
  Create Rule
</button>

// Form input
<input className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />

// Table row
<tr className="border-b border-gray-200 hover:bg-gray-50">
  {/* cells */}
</tr>

// Card
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  {/* content */}
</div>
```

---

## API Integration Pattern

All API calls will use this pattern:

```typescript
import { approvalRulesClient } from '@/lib/api/approvalRulesClient';

async function handleSaveRule(rule: ApprovalRule) {
  try {
    setLoading(true);
    const result = await approvalRulesClient.createRule(rule);
    showSuccessNotification('Rule created successfully');
    navigateTo(`/settings/approval-rules/${result.id}`);
  } catch (error) {
    showErrorNotification(error.message || 'Failed to create rule');
  } finally {
    setLoading(false);
  }
}
```

---

## Error Handling Strategy

**User-Facing Errors**:
- Show toast notifications for errors
- Display field-level validation errors
- Show modal confirmations for destructive actions
- Graceful fallbacks for API failures

**API Error Types**:
- 400: Validation errors (show field errors)
- 401: Unauthorized (redirect to login)
- 403: Forbidden (show permission error)
- 404: Not found (redirect to list)
- 500: Server error (show generic error message)

---

## Loading & Empty States

**Loading**:
- Skeleton loaders for tables and forms
- Button loading spinners
- Page-level loading overlay only for critical operations

**Empty States**:
- No rules: "No approval rules yet. Create your first rule to get started."
- No delegations: "You don't have any active delegations."
- No search results: "No rules match your filters."

---

## Accessibility Considerations

- [ ] ARIA labels on form inputs and buttons
- [ ] Keyboard navigation support
- [ ] Color contrast compliance (WCAG AA)
- [ ] Form field associations (label + input)
- [ ] Error announcements for screen readers
- [ ] Focus indicators on interactive elements

---

## Performance Optimization

- [ ] Lazy load rule details page
- [ ] Memoize RuleList to prevent unnecessary re-renders
- [ ] Debounce search input
- [ ] Paginate large lists
- [ ] Cache user options in context
- [ ] Optimize image loading

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Testing Checklist

### Unit Tests
- [ ] RuleForm validation logic
- [ ] ConditionBuilder field extraction
- [ ] ApproverSelector multi-select logic
- [ ] API client methods

### Integration Tests
- [ ] Create rule workflow
- [ ] Edit rule workflow
- [ ] Delete rule workflow
- [ ] Create delegation workflow
- [ ] View rule history

### E2E Tests
- [ ] Complete rule creation flow (form → API → redirect)
- [ ] Rule list filtering and sorting
- [ ] Delegation management flow

---

## Rollout & Deployment

**Phase 2 Completion Checklist**:
- [ ] All components built and tested
- [ ] API integration complete
- [ ] Forms validated and working
- [ ] Error handling in place
- [ ] Documentation updated
- [ ] Code review passed
- [ ] Staging deployment successful
- [ ] Ready for Phase 3 (Advanced Features)

**Deployment Steps**:
1. Merge feature branch to develop
2. Run full test suite
3. Deploy to staging environment
4. Smoke test all workflows
5. Get approval from product team
6. Merge to main and deploy to production

---

## Timeline Estimate

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 2.1 | Foundation & Navigation | 1 day | Pending |
| 2.2 | List & Filters | 2 days | Pending |
| 2.3 | Forms & Inputs | 2 days | Pending |
| 2.4 | Advanced Components | 2 days | Pending |
| 2.5 | Pages & Navigation | 1 day | Pending |
| 2.6 | Integration & Testing | 2 days | Pending |
| **TOTAL** | **Phase 2** | **~10 days** | **Pending** |

**Actual timeline will depend on**:
- Complexity of form validation
- API response time
- Design approval iterations
- Bug fixes during testing

---

## Success Criteria

✅ Phase 2 is considered complete when:
1. All rule CRUD operations work via UI
2. All condition types are supported in UI
3. Approver selection works with search
4. Delegation management is functional
5. Rule history displays audit trail
6. All forms validate inputs correctly
7. API errors are handled gracefully
8. UI is responsive on all devices
9. Documentation is complete
10. Code is reviewed and approved

---

## Next Steps (Phase 3 & 4)

### Phase 3: Advanced Features
- Analytics dashboard showing rule effectiveness
- Rule simulator with sample ECO data
- Escalation management UI
- Rule templates and bulk operations
- Email notifications for approvals

### Phase 4: Testing & Deployment
- Unit tests for all components (Jest)
- Integration tests (React Testing Library)
- E2E tests (Cypress or Playwright)
- Performance testing
- Security audit
- Production deployment

---

**Document Created**: January 25, 2026  
**Status**: 🟡 Ready to start Phase 2  
**Next Review**: Upon Phase 2 completion  

---

## Quick Start Commands

```bash
# Start frontend dev server
cd frontend
npm run dev

# Navigate to approval rules
# Go to http://localhost:3000/settings/approval-rules (when implemented)

# Check backend is running
curl http://localhost:3001/api/approval-rules

# View API documentation
# See /docs/APPROVAL_RULES_DEVELOPER_GUIDE.md
```

---

**Implementation Lead**: OpenCode  
**Backend Ready**: ✅ January 25, 2026  
**Phase 2 Start**: Ready to Begin
