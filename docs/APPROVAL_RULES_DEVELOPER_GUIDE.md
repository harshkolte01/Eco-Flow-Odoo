# Approval Rules System - Developer Quick Reference

## Quick Start

### API Base
All endpoints are prefixed with: `/api/approval-rules`

### Authentication
All endpoints require:
```
Header: Authorization: Bearer <jwt_token>
```

---

## 🎯 Core Concepts

### 1. Approval Rule
A configurable rule that determines which approvers are required for an ECO.

**Structure**:
```
ApprovalRule
├── Conditions (if these are true)
│   ├── Field: product.salePrice
│   ├── Operator: GT
│   └── Value: 5000
│
└── Approvers (then require these)
    ├── User: John (required)
    └── User: Jane (optional)
```

### 2. Rule Conditions
Determine when a rule applies.

**Available Fields**:
- `eco.type` - Type of ECO (product, bom)
- `eco.status` - ECO status (draft, in_progress, approved, applied)
- `product.salePrice` - Product sale price
- `product.costPrice` - Product cost price
- `product.category` - Product category
- `bom.components` - Number of components in BoM

**Available Operators**:
- `GT` - Greater than (>)
- `LT` - Less than (<)
- `GTE` - Greater than or equal (>=)
- `LTE` - Less than or equal (<=)
- `EQ` - Equals (=)
- `IN` - Value in list (comma-separated)
- `NOT_IN` - Value NOT in list
- `CONTAINS` - String contains
- `NOT_CONTAINS` - String does NOT contain

### 3. Approvers
People assigned to review ECOs based on rules.

**Categories**:
- `required` - All required approvers must approve
- `optional` - Optional to approve (informational)

---

## 📝 Common API Calls

### Create a Rule

```bash
curl -X POST http://localhost:5000/api/approval-rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High-Value Changes",
    "description": "For products > $5000",
    "ruleType": "condition_rule",
    "priority": 10,
    "stageIds": [1, 2],
    "conditions": [
      {
        "fieldName": "product.salePrice",
        "operator": "GT",
        "fieldValue": "5000",
        "logicalOperator": "AND"
      }
    ],
    "approvers": [
      {
        "userId": 5,
        "approvalCategory": "required",
        "canDelegate": true,
        "escalationThresholdDays": 2
      }
    ]
  }'
```

### List All Rules

```bash
curl -X GET "http://localhost:5000/api/approval-rules?isActive=true&page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get a Specific Rule

```bash
curl -X GET http://localhost:5000/api/approval-rules/rule_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update a Rule

```bash
curl -X PATCH http://localhost:5000/api/approval-rules/rule_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Rule Name",
    "priority": 20,
    "isActive": true
  }'
```

### Delete a Rule

```bash
curl -X DELETE http://localhost:5000/api/approval-rules/rule_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add a Condition to a Rule

```bash
curl -X POST http://localhost:5000/api/approval-rules/rule_abc123/conditions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "product.costPrice",
    "operator": "GT",
    "fieldValue": "1000",
    "logicalOperator": "AND"
  }'
```

### Add an Approver to a Rule

```bash
curl -X POST http://localhost:5000/api/approval-rules/rule_abc123/approvers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 5,
    "approvalCategory": "required",
    "canDelegate": true,
    "escalationUserId": 6,
    "escalationThresholdDays": 2
  }'
```

### Evaluate Rules for an ECO

```bash
curl -X POST http://localhost:5000/api/approval-rules/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ecoId": 123
  }'
```

### Test a Rule with Mock Data

```bash
curl -X POST http://localhost:5000/api/approval-rules/rule_abc123/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "product",
    "product": {
      "version": {
        "salePrice": 6000,
        "costPrice": 3000,
        "category": "Electronics"
      }
    }
  }'
```

### Create a Delegation

```bash
curl -X POST http://localhost:5000/api/delegations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId": 5,
    "toUserId": 6,
    "startDate": "2026-01-26T00:00:00Z",
    "endDate": "2026-02-01T00:00:00Z",
    "reason": "On vacation"
  }'
```

### Get User Delegations

```bash
curl -X GET http://localhost:5000/api/delegations/active-for-user/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Service Methods

### ApprovalRulesService

```javascript
import ApprovalRulesService from './approval-rules.service.js';

const service = new ApprovalRulesService();

// Create
await service.createRule(input, userId);

// Read
await service.getRule(ruleId);
await service.listRules(filters);
await service.getRulesForStage(stageId);

// Update
await service.updateRule(ruleId, input, userId);

// Delete
await service.deleteRule(ruleId, userId);

// Conditions
await service.addCondition(ruleId, conditionData, userId);
await service.updateCondition(conditionId, conditionData, userId);
await service.deleteCondition(conditionId, userId);

// Approvers
await service.addApprover(ruleId, approverData, userId);
await service.removeApprover(ruleId, userId, removedById);
await service.updateApprover(ruleId, userId, updates, userId);

// History
await service.getRuleHistory(ruleId);
```

