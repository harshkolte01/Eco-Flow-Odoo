'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface ProductDiff {
  base: {
    productName: string | null;
    salePrice: string | number | null;
    costPrice: string | number | null;
    attachments: unknown;
  };
  draft: {
    newProductName: string | null;
    newSalePrice: string | number | null;
    newCostPrice: string | number | null;
    newAttachments: unknown;
  };
}

interface BomComponent {
  componentProductVersionId: number;
  productCode: string;
  productName: string;
  quantity: string | number;
}

interface BomOperation {
  operationName: string;
  timeMinutes: string | number;
  workCenter: string | null;
}

interface BomDiff {
  base: {
    components: BomComponent[];
    operations: BomOperation[];
  };
  draft: {
    components: BomComponent[];
    operations: BomOperation[];
  };
}

interface EcoChangesViewProps {
  ecoId: number;
  ecoType: 'product' | 'bom';
}

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '(Empty)';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
};

const formatMoney = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '(Empty)';
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return formatValue(value);
  }
  return `$${numeric}`;
};

const formatAttachments = (value: unknown) => {
  if (!value) {
    return '(Empty)';
  }
  if (Array.isArray(value)) {
    const names = value
      .map((item) => {
        if (item && typeof item === 'object' && 'name' in item) {
          return String((item as { name?: string }).name ?? '').trim();
        }
        return String(item);
      })
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : '(Empty)';
  }
  return formatValue(value);
};

const buildComponentRows = (bomDiff: BomDiff) => {
  const map = new Map<number, { base?: BomComponent; draft?: BomComponent }>();

  bomDiff.base.components.forEach((component) => {
    map.set(component.componentProductVersionId, { base: component });
  });

  bomDiff.draft.components.forEach((component) => {
    const existing = map.get(component.componentProductVersionId) ?? {};
    map.set(component.componentProductVersionId, { ...existing, draft: component });
  });

  return Array.from(map.values()).sort((a, b) => {
    const nameA = a.draft?.productName ?? a.base?.productName ?? '';
    const nameB = b.draft?.productName ?? b.base?.productName ?? '';
    return nameA.localeCompare(nameB);
  });
};

const buildOperationRows = (bomDiff: BomDiff) => {
  const map = new Map<string, { base?: BomOperation; draft?: BomOperation }>();

  bomDiff.base.operations.forEach((operation) => {
    map.set(operation.operationName, { base: operation });
  });

  bomDiff.draft.operations.forEach((operation) => {
    const existing = map.get(operation.operationName) ?? {};
    map.set(operation.operationName, { ...existing, draft: operation });
  });

  return Array.from(map.values()).sort((a, b) => {
    const nameA = a.draft?.operationName ?? a.base?.operationName ?? '';
    const nameB = b.draft?.operationName ?? b.base?.operationName ?? '';
    return nameA.localeCompare(nameB);
  });
};

