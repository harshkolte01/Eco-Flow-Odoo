// Enums
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

export enum DelegationStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum ApprovalCategory {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
}

export enum RuleAuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  ARCHIVED = 'archived',
  CONDITION_ADDED = 'condition_added',
  CONDITION_UPDATED = 'condition_updated',
  CONDITION_DELETED = 'condition_deleted',
  APPROVER_ADDED = 'approver_added',
  APPROVER_UPDATED = 'approver_updated',
  APPROVER_DELETED = 'approver_deleted',
}

// Types
export interface RuleCondition {
  id?: string;
  fieldName: string;
  operator: RuleOperator;
  fieldValue: string | string[] | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleApprover {
  userId: number;
  approvalCategory: ApprovalCategory;
  canDelegate?: boolean;
  escalationThresholdDays?: number;
}

export interface ApprovalRule {
  id?: string;
  name: string;
  description?: string;
  ruleType: RuleType;
  priority: number;
  isActive: boolean;
  stageIds: number[];
  conditions: RuleCondition[];
  approvers: RuleApprover[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  version?: number;
}

export interface Delegation {
  id?: string;
  fromUserId: number;
  toUserId: number;
  startDate: string;
  endDate: string;
  status: DelegationStatus;
  revokedAt?: string;
  revokedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RuleAuditEntry {
  id: string;
  ruleId: string;
  action: RuleAuditAction;
  changedBy: number;
  changedByUser?: User;
  changes?: Record<string, any>;
  createdAt: string;
}

export interface RuleEvaluationResult {
  approvers: Array<{
    userId: number;
    originalUserId: number;
    approvalCategory: ApprovalCategory;
    ruleId: string;
    ruleName: string;
  }>;
  rulesApplied: number;
  rulesTriggered: number;
}

// Related types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'approver';
}

export interface Stage {
  id: number;
  name: string;
  description?: string;
}

export interface FieldOption {
  value: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

// Form types
export interface RuleFormData {
  name: string;
  description: string;
  ruleType: RuleType;
  priority: number;
  isActive: boolean;
  stageIds: number[];
  conditions: RuleCondition[];
  approvers: RuleApprover[];
}

export interface DelegationFormData {
  fromUserId: number;
  toUserId: number;
  startDate: string;
  endDate: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface RuleFilterOptions {
  search?: string;
  ruleType?: RuleType;
  isActive?: boolean;
  stageId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DelegationFilterOptions {
  status?: DelegationStatus;
  userId?: number;
  page?: number;
  pageSize?: number;
}
