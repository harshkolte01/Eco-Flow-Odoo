/**
 * API client for Approval Rules system
 * Provides methods to interact with approval rules, conditions, approvers, and delegations
 */

import { apiFetch, ApiError } from './api';
import {
  ApprovalRule,
  Delegation,
  RuleCondition,
  RuleApprover,
  RuleFilterOptions,
  DelegationFilterOptions,
  RuleEvaluationResult,
  RuleAuditEntry,
  PaginatedResponse,
} from '@/lib/types/approvalRules';

const BASE_PATH = '/api/approval-rules';
const DELEGATIONS_PATH = '/api/delegations';

/**
 * Builds query string from filter options
 */
function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

/**
 * Approval Rules API Client
 */
export const approvalRulesClient = {
  // ==================== Rules ====================

  /**
   * List all approval rules with filters and pagination
   */
  async listRules(filters?: RuleFilterOptions) {
    const queryString = buildQueryString(filters || {});
    const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;
    const response = await apiFetch<PaginatedResponse<ApprovalRule>>(url);
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to fetch rules', 500);
    }
    return response.data || { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  },

  /**
   * Get a single approval rule by ID
   */
  async getRule(ruleId: string) {
    const response = await apiFetch<ApprovalRule>(`${BASE_PATH}/${ruleId}`);
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to fetch rule', 500);
    }
    return response.data;
  },

  /**
   * Create a new approval rule
   */
  async createRule(rule: ApprovalRule) {
    const response = await apiFetch<ApprovalRule>(BASE_PATH, {
      method: 'POST',
      body: rule,
    });
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to create rule', 500);
    }
    return response.data;
  },

  /**
   * Update an existing approval rule
   */
  async updateRule(ruleId: string, updates: Partial<ApprovalRule>) {
    const response = await apiFetch<ApprovalRule>(`${BASE_PATH}/${ruleId}`, {
      method: 'PATCH',
      body: updates,
    });
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to update rule', 500);
    }
    return response.data;
  },

  /**
   * Delete/archive an approval rule
   */
  async deleteRule(ruleId: string) {
    const response = await apiFetch<{ success: boolean }>(`${BASE_PATH}/${ruleId}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to delete rule', 500);
    }
    return response.data;
  },

  // ==================== Conditions ====================

  /**
   * Add a condition to a rule
   */
  async addCondition(ruleId: string, condition: RuleCondition) {
    const response = await apiFetch<RuleCondition>(
      `${BASE_PATH}/${ruleId}/conditions`,
      {
        method: 'POST',
        body: condition,
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to add condition', 500);
    }
    return response.data;
  },

  /**
   * Update a condition in a rule
   */
  async updateCondition(
    ruleId: string,
    conditionId: string,
    condition: Partial<RuleCondition>
  ) {
    const response = await apiFetch<RuleCondition>(
      `${BASE_PATH}/${ruleId}/conditions/${conditionId}`,
      {
        method: 'PATCH',
        body: condition,
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to update condition', 500);
    }
    return response.data;
  },

  /**
   * Delete a condition from a rule
   */
  async deleteCondition(ruleId: string, conditionId: string) {
    const response = await apiFetch<{ success: boolean }>(
      `${BASE_PATH}/${ruleId}/conditions/${conditionId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to delete condition', 500);
    }
    return response.data;
  },

  // ==================== Approvers ====================

  /**
   * Add an approver to a rule
   */
  async addApprover(ruleId: string, approver: RuleApprover) {
    const response = await apiFetch<RuleApprover>(
      `${BASE_PATH}/${ruleId}/approvers`,
      {
        method: 'POST',
        body: approver,
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to add approver', 500);
    }
    return response.data;
  },

  /**
   * Remove an approver from a rule
   */
  async removeApprover(ruleId: string, userId: number) {
    const response = await apiFetch<{ success: boolean }>(
      `${BASE_PATH}/${ruleId}/approvers/${userId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to remove approver', 500);
    }
    return response.data;
  },

  /**
   * Update an approver in a rule
   */
  async updateApprover(ruleId: string, userId: number, updates: Partial<RuleApprover>) {
    const response = await apiFetch<RuleApprover>(
      `${BASE_PATH}/${ruleId}/approvers/${userId}`,
      {
        method: 'PATCH',
        body: updates,
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to update approver', 500);
    }
    return response.data;
  },

  // ==================== History & Evaluation ====================

  /**
   * Get the audit history of a rule
   */
  async getRuleHistory(ruleId: string) {
    const response = await apiFetch<RuleAuditEntry[]>(`${BASE_PATH}/${ruleId}/history`);
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to fetch rule history', 500);
    }
    return response.data || [];
  },

  /**
   * Test a rule with mock ECO data
   */
  async testRule(ruleId: string, mockEcoData: Record<string, any>) {
    const response = await apiFetch<{
      conditionsMatched: boolean;
      approversTriggered: RuleApprover[];
    }>(`${BASE_PATH}/${ruleId}/test`, {
      method: 'POST',
      body: { ecoData: mockEcoData },
    });
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to test rule', 500);
    }
    return response.data;
  },

  /**
   * Evaluate all rules for an ECO
   */
  async evaluateRulesForEco(ecoId: number) {
    const response = await apiFetch<RuleEvaluationResult>(`${BASE_PATH}/evaluate`, {
      method: 'POST',
      body: { ecoId },
    });
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to evaluate rules', 500);
    }
    return response.data;
  },

  // ==================== Delegations ====================

  /**
   * List all delegations with filters
   */
  async listDelegations(filters?: DelegationFilterOptions) {
    const queryString = buildQueryString(filters || {});
    const url = queryString
      ? `${DELEGATIONS_PATH}?${queryString}`
      : DELEGATIONS_PATH;
    const response = await apiFetch<PaginatedResponse<Delegation>>(url);
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to fetch delegations', 500);
    }
    return response.data || { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  },

  /**
   * Get active delegations for a specific user
   */
  async getActiveDelegationsForUser(userId: number) {
    const response = await apiFetch<Delegation[]>(
      `${DELEGATIONS_PATH}/active-for-user/${userId}`
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to fetch user delegations', 500);
    }
    return response.data || [];
  },

  /**
   * Create a new delegation
   */
  async createDelegation(delegation: Delegation) {
    const response = await apiFetch<Delegation>(DELEGATIONS_PATH, {
      method: 'POST',
      body: delegation,
    });
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to create delegation', 500);
    }
    return response.data;
  },

  /**
   * Revoke a delegation
   */
  async revokeDelegation(delegationId: string) {
    const response = await apiFetch<Delegation>(
      `${DELEGATIONS_PATH}/${delegationId}/revoke`,
      {
        method: 'PATCH',
        body: {},
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to revoke delegation', 500);
    }
    return response.data;
  },

  /**
   * Delete a delegation permanently
   */
  async deleteDelegation(delegationId: string) {
    const response = await apiFetch<{ success: boolean }>(
      `${DELEGATIONS_PATH}/${delegationId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.success) {
      throw new ApiError(response.message || 'Failed to delete delegation', 500);
    }
    return response.data;
  },
};

export default approvalRulesClient;
