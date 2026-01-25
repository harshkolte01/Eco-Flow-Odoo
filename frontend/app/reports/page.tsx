'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { apiFetch, ApiError } from '@/lib/api';
import { ReportsTable } from '@/components/ReportsTable';
import { useAuth } from '@/context/AuthContext';

interface ReportItem {
  id: number;
  title: string;
  ecoType: string;
  productName: string;
  hasChanges: boolean;
  status: string;
}

interface ProductVersionItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  versionNo: number;
  salePrice: string | number | null;
  costPrice: string | number | null;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  createdFromEco: { id: number; title: string } | null;
}

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

interface ArchivedProductItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  versionNo: number;
  archivedAt: string;
}

interface ActiveMatrixItem {
  productId: number;
  productCode: string;
  productName: string | null;
  productVersionNo: number | null;
  bomId: number | null;
  bomVersionNo: number | null;
  bomComponents: number;
  bomOperations: number;
}

interface AuditLogItem {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
  performedBy: {
    id: number;
    name: string;
    loginId: string;
    email: string;
    role: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const formatMoney = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return `$${numeric.toFixed(2)}`;
};

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

function ReportsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const showAuditTab = user?.role === 'approver' || user?.role === 'admin';
  const isOperations = user?.role === 'operations';

  const [activeTab, setActiveTab] = useState(tabParam ?? 'ecos');

  const [ecoReport, setEcoReport] = useState<ReportItem[]>([]);
  const [ecoLoading, setEcoLoading] = useState(true);
  const [ecoError, setEcoError] = useState<string | null>(null);
  const [ecoSearch, setEcoSearch] = useState('');
  const [ecoActiveSearch, setEcoActiveSearch] = useState('');
  const [ecoTypeFilter, setEcoTypeFilter] = useState('');

  const [productVersions, setProductVersions] = useState<ProductVersionItem[]>([]);
  const [productPagination, setProductPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productStatusFilter, setProductStatusFilter] = useState(isOperations ? 'active' : '');
  const [productSearch, setProductSearch] = useState('');
  const [productActiveSearch, setProductActiveSearch] = useState('');

