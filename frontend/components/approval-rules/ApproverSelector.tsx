'use client';

import { useState, useEffect } from 'react';
import { RuleApprover, ApprovalCategory } from '@/lib/types/approvalRules';

interface ApproverSelectorProps {
  approvers: RuleApprover[];
  onChange: (approvers: RuleApprover[]) => void;
}

interface User {
  id: number;
  name: string;
  email: string;
  loginId: string;
  role?: {
    name: string;
  };
}

export function ApproverSelector({ approvers, onChange }: ApproverSelectorProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ApprovalCategory>(ApprovalCategory.REQUIRED);
  const [canDelegate, setCanDelegate] = useState(false);
  const [escalationDays, setEscalationDays] = useState<number>(0);

  // Load available users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await fetch('/api/users/lookup', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.success && data.data?.users) {
          setAvailableUsers(data.data.users);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const addApprover = () => {
    if (!selectedUserId) return;

    const newApprover: RuleApprover = {
      userId: selectedUserId,
      approvalCategory: selectedCategory,
      canDelegate: canDelegate,
      escalationThresholdDays: escalationDays > 0 ? escalationDays : undefined,
    };

    onChange([...approvers, newApprover]);

    // Reset form
    setSelectedUserId(null);
    setSelectedCategory(ApprovalCategory.REQUIRED);
    setCanDelegate(false);
    setEscalationDays(0);
    setIsAddModalOpen(false);
  };

  const removeApprover = (index: number) => {
    onChange(approvers.filter((_, i) => i !== index));
  };

  const updateApprover = (index: number, field: keyof RuleApprover, value: any) => {
    const newApprovers = [...approvers];
    newApprovers[index] = { ...newApprovers[index], [field]: value };
    onChange(newApprovers);
  };

  const getUserById = (userId: number): User | undefined => {
    return availableUsers.find((u) => u.id === userId);
  };

  const eligibleUsers = availableUsers.filter((user) => {
    if (!user.role?.name) {
      return true;
    }
    return user.role.name === 'approver' || user.role.name === 'admin';
  });

  const assignedUserIds = new Set(approvers.map((a) => a.userId));
  const unassignedUsers = eligibleUsers.filter((u) => !assignedUserIds.has(u.id));

  const requiredApprovers = approvers.filter((a) => a.approvalCategory === ApprovalCategory.REQUIRED);
  const optionalApprovers = approvers.filter((a) => a.approvalCategory === ApprovalCategory.OPTIONAL);

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
        <span className="ml-2 text-sm text-gray-500">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Required Approvers */}
      <div className="rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Required Approvers</h3>
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
              {requiredApprovers.length} Required
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {requiredApprovers.map((approver, index) => {
            const user = getUserById(approver.userId);
            const actualIndex = approvers.findIndex((a) => a === approver);
            return (
              <div key={actualIndex} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
                      <span className="text-sm font-semibold text-rose-700">
                        {user?.name.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user?.name || `User ${approver.userId}`}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateApprover(actualIndex, 'approvalCategory', ApprovalCategory.OPTIONAL)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Make Optional
                    </button>
                    <button
                      type="button"
                      onClick={() => removeApprover(actualIndex)}
                      className="text-xs text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {requiredApprovers.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No required approvers configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Optional Approvers */}
      <div className="rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Optional Approvers</h3>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {optionalApprovers.length} Optional
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {optionalApprovers.map((approver, index) => {
            const user = getUserById(approver.userId);
            const actualIndex = approvers.findIndex((a) => a === approver);
            return (
              <div key={actualIndex} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-semibold text-blue-700">
                        {user?.name.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user?.name || `User ${approver.userId}`}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateApprover(actualIndex, 'approvalCategory', ApprovalCategory.REQUIRED)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      Make Required
                    </button>
                    <button
                      type="button"
                      onClick={() => removeApprover(actualIndex)}
                      className="text-xs text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {optionalApprovers.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No optional approvers configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Approver Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          disabled={unassignedUsers.length === 0}
          className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Approver
        </button>
      </div>

      {/* Add Approver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Add Approver</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select a user...</option>
                  {unassignedUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Approval Category</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-start">
                    <input
                      type="radio"
                      value={ApprovalCategory.REQUIRED}
                      checked={selectedCategory === ApprovalCategory.REQUIRED}
                      onChange={(e) => setSelectedCategory(e.target.value as ApprovalCategory)}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2">
                      <span className="block text-sm font-medium text-gray-700">Required</span>
                      <span className="block text-xs text-gray-500">Approval mandatory to proceed</span>
                    </span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="radio"
                      value={ApprovalCategory.OPTIONAL}
                      checked={selectedCategory === ApprovalCategory.OPTIONAL}
                      onChange={(e) => setSelectedCategory(e.target.value as ApprovalCategory)}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2">
                      <span className="block text-sm font-medium text-gray-700">Optional</span>
                      <span className="block text-xs text-gray-500">Can proceed without approval</span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={canDelegate}
                    onChange={(e) => setCanDelegate(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow delegation</span>
                </label>
                <p className="ml-6 mt-1 text-xs text-gray-500">
                  User can delegate their approval to another user
                </p>
              </div>

              <div>
                <label htmlFor="escalation" className="block text-sm font-medium text-gray-700">
                  Escalation Threshold (days)
                </label>
                <input
                  id="escalation"
                  type="number"
                  min="0"
                  value={escalationDays}
                  onChange={(e) => setEscalationDays(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="0 = no escalation"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Days before approval escalates (0 = no escalation)
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedUserId(null);
                  setSelectedCategory(ApprovalCategory.REQUIRED);
                  setCanDelegate(false);
                  setEscalationDays(0);
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addApprover}
                disabled={!selectedUserId}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Add Approver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
