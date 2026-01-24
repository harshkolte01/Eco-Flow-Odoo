'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface StageItem {
  id: number;
  name: string;
  sequenceOrder: number;
  approvalRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StageDraft {
  id: number;
  name: string;
  sequenceOrder: string;
  approvalRequired: boolean;
}

const toStageDraft = (stage: StageItem): StageDraft => ({
  id: stage.id,
  name: stage.name,
  sequenceOrder: String(stage.sequenceOrder),
  approvalRequired: stage.approvalRequired
});

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'approvals' ? 'approvals' : 'stages');
  const [stages, setStages] = useState<StageItem[]>([]);
  const [drafts, setDrafts] = useState<StageDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingStageId, setSavingStageId] = useState<number | null>(null);
  const [newStage, setNewStage] = useState({ name: '', sequenceOrder: '', approvalRequired: false });

  const isAdmin = user?.role === 'admin';
  const isApprovalTab = activeTab === 'approvals';

  const loadStages = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiFetch<{ stages: StageItem[] }>('/api/stages');
      const list = response.data?.stages ?? [];
      setStages(list);
      setDrafts(list.map(toStageDraft));
    } catch (error) {
      const messageText = error instanceof ApiError ? error.message : 'Failed to load ECO stages';
      setMessage({ type: 'error', text: messageText });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadStages();
  }, [user?.role]);

  useEffect(() => {
    if (tabParam === 'approvals') {
      setActiveTab('approvals');
    } else {
      setActiveTab('stages');
    }
  }, [tabParam]);

  const changeTab = (tab: 'stages' | 'approvals') => {
    setActiveTab(tab);
    router.push(`/settings?tab=${tab}`);
  };

  const updateDraft = (id: number, field: keyof StageDraft, value: string | boolean) => {
    setDrafts((prev) =>
      prev.map((draft) => (draft.id === id ? { ...draft, [field]: value } : draft))
    );
  };

  const handleSaveStage = async (stageId: number) => {
    if (!isAdmin) return;
    const draft = drafts.find((item) => item.id === stageId);
    if (!draft) return;

    setSavingStageId(stageId);
    setMessage(null);
    try {
      await apiFetch(`/api/stages/${stageId}`, {
        method: 'PATCH',
        body: {
          name: draft.name,
          sequenceOrder: Number(draft.sequenceOrder),
          approvalRequired: draft.approvalRequired
        }
      });
      setMessage({ type: 'success', text: 'Stage updated successfully.' });
      await loadStages();
    } catch (error) {
      const messageText = error instanceof ApiError ? error.message : 'Failed to update stage';
      setMessage({ type: 'error', text: messageText });
    } finally {
      setSavingStageId(null);
    }
  };

  const handleCreateStage = async () => {
    if (!isAdmin) return;
    setCreating(true);
    setMessage(null);
    try {
      await apiFetch('/api/stages', {
        method: 'POST',
        body: {
          name: newStage.name,
          sequenceOrder: Number(newStage.sequenceOrder),
          approvalRequired: newStage.approvalRequired
        }
      });
      setNewStage({ name: '', sequenceOrder: '', approvalRequired: false });
      setMessage({ type: 'success', text: 'Stage created successfully.' });
      await loadStages();
    } catch (error) {
      const messageText = error instanceof ApiError ? error.message : 'Failed to create stage';
      setMessage({ type: 'error', text: messageText });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    if (!isAdmin) return;
    setMessage(null);
    try {
      await apiFetch(`/api/stages/${stageId}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Stage removed successfully.' });
      await loadStages();
    } catch (error) {
      const messageText = error instanceof ApiError ? error.message : 'Failed to delete stage';
      setMessage({ type: 'error', text: messageText });
    }
  };

  const stageRows = useMemo(() => {
    return drafts.map((draft) => {
      const stage = stages.find((item) => item.id === draft.id);
      return { draft, stage };
    });
  }, [drafts, stages]);

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="flex-1 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-sm text-gray-600">
                Configure ECO stages and approval requirements.
              </p>
            </div>

            {!isAdmin && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-800 shadow-sm">
                You do not have permission to manage ECO stages or approval rules.
              </div>
            )}

            {isAdmin && (
              <>

              <div className="mb-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeTab('stages')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === 'stages'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  ECO Stages
                </button>
                <button
                  type="button"
                  onClick={() => changeTab('approvals')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === 'approvals'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  Approval Rules
                </button>
              </div>

              {message && (
                <div
                  className={`mb-6 rounded-md border px-3 py-2 text-sm ${
                    message.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

            {isAdmin && activeTab === 'stages' && (
              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Add Stage</h2>
                <div className="grid gap-3 sm:grid-cols-4">
                  <input
                    type="text"
                    value={newStage.name}
                    onChange={(event) => setNewStage((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Stage name"
                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <input
                    type="number"
                    value={newStage.sequenceOrder}
                    onChange={(event) => setNewStage((prev) => ({ ...prev, sequenceOrder: event.target.value }))}
                    placeholder="Sequence"
                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={newStage.approvalRequired}
                      onChange={(event) => setNewStage((prev) => ({ ...prev, approvalRequired: event.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Approval required
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateStage}
                    disabled={creating}
                    className="h-10 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    Add stage
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className={`grid gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${isApprovalTab ? 'grid-cols-8' : 'grid-cols-12'}`}>
                <div className={isApprovalTab ? 'col-span-4' : 'col-span-5'}>Stage</div>
                {!isApprovalTab && <div className="col-span-2">Sequence</div>}
                <div className={isApprovalTab ? 'col-span-2' : 'col-span-3'}>Approval Required</div>
                <div className={isApprovalTab ? 'col-span-2 text-right' : 'col-span-2 text-right'}>Actions</div>
              </div>

              {loading ? (
                <div className="px-6 py-6 text-sm text-gray-500">Loading stages...</div>
              ) : stageRows.length === 0 ? (
                <div className="px-6 py-6 text-sm text-gray-500">No stages configured.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stageRows.map(({ draft, stage }) => (
                    <div key={draft.id} className={`grid gap-4 px-6 py-4 ${isApprovalTab ? 'grid-cols-8' : 'grid-cols-12'}`}>
                      <div className={isApprovalTab ? 'col-span-4' : 'col-span-5'}>
                        {isAdmin ? (
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(event) => updateDraft(draft.id, 'name', event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{draft.name}</p>
                        )}
                      </div>
                      {!isApprovalTab && (
                        <div className="col-span-2">
                          {isAdmin ? (
                            <input
                              type="number"
                              value={draft.sequenceOrder}
                              onChange={(event) => updateDraft(draft.id, 'sequenceOrder', event.target.value)}
                              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">#{stage?.sequenceOrder}</span>
                          )}
                        </div>
                      )}
                      <div className={isApprovalTab ? 'col-span-2' : 'col-span-3'}>
                        {isAdmin ? (
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={draft.approvalRequired}
                              onChange={(event) => updateDraft(draft.id, 'approvalRequired', event.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Required
                          </label>
                        ) : (
                          <span className="text-sm text-gray-600">
                            {draft.approvalRequired ? 'Required' : 'Not required'}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveStage(draft.id)}
                              disabled={savingStageId === draft.id}
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:border-emerald-400"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStage(draft.id)}
                              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-400"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">View only</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            )}
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
