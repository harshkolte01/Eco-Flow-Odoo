'use client';

import { useMemo } from 'react';

export interface EcoListItem {
  id: number;
  kind?: 'eco' | 'product';
  title: string;
  ecoType?: 'product' | 'bom';
  status: 'draft' | 'in_progress' | 'approved' | 'applied' | 'active' | 'archived';
  effectiveDate?: string | null;
  versionUpdate: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  productUpdatedAt?: string | null;
  currentStage?: {
    id: number;
    name: string;
    sequenceOrder: number;
    approvalRequired?: boolean;
  } | null;
  product?: {
    id: number;
    productCode: string;
    productName: string | null;
  } | null;
}

interface EcoListPanelProps {
  viewMode: 'list' | 'kanban';
  ecos: EcoListItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenEco?: (ecoId: number) => void;
  openStatuses?: EcoListItem['status'][];
}

const statusOrder: EcoListItem['status'][] = [
  'draft',
  'in_progress',
  'approved',
  'applied',
  'active',
  'archived'
];

const statusLabels: Record<EcoListItem['status'], string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  approved: 'Approved',
  applied: 'Applied',
  active: 'Active',
  archived: 'Archived'
};

const statusClasses: Record<EcoListItem['status'], string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200/50',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200/50',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  applied: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
  active: 'bg-sky-50 text-sky-700 border-sky-200/50',
  archived: 'bg-gray-50 text-gray-500 border-gray-200/50'
};