export function EcoChangesView({ ecoId, ecoType }: EcoChangesViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productDiff, setProductDiff] = useState<ProductDiff | null>(null);
  const [bomDiff, setBomDiff] = useState<BomDiff | null>(null);

  useEffect(() => {
    const loadChanges = async () => {
      setLoading(true);
      setError(null);
      try {
        if (ecoType === 'product') {
          const response = await apiFetch<{ draft: ProductDiff }>(`/api/ecos/${ecoId}/draft/product`);
          setProductDiff(response.data?.draft ?? null);
        } else {
          const response = await apiFetch<{ draft: BomDiff }>(`/api/ecos/${ecoId}/draft/bom`);
          setBomDiff(response.data?.draft ?? null);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load changes');
      } finally {
        setLoading(false);
      }
    };

    loadChanges();
  }, [ecoId, ecoType]);

  if (loading) {
    return <div className="flex justify-center p-8 text-gray-500">Loading changes...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md border border-red-200">
        {error}
      </div>
    );
  }

  if (ecoType === 'product' && productDiff) {
    const { base, draft } = productDiff;

    const DiffRow = ({
      label,
      baseValue,
      newValue,
      formatter = formatValue
    }: {
      label: string;
      baseValue: unknown;
      newValue: unknown;
      formatter?: (value: unknown) => string;
    }) => {
      const baseText = formatter(baseValue);
      const newText = formatter(newValue);
      const isChanged = baseText !== newText;

      return (
        <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100 last:border-0">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-gray-900">{baseText}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Proposed</p>
            <p
              className={`text-sm font-semibold ${
                isChanged ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block' : 'text-gray-900'
              }`}
            >
              {newText}
            </p>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Product Master - ECO Changes</h3>
        </div>
        <div className="px-6 py-2">
          <DiffRow label="Product Name" baseValue={base.productName} newValue={draft.newProductName} />
          <DiffRow label="Sale Price" baseValue={base.salePrice} newValue={draft.newSalePrice} formatter={formatMoney} />
          <DiffRow label="Cost Price" baseValue={base.costPrice} newValue={draft.newCostPrice} formatter={formatMoney} />
          <DiffRow label="Attachments" baseValue={base.attachments} newValue={draft.newAttachments} formatter={formatAttachments} />
        </div>
      </div>
    );
  }

  if (ecoType === 'bom' && bomDiff) {
    const componentRows = buildComponentRows(bomDiff);
    const operationRows = buildOperationRows(bomDiff);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">BoM Components - ECO Changes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-3">Component</th>
                  <th className="px-6 py-3">Current Qty</th>
                  <th className="px-6 py-3">Proposed Qty</th>
                  <th className="px-6 py-3">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {componentRows.map((row, index) => {
                  const baseQty = row.base ? Number(row.base.quantity) : null;
                  const draftQty = row.draft ? Number(row.draft.quantity) : null;
                  const isRemoved = !!row.base && !row.draft;
                  const isAdded = !!row.draft && !row.base;
                  const isChanged = row.base && row.draft && baseQty !== draftQty;
                  const isReduced = isChanged && draftQty !== null && baseQty !== null && draftQty < baseQty;
                  const changeLabel = isRemoved
                    ? 'Removed'
                    : isAdded
                      ? 'Added'
                      : isChanged
                        ? isReduced
                          ? 'Reduced'
                          : 'Increased'
                        : 'No change';
                  const changeTone = isAdded || (!isReduced && isChanged)
                    ? 'emerald'
                    : isRemoved || isReduced
                      ? 'rose'
                      : 'gray';
                  const name = row.draft?.productName ?? row.base?.productName ?? 'Unknown';
                  const code = row.draft?.productCode ?? row.base?.productCode ?? '';

                  return (
                    <tr key={`${row.base?.componentProductVersionId ?? row.draft?.componentProductVersionId ?? index}`}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500">{code}</p>
                      </td>
                      <td className={`px-6 py-4 ${isRemoved ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>
                        {baseQty !== null ? `${baseQty} Units` : '—'}
                      </td>
                      <td
                        className={`px-6 py-4 font-semibold ${
                          changeTone === 'emerald'
                            ? 'text-emerald-600'
                            : changeTone === 'rose'
                              ? 'text-rose-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {draftQty !== null ? `${draftQty} Units` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {changeLabel === 'No change' ? (
                          <span className="text-xs text-gray-400">No change</span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              changeTone === 'emerald'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {changeLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">BoM Operations - ECO Changes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-3">Operation</th>
                  <th className="px-6 py-3">Work Center</th>
                  <th className="px-6 py-3">Current Time</th>
                  <th className="px-6 py-3">Proposed Time</th>
                  <th className="px-6 py-3">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {operationRows.map((row, index) => {
                  const baseTime = row.base ? Number(row.base.timeMinutes) : null;
                  const draftTime = row.draft ? Number(row.draft.timeMinutes) : null;
                  const isRemoved = !!row.base && !row.draft;
                  const isAdded = !!row.draft && !row.base;
                  const isChanged = row.base && row.draft && baseTime !== draftTime;
                  const isReduced = isChanged && draftTime !== null && baseTime !== null && draftTime < baseTime;
                  const changeLabel = isRemoved
                    ? 'Removed'
                    : isAdded
                      ? 'Added'
                      : isChanged
                        ? isReduced
                          ? 'Reduced'
                          : 'Increased'
                        : 'No change';
                  const changeTone = isAdded || (!isReduced && isChanged)
                    ? 'emerald'
                    : isRemoved || isReduced
                      ? 'rose'
                      : 'gray';
                  const name = row.draft?.operationName ?? row.base?.operationName ?? 'Unknown';
                  const workCenter = row.draft?.workCenter ?? row.base?.workCenter ?? 'N/A';

                  return (
                    <tr key={`${name}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{name}</td>
                      <td className="px-6 py-4 text-gray-600">{workCenter}</td>
                      <td className={`px-6 py-4 ${isRemoved ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>
                        {baseTime !== null ? `${baseTime} Mins` : '—'}
                      </td>
                      <td
                        className={`px-6 py-4 font-semibold ${
                          changeTone === 'emerald'
                            ? 'text-emerald-600'
                            : changeTone === 'rose'
                              ? 'text-rose-600'
                              : 'text-gray-900'
                        }`}
                      >
                        {draftTime !== null ? `${draftTime} Mins` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {changeLabel === 'No change' ? (
                          <span className="text-xs text-gray-400">No change</span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              changeTone === 'emerald'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {changeLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
