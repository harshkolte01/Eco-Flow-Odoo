# Approval Rules Integration - Visual Flow Diagram

**Date**: January 25, 2026

---

## ECO Workflow with Approval Rules Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ECO LIFECYCLE                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ ECO Created  │
│  (Draft)     │
└──────┬───────┘
       │
       │ User clicks "Start ECO"
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        startEco()                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. Validate ECO                                            │  │
│  │ 2. Move to first approval stage                           │  │
│  │ 3. Update status → 'in_progress'                          │  │
│  │ 4. Create audit log                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ✅ NEW: Evaluate Approval Rules                           │  │
│  │                                                            │  │
│  │  try {                                                     │  │
│  │    await assignApproversFromRules(ecoId)                  │  │
│  │    → Fetch all active rules for current stage            │  │
│  │    → Evaluate rule conditions                            │  │
│  │    → Assign dynamic approvers                            │  │
│  │    → Log evaluation to database                          │  │
│  │  } catch (error) {                                        │  │
│  │    // Fallback to static approvers                       │  │
│  │  }                                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
       │
       │ ECO now in Stage 2 with approvers assigned
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Required Approvers                               │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  Static Approvers    │  │  Dynamic Approvers   │             │
│  │  (StageApprover)     │  │  (from Rules)        │             │
│  ├──────────────────────┤  ├──────────────────────┤             │
│  │ • QA Lead (Manual)   │  │ • CFO (Rule: $>1000) │             │
│  │ • Eng Manager (Setup)│  │ • VP (Rule: Stage 2) │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                    │
│  Total Required: 4 approvers (2 static + 2 dynamic)              │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Approvers review and approve
       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        approveEco()                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. Validate ECO in progress                                │  │
│  │ 2. Record approval in EcoApproval table                    │  │
│  │ 3. Create audit log                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ✅ NEW: Check Both Static + Dynamic Approvers             │  │
│  │                                                            │  │
│  │  const approvalCheck =                                     │  │
│  │    await canProceedWithApprovals(ecoId, stageId)          │  │
│  │                                                            │  │
│  │  → Check static approvers (existing)                      │  │
│  │  → Evaluate rules to get dynamic approvers                │  │
│  │  → Check if all required approvals received               │  │
│  │                                                            │  │
│  │  Return: { canProceed, reason, missingApprovals }         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────┐
       │ canProceed: false                   │ canProceed: true
       ▼                                     ▼
┌──────────────────┐              ┌──────────────────────────────┐
│ Stay in Current  │              │  Move to Next Stage          │
│ Stage            │              │  ┌────────────────────────┐  │
│                  │              │  │ Update currentStageId  │  │
│ Waiting for:     │              │  │ Create audit log       │  │
│ • 1 static       │              │  └────────────────────────┘  │
│ • 2 dynamic      │              │                              │
└──────────────────┘              │  ┌────────────────────────┐  │
                                  │  │ ✅ NEW: Re-evaluate    │  │
                                  │  │     Rules for New      │  │
                                  │  │     Stage              │  │
                                  │  │                        │  │
                                  │  │ if (!nextStageIsFinal) │  │
                                  │  │   assignApprovers...   │  │
                                  │  └────────────────────────┘  │
                                  └──────────────────────────────┘
                                              │
                                              ▼
                                  ┌──────────────────────────────┐
                                  │  New Stage (e.g., Stage 3)   │
                                  │  with newly assigned         │
                                  │  approvers                   │
                                  └──────────────────────────────┘

```

---

## Approval Check Logic (Hybrid System)

```
┌─────────────────────────────────────────────────────────────────────┐
│          canProceedWithApprovals(ecoId, stageId)                     │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Check Static Approvers
┌────────────────────────────────────────┐
│ await approversService                 │
│   .canProceedToNextStage(ecoId, stage) │
└──────────────┬─────────────────────────┘
               │
               ├──── canProceed: false ────► RETURN: Cannot proceed
               │                             (static approvers incomplete)
               │
               └──── canProceed: true
                     │
                     ▼
