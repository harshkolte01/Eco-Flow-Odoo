'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRule } from '@/hooks/useApprovalRules';
import { approvalRulesClient } from '@/lib/api/approvalRulesClient';
import { ApprovalCategory, RuleType } from '@/lib/types/approvalRules';
import { ApiError } from '@/lib/api';

interface Stage {
  id: number;
  name: string;
  sequenceOrder: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function RuleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params?.id as string;

  const { rule, loading, error, fetchRule } = useRule({ ruleId, autoFetch: true });
  const [stages, setStages] = useState<Stage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load stages and users for display
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoadingMetadata(true);
        const [stagesRes, usersRes] = await Promise.all([
          fetch('/api/stages', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
          fetch('/api/users/lookup', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        const stagesData = await stagesRes.json();
        const usersData = await usersRes.json();

        if (stagesData.success && stagesData.data?.stages) {
          setStages(stagesData.data.stages);
        }
        if (usersData.success && usersData.data?.users) {
          setUsers(usersData.data.users);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, []);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await approvalRulesClient.deleteRule(ruleId);
      router.push('/settings/approval-rules');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete rule';
      alert(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleToggleActive = async () => {
    if (!rule) return;

    try {
      await approvalRulesClient.updateRule(ruleId, {
        isActive: !rule.isActive,
      });
      fetchRule(ruleId);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update rule status';
      alert(message);
    }
  };

  const getStageById = (stageId: number) => {
    return stages.find((s) => s.id === stageId);
  };

  const getUserById = (userId: number) => {
    return users.find((u) => u.id === userId);
  };

  if (loading || loadingMetadata) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading rule details...</p>
        </div>
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error || 'Rule not found'}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const requiredApprovers = rule.approvers.filter((a) => a.approvalCategory === ApprovalCategory.REQUIRED);
  const optionalApprovers = rule.approvers.filter((a) => a.approvalCategory === ApprovalCategory.OPTIONAL);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/settings/approval-rules')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Approval Rules
        </button>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{rule.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  rule.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {rule.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {rule.description && (
              <p className="mt-2 text-sm text-gray-500">{rule.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleActive}
              className={`rounded-md border px-4 py-2 text-sm font-medium ${
                rule.isActive
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {rule.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => router.push(`/settings/approval-rules/${ruleId}/edit`)}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Edit Rule
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Rule Details */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Rule Configuration</h2>
          </div>
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Rule Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {rule.ruleType === RuleType.STAGE_RULE ? 'Stage-Based' : 'Condition-Based'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1 text-sm text-gray-900">{rule.priority}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {rule.createdAt ? new Date(rule.createdAt).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {rule.updatedAt ? new Date(rule.updatedAt).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Applicable Stages */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Applicable Stages</h2>
          </div>
          <div className="px-6 py-6">
            <div className="flex flex-wrap gap-2">
              {rule.stageIds.map((stageId) => {
                const stage = getStageById(stageId);
                return (
                  <span
                    key={stageId}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-900">
                      {stage?.sequenceOrder || stageId}
                    </span>
                    {stage?.name || `Stage ${stageId}`}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conditions (if condition-based rule) */}
        {rule.ruleType === RuleType.CONDITION_RULE && rule.conditions.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Conditions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {rule.conditions.map((condition, index) => (
                <div key={index} className="px-6 py-4">
                  {index > 0 && condition.logicalOperator && (
                    <div className="mb-2">
                      <span className="inline-flex items-center rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                        {condition.logicalOperator}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">{condition.fieldName}</span>
                    <span className="text-gray-500">{condition.operator}</span>
                    <span className="font-medium text-gray-900">
                      {Array.isArray(condition.fieldValue)
                        ? condition.fieldValue.join(', ')
                        : String(condition.fieldValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Approvers */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Required Approvers</h2>
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-800">
                {requiredApprovers.length} Required
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {requiredApprovers.map((approver, index) => {
              const user = getUserById(approver.userId);
              return (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                      <span className="text-sm font-semibold text-rose-700">
                        {user?.name.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || `User ${approver.userId}`}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {approver.canDelegate && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Can Delegate
                          </span>
                        )}
                        {approver.escalationThresholdDays && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Escalates in {approver.escalationThresholdDays}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {requiredApprovers.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No required approvers configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Optional Approvers */}
        {optionalApprovers.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Optional Approvers</h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {optionalApprovers.length} Optional
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {optionalApprovers.map((approver, index) => {
                const user = getUserById(approver.userId);
                return (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm font-semibold text-blue-700">
                          {user?.name.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name || `User ${approver.userId}`}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {approver.canDelegate && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              Can Delegate
                            </span>
                          )}
                          {approver.escalationThresholdDays && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Escalates in {approver.escalationThresholdDays}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Delete Approval Rule</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this approval rule? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
