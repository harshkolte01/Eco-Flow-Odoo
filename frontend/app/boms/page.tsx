'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface BomVersionItem {
  id: number;
  bomId: number;
  productId: number;
  productCode: string;
  productName: string;
  productVersionNo: number;
  versionNo: number;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  componentsCount: number;
  operationsCount: number;
  createdFromEco: { id: number; title: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function BomsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('q') ?? '';
  const isOperations = user?.role === 'operations';
  const [items, setItems] = useState<BomVersionItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(isOperations ? 'active' : '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!activeSearch) {
      return items;
    }
    const needle = activeSearch.toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.productCode} ${item.productName}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, activeSearch]);

  const loadBoms = async (page = pagination.page) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        setItems([]);
        setPagination((prev) => ({ ...prev, total: 0 }));
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      params.set('page', String(page));
      params.set('limit', String(pagination.limit));

      const queryString = params.toString();
      const path = queryString ? `/api/reports/bom-versions?${queryString}` : '/api/reports/bom-versions';

      const response = await apiFetch<{ items: BomVersionItem[]; pagination: Pagination }>(path);
      setItems(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? { page, limit: pagination.limit, total: 0 });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load BoM versions';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoms(1);
  }, [statusFilter, user?.role]);

  useEffect(() => {
    const trimmed = queryParam.trim();
    if (trimmed) {
      setSearchQuery(trimmed);
      setActiveSearch(trimmed);
    }
  }, [queryParam]);

  useEffect(() => {
    if (isOperations) {
      setStatusFilter('active');
    }
  }, [isOperations]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    const nextPage = direction === 'next' ? pagination.page + 1 : pagination.page - 1;
    if (nextPage < 1 || nextPage > Math.ceil(pagination.total / pagination.limit)) {
      return;
    }
    loadBoms(nextPage);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="flex-1 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Bills of Materials</h1>
              <p className="text-sm text-gray-600">Active and archived BoM versions by product.</p>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by product code or name..."
                    className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all group-hover:bg-white group-hover:border-gray-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    disabled={isOperations}
                    className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    {!isOperations && <option value="">All statuses</option>}
                    <option value="active">Active</option>
                    {!isOperations && <option value="archived">Archived</option>}
                    {!isOperations && <option value="draft">Draft</option>}
                  </select>
                  <button
                    type="submit"
                    className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">BoM Version</div>
                <div className="col-span-2">Product Version</div>
                <div className="col-span-2">Structure</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Updated</div>
              </div>

              {loading ? (
                <div className="px-6 py-8 text-sm text-gray-500">Loading BoM versions...</div>
              ) : error ? (
                <div className="px-6 py-8 text-sm text-rose-600">{error}</div>
              ) : filteredItems.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No BoM versions found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="col-span-3">
                        <p className="text-sm font-semibold text-gray-900">{item.productCode}</p>
                        <p className="text-xs text-gray-500">{item.productName}</p>
                        {item.createdFromEco && (
                          <p className="text-xs text-gray-400">ECO #{item.createdFromEco.id}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          v{item.versionNo}
                        </span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-700">v{item.productVersionNo}</div>
                      <div className="col-span-2 text-xs text-gray-600">
                        <div>{item.componentsCount} components</div>
                        <div>{item.operationsCount} operations</div>
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 capitalize">
                          {item.status}
                        </span>
                      </div>
                      <div className="col-span-1 text-xs text-gray-500 text-right">{formatDate(item.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.limit))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange('prev')}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange('next')}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
