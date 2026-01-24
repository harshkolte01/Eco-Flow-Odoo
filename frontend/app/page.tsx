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
  const [startConfirmEco, setStartConfirmEco] = useState<EcoListItem | null>(null);
  const [startConfirmError, setStartConfirmError] = useState<string | null>(null);
  const [startConfirmLoading, setStartConfirmLoading] = useState(false);
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

  const handleStartEco = async (ecoId: number) => {
    try {
      await apiFetch(`/api/ecos/${ecoId}/start`, { method: 'POST' });
      refreshEcos();
      return true;
    } catch (error) {
      return false;
    }
  };

  const openStartConfirm = (ecoId: number) => {
    const eco = ecoItems.find((item) => item.id === ecoId) ?? null;
    setStartConfirmEco(eco);
    setStartConfirmError(null);
  };

  const closeStartConfirm = () => {
    if (startConfirmLoading) {
      return;
    }
    setStartConfirmEco(null);
    setStartConfirmError(null);
  };

  const confirmStartEco = async () => {
    if (!startConfirmEco) {
      return;
    }
    setStartConfirmLoading(true);
    setStartConfirmError(null);
    const success = await handleStartEco(startConfirmEco.id);
    if (success) {
      setStartConfirmEco(null);
    } else {
      setStartConfirmError('Failed to start ECO. Please try again.');
    }
    setStartConfirmLoading(false);
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
            onStartEco={openStartConfirm}
          />
        </div>
      </main>

      {!isOperations && (
        <EcoCreateModal
          isOpen={isEcoModalOpen}
          onClose={() => setIsEcoModalOpen(false)}
          currentUser={user}
          onComplete={refreshEcos}
        />
      )}
      {startConfirmEco && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Start this ECO?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Starting will move the ECO to In Progress and lock the draft fields.
            </p>
            <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <div className="font-semibold text-gray-800">{startConfirmEco.title}</div>
              <div className="mt-1">
                {startConfirmEco.ecoType ? `ECO · ${startConfirmEco.ecoType}` : 'ECO'} ·{' '}
                {startConfirmEco.product?.productCode ?? 'No product'}
              </div>
            </div>
            {startConfirmError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {startConfirmError}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeStartConfirm}
                disabled={startConfirmLoading}
                className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStartEco}
                disabled={startConfirmLoading}
                className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {startConfirmLoading ? 'Starting...' : 'Start ECO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
