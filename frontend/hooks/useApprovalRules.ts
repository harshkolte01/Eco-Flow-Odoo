/**
 * Custom React hooks for Approval Rules API
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ApprovalRule,
  Delegation,
  DelegationStatus,
  RuleCondition,
  RuleApprover,
  RuleFilterOptions,
  DelegationFilterOptions,
  RuleEvaluationResult,
  RuleAuditEntry,
  PaginatedResponse,
} from '@/lib/types/approvalRules';
import { approvalRulesClient } from '@/lib/api/approvalRulesClient';

// ==================== useRules ====================

export interface UseRulesOptions {
  initialFilters?: RuleFilterOptions;
  autoFetch?: boolean;
}

export function useRules(options: UseRulesOptions = {}) {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(
    async (filters?: RuleFilterOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await approvalRulesClient.listRules(filters);
        setRules(result.data || []);
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch rules';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createRule = useCallback(
    async (rule: ApprovalRule) => {
      setLoading(true);
      setError(null);
      try {
        const result = await approvalRulesClient.createRule(rule);
        // Refresh list
        await fetchRules();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create rule';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchRules]
  );

  const updateRule = useCallback(
    async (ruleId: string, updates: Partial<ApprovalRule>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await approvalRulesClient.updateRule(ruleId, updates);
        // Update in list
        if (result) {
          setRules(rules.map((r) => (r.id === ruleId ? result : r)));
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update rule';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [rules]
  );

  const deleteRule = useCallback(
    async (ruleId: string) => {
      setLoading(true);
      setError(null);
      try {
        await approvalRulesClient.deleteRule(ruleId);
        // Remove from list
        setRules(rules.filter((r) => r.id !== ruleId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete rule';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [rules]
  );

  return {
    rules,
    pagination,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  };
}

// ==================== useRule ====================

export interface UseRuleOptions {
  ruleId?: string;
  autoFetch?: boolean;
}

export function useRule(options: UseRuleOptions = {}) {
  const { ruleId: initialRuleId, autoFetch = true } = options;
  const [rule, setRule] = useState<ApprovalRule | null>(null);
  const [history, setHistory] = useState<RuleAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRule = useCallback(async (ruleId: string) => {
    if (!ruleId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await approvalRulesClient.getRule(ruleId);
      setRule(result || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rule';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount if ruleId is provided
  useEffect(() => {
    if (autoFetch && initialRuleId) {
      fetchRule(initialRuleId);
    }
  }, [initialRuleId, fetchRule, autoFetch]);

  const fetchHistory = useCallback(async (ruleId: string) => {
    if (!ruleId) return;
    setError(null);
    try {
      const result = await approvalRulesClient.getRuleHistory(ruleId);
      setHistory(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(message);
    }
  }, []);

  const testRule = useCallback(
    async (ruleId: string, mockData: Record<string, any>) => {
      setError(null);
      try {
        const result = await approvalRulesClient.testRule(ruleId, mockData);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to test rule';
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateRule = useCallback(
    async (ruleId: string, updates: Partial<ApprovalRule>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await approvalRulesClient.updateRule(ruleId, updates);
        setRule(result || null);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update rule';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addCondition = useCallback(
    async (ruleId: string, condition: RuleCondition) => {
      setError(null);
      try {
        await approvalRulesClient.addCondition(ruleId, condition);
        // Refresh rule
        await fetchRule(ruleId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add condition';
        setError(message);
        throw err;
      }
    },
    [fetchRule]
  );

  const updateCondition = useCallback(
    async (ruleId: string, conditionId: string, updates: Partial<RuleCondition>) => {
      setError(null);
      try {
        await approvalRulesClient.updateCondition(ruleId, conditionId, updates);
        // Refresh rule
        await fetchRule(ruleId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update condition';
        setError(message);
        throw err;
      }
    },
    [fetchRule]
  );

  const deleteCondition = useCallback(
    async (ruleId: string, conditionId: string) => {
      setError(null);
      try {
        await approvalRulesClient.deleteCondition(ruleId, conditionId);
        // Refresh rule
        await fetchRule(ruleId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete condition';
        setError(message);
        throw err;
      }
    },
    [fetchRule]
  );

  const addApprover = useCallback(
    async (ruleId: string, approver: RuleApprover) => {
      setError(null);
      try {
        await approvalRulesClient.addApprover(ruleId, approver);
        // Refresh rule
        await fetchRule(ruleId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add approver';
        setError(message);
        throw err;
      }
    },
    [fetchRule]
  );

  const removeApprover = useCallback(
    async (ruleId: string, userId: number) => {
      setError(null);
      try {
        await approvalRulesClient.removeApprover(ruleId, userId);
        // Refresh rule
        await fetchRule(ruleId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove approver';
        setError(message);
        throw err;
      }
    },
    [fetchRule]
  );

  const updateApprover = useCallback(
    async (ruleId: string, userId: number, updates: Partial<RuleApprover>) => {
      setError(null);
      try {
        await approvalRulesClient.updateApprover(ruleId, userId, updates);
        // Refresh rule
        await fetchRule(ruleId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update approver';
        setError(message);
        throw err;
      }
    },
    [fetchRule]
  );

  return {
    rule,
    history,
    loading,
    error,
    fetchRule,
    refetch: fetchRule, // Alias for consistency
    fetchHistory,
    testRule,
    updateRule,
    addCondition,
    updateCondition,
    deleteCondition,
    addApprover,
    removeApprover,
    updateApprover,
  };
}

// ==================== useDelegations ====================

export interface UseDelegationsOptions {
  initialFilters?: DelegationFilterOptions;
  autoFetch?: boolean;
}

export function useDelegations(options: UseDelegationsOptions = {}) {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDelegations = useCallback(
    async (filters?: DelegationFilterOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await approvalRulesClient.listDelegations(filters);
        setDelegations(result.data || []);
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch delegations';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createDelegation = useCallback(
    async (delegation: Delegation) => {
      setLoading(true);
      setError(null);
      try {
        const result = await approvalRulesClient.createDelegation(delegation);
        // Refresh list
        await fetchDelegations();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create delegation';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDelegations]
  );

  const revokeDelegation = useCallback(
    async (delegationId: string) => {
      setLoading(true);
      setError(null);
      try {
        await approvalRulesClient.revokeDelegation(delegationId);
        // Update in list
        setDelegations(
          delegations.map((d) =>
            d.id === delegationId ? { ...d, status: DelegationStatus.REVOKED } : d
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to revoke delegation';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [delegations]
  );

  const deleteDelegation = useCallback(
    async (delegationId: string) => {
      setLoading(true);
      setError(null);
      try {
        await approvalRulesClient.deleteDelegation(delegationId);
        // Remove from list
        setDelegations(delegations.filter((d) => d.id !== delegationId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete delegation';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [delegations]
  );

  const getActiveDelegationsForUser = useCallback(async (userId: number) => {
    setError(null);
    try {
      const result = await approvalRulesClient.getActiveDelegationsForUser(userId);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch user delegations';
      setError(message);
      throw err;
    }
  }, []);

  return {
    delegations,
    pagination,
    loading,
    error,
    fetchDelegations,
    createDelegation,
    revokeDelegation,
    deleteDelegation,
    getActiveDelegationsForUser,
  };
}

// ==================== useRuleEvaluation ====================

export function useRuleEvaluation() {
  const [result, setResult] = useState<RuleEvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluateRulesForEco = useCallback(async (ecoId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await approvalRulesClient.evaluateRulesForEco(ecoId);
      setResult(result || null);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate rules';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    result,
    loading,
    error,
    evaluateRulesForEco,
  };
}