Step 2: Get Dynamic Approvers
┌────────────────────────────────────────┐
│ await evaluateAndApplyRulesForEco()    │
│   → Fetch active rules for stage       │
│   → Evaluate conditions                │
│   → Return dynamic approvers           │
└──────────────┬─────────────────────────┘
               │
               ├──── No dynamic approvers ─► RETURN: Can proceed
               │                              (static check sufficient)
               │
               └──── Has dynamic approvers
                     │
                     ▼
Step 3: Check Dynamic Approvals
┌────────────────────────────────────────┐
│ Fetch EcoApprovals for (ecoId, stage) │
│ Check if all required dynamic          │
│ approvers have approved                │
└──────────────┬─────────────────────────┘
               │
               ├──── Missing approvals ────► RETURN: Cannot proceed
               │                             (dynamic approvers incomplete)
               │
               └──── All approved
                     │
                     ▼
                ┌─────────────────┐
                │ RETURN:         │
                │ canProceed=true │
                └─────────────────┘

```

---

## Rule Evaluation Process

```
┌─────────────────────────────────────────────────────────────────────┐
│             assignApproversFromRules(ecoId)                          │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Fetch ECO Data
┌────────────────────────────────────────┐
│ ECO.findUnique({                       │
│   include: {                           │
│     product: { versions },             │
│     bom: { versions },                 │
│     currentStage                       │
│   }                                    │
│ })                                     │
└──────────────┬─────────────────────────┘
               │
               ▼
Step 2: Fetch Applicable Rules
┌────────────────────────────────────────┐
│ ApprovalRule.findMany({                │
│   where: {                             │
│     isActive: true,                    │
│     stageIds: { has: currentStageId }  │
│   },                                   │
│   orderBy: { priority: 'asc' }        │
│ })                                     │
└──────────────┬─────────────────────────┘
               │
               ▼
Step 3: Evaluate Each Rule
┌────────────────────────────────────────┐
│ for each rule:                         │
│   ┌──────────────────────────────┐    │
│   │ Evaluate Conditions          │    │
│   │ ┌──────────────────────┐     │    │
│   │ │ product.salePrice    │     │    │
│   │ │ eco.type             │     │    │
│   │ │ bom.complexity       │     │    │
│   │ └──────────────────────┘     │    │
│   │                              │    │
│   │ If ALL conditions met:       │    │
│   │   ┌────────────────────┐     │    │
│   │   │ Add approvers      │     │    │
│   │   │ Check delegations  │     │    │
│   │   │ Log evaluation     │     │    │
│   │   └────────────────────┘     │    │
│   └──────────────────────────────┘    │
└──────────────┬─────────────────────────┘
               │
               ▼
Step 4: Return Results
┌────────────────────────────────────────┐
│ {                                      │
│   approvers: [...],                    │
│   rulesEvaluated: 5,                   │
│   rulesTriggered: 2                    │
│ }                                      │
│                                        │
│ + Log to console                       │
│ + Save to RuleEvaluationLog            │
└────────────────────────────────────────┘

```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Error Handling Strategy                          │
└─────────────────────────────────────────────────────────────────────┘

Try-Catch Wrapper:
┌────────────────────────────────────────┐
│ try {                                  │
│   await ruleIntegrationHelper          │
│     .assignApproversFromRules(ecoId)   │
│                                        │
│   → Evaluate rules                     │
│   → Assign approvers                   │
│   → Log results                        │
│ }                                      │
└──────────────┬─────────────────────────┘
               │
               ├──── Success ──────► Continue with dynamic approvers
               │
               └──── Error
                     │
                     ▼
                ┌────────────────────────────────┐
                │ catch (error) {                │
                │   console.error(error)         │
                │   // Don't throw - continue    │
                │ }                              │
                └────────────┬───────────────────┘
                             │
                             ▼
                ┌────────────────────────────────┐
                │ Fallback Behavior:             │
                │                                │
                │ • ECO workflow continues       │
                │ • Static approvers still work  │
                │ • No crash or interruption     │
                │ • Error logged for debugging   │
                └────────────────────────────────┘

Result:
  ✅ ECO workflow is NEVER blocked by rule failures
  ✅ Static approver system serves as reliable fallback
  ✅ System degrades gracefully to legacy behavior

```

