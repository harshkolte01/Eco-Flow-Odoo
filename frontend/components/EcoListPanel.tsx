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
  currentStage?: {
    id: number;
    name: string;
    sequenceOrder: number;
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
  onStartEco?: (ecoId: number) => void;
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
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  applied: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  active: 'bg-sky-100 text-sky-700 border-sky-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200'
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
  return parsed.toLocaleDateString();
};

export function EcoListPanel({
  viewMode,
  ecos,
  loading,
  error,
  onRetry,
  onStartEco
}: EcoListPanelProps) {
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
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-6 shadow-sm">
        <div className="text-sm text-gray-500">Loading ECOs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-6 shadow-sm">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:border-red-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (ecos.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-10 text-center shadow-sm">
        <p className="text-sm text-gray-500">No ECOs found yet.</p>
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statusOrder.map((status) => (
          <div key={status} className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-700">{statusLabels[status]}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                {grouped[status].length}
              </span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {grouped[status].length === 0 ? (
                <p className="text-xs text-gray-400">No items</p>
              ) : (
                grouped[status].map((eco) => {
                  const isDraftEco = eco.kind === 'eco' && eco.status === 'draft' && onStartEco;
                  
                  return (
                    <div
                      key={`${eco.kind ?? 'eco'}-${eco.id}`}
                      onClick={isDraftEco ? () => onStartEco(eco.id) : undefined}
                      role={isDraftEco ? 'button' : undefined}
                      tabIndex={isDraftEco ? 0 : undefined}
                      onKeyDown={isDraftEco ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onStartEco(eco.id);
                        }
                      } : undefined}
                      className={`rounded-md border border-gray-200 bg-white px-3 py-3 shadow-sm transition-all ${isDraftEco
                        ? 'cursor-pointer hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50/30 active:scale-[0.98]'
                        : ''
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{eco.title}</p>
                          <p className="text-xs text-gray-500">
                            {eco.kind === 'product'
                              ? 'Product'
                              : `ECO · ${formatEcoType(eco.ecoType)}`}{' '}
                            · {eco.currentStage?.name ?? '—'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses[eco.status]
                            }`}
                        >
                          {statusLabels[eco.status]}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-gray-600 text-left">
                        {eco.product?.productCode ? (
                          <span>
                            {eco.product.productCode} · {eco.product.productName ?? 'Unnamed product'}
                          </span>
                        ) : (
                          'No product linked'
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                        <span>
                          {eco.updatedAt ? `Updated ${formatDate(eco.updatedAt)}` : 'No updates yet'}
                        </span>
                        {isDraftEco && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Click to Start
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <div className="col-span-3">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Product</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Status</div>
      </div>
      <div className="divide-y divide-gray-100">
        {ecos.map((eco) => {
          const isDraftEco = eco.kind === 'eco' && eco.status === 'draft' && onStartEco;
          
          return (
            <div
              key={`${eco.kind ?? 'eco'}-${eco.id}`}
              onClick={isDraftEco ? () => onStartEco(eco.id) : undefined}
              role={isDraftEco ? 'button' : undefined}
              tabIndex={isDraftEco ? 0 : undefined}
              onKeyDown={isDraftEco ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStartEco(eco.id);
                }
              } : undefined}
              className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm text-gray-700 transition-all ${isDraftEco
                ? 'cursor-pointer hover:bg-emerald-50/50 hover:shadow-[inset_4px_0_0_0_rgb(16,185,129)] active:bg-emerald-100/50'
                : ''
                }`}
            >
              <div className="col-span-3 text-left">
                <p className="font-semibold text-gray-900">{eco.title}</p>
                <p className="text-xs text-gray-400">
                  {eco.updatedAt ? `Updated ${formatDate(eco.updatedAt)}` : 'No updates yet'}
                </p>
              </div>
              <div className="col-span-2 text-xs font-semibold text-gray-600 text-left">
                {eco.kind === 'product'
                  ? 'Product'
                  : `ECO · ${formatEcoType(eco.ecoType)}`}
              </div>
              <div className="col-span-3 text-xs text-gray-600 text-left">
                {eco.product?.productCode ? (
                  <span>
                    {eco.product.productCode} · {eco.product.productName ?? 'Unnamed product'}
                  </span>
                ) : (
                  'No product linked'
                )}
              </div>
              <div className="col-span-2 text-xs text-gray-600 text-left">
                {eco.kind === 'eco' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{eco.currentStage?.name ?? '—'}</span>
                    {isDraftEco && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Click to Start
                      </span>
                    )}
                  </div>
                ) : (
                  '—'
                )}
              </div>
              <div className="col-span-2 text-left">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses[eco.status]
                    }`}
                >
                  {statusLabels[eco.status]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EcoListPanel;
