'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { useEffect, useMemo, useState } from 'react';
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

  const loadOverview = async () => {
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

      const productStatus = isAdmin ? 'all' : isOperations ? 'active' : 'active,archived';
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
            id: product.productId,
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
  };

  useEffect(() => {
    loadOverview();
  }, [activeSearch, refreshKey, user?.role]);

  const pendingApprovals = useMemo(() => {
    if (isEngineering || isOperations) return [];
    return ecoItems.filter(eco => 
      eco.status === 'in_progress' && 
      eco.currentStage?.approvalRequired === true
    );
  }, [ecoItems, isEngineering, isOperations]);

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Sub Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-2 lg:px-8">
          {/* Left side: Action Button */}
          {canCreateEco && (
            <div className="flex items-center">
              <button
                onClick={() => setIsEcoModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New ECO
              </button>
            </div>
          )}

          {/* Middle: Search bar */}
          <form onSubmit={handleSearch} className="relative flex-1 min-w-0 sm:max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ECOs, products, or codes..."
              aria-label="Search ECOs, products, or codes"
              className="h-9 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Right side: View Toggles */}
          <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:justify-end sm:ml-auto">
            <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`rounded p-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
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
                className={`rounded p-1.5 transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
                title="Kanban View"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {pendingApprovals.length > 0 && (
          <div className="mb-12">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                Pending Approvals
              </h2>
              <p className="text-sm text-gray-500 mt-1">Items requiring your immediate review and sign-off.</p>
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isOperations ? 'Product Overview' : 'ECO Overview'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isOperations
                  ? 'Active products available for operations.'
                  : 'Track ECOs alongside linked product metadata.'}
              </p>
            </div>
            <div className="text-sm font-medium text-gray-500">
              {overviewItems.length} items
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