const formatEcoType = (ecoType?: EcoListItem['ecoType']) => {
  if (!ecoType) {
    return '—';
  }
  return ecoType === 'bom' ? 'BoM' : 'Product';
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getUpdatedMeta = (eco: EcoListItem) => {
  const timestamp = eco.productUpdatedAt ?? eco.updatedAt;
  const label = eco.productUpdatedAt ? 'Product Updated' : 'Updated';
  return { timestamp, label };
};

export function EcoListPanel({
  viewMode,
  ecos,
  loading,
  error,
  onRetry,
  onOpenEco,
  openStatuses
}: EcoListPanelProps) {
  const openableStatuses = openStatuses ?? ['draft'];
  const grouped = useMemo(() => {
    const groups: Record<EcoListItem['status'], EcoListItem[]> = {
      draft: [],
      in_progress: [],
      approved: [],
      applied: [],
      active: [],
      archived: []
    };
    ecos.forEach((eco) => {
      groups[eco.status]?.push(eco);
    });
    return groups;
  }, [ecos]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-100 bg-rose-50/30 p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-rose-900">Load Failed</h3>
        <p className="mt-1 text-xs text-rose-600/80">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (ecos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-sm">
          <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900">No Items Found</h3>
        <p className="mt-1 text-xs text-slate-500">Your search didn&apos;t return any results.</p>
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statusOrder.map((status) => (
          <div key={status} className="flex flex-col bg-slate-50/50 rounded-3xl border border-slate-200/60 shadow-sm min-h-[300px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm rounded-t-[22px]">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{statusLabels[status]}</h3>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-lg bg-slate-900 px-1.5 text-[9px] font-black text-white">
                {grouped[status].length}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto max-h-[600px] no-scrollbar">
              {grouped[status].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No Items</p>
                </div>
              ) : (
                grouped[status].map((eco) => {
                  const isOpenableEco =
                    eco.kind === 'eco' && !!onOpenEco && openableStatuses.includes(eco.status);
                  const actionLabel = eco.status === 'draft' ? 'Start' : 'Review';
                  const { timestamp, label } = getUpdatedMeta(eco);

                  return (
                    <div
                      key={`${eco.kind ?? 'eco'}-${eco.id}`}
                      onClick={isOpenableEco ? () => onOpenEco(eco.id) : undefined}
                      role={isOpenableEco ? 'button' : undefined}
                      tabIndex={isOpenableEco ? 0 : undefined}
                      onKeyDown={isOpenableEco ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenEco(eco.id);
                        }
                      } : undefined}
                      className={`group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ${isOpenableEco
                        ? 'cursor-pointer hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 active:scale-[0.98]'
                        : ''
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight">{eco.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                              {eco.kind === 'product' ? 'Product' : formatEcoType(eco.ecoType)}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                              {eco.currentStage?.name ?? 'Initial'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:bg-emerald-50/30 group-hover:border-emerald-100 transition-colors">
                        {eco.product?.productCode ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Product Code</span>
                              <span className="text-[10px] font-black text-slate-900">{eco.product.productCode}</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 truncate">{eco.product.productName ?? 'Unnamed Product'}</p>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 italic">No linked product</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
                          <span className="text-[10px] font-bold text-slate-600">
                            {timestamp ? formatDate(timestamp) : 'Recent'}
                          </span>
                        </div>
                        {isOpenableEco && (
                          <span className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-black text-white shadow-lg shadow-emerald-600/20 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            {actionLabel}
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <div className="col-span-4 lg:col-span-3">Name / Title</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Linked Product</div>
        <div className="col-span-3 lg:col-span-2">Current Stage</div>
        <div className="hidden lg:block lg:col-span-2 text-right">Status</div>
      </div>

      <div className="divide-y divide-slate-100">
        {ecos.map((eco) => {
          const isOpenableEco =
            eco.kind === 'eco' && !!onOpenEco && openableStatuses.includes(eco.status);
          const actionLabel = eco.status === 'draft' ? 'Start' : 'Review';
          const { timestamp, label } = getUpdatedMeta(eco);

          return (
            <div
              key={`${eco.kind ?? 'eco'}-${eco.id}`}
              onClick={isOpenableEco ? () => onOpenEco(eco.id) : undefined}
              role={isOpenableEco ? 'button' : undefined}
              tabIndex={isOpenableEco ? 0 : undefined}
              onKeyDown={isOpenableEco ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenEco(eco.id);
                }
              } : undefined}
              className={`group flex flex-col sm:grid sm:grid-cols-12 gap-4 sm:gap-4 px-6 py-6 sm:px-8 sm:py-5 transition-all duration-300 ${isOpenableEco
                ? 'cursor-pointer hover:bg-emerald-50/30 hover:shadow-[inset_4px_0_0_0_#10b981]'
                : ''
                }`}
            >
              {/* Name/Title Column */}
              <div className="col-span-4 lg:col-span-3 flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <div className={`hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:border-emerald-200 group-hover:bg-emerald-50`}>
                    <svg className={`h-5 w-5 ${isOpenableEco ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {eco.ecoType === 'bom' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      )}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{eco.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      {timestamp ? `${label} ${formatDate(timestamp)}` : 'Recently created'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Type Column */}
              <div className="col-span-2 flex items-center">
                <span className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mr-3">Type</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-tight group-hover:bg-white group-hover:ring-1 group-hover:ring-slate-200 transition-all">
                  <span className={`h-1.5 w-1.5 rounded-full ${eco.ecoType === 'bom' ? 'bg-indigo-500' : 'bg-sky-500'}`} />
                  {eco.kind === 'product' ? 'Product' : formatEcoType(eco.ecoType)}
                </span>
              </div>

              {/* Product Column */}
              <div className="col-span-3 flex flex-col justify-center">
                <span className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Linked Product</span>
                {eco.product?.productCode ? (
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-900 tracking-tight">{eco.product.productCode}</span>
                    <span className="text-[11px] font-medium text-slate-500 truncate">{eco.product.productName ?? 'Unnamed'}</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-300 italic">No linked product</span>
                )}
              </div>

              {/* Stage Column */}
              <div className="col-span-3 lg:col-span-2 flex flex-col justify-center">
                <span className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Stage</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-700">{eco.currentStage?.name ?? 'Initial'}</span>
                  {isOpenableEco && (
                    <span className="hidden lg:inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                      {actionLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Column */}
              <div className="col-span-12 lg:col-span-2 flex items-center lg:justify-end mt-2 sm:mt-0">
                <span className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest mr-3">Status</span>
                <span
                  className={`inline-flex items-center rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statusClasses[eco.status]} transition-all group-hover:shadow-sm`}
                >
                  {statusLabels[eco.status]}
                </span>
              </div>

              {/* Mobile Action Button */}
              {isOpenableEco && (
                <div className="sm:hidden mt-4 pt-4 border-t border-slate-100">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                    <span>{actionLabel} Record</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EcoListPanel;