  const [bomVersions, setBomVersions] = useState<BomVersionItem[]>([]);
  const [bomPagination, setBomPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [bomLoading, setBomLoading] = useState(false);
  const [bomError, setBomError] = useState<string | null>(null);
  const [bomStatusFilter, setBomStatusFilter] = useState(isOperations ? 'active' : '');
  const [bomSearch, setBomSearch] = useState('');
  const [bomActiveSearch, setBomActiveSearch] = useState('');

  const [archivedProducts, setArchivedProducts] = useState<ArchivedProductItem[]>([]);
  const [archivedPagination, setArchivedPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);
  const [archivedSearch, setArchivedSearch] = useState('');
  const [archivedActiveSearch, setArchivedActiveSearch] = useState('');

  const [activeMatrix, setActiveMatrix] = useState<ActiveMatrixItem[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditPagination, setAuditPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditEntityFilter, setAuditEntityFilter] = useState('');

  useEffect(() => {
    if (!tabParam) {
      return;
    }
    if (tabParam === 'audit-logs' && !showAuditTab) {
      setActiveTab('ecos');
      return;
    }
    if (tabParam === 'archived-products' && isOperations) {
      setActiveTab('ecos');
      return;
    }
    setActiveTab(tabParam);
  }, [tabParam, showAuditTab, isOperations]);

  const setTab = (tab: string) => {
    if (tab === 'audit-logs' && !showAuditTab) {
      return;
    }
    if (tab === 'archived-products' && isOperations) {
      return;
    }
    setActiveTab(tab);
    router.push(`/reports?tab=${tab}`);
  };

  const loadEcoReport = async () => {
    setEcoLoading(true);
    setEcoError(null);

    try {
      if (!user) {
        setEcoReport([]);
        setEcoLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (ecoActiveSearch) {
        params.set('q', ecoActiveSearch);
      }
      if (ecoTypeFilter) {
        params.set('ecoType', ecoTypeFilter);
      }

      const role = user?.role;
      const isEngineering = role === 'engineering';
      if (!isEngineering) {
        params.set('scope', 'all');
      } else {
        params.set('scope', 'mine');
      }

      const queryString = params.toString();
      const path = queryString ? `/api/reports/ecos?${queryString}` : '/api/reports/ecos';

      const response = await apiFetch<{ report: ReportItem[] }>(path);
      setEcoReport(response.data?.report ?? []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load report data';
      setEcoError(message);
    } finally {
      setEcoLoading(false);
    }
  };

  const loadProductVersions = async (page = productPagination.page) => {
    setProductLoading(true);
    setProductError(null);

    try {
      if (!user) {
        setProductVersions([]);
        setProductPagination((prev) => ({ ...prev, total: 0 }));
        setProductLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (productStatusFilter) {
        params.set('status', productStatusFilter);
      }
      params.set('page', String(page));
      params.set('limit', String(productPagination.limit));

      const queryString = params.toString();
      const path = queryString ? `/api/reports/product-versions?${queryString}` : '/api/reports/product-versions';

      const response = await apiFetch<{ items: ProductVersionItem[]; pagination: Pagination }>(path);
      setProductVersions(response.data?.items ?? []);
      setProductPagination(response.data?.pagination ?? { page, limit: productPagination.limit, total: 0 });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load product versions';
      setProductError(message);
    } finally {
      setProductLoading(false);
    }
  };

  const loadBomVersions = async (page = bomPagination.page) => {
    setBomLoading(true);
    setBomError(null);

    try {
      if (!user) {
        setBomVersions([]);
        setBomPagination((prev) => ({ ...prev, total: 0 }));
        setBomLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (bomStatusFilter) {
        params.set('status', bomStatusFilter);
      }
      params.set('page', String(page));
      params.set('limit', String(bomPagination.limit));

      const queryString = params.toString();
      const path = queryString ? `/api/reports/bom-versions?${queryString}` : '/api/reports/bom-versions';

      const response = await apiFetch<{ items: BomVersionItem[]; pagination: Pagination }>(path);
      setBomVersions(response.data?.items ?? []);
      setBomPagination(response.data?.pagination ?? { page, limit: bomPagination.limit, total: 0 });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load BoM versions';
      setBomError(message);
    } finally {
      setBomLoading(false);
    }
  };

  const loadArchivedProducts = async (page = archivedPagination.page) => {
    setArchivedLoading(true);
    setArchivedError(null);

    try {
      if (!user) {
        setArchivedProducts([]);
        setArchivedPagination((prev) => ({ ...prev, total: 0 }));
        setArchivedLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(archivedPagination.limit));

      const queryString = params.toString();
      const path = queryString ? `/api/reports/archived-products?${queryString}` : '/api/reports/archived-products';

      const response = await apiFetch<{ items: ArchivedProductItem[]; pagination: Pagination }>(path);
      setArchivedProducts(response.data?.items ?? []);
      setArchivedPagination(response.data?.pagination ?? { page, limit: archivedPagination.limit, total: 0 });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load archived products';
      setArchivedError(message);
    } finally {
      setArchivedLoading(false);
    }
  };

  const loadActiveMatrix = async () => {
    setMatrixLoading(true);
    setMatrixError(null);

    try {
      if (!user) {
        setActiveMatrix([]);
        setMatrixLoading(false);
        return;
      }

      const response = await apiFetch<{ matrix: ActiveMatrixItem[] }>('/api/reports/active-matrix');
      setActiveMatrix(response.data?.matrix ?? []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load active matrix';
      setMatrixError(message);
    } finally {
      setMatrixLoading(false);
    }
  };

  const loadAuditLogs = async (page = auditPagination.page) => {
    setAuditLoading(true);
    setAuditError(null);

    try {
      if (!user) {
        setAuditLogs([]);
        setAuditPagination((prev) => ({ ...prev, total: 0 }));
        setAuditLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (auditEntityFilter) {
        params.set('entityType', auditEntityFilter);
      }
      params.set('page', String(page));
      params.set('limit', String(auditPagination.limit));

      const queryString = params.toString();
      const path = queryString ? `/api/audit-logs?${queryString}` : '/api/audit-logs';

      const response = await apiFetch<{ logs: AuditLogItem[]; pagination: Pagination }>(path);
      setAuditLogs(response.data?.logs ?? []);
      setAuditPagination(response.data?.pagination ?? { page, limit: auditPagination.limit, total: 0 });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load audit logs';
      setAuditError(message);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ecos') {
      loadEcoReport();
    }
  }, [activeTab, ecoActiveSearch, ecoTypeFilter, user?.role]);

  useEffect(() => {
    if (activeTab === 'product-versions') {
      loadProductVersions(1);
    }
  }, [activeTab, productStatusFilter, user?.role]);

  useEffect(() => {
    if (isOperations) {
      setProductStatusFilter('active');
      setBomStatusFilter('active');
    }
  }, [isOperations]);

  useEffect(() => {
    if (activeTab === 'bom-versions') {
      loadBomVersions(1);
    }
  }, [activeTab, bomStatusFilter, user?.role]);

  useEffect(() => {
    if (activeTab === 'archived-products') {
      loadArchivedProducts(1);
    }
  }, [activeTab, user?.role]);

  useEffect(() => {
    if (activeTab === 'active-matrix') {
      loadActiveMatrix();
    }
  }, [activeTab, user?.role]);

  useEffect(() => {
    if (activeTab === 'audit-logs' && showAuditTab) {
      loadAuditLogs(1);
    }
  }, [activeTab, auditEntityFilter, user?.role, showAuditTab]);

  const ecoFilteredItems = ecoReport;
  const productFilteredItems = useMemo(() => {
    if (!productActiveSearch) return productVersions;
    const needle = productActiveSearch.toLowerCase();
    return productVersions.filter((item) => `${item.productCode} ${item.productName}`.toLowerCase().includes(needle));
  }, [productVersions, productActiveSearch]);

  const bomFilteredItems = useMemo(() => {
    if (!bomActiveSearch) return bomVersions;
    const needle = bomActiveSearch.toLowerCase();
    return bomVersions.filter((item) => `${item.productCode} ${item.productName}`.toLowerCase().includes(needle));
  }, [bomVersions, bomActiveSearch]);

  const archivedFilteredItems = useMemo(() => {
    if (!archivedActiveSearch) return archivedProducts;
    const needle = archivedActiveSearch.toLowerCase();
    return archivedProducts.filter((item) => `${item.productCode} ${item.productName}`.toLowerCase().includes(needle));
  }, [archivedProducts, archivedActiveSearch]);

  const handlePageChange = (
    direction: 'prev' | 'next',
    pagination: Pagination,
    loader: (page: number) => void
  ) => {
    const nextPage = direction === 'next' ? pagination.page + 1 : pagination.page - 1;
    if (nextPage < 1 || nextPage > Math.ceil(pagination.total / pagination.limit)) {
      return;
    }
    loader(nextPage);
  };

  return (
    <main className="flex-1 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reporting</h1>
          <p className="text-sm text-gray-600">
            ECO analytics, version history, and audit snapshots.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('ecos')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'ecos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            ECOs
          </button>
          <button
            type="button"
            onClick={() => setTab('product-versions')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'product-versions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            Product Versions
          </button>
          <button
            type="button"
            onClick={() => setTab('bom-versions')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'bom-versions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            BoM History
          </button>
          {!isOperations && (
            <button
              type="button"
              onClick={() => setTab('archived-products')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'archived-products'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
              }`}
            >
              Archived Products
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab('active-matrix')}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'active-matrix'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            Active Matrix
          </button>
          {showAuditTab && (
            <button
              type="button"
              onClick={() => setTab('audit-logs')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'audit-logs'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
              }`}
            >
              Audit Logs
            </button>
          )}
        </div>

        {activeTab === 'ecos' && (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setEcoActiveSearch(ecoSearch.trim());
                }}
                className="flex flex-col gap-4 md:flex-row"
              >
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={ecoSearch}
                    onChange={(e) => setEcoSearch(e.target.value)}
                    placeholder="Search ECO title..."
                    className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all group-hover:bg-white group-hover:border-gray-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={ecoTypeFilter}
                    onChange={(e) => setEcoTypeFilter(e.target.value)}
                    className="w-full sm:w-48 h-11 pl-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all hover:bg-white hover:border-gray-300"
                  >
                    <option value="">All Types</option>
                    <option value="product">Product</option>
                    <option value="bom">Bill of Materials</option>
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

            <ReportsTable report={ecoFilteredItems} loading={ecoLoading} error={ecoError} onRetry={loadEcoReport} />
          </>
        )}

        {activeTab === 'product-versions' && (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setProductActiveSearch(productSearch.trim());
                }}
                className="flex flex-col gap-4 md:flex-row md:items-center"
              >
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search product code or name..."
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
                    value={productStatusFilter}
                    onChange={(event) => setProductStatusFilter(event.target.value)}
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
                <div className="col-span-2">Code</div>
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Version</div>
                <div className="col-span-2">Pricing</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Updated</div>
              </div>

              {productLoading ? (
                <div className="px-6 py-8 text-sm text-gray-500">Loading product versions...</div>
              ) : productError ? (
                <div className="px-6 py-8 text-sm text-rose-600">{productError}</div>
              ) : productFilteredItems.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No product versions found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {productFilteredItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="col-span-2 text-sm font-semibold text-gray-900">{item.productCode}</div>
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        {item.createdFromEco && <p className="text-xs text-gray-400">ECO #{item.createdFromEco.id}</p>}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">v{item.versionNo}</span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-600">
                        <div>Sale: {formatMoney(item.salePrice)}</div>
                        <div>Cost: {formatMoney(item.costPrice)}</div>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                          item.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : item.status === 'archived'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {item.status}
                          {item.status === 'archived' && (
                            <svg className="ml-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
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
                Page {productPagination.page} of {Math.max(1, Math.ceil(productPagination.total / productPagination.limit))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange('prev', productPagination, loadProductVersions)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange('next', productPagination, loadProductVersions)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'bom-versions' && (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setBomActiveSearch(bomSearch.trim());
                }}
                className="flex flex-col gap-4 md:flex-row md:items-center"
              >
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={bomSearch}
                    onChange={(event) => setBomSearch(event.target.value)}
                    placeholder="Search product code or name..."
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
                    value={bomStatusFilter}
                    onChange={(event) => setBomStatusFilter(event.target.value)}
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

              {bomLoading ? (
                <div className="px-6 py-8 text-sm text-gray-500">Loading BoM versions...</div>
              ) : bomError ? (
                <div className="px-6 py-8 text-sm text-rose-600">{bomError}</div>
              ) : bomFilteredItems.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No BoM versions found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {bomFilteredItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="col-span-3">
                        <p className="text-sm font-semibold text-gray-900">{item.productCode}</p>
                        <p className="text-xs text-gray-500">{item.productName}</p>
                        {item.createdFromEco && <p className="text-xs text-gray-400">ECO #{item.createdFromEco.id}</p>}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">v{item.versionNo}</span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-700">v{item.productVersionNo}</div>
                      <div className="col-span-2 text-xs text-gray-600">
                        <div>{item.componentsCount} components</div>
                        <div>{item.operationsCount} operations</div>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                          item.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : item.status === 'archived'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {item.status}
                          {item.status === 'archived' && (
                            <svg className="ml-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
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
                Page {bomPagination.page} of {Math.max(1, Math.ceil(bomPagination.total / bomPagination.limit))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange('prev', bomPagination, loadBomVersions)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange('next', bomPagination, loadBomVersions)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'archived-products' && !isOperations && (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setArchivedActiveSearch(archivedSearch.trim());
                }}
                className="flex flex-col gap-4 md:flex-row"
              >
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={archivedSearch}
                    onChange={(event) => setArchivedSearch(event.target.value)}
                    placeholder="Search archived products..."
                    className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all group-hover:bg-white group-hover:border-gray-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="col-span-3">Code</div>
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Version</div>
                <div className="col-span-2 text-right">Archived</div>
              </div>

              {archivedLoading ? (
                <div className="px-6 py-8 text-sm text-gray-500">Loading archived products...</div>
              ) : archivedError ? (
                <div className="px-6 py-8 text-sm text-rose-600">{archivedError}</div>
              ) : archivedFilteredItems.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No archived products found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {archivedFilteredItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="col-span-3 text-sm font-semibold text-gray-900">{item.productCode}</div>
                      <div className="col-span-5 text-sm text-gray-700">{item.productName}</div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">v{item.versionNo}</span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 text-right">{formatDate(item.archivedAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Page {archivedPagination.page} of {Math.max(1, Math.ceil(archivedPagination.total / archivedPagination.limit))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange('prev', archivedPagination, loadArchivedProducts)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange('next', archivedPagination, loadArchivedProducts)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'active-matrix' && (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Product Version</div>
                <div className="col-span-2">BoM Version</div>
                <div className="col-span-2">Components</div>
                <div className="col-span-3">Operations</div>
              </div>

              {matrixLoading ? (
                <div className="px-6 py-8 text-sm text-gray-500">Loading active matrix...</div>
              ) : matrixError ? (
                <div className="px-6 py-8 text-sm text-rose-600">{matrixError}</div>
              ) : activeMatrix.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No active matrix data available.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeMatrix.map((item) => (
                    <div key={item.productId} className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="col-span-3">
                        <p className="text-sm font-semibold text-gray-900">{item.productCode}</p>
                        <p className="text-xs text-gray-500">{item.productName ?? '-'}</p>
                      </div>
                      <div className="col-span-2 text-sm text-gray-700">{item.productVersionNo ? `v${item.productVersionNo}` : '-'}</div>
                      <div className="col-span-2 text-sm text-gray-700">{item.bomVersionNo ? `v${item.bomVersionNo}` : '-'}</div>
                      <div className="col-span-2 text-sm text-gray-700">{item.bomComponents}</div>
                      <div className="col-span-3 text-sm text-gray-700">{item.bomOperations}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'audit-logs' && showAuditTab && (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={auditEntityFilter}
                  onChange={(event) => setAuditEntityFilter(event.target.value)}
                  className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">All entities</option>
                  <option value="eco">ECO</option>
                  <option value="product">Product</option>
                  <option value="bom">BoM</option>
                </select>
                <button
                  type="button"
                  onClick={() => loadAuditLogs(1)}
                  className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="col-span-2">Entity</div>
                <div className="col-span-3">Action</div>
                <div className="col-span-3">Performed By</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2 text-right">Time</div>
              </div>

              {auditLoading ? (
                <div className="px-6 py-8 text-sm text-gray-500">Loading audit logs...</div>
              ) : auditError ? (
                <div className="px-6 py-8 text-sm text-rose-600">{auditError}</div>
              ) : auditLogs.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No audit logs found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-12 sm:gap-4 sm:px-6">
                      <div className="col-span-2 text-sm font-semibold text-gray-900">
                        {log.entityType.toUpperCase()} #{log.entityId}
                      </div>
                      <div className="col-span-3 text-sm text-gray-700">{log.action}</div>
                      <div className="col-span-3 text-sm text-gray-700">
                        {log.performedBy.name}
                        <div className="text-xs text-gray-400">{log.performedBy.loginId}</div>
                      </div>
                      <div className="col-span-2 text-sm text-gray-700">{log.performedBy.role ?? '-'}</div>
                      <div className="col-span-2 text-xs text-gray-500 text-right">{formatDate(log.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                Page {auditPagination.page} of {Math.max(1, Math.ceil(auditPagination.total / auditPagination.limit))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange('prev', auditPagination, loadAuditLogs)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange('next', auditPagination, loadAuditLogs)}
                  className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={
          <div className="flex-1 bg-gray-50 p-8 flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading reports...</div>
          </div>
        }>
          <ReportsContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
