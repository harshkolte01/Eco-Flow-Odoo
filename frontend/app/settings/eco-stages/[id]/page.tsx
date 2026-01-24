'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { apiFetch, ApiError } from '@/lib/api';

interface Stage {
  id: number;
  name: string;
  sequenceOrder: number;
  approvalRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StageApprover {
  id: number;
  stageId: number;
  userId: number;
  approvalCategory: 'required' | 'optional';
  user: {
    id: number;
    name: string;
    email: string;
    loginId: string;
  };
  createdAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  loginId: string;
}

export default function StageDetailPage() {
  return <StageDetailContent />;
}

function StageDetailContent() {
  const router = useRouter();
  const params = useParams();
  const stageId = params?.id as string;

  const [stage, setStage] = useState<Stage | null>(null);
  const [approvers, setApprovers] = useState<StageApprover[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddApproverOpen, setIsAddApproverOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'required' | 'optional'>('required');
  const [deleteApproverId, setDeleteApproverId] = useState<number | null>(null);

  const loadStageData = useCallback(async () => {
    if (!stageId) return;
    
    setLoading(true);
    setError(null);
    try {
      const [stageRes, approversRes, usersRes] = await Promise.all([
        apiFetch<{ stages: Stage[] }>('/api/stages'),
        apiFetch<{ approvers: StageApprover[] }>(`/api/stages/${stageId}/approvers`),
        apiFetch<{ users: User[] }>('/api/users/lookup'),
      ]);

      const currentStage = stageRes.data?.stages.find(s => s.id === parseInt(stageId));
      setStage(currentStage || null);
      setApprovers(approversRes.data?.approvers || []);
      setAvailableUsers(usersRes.data?.users || []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load stage data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [stageId]);

  useEffect(() => {
    loadStageData();
  }, [loadStageData]);

  const handleAddApprover = async () => {
    if (!selectedUserId) return;

    try {
      await apiFetch(`/api/stages/${stageId}/approvers`, {
        method: 'POST',
        body: {
          userId: selectedUserId,
          approvalCategory: selectedCategory,
        },
      });
      await loadStageData();
      setIsAddApproverOpen(false);
      setSelectedUserId(null);
      setSelectedCategory('required');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to add approver';
      alert(message);
    }
  };

  const handleUpdateCategory = async (approverId: number, newCategory: 'required' | 'optional') => {
    try {
      await apiFetch(`/api/stages/${stageId}/approvers/${approverId}`, {
        method: 'PATCH',
        body: {
          approvalCategory: newCategory,
        },
      });
      await loadStageData();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update approver category';
      alert(message);
    }
  };

  const handleDeleteApprover = async (approverId: number) => {
    try {
      await apiFetch(`/api/stages/${stageId}/approvers/${approverId}`, {
        method: 'DELETE',
      });
      await loadStageData();
      setDeleteApproverId(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to remove approver';
      alert(message);
    }
  };

  const assignedUserIds = new Set(approvers.map(a => a.userId));
  const unassignedUsers = availableUsers.filter(u => !assignedUserIds.has(u.id));

  const requiredApprovers = approvers.filter(a => a.approvalCategory === 'required');
  const optionalApprovers = approvers.filter(a => a.approvalCategory === 'optional');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading stage details...</p>
        </div>
      </div>
    );
  }

  if (error || !stage) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error || 'Stage not found'}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/settings/eco-stages')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Stages
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700">
                {stage.sequenceOrder}
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{stage.name}</h1>
                <p className="text-sm text-gray-500">
                  {stage.approvalRequired ? 'Approval Required' : 'Validation Only'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approvers Section */}
      <div className="space-y-6">
        {/* Required Approvers */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Required Approvers</h2>
                <p className="mt-1 text-sm text-gray-500">
                  All required approvers must approve before ECO can proceed to next stage
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-800">
                {requiredApprovers.length} Required
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {requiredApprovers.map((approver) => (
              <div key={approver.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                    <span className="text-sm font-semibold text-rose-700">
                      {approver.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{approver.user.name}</p>
                    <p className="text-sm text-gray-500">{approver.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateCategory(approver.id, 'optional')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Make Optional
                  </button>
                  <button
                    onClick={() => setDeleteApproverId(approver.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {requiredApprovers.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No required approvers configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Optional Approvers */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Optional Approvers</h2>
                <p className="mt-1 text-sm text-gray-500">
                  ECO can proceed without optional approvals
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {optionalApprovers.length} Optional
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {optionalApprovers.map((approver) => (
              <div key={approver.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-700">
                      {approver.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{approver.user.name}</p>
                    <p className="text-sm text-gray-500">{approver.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateCategory(approver.id, 'required')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Make Required
                  </button>
                  <button
                    onClick={() => setDeleteApproverId(approver.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {optionalApprovers.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-500">No optional approvers configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Approver Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsAddApproverOpen(true)}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Approver
          </button>
        </div>
      </div>

      {/* Add Approver Modal */}
      {isAddApproverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl w-full mx-4">
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
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="required"
                      checked={selectedCategory === 'required'}
                      onChange={(e) => setSelectedCategory(e.target.value as 'required')}
                      className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <span className="font-medium">Required</span> - Approval mandatory to proceed
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="optional"
                      checked={selectedCategory === 'optional'}
                      onChange={(e) => setSelectedCategory(e.target.value as 'optional')}
                      className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      <span className="font-medium">Optional</span> - Can proceed without approval
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAddApproverOpen(false);
                  setSelectedUserId(null);
                  setSelectedCategory('required');
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApprover}
                disabled={!selectedUserId}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Approver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteApproverId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Remove Approver</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to remove this approver from this stage?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteApproverId(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteApproverId && handleDeleteApprover(deleteApproverId)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
