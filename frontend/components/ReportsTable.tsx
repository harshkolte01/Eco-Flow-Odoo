'use client';

import { useState } from 'react';
import { EcoChangesView } from './EcoChangesView';

interface ReportItem {
  id: number;
  title: string;
  ecoType: string;
  productName: string;
  hasChanges: boolean;
  status: string;
}

interface ReportsTableProps {
  report: ReportItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ReportsTable({ report, loading, error, onRetry }: ReportsTableProps) {
  const [selectedEcoId, setSelectedEcoId] = useState<number | null>(null);
  const [selectedEcoType, setSelectedEcoType] = useState<'product' | 'bom' | null>(null);
  const [showChangesModal, setShowChangesModal] = useState(false);

  const handleViewChanges = (ecoId: number, ecoType: string) => {
    const normalizedType = ecoType.toLowerCase().includes('product') ? 'product' : 'bom';
    setSelectedEcoId(ecoId);
    setSelectedEcoType(normalizedType);
    setShowChangesModal(true);
  };

  const handleCloseModal = () => {
    setShowChangesModal(false);
    setSelectedEcoId(null);
    setSelectedEcoType(null);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-6 shadow-sm">
        <div className="text-sm text-gray-500">Loading report data...</div>
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

  if (report.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-10 text-center shadow-sm">
        <p className="text-sm text-gray-500">No ECOs found in the report.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <div className="col-span-4 lg:col-span-3">ECO Title</div>
          <div className="col-span-2">ECO Type</div>
          <div className="col-span-4 lg:col-span-5">Linked Product</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-gray-100">
          {report.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 px-4 py-4 sm:px-6 sm:py-4 transition-all duration-200 hover:bg-gray-50/50 group"
            >
              {/* Title Column */}
              <div className="col-span-4 lg:col-span-3 flex flex-col justify-center">
                <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{item.title}</p>
              </div>

              {/* Type Column */}
              <div className="col-span-2 flex items-center">
                <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase tracking-tight mr-2">Type:</span>
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                  {item.ecoType}
                </span>
              </div>

              {/* Product Column */}
              <div className="col-span-4 lg:col-span-5 flex flex-col justify-center">
                <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Product:</span>
                <p className="text-sm text-gray-600 font-medium">{item.productName}</p>
              </div>

              {/* Actions Column */}
              <div className="col-span-2 flex items-center justify-end">
                {item.hasChanges ? (
                  <button
                    type="button"
                    onClick={() => handleViewChanges(item.id, item.ecoType)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:border-emerald-500 hover:bg-emerald-100 hover:shadow transition-all active:scale-95"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Changes</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tighter">No changes</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Changes Modal */}
      {showChangesModal && selectedEcoId && selectedEcoType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">ECO Changes</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EcoChangesView ecoId={selectedEcoId} ecoType={selectedEcoType} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
