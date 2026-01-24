# ECO-Flow Codebase: Comprehensive Overview

**Date**: January 25, 2026  
**Status**: ✅ Complete Implementation  
**Framework**: Node.js/Express (Backend) + Next.js (Frontend)  
**Database**: PostgreSQL with Prisma ORM

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Technology Stack](#technology-stack)
3. [Database Schema & Models](#database-schema--models)
4. [Existing Features & Implementation](#existing-features--implementation)
5. [API Architecture](#api-architecture)
6. [UI Components & Patterns](#ui-components--patterns)
7. [Settings & Configuration](#settings--configuration)
8. [Existing Approval Rules Logic](#existing-approval-rules-logic)
9. [Implementation Gaps](#implementation-gaps)
10. [Key Statistics](#key-statistics)

---

## Directory Structure

### Backend (`/backend`)
```
backend/
├── src/
│   ├── config/
│   │   ├── env.js              # Environment variable validation
│   │   └── database.js         # Prisma singleton instance
│   ├── middlewares/
│   │   ├── auth.middleware.js  # JWT validation, role-based access
│   │   ├── error.handler.js    # Centralized error handling
│   │   └── validate.middleware.js # Request validation
│   ├── modules/
│   │   ├── auth/               # Authentication (signup, login, JWT)
│   │   ├── users/              # User management & role assignment
│   │   ├── ecos/               # ECO lifecycle (CRUD, approval, apply)
│   │   ├── products/           # Product management & versioning
│   │   ├── boms/               # Bill of Materials management
│   │   ├── stages/             # ECO stages & approver configuration
│   │   ├── audit-logs/         # Audit trail logging
│   │   └── reports/            # Reporting & analytics
│   └── utils/
│       ├── response.js         # Response helpers (success, error)
│       └── asyncHandler.js     # Async error wrapper
├── prisma/
│   ├── schema.prisma           # Database schema (327 lines)
│   ├── seed.js                 # Database seeding script
│   └── migrations/             # Database migrations
├── docs/                       # Implementation documentation
├── package.json                # Dependencies & scripts
└── index.js                    # Express app entry point
```

### Frontend (`/frontend`)
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/              # Login page
│   │   └── signup/             # Registration page
│   ├── settings/
│   │   └── eco-stages/         # Stage management UI
│   ├── products/               # Product browsing
│   ├── boms/                   # BOM management
│   ├── reports/                # Analytics & reports
│   ├── page.tsx                # Home page (ECO list)
│   └── layout.tsx              # Main layout
├── components/
│   ├── AppShell.tsx            # App container
│   ├── Header.tsx              # Top navigation
│   ├── Sidebar.tsx             # Side navigation
│   ├── EcoCreateModal.tsx      # ECO creation form
│   ├── EcoListPanel.tsx        # ECO listing view
│   ├── EcoChangesView.tsx      # Draft changes display
│   ├── EcoDraftsModal.tsx      # Draft management
│   ├── ReportsTable.tsx        # Report tables
│   └── ProtectedRoute.tsx      # Route guards
├── context/                    # React Context
├── lib/                        # Utilities & helpers
├── public/                     # Static assets
└── tsconfig.json               # TypeScript config
```

---

## Technology Stack

### Backend
| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 4.x |
| **Database** | PostgreSQL |
| **ORM** | Prisma 5.x |
| **Authentication** | JWT (jsonwebtoken 9.x) |
| **Password Hashing** | bcryptjs 3.x |
| **Validation** | Joi (custom implementation) |
| **Error Handling** | Custom middleware |
| **Async** | express-async-handler 1.x |

### Frontend
| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14.x |
| **Language** | TypeScript |
| **Styling** | CSS Modules / Tailwind (configured) |
| **State Management** | React Context API |
| **HTTP Client** | Fetch API |
| **Package Manager** | npm |

---

## Database Schema & Models

### Core Entities

#### 1. **User** (Authentication & Authorization)
```prisma
model User {
  id                Int              @id @default(autoincrement())
  loginId           String           @unique
  name              String
  email             String           @unique
  passwordHash      String
  roleId            Int
  role              Role             @relation(fields: [roleId], references: [id])
  
  // Relations
  products          Product[]        # Products created by user
  ecosRaised        Eco[]           # ECOs raised by user
  approvals         EcoApproval[]   # Approvals by user
  auditLogs         AuditLog[]      # Actions performed
  stageApprovers    StageApprover[] # Stage approver assignments
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Roles**: engineering, approver, operations, admin

#### 2. **Role** (Access Control)
```prisma
model Role {
  id    Int    @id @default(autoincrement())
  name  String @unique  # engineering, approver, operations, admin
  users User[]
}
```

#### 3. **ECO** (Engineering Change Order) - Main Entity
```prisma
model Eco {
  id              Int                 @id @default(autoincrement())
  title           String
  ecoType         EcoType            # product | bom
  productId       Int
  product         Product            @relation(fields: [productId], references: [id])
  bomId           Int?
  bom             Bom?               @relation(fields: [bomId], references: [id])
  raisedById      Int
  raisedBy        User               @relation("EcoRaisedBy", fields: [raisedById], references: [id])
  
  # Workflow state
  currentStageId  Int
  currentStage    EcoStage           @relation(fields: [currentStageId], references: [id])
  status          EcoStatus          # draft | in_progress | approved | applied
  
  # Additional metadata
  effectiveDate   DateTime?
  versionUpdate   Boolean            @default(true)  # Create new version vs update existing
  
  # Relations
  approvals       EcoApproval[]      # All approvals for this ECO
  productChange   EcoProductChange?  # Product changes (for product ECOs)
  bomDraft        EcoBomDraft?       # BoM changes (for BoM ECOs)
  createdProductVersions ProductVersion[]
  createdBomVersions BomVersion[]
  activationLogs  VersionActivationLog[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**EcoStatus**: draft | in_progress | approved | applied  
**EcoType**: product | bom

#### 4. **EcoStage** (Workflow Stages)
```prisma
model EcoStage {
  id              Int              @id @default(autoincrement())
  name            String           @unique    # e.g., "Review", "Approval"
  sequenceOrder   Int              # Determines stage order
  approvalRequired Boolean          @default(false)
  
  # Relations
  ecos            Eco[]            # ECOs in this stage
  approvals       EcoApproval[]
  stageApprovers  StageApprover[]  # Configured approvers for this stage
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 5. **StageApprover** (Approval Rules Configuration) ⭐
```prisma
model StageApprover {
  id               Int              @id @default(autoincrement())
  stageId          Int
  stage            EcoStage         @relation(fields: [stageId], references: [id], onDelete: Cascade)
  userId           Int
  user             User             @relation(fields: [userId], references: [id])
  approvalCategory ApprovalCategory @default(required)  # required | optional
  
  @@unique([stageId, userId])  # One entry per user per stage
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**ApprovalCategory**: required | optional

#### 6. **EcoApproval** (Approval Records)
```prisma
model EcoApproval {
  id        Int            @id @default(autoincrement())
  ecoId     Int
  eco       Eco            @relation(fields: [ecoId], references: [id])
  stageId   Int
  stage     EcoStage       @relation(fields: [stageId], references: [id])
  approverId Int
  approver  User           @relation(fields: [approverId], references: [id])
  status    ApprovalStatus # pending | approved | rejected
  actionDate DateTime?
  
  @@index([ecoId, stageId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**ApprovalStatus**: pending | approved | rejected

#### 7. **Product** (Product Management)
```prisma
model Product {
  id          Int              @id @default(autoincrement())
  productCode String           @unique
  createdById Int?
  createdBy   User?            @relation(fields: [createdById], references: [id])
  
  versions    ProductVersion[]
  bom         Bom?
  ecos        Eco[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 8. **ProductVersion** (Product Versioning)
```prisma
model ProductVersion {
  id               Int                   @id @default(autoincrement())
  productId        Int
  versionNo        Int                   # Version number
  productName      String
  salePrice        Decimal?              @db.Decimal(12, 2)
  costPrice        Decimal?              @db.Decimal(12, 2)
  attachments      Json?
  status           ProductVersionStatus  # draft | active | archived
  createdFromEcoId Int?
  createdFromEco   Eco?
  
  bomVersions      BomVersion[]
  bomComponents    BomComponent[]
  ecoProductChanges EcoProductChange[]
  
  @@unique([productId, versionNo])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 9. **EcoProductChange** (Product ECO Changes)
```prisma
model EcoProductChange {
  id                   Int            @id @default(autoincrement())
  ecoId                Int            @unique
  eco                  Eco            @relation(fields: [ecoId], references: [id])
  baseProductVersionId Int
  baseProductVersion   ProductVersion @relation(fields: [baseProductVersionId], references: [id])
  
  # New values (nullable - only changed fields are set)
  newProductName       String?
  newSalePrice         Decimal?       @db.Decimal(12, 2)
  newCostPrice         Decimal?       @db.Decimal(12, 2)
  newAttachments       Json?
}
```

#### 10. **Bom** (Bill of Materials)
```prisma
model Bom {
  id        Int          @id @default(autoincrement())
  productId Int          @unique  # One BOM per product
  product   Product      @relation(fields: [productId], references: [id])
  
  versions  BomVersion[]
  ecos      Eco[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 11. **BomVersion** (BoM Versioning)
```prisma
model BomVersion {
  id               Int                @id @default(autoincrement())
  bomId            Int
  productVersionId Int  # Links to product version
  versionNo        Int
  status           BomVersionStatus   # draft | active | archived
  createdFromEcoId Int?
  
  components       BomComponent[]     # Components in this BoM
  operations       BomOperation[]     # Operations in this BoM
}
```

#### 12. **AuditLog** (Audit Trail)
```prisma
model AuditLog {
  id           Int            @id @default(autoincrement())
  entityType   AuditEntityType # product | bom | eco
  entityId     String
  action       String         # created | updated | approved | applied
  oldValue     Json?
  newValue     Json?
  performedById Int
  performedBy  User           @relation(fields: [performedById], references: [id])
  timestamp    DateTime       @default(now())
}
```

---

## Existing Features & Implementation

### 1. Authentication & Authorization ✅
**Status**: Fully Implemented

**Features**:
- User signup with automatic 'engineering' role assignment
- Login with JWT token generation (7-day expiration)
- Password hashing with bcryptjs (10 salt rounds)
- Role-based access control (RBAC)
  - engineering: Create/edit own ECOs
  - approver: Approve ECOs
  - operations: Read-only access
  - admin: Full access

**Files**:
- `backend/src/modules/auth/` (4 files)
- `backend/src/middlewares/auth.middleware.js`

### 2. User Management ✅
**Status**: Fully Implemented

**Features**:
- User registration
- List all users (admin only)
- Update user roles (admin only)
- Self-role-change prevention

**Files**:
- `backend/src/modules/users/` (4 files)

### 3. ECO Lifecycle Management ✅
**Status**: Fully Implemented

**Features**:
- **Create ECO**: Define title, type (product/BoM), product, effective date
- **Draft Phase**: Edit ECO properties while in draft
- **Start ECO**: Move to first workflow stage, create initial draft changes
- **In-Progress Phase**: Workflow through approval stages
- **Approval Phase**: Approvers review and approve at configured stages
- **Rejection**: Return ECO to draft for modifications
- **Apply Changes**: Create new product/BoM versions on approval
- **Applied Phase**: ECO finalized with versioning

**Files**:
- `backend/src/modules/ecos/ecos.service.js` (1973 lines)
- `backend/src/modules/ecos/ecos.controller.js` (118 lines)
- `backend/src/modules/ecos/ecos.routes.js`

**API Endpoints**:
- `POST /api/ecos` - Create ECO
- `GET /api/ecos` - List ECOs (filtered by scope/type)
- `GET /api/ecos/:id` - Get ECO details
- `PATCH /api/ecos/:id` - Update ECO (draft only)
- `POST /api/ecos/:id/start` - Start ECO workflow
- `POST /api/ecos/:id/approve` - Approve ECO (approver only)
- `POST /api/ecos/:id/validate` - Validate ECO (non-approval stage)
- `POST /api/ecos/:id/reject` - Reject ECO
- `POST /api/ecos/:id/apply` - Apply approved changes

### 4. Product Management ✅
**Status**: Fully Implemented

**Features**:
- Product creation with unique code
- Product versioning (draft, active, archived)
- Price management (sale price, cost price)
- Attachment support
- Version activation via ECO approval

**Files**:
- `backend/src/modules/products/` (4 files)

### 5. Bill of Materials (BoM) ✅
**Status**: Fully Implemented

**Features**:
- BoM creation linked to products
- Component management with quantities
- Operation/work instructions tracking
- BoM versioning (draft, active, archived)
- BoM changes via ECO workflow

**Files**:
- `backend/src/modules/boms/` (4 files)

### 6. ECO Stage Management ✅
**Status**: Fully Implemented

**Features**:
- Define workflow stages in sequence
- Set approval requirements per stage
- Stage-specific approver configuration
- Transition logic through stages

**Files**:
- `backend/src/modules/stages/stages.service.js` (162 lines)
- `backend/src/modules/stages/stages.controller.js`
- `backend/src/modules/stages/stages.routes.js`

**API Endpoints**:
- `GET /api/stages` - List all stages
- `POST /api/stages` - Create stage
- `PATCH /api/stages/:id` - Update stage
- `DELETE /api/stages/:id` - Delete stage

### 7. Multi-Approver System ⭐ ✅
**Status**: Fully Implemented

**Features**:
- Assign multiple approvers per stage
- Required vs Optional approver categories
- Track approval status per user
- Auto-proceed when all required approvals met
- Approval summary for each ECO stage

**Files**:
- `backend/src/modules/stages/approvers.service.js` (327 lines)
- `backend/src/modules/stages/stages.routes.js`

**API Endpoints**:
- `GET /api/stages/:id/approvers` - Get stage approvers
- `POST /api/stages/:id/approvers` - Add approver
- `PATCH /api/stages/:stageId/approvers/:approverId` - Update category
- `DELETE /api/stages/:stageId/approvers/:approverId` - Remove approver

**Approval Logic** (`ecos.service.js`):
```
1. Approver calls POST /api/ecos/:id/approve
2. System records user's approval in EcoApproval table
3. Calls approversService.canProceedToNextStage()
4. If all required approvers approved → Move to next stage
5. If final stage → Auto-apply changes
6. If not all approved → Stay in current stage
```

### 8. Audit Logging ✅
**Status**: Fully Implemented

**Features**:
- Comprehensive audit trail for all entity changes
- User action tracking
- Old/new value comparison
- Timestamp tracking
- Entity type tracking

**Files**:
- `backend/src/modules/audit-logs/` (4 files)

**Tracked Actions**:
- ECO: created, updated, started, approved_by_user, stage_completed, rejected, validated, applied
- Product: created, updated
- BoM: created, updated

### 9. Reports & Analytics ✅
**Status**: Fully Implemented

**Features**:
- ECO status summaries
- Approval metrics
- Stage throughput analysis
- User activity reports

**Files**:
- `backend/src/modules/reports/` (4 files)

### 10. UI Implementation ✅
**Status**: Fully Implemented

**Components**:
- **Header**: User info, logout
- **Sidebar**: Navigation (Home, Products, BoMs, Reports, Settings)
- **ECO List**: Search, filter by type/scope, status display
- **ECO Creation**: Modal form with product/BoM selection
- **ECO Details**: Full ECO information with approval status
- **ECO Changes**: Product/BoM draft diff viewer
- **Stage Management**: Admin interface to configure stages
- **Approvers**: Configure required/optional approvers per stage

**Files**:
- `frontend/components/` (12 components)
- `frontend/app/settings/eco-stages/` (stage management UI)

---

## API Architecture

### Request/Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Details (development only)"
}
```

**Paginated Response**:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Middleware Chain

```
Request
  ↓
CORS Middleware
  ↓
JSON Parser
  ↓
Route-Specific Auth Middleware
  ├─ requireAuth: Validates JWT token
  └─ requireRole(...): Checks user role
  ↓
Request Validation
  ├─ Body validation
  ├─ Params validation
  └─ Query validation
  ↓
Route Handler
  ↓
Error Handling
  └─ Centralized error handler catches all errors
  ↓
Response
```

### Authentication Flow

```
1. User → POST /api/auth/signup (Creates user with role='engineering')
2. System → Generate JWT token (7-day expiration)
3. User → Stores token in localStorage/cookie
4. User → All requests include: Authorization: Bearer <TOKEN>
5. Middleware → Validates token, extracts user info
6. Handler → Receives req.user = { id, role, email }
7. Business Logic → Enforces role-based rules
```

---

## UI Components & Patterns

### Page Hierarchy

```
/
├── Settings
│   └── ECO Stages
│       └── [id] (Stage details & approver config)
├── Products
├── BoMs
├── Reports
└── (Auth)
    ├── Login
    └── Signup
```

### Key UI Patterns

1. **Modal Forms**: ECO creation, changes editing
2. **Data Tables**: ECO list, products, reports
3. **Tabs**: Approval workflows, draft changes
4. **Status Badges**: ECO status (draft, in_progress, approved, applied)
5. **Diff Viewer**: Original vs. changed values for products/BoMs
6. **Role-Based Visibility**: Components hidden based on user role

---

## Settings & Configuration

### Stage Configuration UI
**Location**: `frontend/app/settings/eco-stages/`

**Capabilities**:
- View all ECO stages in sequence order
- Create new stage with approval requirement setting
- Edit stage name, sequence, approval requirement
- Delete stage (with validation checks)
- Assign approvers per stage (required/optional)
- View ECO count per stage

### Approver Configuration
**Location**: Stage details page

**Capabilities**:
- Add approvers to a stage
- Toggle between required/optional categories
- Remove approvers
- View approval summary for each ECO

---

## Existing Approval Rules Logic

### Approval Rules Engine Location

**File**: `backend/src/modules/stages/approvers.service.js`

**Key Method**: `canProceedToNextStage(ecoId, stageId)`

```javascript
async canProceedToNextStage(ecoId, stageId) {
  // 1. Get all required approvers for stage
  const requiredApprovers = await prisma.stageApprover.findMany({
    where: { stageId, approvalCategory: 'required' }
  });
  
  // 2. If no required approvers, can proceed
  if (requiredApprovers.length === 0) {
    return { canProceed: true, reason: 'no_required_approvals' };
  }
  
  // 3. Get approvals for this ECO at this stage
  const approvals = await prisma.ecoApproval.findMany({
    where: { ecoId, stageId, status: 'approved' }
  });
  
  // 4. Find missing approvals
  const missingApprovals = requiredApprovers.filter(
    ra => !approvedUserIds.has(ra.userId)
  );
  
  // 5. Return result
  if (missingApprovals.length > 0) {
    return {
      canProceed: false,
      reason: 'pending_required_approvals',
      missingApprovals: [...missing approver details...]
    };
  }
  
  return { canProceed: true, reason: 'all_approved' };
}
```

### Approval Decision Flow

**File**: `backend/src/modules/ecos/ecos.service.js`

**Method**: `approveEco(ecoId, currentUser)`

```
1. Validate ECO is in_progress
2. Validate user is approver/admin
3. Validate stage requires approval
4. Create EcoApproval record (status='approved')
5. Call approversService.canProceedToNextStage()
6. If canProceed=false:
   └─ Return current ECO (approval recorded but stage incomplete)
7. If canProceed=true:
   ├─ Find nextStage
   ├─ Check if nextStage is final
   ├─ Update ECO to new stage/status
   ├─ If final stage: Call applyEcoChanges()
   └─ Return updated ECO
```

### Validation Method: `validateEco(ecoId, currentUser)`

Used for stages that don't require approval:

```
1. Validate ECO is in_progress
2. Validate stage doesn't require approval
3. Get nextStage
4. Check if nextStage is final
5. Update ECO to nextStage
6. If final stage: Call applyEcoChanges()
7. Return updated ECO
```

### Rejection Method: `rejectEco(ecoId, currentUser)`

Returns ECO to draft for modifications:

```
1. Validate ECO is in_progress
2. Create EcoApproval record (status='rejected')
3. Get first stage
4. Reset ECO to first stage with status='draft'
5. Return updated ECO
```

### Key Features

✅ **Multi-Approver Support**: Multiple approvers per stage  
✅ **Flexible Categories**: Required vs Optional approvers  
✅ **State Tracking**: Individual approval records stored  
✅ **Auto-Progression**: Automatic advancement when requirements met  
✅ **Audit Trail**: All approvals logged with timestamps  
✅ **Validation**: Prevents moving to next stage prematurely  

---

## Implementation Gaps

### Gap 1: Approval Rules Configuration GUI ⚠️

**Status**: Partially Implemented

**Current**:
- Backend API exists for all CRUD operations
- Frontend has stage management page

**Missing**:
- Detailed "Approvers" tab in stage details
- UI to add/remove approvers per stage
- UI to toggle required/optional categories
- Bulk approver assignment
- Approval rule templates/presets

**Impact**: Admins must use API directly or database to assign approvers

### Gap 2: Conditional Approval Rules ❌

**Status**: Not Implemented

**Missing**:
- Rule conditions (e.g., "if price change > $1000, require manager approval")
- Dynamic approver selection based on ECO properties
- Escalation rules (e.g., if level 1 rejects, go to level 2)
- Conditional stage skipping
- Time-based approval requirements

**Use Case**: "Large changes require VP approval, small changes only need supervisor"

### Gap 3: Approval Rule Precedence & Conflicts ❌

**Status**: Not Implemented

**Missing**:
- Rule priority/ordering system
- Conflict resolution between rules
- Override capabilities
- SLA/deadline enforcement

**Use Case**: "If both conditions match, apply rule with highest priority"

### Gap 4: Advanced Approval Workflows ❌

**Status**: Not Implemented

**Missing**:
- Parallel approvals (multiple users at same time)
- Sequential approvals (one after another)
- Approval delegation
- Approval forwarding
- Conditional branches in workflow
- Optional approval skipping

**Current**: All approvals at a stage must be completed before moving to next stage

### Gap 5: Approval Notifications ❌

**Status**: Not Implemented

**Missing**:
- Email notifications when ECO needs approval
- Escalation notifications for overdue approvals
- Rejection/approval notifications
- Approval deadline tracking
- Reminder system

### Gap 6: Approval Analytics & Reporting ⚠️

**Status**: Partially Implemented

**Current**:
- Basic reports module exists
- Approval summary per ECO/stage

**Missing**:
- Approval cycle time metrics
- Bottleneck identification (stages with longest wait)
- Approval rate by user
- Rejection rate analysis
- SLA compliance reporting
- Trend analysis over time

### Gap 7: Approval Rules Version Control ❌

**Status**: Not Implemented

**Missing**:
- Rule change history
- Rule effective dates
- Retroactive rule application options
- Rule rollback capability

**Use Case**: "Apply new approval rules to ECOs created after Date X"

### Gap 8: Approval State Machine Validation ⚠️

**Status**: Partially Implemented

**Current**:
- Basic stage transitions work
- Status updates on approval

**Missing**:
- Formal state machine definition
- Invalid transition prevention
- State diagram documentation
- Transition pre/post-conditions
- Guard conditions enforcement

### Gap 9: Bulk Approvals ❌

**Status**: Not Implemented

**Missing**:
- Batch approve multiple ECOs
- Bulk assign approvers to stages
- Bulk update approval rules

### Gap 10: Approval Dashboard ❌

**Status**: Not Implemented

**Missing**:
- Personal approval queue (ECOs waiting for my approval)
- Approval metrics dashboard
- Real-time approval status board
- Overdue approvals highlight

---

## Key Statistics

### Codebase Size

| Category | Count | Files |
|----------|-------|-------|
| **Modules** | 8 | - |
| **Backend Routes** | 40+ | 8 |
| **Database Models** | 12 | 1 (schema.prisma) |
| **Frontend Components** | 12+ | - |
| **Frontend Pages** | 8+ | - |
| **API Endpoints** | 50+ | - |
| **Lines of Backend Code** | ~3,500+ | - |

### Database

| Table | Purpose | Key Features |
|-------|---------|--------------|
| User | 4 + relations | Auth, roles, audit |
| Role | 1 + relations | RBAC system |
| Product | 3 | Versioning |
| ProductVersion | 10 | Draft/active/archived |
| Bom | 2 | 1:1 with Product |
| BomVersion | 7 | Components, operations |
| Eco | 10 | Main workflow entity |
| EcoStage | 4 | Workflow stages |
| EcoApproval | 7 | Approval records |
| StageApprover | 6 | Approver assignment ⭐ |
| AuditLog | 8 | Audit trail |

### Roles & Permissions

| Role | Can Create ECOs | Can Approve | Can Apply | Can Manage | Can See All |
|------|-----------------|-------------|-----------|-----------|------------|
| engineering | ✅ Own only | ❌ | ❌ | ❌ | ❌ |
| approver | ❌ | ✅ | ❌ | ❌ | ✅ |
| operations | ❌ | ❌ | ❌ | ❌ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Summary

### What's Implemented ✅

1. **Complete ECO Lifecycle**: Create, draft, start, approve, apply, reject
2. **Multi-Stage Workflow**: Configurable stages in sequence
3. **Multi-Approver System**: Multiple approvers per stage (required/optional)
4. **Version Control**: Product and BoM versioning
5. **Audit Logging**: Comprehensive change tracking
6. **Role-Based Access**: Engineering, Approver, Operations, Admin
7. **Authentication**: JWT-based with bcrypt password hashing
8. **UI Components**: Full frontend for all major features
9. **Approval Rules Engine**: Logic for checking approval requirements

### What's Missing ❌

1. **Advanced Rules**: Conditional, escalation, priority-based
2. **Notifications**: Email, SMS, in-app
3. **Analytics**: Cycle time, bottleneck identification
4. **State Validation**: Formal state machine
5. **Bulk Operations**: Batch approvals/assignments
6. **Dashboards**: Approval queue, metrics
7. **Delegation**: Forward approvals to others
8. **Parallel Workflows**: Non-sequential approvals
9. **Version Control**: Rule change history
10. **Detailed UI**: Admin interface for approver assignment

---

## Next Steps

For implementing advanced approval rules, focus on:

1. **Rules Configuration Table**: Store conditions, actions, priorities
2. **Rules Engine**: Evaluate conditions at each stage
3. **State Machine**: Formalize workflow transitions
4. **Notifications**: Email integration for approvers
5. **Dashboard**: Approval queue and metrics UI
6. **Analytics**: Approval cycle metrics and bottleneck detection

---

**Document Created**: January 25, 2026  
**Last Updated**: January 25, 2026  
**Status**: ✅ Complete Overview
