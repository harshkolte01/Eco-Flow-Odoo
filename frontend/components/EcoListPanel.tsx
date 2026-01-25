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
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  applied: 'bg-purple-50 text-purple-700',
  active: 'bg-green-50 text-green-700',
  archived: 'bg-gray-50 text-gray-500'
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
  // Use UTC to prevent hydration mismatches between server and client timezones
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(parsed);
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
          <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium text-red-700 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (ecos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-sm text-gray-500">No items found</p>
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <div className="flex h-full gap-6 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {statusOrder.map((status) => {
          const items = grouped[status];
          const count = items.length;
          
          // Column header colors
          const headerColors: Record<EcoListItem['status'], string> = {
            draft: 'bg-gray-100 text-gray-700 border-gray-200',
            in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
            approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            applied: 'bg-purple-50 text-purple-700 border-purple-100',
            active: 'bg-green-50 text-green-700 border-green-100',
            archived: 'bg-gray-50 text-gray-500 border-gray-200'
          };

          const borderColors: Record<EcoListItem['status'], string> = {
            draft: 'border-l-gray-400',
            in_progress: 'border-l-blue-500',
            approved: 'border-l-emerald-500',
            applied: 'border-l-purple-500',
            active: 'border-l-green-500',
            archived: 'border-l-gray-400'
          };

          return (
            <div key={status} className="flex min-w-[320px] max-w-[320px] flex-col rounded-xl bg-gray-50/80 border border-gray-200 h-fit max-h-full">
              {/* Column Header */}
              <div className={`flex items-center justify-between p-3 rounded-t-xl border-b ${headerColors[status].split(' ')[2]}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${headerColors[status].replace('bg-', 'bg-opacity-100 bg-').split(' ')[0].replace('50', '500')}`} />
                  <h3 className="text-sm font-semibold text-gray-900">{statusLabels[status]}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-white/60 ${headerColors[status].split(' ')[1]}`}>
                  {count}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-gray-200">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 bg-white/50">
                    <span className="text-xs">No items</span>
                  </div>
                ) : (
                  items.map((eco) => {
                    const isOpenableEco =
                      eco.kind === 'eco' && !!onOpenEco && openableStatuses.includes(eco.status);
                    const { timestamp } = getUpdatedMeta(eco);

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
                        className={`group relative flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all border-l-4 ${borderColors[status]} ${
                          isOpenableEco
                            ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                            : ''
                        }`}
                      >
                        {/* Header: Type & Stage */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            eco.kind === 'product' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {eco.kind === 'product' ? 'Product' : formatEcoType(eco.ecoType)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            #{eco.id}
                          </span>
                        </div>

                        {/* Title */}
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-emerald-600 transition-colors">
                            {eco.title}
                          </p>
                        </div>

                        {/* Product Info */}
                        {eco.product?.productCode && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                            <span className="font-mono font-medium text-gray-700">{eco.product.productCode}</span>
                            <span className="truncate border-l border-gray-300 pl-2">{eco.product.productName}</span>
                          </div>
                        )}

                        {/* Footer: Stage & Date */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-1">
                          <span className="text-xs font-medium text-gray-600">
                            {eco.currentStage?.name ?? 'Initial'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {timestamp ? formatDate(timestamp) : 'Recent'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-3 text-xs font-medium text-gray-500">
        <div className="col-span-4 lg:col-span-3">Title</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Product</div>
        <div className="col-span-3 lg:col-span-2">Stage</div>
        <div className="hidden lg:block lg:col-span-2 text-right">Status</div>
      </div>

      <div className="divide-y divide-gray-100">
        {ecos.map((eco) => {
          const isOpenableEco =
            eco.kind === 'eco' && !!onOpenEco && openableStatuses.includes(eco.status);
          const { timestamp } = getUpdatedMeta(eco);

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
              className={`group flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-4 transition-colors ${
                isOpenableEco
                  ? 'cursor-pointer hover:bg-gray-50'
                  : ''
              }`}
            >
              {/* Title */}
              <div className="col-span-4 lg:col-span-3 flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-900 truncate">{eco.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {timestamp ? formatDate(timestamp) : 'Recent'}
                </p>
              </div>

              {/* Type */}
              <div className="col-span-2 flex items-center">
                <span className="sm:hidden text-xs font-medium text-gray-500 mr-2">Type:</span>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {eco.kind === 'product' ? 'Product' : formatEcoType(eco.ecoType)}
                </span>
              </div>

              {/* Product */}
              <div className="col-span-3 flex flex-col justify-center min-w-0">
                <span className="sm:hidden text-xs font-medium text-gray-500 mb-1">Product:</span>
                {eco.product?.productCode ? (
                  <>
                    <span className="text-xs font-mono text-gray-900">{eco.product.productCode}</span>
                    <span className="text-xs text-gray-500 truncate">{eco.product.productName}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">No product</span>
                )}
              </div>

              {/* Stage */}
              <div className="col-span-3 lg:col-span-2 flex items-center">
                <span className="sm:hidden text-xs font-medium text-gray-500 mr-2">Stage:</span>
                <span className="text-sm text-gray-700">{eco.currentStage?.name ?? 'Initial'}</span>
              </div>

              {/* Status */}
              <div className="col-span-12 lg:col-span-2 flex items-center lg:justify-end mt-2 sm:mt-0">
                <span className="sm:hidden text-xs font-medium text-gray-500 mr-2">Status:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[eco.status]}`}
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