---

## Integration Points Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                    3 Integration Points                              │
└─────────────────────────────────────────────────────────────────────┘

1. startEco()
   Location: backend/src/modules/ecos/ecos.service.js:~850
   Purpose: Assign approvers when ECO starts
   Action: await assignApproversFromRules(ecoId)
   
2. approveEco() - Approval Check
   Location: backend/src/modules/ecos/ecos.service.js:~1522
   Purpose: Check both static + dynamic approvers
   Action: await canProceedWithApprovals(ecoId, stageId)
   
3. approveEco() + validateEco() - Stage Transition
   Location: backend/src/modules/ecos/ecos.service.js:~1565, ~1634
   Purpose: Re-evaluate rules for new stage
   Action: await assignApproversFromRules(ecoId)

```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Flow                                    │
└─────────────────────────────────────────────────────────────────────┘

Database Tables Involved:

Input:
┌──────────────────┐
│ ApprovalRule     │ ──┐
│ RuleCondition    │   │
│ RuleApprover     │   ├──► Rule Evaluation Engine
│ ApproverDelegation│  │
└──────────────────┘   │
                       │
┌──────────────────┐   │
│ ECO              │   │
│ Product          │   │
│ ProductVersion   │   ├──► Rule Evaluation Engine
│ BOM              │   │
│ BOMVersion       │   │
└──────────────────┘ ──┘
                       │
                       ▼
                ┌──────────────┐
                │   Evaluate   │
                │    Rules     │
                └──────┬───────┘
                       │
                       ▼
Output:
┌──────────────────────────────────────┐
│ RuleEvaluationLog (audit)            │
│ Console logs (debugging)             │
│ Dynamic approvers list (in-memory)   │
└──────────────────────────────────────┘
                       │
                       ▼
                ┌──────────────┐
                │ EcoApproval  │ ◄── Approvers approve
                │ (existing)   │
                └──────────────┘

```

---

## Before vs After Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BEFORE Integration                                │
└─────────────────────────────────────────────────────────────────────┘

ECO Start:
  User starts ECO
  ↓
  ECO → in_progress
  ↓
  Static approvers only
  ❌ Rules NOT evaluated
  ❌ Dynamic approvers NOT assigned

ECO Approval:
  Approver approves
  ↓
  Check static approvers only
  ❌ Rule-based approvers IGNORED
  ↓
  If static complete → next stage
  ❌ Rules NOT re-evaluated


┌─────────────────────────────────────────────────────────────────────┐
│                    AFTER Integration                                 │
└─────────────────────────────────────────────────────────────────────┘

ECO Start:
  User starts ECO
  ↓
  ECO → in_progress
  ↓
  ✅ Rules EVALUATED
  ✅ Dynamic approvers ASSIGNED
  ✅ Console logs show evaluation
  ✅ Static + Dynamic approvers

ECO Approval:
  Approver approves
  ↓
  ✅ Check BOTH static + dynamic approvers
  ✅ Rule-based approvers REQUIRED
  ↓
  If ALL approvals complete → next stage
  ✅ Rules RE-EVALUATED for new stage
  ✅ New approvers assigned

```

---

**Visual Summary**: The approval rules system is now fully integrated into the ECO workflow at 3 critical points, enabling automatic approver assignment based on configurable rules while maintaining 100% backward compatibility with the existing static approver system.
