'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useEffect, useMemo, useState } from 'react';
import { EcoCreateModal } from '@/components/EcoCreateModal';
import { apiFetch, ApiError } from '@/lib/api';
import { EcoListPanel, EcoListItem } from '@/components/EcoListPanel';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Dashboard />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? 'engineering';
  const isAdmin = role === 'admin';
  const isOperations = role === 'operations';
  const isEngineering = role === 'engineering';
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
            effectiveDate: null,
            versionUpdate: true,
            createdAt: null,
            updatedAt: null,
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

  return (
    <div className="bg-gray-50">
      {/* Sub Header Content - Defined inside Home Page */}
      <div className="sticky top-12 z-40 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {!isOperations && (
              <button
                onClick={() => setIsEcoModalOpen(true)}
                className="px-6 py-1.5 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-emerald-500 active:scale-95 transition-all"
              >
                New
              </button>
            )}
          </div>

          <div className="flex-1 max-w-2xl px-8">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 px-4 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
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
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isOperations ? 'Product Overview' : 'ECO Overview'}
              </h2>
              <p className="text-xs text-gray-500">
                {isOperations
                  ? 'Active products available for operations.'
                  : 'Track ECOs alongside linked product metadata.'}
              </p>
            </div>
            <div className="text-xs font-semibold text-gray-500">
              {overviewItems.length} items
            </div>
          </div>
          <EcoListPanel
            viewMode={viewMode}
            ecos={overviewItems}
            loading={overviewLoading}
            error={overviewError}
            onRetry={refreshEcos}
            onStartEco={handleEditDraft}
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