### RuleEvaluationService

```javascript
import RuleEvaluationService from './rule-evaluation.service.js';

const service = new RuleEvaluationService();

// Main evaluation
await service.evaluateRulesForEco(ecoId);

// Simulation
await service.simulateRuleEvaluation(ruleId, mockEcoData);

// Analytics
await service.getEcoRuleEvaluations(ecoId);
```

### DelegationService

```javascript
import DelegationService from './delegation.service.js';

const service = new DelegationService();

// Create
await service.createDelegation(input, createdById);

// Read
await service.getDelegation(delegationId);
await service.listDelegations(filters);
await service.getActiveDelegationsForUser(userId);

// Update
await service.revokeDelegation(delegationId, revokedById);

// Delete
await service.deleteDelegation(delegationId);

// Utilities
await service.hasActiveDelegation(userId);
await service.getActiveDelegate(userId);
await service.getUsersDelegatingTo(userId);
```

---

## 📊 Database Queries

### Find All Active Rules

```javascript
import { prisma } from '../../config/database.js';

const rules = await prisma.approvalRule.findMany({
  where: {
    isActive: true,
    isArchived: false
  },
  include: {
    conditions: true,
    approvers: { include: { approver: true } }
  }
});
```

### Find Rules for a Specific Stage

```javascript
const rules = await prisma.approvalRule.findMany({
  where: {
    isActive: true,
    stageIds: { hasSome: [stageId] }
  },
  orderBy: { priority: 'asc' }
});
```

### Get Rule History

```javascript
const history = await prisma.ruleAudit.findMany({
  where: { ruleId },
  orderBy: { performedAt: 'desc' },
  include: { performedBy: { select: { name: true } } }
});
```

### Get Active Delegations for User

```javascript
const now = new Date();

const delegations = await prisma.approverDelegation.findMany({
  where: {
    fromUserId: userId,
    status: 'active',
    startDate: { lte: now },
    endDate: { gte: now }
  }
});
```

---

## 🚀 Integration Points

### In ECO Service (Future)

When starting an ECO, call rule evaluation:

```javascript
import { evaluateAndApplyRulesForEco } from '../approval-rules/rule-integration.helper.js';

// Get all applicable approvers
const { allApprovers, rulesTriggered } = await evaluateAndApplyRulesForEco(ecoId, stageId);

// Create approval entries for each approver
for (const approver of allApprovers) {
  await prisma.ecoApproval.create({
    data: {
      ecoId,
      stageId,
      approverId: approver.userId,
      status: 'pending'
    }
  });
}
```

---

## ❌ Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad request (validation failed)
- `403` - Forbidden (not admin)
- `404` - Not found
- `500` - Server error

---

## 📈 Performance Tips

1. **Rule Evaluation**
   - Rules are evaluated in priority order
   - Conditions use AND logic (short-circuit on first false)
   - Typical eval time: <50ms for 100 rules

2. **Database Queries**
   - Use pagination for list endpoints
   - Include only needed fields in selects
   - Indexes on `isActive`, `priority`, `ruleType`

3. **Delegation Checks**
   - Cache active delegations if high frequency
   - Lazy load delegation data

---

## 🧪 Testing Examples

### Test Rule Creation

```javascript
test('should create approval rule', async () => {
  const rule = await service.createRule({
    name: 'Test Rule',
    stageIds: [1],
    conditions: [],
    approvers: []
  }, userId);

  expect(rule.id).toBeDefined();
  expect(rule.name).toBe('Test Rule');
  expect(rule.isActive).toBe(true);
});
```

### Test Condition Evaluation

```javascript
test('should evaluate GT condition correctly', () => {
  const result = service.compareValues(6000, 'GT', '5000');
  expect(result).toBe(true);
});
```

---

## 🔐 Security Notes

1. **Admin Only**: All rule management endpoints require `admin` role
2. **Delegation Privacy**: Users can only view their own delegations
3. **Audit Trail**: All changes logged to `RuleAudit` table
4. **User Validation**: All user IDs validated before operations

---

## 📞 Support

For issues or questions:
1. Check service error messages
2. Review audit logs: `GET /api/approval-rules/:id/history`
3. Check rule evaluations: `GET /api/approval-rules/evaluate`
4. Review database directly using Prisma Studio: `npm run prisma:studio`

---

**Last Updated**: January 25, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
