'use client';

import { useState } from 'react';

interface DraftEcoItem {
  id: number;
  title: string;
  ecoType?: 'product' | 'bom';
  updatedAt?: string | null;
  currentStage?: {
    name: string;
  } | null;
}

interface ProductInfo {
  id: number;
  productCode: string;
  productName: string | null;
}

interface EcoDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductInfo | null;
  draftEcos: DraftEcoItem[];
  onStart: (ecoId: number) => Promise<boolean>;
}

const formatEcoType = (ecoType?: 'product' | 'bom') => {
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

export function EcoDraftsModal({
  isOpen,
  onClose,
  product,
  draftEcos,
  onStart
}: EcoDraftsModalProps) {
  const [startingEcoId, setStartingEcoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleStart = async (ecoId: number) => {
    setStartingEcoId(ecoId);
    setError(null);
    const success = await onStart(ecoId);
    if (!success) {
      setError('Failed to start ECO. Please try again.');
    }
    setStartingEcoId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Draft ECOs
            </p>
            <h3 className="text-lg font-semibold text-gray-900">
              {product ? `${product.productCode} · ${product.productName ?? 'Product'}` : 'Product'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {draftEcos.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              No draft ECOs found for this product.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="grid grid-cols-12 gap-2 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Stage</div>
                <div className="col-span-2">Updated</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
              <div className="divide-y divide-gray-100">
                {draftEcos.map((eco) => (
                  <div key={eco.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-gray-700">
                    <div className="col-span-4 font-semibold text-gray-900">{eco.title}</div>
                    <div className="col-span-2 text-xs font-semibold text-gray-600">
                      {formatEcoType(eco.ecoType)}
                    </div>
                    <div className="col-span-3 text-xs text-gray-600">
                      {eco.currentStage?.name ?? '—'}
                    </div>
                    <div className="col-span-2 text-xs text-gray-500">
                      {formatDate(eco.updatedAt)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleStart(eco.id)}
                        disabled={startingEcoId === eco.id}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EcoDraftsModal;
