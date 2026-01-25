'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { EcoCreateModal } from '@/components/EcoCreateModal';
import { apiFetch, ApiError } from '@/lib/api';
import { EcoListPanel, EcoListItem } from '@/components/EcoListPanel';

export default function Home() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Dashboard />
      </AppShell>
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? 'engineering';
  const isAdmin = role === 'admin';
  const isOperations = role === 'operations';
  const isEngineering = role === 'engineering';
  const canCreateEco = isEngineering || isAdmin;
  const [searchQuery, setSearchQuery] = useState('');
  const [isEcoModalOpen, setIsEcoModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [ecoItems, setEcoItems] = useState<EcoListItem[]>([]);
  const [productItems, setProductItems] = useState<EcoListItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingEcoId, setEditingEcoId] = useState<number | null>(null);

  const overviewItems = useMemo(
    () => [...ecoItems, ...productItems],
    [ecoItems, productItems]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const refreshEcos = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEditDraft = (ecoId: number) => {
    setEditingEcoId(ecoId);
    setIsEcoModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEcoModalOpen(false);
    setEditingEcoId(null);
  };

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);

    try {
      if (!user) {
        setEcoItems([]);
        setProductItems([]);
        setOverviewLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (activeSearch) {
        params.set('q', activeSearch);
      }
      if (!isOperations) {
        params.set('scope', isEngineering ? 'mine' : 'all');
      }
      const ecoQueryString = params.toString();
      const ecoPath = ecoQueryString ? `/api/ecos?${ecoQueryString}` : '/api/ecos';

      const productStatus = isAdmin ? 'all' : isOperations ? 'active' : 'all'; // Fetch all statuses (active, archived, draft) for engineering/admin to populate Kanban
      const productParams = new URLSearchParams();
      if (productStatus) {
        productParams.set('status', productStatus);
      }
      const productQueryString = productParams.toString();
      const productPath = productQueryString
        ? `/api/products?${productQueryString}`
        : '/api/products';

      const [ecoResponse, productResponse] = await Promise.all([
        isOperations
          ? Promise.resolve({ data: { ecos: [] as EcoListItem[] } })
          : apiFetch<{ ecos: EcoListItem[] }>(ecoPath),
        apiFetch<{
          products: {
            id: number;
            productId: number;
            productCode: string;
            productName: string;
            status: 'active' | 'archived';
            updatedAt?: string | null;
          }[];
        }>(productPath)
      ]);

      const ecoList =
        ecoResponse.data?.ecos.map((eco) => ({
          ...eco,
          kind: 'eco' as const
        })) ?? [];

      const searchValue = activeSearch.toLowerCase();
      const productList =
        productResponse.data?.products
          .filter((product) => {
            if (!searchValue) {
              return true;
            }
            const haystack = `${product.productCode} ${product.productName}`.toLowerCase();
            return haystack.includes(searchValue);
          })
          .map((product) => ({
            id: product.id,
            kind: 'product' as const,
            title: product.productName || product.productCode,
            ecoType: undefined,
            status: product.status,
            updatedAt: product.updatedAt ?? null,
            productUpdatedAt: product.updatedAt ?? null,
            effectiveDate: null,
            versionUpdate: true,
            createdAt: null,
            currentStage: null,
            product: {
              id: product.productId,
              productCode: product.productCode,
              productName: product.productName
            }
          })) ?? [];

      setEcoItems(ecoList);
      setProductItems(productList);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load overview data';
      setOverviewError(message);
    } finally {
      setOverviewLoading(false);
    }
  }, [activeSearch, refreshKey, user, isOperations, isEngineering, isAdmin]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const pendingApprovals = useMemo(() => {
    if (isEngineering || isOperations) return [];
    return ecoItems.filter(eco => 
      eco.status === 'in_progress' && 
      eco.currentStage?.approvalRequired === true
    );
  }, [ecoItems, isEngineering, isOperations]);

  return (
    <div className="bg-white min-h-full">
      {/* Sub Header */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {/* Search bar - Now on the left/main focus */}
          <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ECOs, products..."
                aria-label="Search ECOs, products"
                className="h-11 w-full rounded-xl border-0 bg-gray-100/50 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 ring-1 ring-transparent transition-all focus:bg-white focus:ring-emerald-500/20 focus:shadow-sm sm:text-sm"
              />
            </div>
          </form>

          {/* Right side: Actions & View Toggles */}
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {/* View Toggles */}
            <div className="flex items-center gap-1 rounded-xl bg-gray-100/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`rounded-lg p-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
                title="List View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                aria-pressed={viewMode === 'kanban'}
                className={`rounded-lg p-2 transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
                title="Kanban View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
            </div>

            {/* Action Button */}
            {canCreateEco && (
              <button
                onClick={() => setIsEcoModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20 transition-all active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New ECO</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {pendingApprovals.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Approvals
              </h2>
              <span className="flex h-5 items-center justify-center rounded-full bg-red-100 px-2 text-xs font-medium text-red-700">
                {pendingApprovals.length}
              </span>
            </div>
            <EcoListPanel
              viewMode="list"
              ecos={pendingApprovals}
              loading={overviewLoading}
              error={null}
              onRetry={refreshEcos}
              onOpenEco={handleEditDraft}
              openStatuses={['in_progress']}
            />
          </div>
        )}

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {isOperations ? 'Product Overview' : 'All Items'}
            </h2>
            <div className="text-sm text-gray-500">
              {overviewItems.length} results
            </div>
          </div>
          <EcoListPanel
            viewMode={viewMode}
            ecos={overviewItems}
            loading={overviewLoading}
            error={overviewError}
            onRetry={refreshEcos}
            onOpenEco={canCreateEco ? handleEditDraft : undefined}
            openStatuses={canCreateEco ? ['draft'] : []}
          />
        </div>
      </main>

      {!isOperations && (
        <EcoCreateModal
          isOpen={isEcoModalOpen}
          onClose={handleModalClose}
          currentUser={user}
          onComplete={refreshEcos}
          initialEcoId={editingEcoId}
        />
      )}
    </div>
  );
}
