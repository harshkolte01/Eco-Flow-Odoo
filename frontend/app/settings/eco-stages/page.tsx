'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { apiFetch, ApiError } from '@/lib/api';

interface Stage {
  id: number;
  name: string;
  sequenceOrder: number;
  approvalRequired: boolean;
  approverCount?: number;
  ecoCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function EcoStagesPage() {
  return <EcoStagesContent />;
}

function EcoStagesContent() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteStageId, setDeleteStageId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    sequenceOrder: '',
    approvalRequired: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editStageId, setEditStageId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    sequenceOrder: '',
    approvalRequired: false
  });

  const loadStages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ stages: Stage[] }>('/api/stages');
      setStages(response.data?.stages || []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load stages';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  const handleViewStage = (stageId: number) => {
    router.push(`/settings/eco-stages/${stageId}`);
  };

  const handleDeleteStage = async (stageId: number) => {
    try {
      await apiFetch(`/api/stages/${stageId}`, {
        method: 'DELETE',
      });
      await loadStages();
      setDeleteStageId(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete stage';
      alert(message);
    }
  };

  const handleCreateStage = async () => {
    // Validation
    if (!createForm.name.trim()) {
      alert('Stage name is required');
      return;
    }
    if (!createForm.sequenceOrder || parseInt(createForm.sequenceOrder) <= 0) {
      alert('Valid sequence order is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/api/stages', {
        method: 'POST',
        body: {
          name: createForm.name.trim(),
          sequenceOrder: parseInt(createForm.sequenceOrder),
          approvalRequired: createForm.approvalRequired
        },
      });
      await loadStages();
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', sequenceOrder: '', approvalRequired: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create stage';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStage = (stage: Stage) => {
    setEditStageId(stage.id);
    setEditForm({
      name: stage.name,
      sequenceOrder: stage.sequenceOrder.toString(),
      approvalRequired: stage.approvalRequired
    });
  };

  const handleUpdateStage = async () => {
    if (!editStageId) return;

    // Validation
    if (!editForm.name.trim()) {
      alert('Stage name is required');
      return;
    }
    if (!editForm.sequenceOrder || parseInt(editForm.sequenceOrder) <= 0) {
      alert('Valid sequence order is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/stages/${editStageId}`, {
        method: 'PATCH',
        body: {
          name: editForm.name.trim(),
          sequenceOrder: parseInt(editForm.sequenceOrder),
          approvalRequired: editForm.approvalRequired
        },
      });
      await loadStages();
      setEditStageId(null);
      setEditForm({ name: '', sequenceOrder: '', approvalRequired: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update stage';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ECO Stages</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure approval workflow stages for Engineering Change Orders
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Stage
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">Loading stages...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Stages List */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sequence
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stage Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Approval Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Approvers
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ECOs
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {stages.map((stage) => (
                <tr key={stage.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {stage.sequenceOrder}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{stage.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {stage.approvalRequired ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Approval Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        Validation
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{stage.approverCount || 0}</span>
                      {stage.approverCount && stage.approverCount > 0 ? (
                        <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {stage.ecoCount || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewStage(stage.id)}
                      className="text-emerald-600 hover:text-emerald-900 mr-4"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleEditStage(stage)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    {stage.ecoCount === 0 && (
                      <button
                        onClick={() => setDeleteStageId(stage.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stages.length === 0 && (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stages configured</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first ECO stage.</p>
              <div className="mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Stage
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Delete Stage</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this stage? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteStageId(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteStageId && handleDeleteStage(deleteStageId)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Stage Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsCreateModalOpen(false);
              setCreateForm({ name: '', sequenceOrder: '', approvalRequired: false });
            }
          }}
        >
          <div className="max-w-lg w-full rounded-lg bg-white shadow-2xl transform transition-all">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create New ECO Stage</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a new stage to the ECO approval workflow
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!isSubmitting) {
                      setIsCreateModalOpen(false);
                      setCreateForm({ name: '', sequenceOrder: '', approvalRequired: false });
                    }
                  }}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-4 space-y-5">
              <div>
                <label htmlFor="stage-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Stage Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="stage-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Review, Validation, Approval"
                  disabled={isSubmitting}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="sequence-order" className="block text-sm font-medium text-gray-700 mb-1">
                  Sequence Order <span className="text-red-500">*</span>
                </label>
                <input
                  id="sequence-order"
                  type="number"
                  min="1"
                  step="1"
                  value={createForm.sequenceOrder}
                  onChange={(e) => setCreateForm({ ...createForm, sequenceOrder: e.target.value })}
                  placeholder="Enter a positive number"
                  disabled={isSubmitting}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  <svg className="inline h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lower numbers appear first in the workflow sequence
                </p>
              </div>

              <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.approvalRequired}
                    onChange={(e) => setCreateForm({ ...createForm, approvalRequired: e.target.checked })}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      Approval Required
                    </span>
                    <p className="mt-0.5 text-xs text-gray-600">
                      When enabled, ECOs must receive approval before proceeding to the next stage. Configure approvers after creating the stage.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateForm({ name: '', sequenceOrder: '', approvalRequired: false });
                  }}
                  disabled={isSubmitting}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStage}
                  disabled={isSubmitting || !createForm.name.trim() || !createForm.sequenceOrder}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Stage
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stage Modal */}
      {editStageId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setEditStageId(null);
              setEditForm({ name: '', sequenceOrder: '', approvalRequired: false });
            }
          }}
        >
          <div className="max-w-lg w-full rounded-lg bg-white shadow-2xl transform transition-all">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Edit ECO Stage</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update stage details in the ECO approval workflow
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!isSubmitting) {
                      setEditStageId(null);
                      setEditForm({ name: '', sequenceOrder: '', approvalRequired: false });
                    }
                  }}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-4 space-y-5">
              <div>
                <label htmlFor="edit-stage-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Stage Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-stage-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Review, Validation, Approval"
                  disabled={isSubmitting}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="edit-sequence-order" className="block text-sm font-medium text-gray-700 mb-1">
                  Sequence Order <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-sequence-order"
                  type="number"
                  min="1"
                  step="1"
                  value={editForm.sequenceOrder}
                  onChange={(e) => setEditForm({ ...editForm, sequenceOrder: e.target.value })}
                  placeholder="Enter a positive number"
                  disabled={isSubmitting}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  <svg className="inline h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lower numbers appear first in the workflow sequence
                </p>
              </div>

              <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.approvalRequired}
                    onChange={(e) => setEditForm({ ...editForm, approvalRequired: e.target.checked })}
                    disabled={isSubmitting}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      Approval Required
                    </span>
                    <p className="mt-0.5 text-xs text-gray-600">
                      When enabled, ECOs must receive approval before proceeding to the next stage. Configure approvers after updating the stage.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditStageId(null);
                    setEditForm({ name: '', sequenceOrder: '', approvalRequired: false });
                  }}
                  disabled={isSubmitting}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStage}
                  disabled={isSubmitting || !editForm.name.trim() || !editForm.sequenceOrder}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Stage
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
